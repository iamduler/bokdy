// Package logging provides structured zerolog loggers with rotating JSON files
// (Grafana/Loki-ready) and optional pretty console output in development.
package logging

import (
	"context"
	"io"
	"os"
	"path/filepath"
	"time"

	"bokdy/internal/platform/config"
	"bokdy/internal/platform/requestctx"

	"github.com/natefinch/lumberjack"
	"github.com/rs/zerolog"
)

type contextKey string

// TraceIDKey stashes the request trace id for pgx / non-requestctx callers.
const TraceIDKey contextKey = "trace_id"

// CorrelationIDKey is kept for older call sites; prefer requestctx.
const CorrelationIDKey contextKey = "correlation_id"

// Log is the process-wide logger. Set once by InitLogger.
var Log *zerolog.Logger

var (
	logDir  string
	logCfg  *config.Config
	logOpts Options
)

// Options configures NewLogger / InitLogger / Channel.
type Options struct {
	Dir        string
	Filename   string
	MaxSizeMB  int
	MaxBackups int
	MaxAgeDays int
	Compress   bool
}

// DefaultOptions returns 10 MB × 10 rotating files for filename.
func DefaultOptions(dir, filename string) Options {
	return Options{
		Dir:        dir,
		Filename:   filename,
		MaxSizeMB:  10,
		MaxBackups: 10,
		MaxAgeDays: 30,
		Compress:   true,
	}
}

func (o Options) normalized() Options {
	if o.MaxSizeMB <= 0 {
		o.MaxSizeMB = 10
	}
	if o.MaxBackups <= 0 {
		o.MaxBackups = 10
	}
	if o.MaxAgeDays <= 0 {
		o.MaxAgeDays = 30
	}
	return o
}

// InitLogger builds the process logger and remembers the log directory for Channel.
func InitLogger(cfg *config.Config, opts Options) {
	opts = opts.normalized()
	_ = os.MkdirAll(opts.Dir, 0o755)
	logDir = opts.Dir
	logCfg = cfg
	logOpts = opts
	Log = NewLogger(cfg, opts)
}

// NewLogger builds the process logger: JSON file always; pretty stderr in
// development; warn+ stderr in production.
func NewLogger(cfg *config.Config, opts Options) *zerolog.Logger {
	opts = opts.normalized()
	zerolog.TimeFieldFormat = time.RFC3339
	zerolog.TimestampFunc = func() time.Time { return time.Now().UTC() }
	_ = os.MkdirAll(opts.Dir, 0o755)

	// File + JSON stdout (12-factor / Promtail). Warn+ also to stderr in prod
	// so supervisors surface crashes without scraping stdout.
	writers := []io.Writer{rotatingFile(opts), os.Stdout}
	if cfg == nil || !cfg.App.IsDevelopment() {
		writers = append(writers, levelFilterWriter{Writer: os.Stderr, MinLevel: zerolog.WarnLevel})
	}
	writer := zerolog.MultiLevelWriter(writers...)

	service, envName := "bokdy", "development"
	if cfg != nil {
		service = cfg.App.Name
		envName = cfg.App.Env
	}
	logger := zerolog.New(writer).With().
		Timestamp().
		Str("service", service).
		Str("env", envName).
		Str("component", "app").
		Logger()
	return &logger
}

// Channel returns a JSON rotating logger for a dedicated file (access, sql, …).
func Channel(filename, component string) *zerolog.Logger {
	opts := logOpts.normalized()
	if logDir != "" {
		opts.Dir = logDir
	}
	if opts.Dir == "" {
		opts.Dir = "logs"
	}
	opts.Filename = filename
	_ = os.MkdirAll(opts.Dir, 0o755)

	service, envName := "bokdy", "development"
	if logCfg != nil {
		service = logCfg.App.Name
		envName = logCfg.App.Env
	}
	var writer io.Writer = rotatingFile(opts)
	if logCfg != nil && logCfg.App.LogStdoutChannels {
		writer = zerolog.MultiLevelWriter(writer, os.Stdout)
	}
	logger := zerolog.New(writer).With().
		Timestamp().
		Str("service", service).
		Str("env", envName).
		Str("component", component).
		Logger()
	return &logger
}

func rotatingFile(opts Options) io.Writer {
	return &lumberjack.Logger{
		Filename:   filepath.Join(opts.Dir, opts.Filename),
		MaxSize:    opts.MaxSizeMB,
		MaxBackups: opts.MaxBackups,
		MaxAge:     opts.MaxAgeDays,
		Compress:   opts.Compress,
		LocalTime:  false,
	}
}

type levelFilterWriter struct {
	Writer   io.Writer
	MinLevel zerolog.Level
}

func (w levelFilterWriter) Write(p []byte) (int, error) {
	return w.Writer.Write(p)
}

func (w levelFilterWriter) WriteLevel(level zerolog.Level, p []byte) (int, error) {
	if level < w.MinLevel {
		return len(p), nil
	}
	return w.Writer.Write(p)
}

// GetTraceID reads the trace id from logging.TraceIDKey or requestctx.
func GetTraceID(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	if v, ok := ctx.Value(TraceIDKey).(string); ok && v != "" {
		return v
	}
	return requestctx.TraceID(ctx)
}

// WithTrace returns a logger enriched with trace_id / request_id / correlation_id.
func WithTrace(logger *zerolog.Logger, ctx context.Context) *zerolog.Logger {
	if logger == nil {
		logger = Log
	}
	if logger == nil {
		nop := zerolog.Nop()
		return &nop
	}
	c := logger.With()
	if id := GetTraceID(ctx); id != "" {
		c = c.Str("trace_id", id)
	}
	if id := requestctx.RequestID(ctx); id != "" {
		c = c.Str("request_id", id)
	}
	if id := requestctx.CorrelationID(ctx); id != "" {
		c = c.Str("correlation_id", id)
	}
	out := c.Logger()
	return &out
}

// From is Log + trace fields from ctx.
func From(ctx context.Context) *zerolog.Logger {
	return WithTrace(Log, ctx)
}

// CorrelationID extracts a correlation id from ctx (legacy helper).
func CorrelationID(ctx context.Context) string {
	if v, ok := ctx.Value(CorrelationIDKey).(string); ok {
		return v
	}
	return requestctx.CorrelationID(ctx)
}
