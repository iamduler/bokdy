// Package logging provides a process-wide structured logger (zerolog) with
// file rotation in production and pretty console output in development.
package logging

import (
	"context"
	"io"
	"os"
	"path/filepath"
	"time"

	"bokdy/internal/platform/config"

	"github.com/natefinch/lumberjack"
	"github.com/rs/zerolog"
)

type contextKey string

// CorrelationIDKey is the context key used to correlate log lines with a request.
const CorrelationIDKey contextKey = "correlation_id"

// Log is the process-wide logger. It is set once by InitLogger during
// startup and treated as read-only afterwards.
var Log *zerolog.Logger

// Options configures NewLogger / InitLogger.
type Options struct {
	// Dir is the directory log files are written to in production.
	Dir string
	// Filename is the base log file name (e.g. "app.log").
	Filename   string
	MaxSizeMB  int
	MaxBackups int
	MaxAgeDays int
	Compress   bool
}

// DefaultOptions returns sane file-rotation defaults for filename.
func DefaultOptions(dir, filename string) Options {
	return Options{
		Dir:        dir,
		Filename:   filename,
		MaxSizeMB:  50,
		MaxBackups: 5,
		MaxAgeDays: 30,
		Compress:   true,
	}
}

// InitLogger builds the logger for cfg and stores it in the package-level Log.
func InitLogger(cfg *config.Config, opts Options) {
	Log = NewLogger(cfg, opts)
}

// NewLogger builds a *zerolog.Logger. In development it writes pretty console
// output to stderr; in production it writes JSON to a rotating file, with
// warn+ level entries duplicated to stderr so process supervisors can surface
// crashes without tailing the log file.
func NewLogger(cfg *config.Config, opts Options) *zerolog.Logger {
	zerolog.TimeFieldFormat = time.RFC3339

	var writer io.Writer
	if cfg.App.IsDevelopment() {
		writer = zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339}
	} else {
		fileWriter := &lumberjack.Logger{
			Filename:   filepath.Join(opts.Dir, opts.Filename),
			MaxSize:    opts.MaxSizeMB,
			MaxBackups: opts.MaxBackups,
			MaxAge:     opts.MaxAgeDays,
			Compress:   opts.Compress,
		}
		writer = zerolog.MultiLevelWriter(
			fileWriter,
			levelFilterWriter{Writer: os.Stderr, MinLevel: zerolog.WarnLevel},
		)
	}

	logger := zerolog.New(writer).With().
		Timestamp().
		Str("service", cfg.App.Name).
		Str("env", cfg.App.Env).
		Logger()

	return &logger
}

// levelFilterWriter forwards only entries at or above MinLevel.
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

// CorrelationID extracts the correlation id stashed on ctx, if any.
func CorrelationID(ctx context.Context) string {
	if v, ok := ctx.Value(CorrelationIDKey).(string); ok {
		return v
	}
	return ""
}
