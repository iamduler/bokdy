package persistence

import (
	"context"
	"fmt"
	"reflect"
	"regexp"
	"strings"
	"time"

	"bokdy/internal/platform/logging"

	"github.com/jackc/pgx/v5/tracelog"
	"github.com/rs/zerolog"
)

// PgxZerologTracer logs executed SQL with interpolated args (dev only).
type PgxZerologTracer struct {
	Logger         zerolog.Logger
	SlowQueryLimit time.Duration
}

type queryInfo struct {
	QueryName     string
	OperationType string
	CleanSQL      string
	OriginalSQL   string
}

var (
	sqlcNameRegex = regexp.MustCompile(`-- name:\s*(\w+)\s*:(\w+)`)
	spaceRegex    = regexp.MustCompile(`\s+`)
	commentRegex  = regexp.MustCompile(`-- [^\r\n]*`)
)

func parseSQL(sql string) queryInfo {
	info := queryInfo{OriginalSQL: sql}
	if matches := sqlcNameRegex.FindStringSubmatch(sql); len(matches) == 3 {
		info.QueryName = matches[1]
		info.OperationType = strings.ToUpper(matches[2])
	}
	clean := commentRegex.ReplaceAllString(sql, "")
	clean = strings.TrimSpace(clean)
	clean = spaceRegex.ReplaceAllString(clean, " ")
	info.CleanSQL = clean
	return info
}

func formatArg(arg any) string {
	if arg == nil {
		return "NULL"
	}
	val := reflect.ValueOf(arg)
	if !val.IsValid() {
		return "NULL"
	}
	if val.Kind() == reflect.Ptr {
		if val.IsNil() {
			return "NULL"
		}
		arg = val.Elem().Interface()
	}
	switch v := arg.(type) {
	case string:
		return fmt.Sprintf("'%s'", strings.ReplaceAll(v, "'", "''"))
	case []byte:
		return fmt.Sprintf("'%s'", strings.ReplaceAll(string(v), "'", "''"))
	case bool:
		return fmt.Sprintf("%t", v)
	case int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64:
		return fmt.Sprintf("%d", v)
	case float32, float64:
		return fmt.Sprintf("%f", v)
	case time.Time:
		return fmt.Sprintf("'%s'", v.Format(time.RFC3339))
	default:
		return fmt.Sprintf("'%s'", strings.ReplaceAll(fmt.Sprintf("%v", v), "'", "''"))
	}
}

func interpolateSQL(sql string, args []any) string {
	for i := len(args); i >= 1; i-- {
		sql = strings.ReplaceAll(sql, fmt.Sprintf("$%d", i), formatArg(args[i-1]))
	}
	return sql
}

func (t *PgxZerologTracer) Log(ctx context.Context, _ tracelog.LogLevel, msg string, data map[string]any) {
	if msg != "Query" {
		return
	}
	sql, _ := data["sql"].(string)
	args, _ := data["args"].([]any)
	duration, _ := data["time"].(time.Duration)
	info := parseSQL(sql)
	finalSQL := info.CleanSQL
	if len(args) > 0 {
		finalSQL = interpolateSQL(info.CleanSQL, args)
	}
	durationMS := duration.Milliseconds()
	evt := t.Logger.Info()
	eventName := "sql_query"
	if t.SlowQueryLimit > 0 && duration > t.SlowQueryLimit {
		evt = t.Logger.Warn()
		eventName = "sql_slow"
	}
	evt.
		Str("event", eventName).
		Str("trace_id", logging.GetTraceID(ctx)).
		Int64("duration_ms", durationMS).
		Str("sql", finalSQL).
		Str("sql_original", info.OriginalSQL).
		Str("query_name", info.QueryName).
		Str("operation", info.OperationType).
		Interface("args", args).
		Msg("sql")
}
