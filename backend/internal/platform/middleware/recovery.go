package middleware

import (
	"bytes"
	"fmt"
	"regexp"
	"runtime/debug"
	"strings"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/logging"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
)

// Recovery logs panics to recovery.log and returns the standard error envelope.
func Recovery(logger *zerolog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			recovered := recover()
			if recovered == nil {
				return
			}
			stack := debug.Stack()
			if logger != nil {
				logging.WithTrace(logger, c.Request.Context()).Error().
					Str("event", "panic_recovered").
					Str("method", c.Request.Method).
					Str("path", c.Request.URL.Path).
					Str("ip", c.ClientIP()).
					Str("panic_message", fmt.Sprintf("%v", recovered)).
					Str("stack_line", extractFirstAppStackLine(stack)).
					Str("stack_trace", string(stack)).
					Msg("panic recovered")
			}
			c.Abort()
			httpx.Error(c, apperr.Internal("internal server error"))
		}()
		c.Next()
	}
}

var stackLineRegex = regexp.MustCompile(`(.+\.go:\d+)`)

func extractFirstAppStackLine(stackTrace []byte) string {
	skip := [][]byte{
		[]byte("/runtime/"),
		[]byte("/debug/"),
		[]byte("recovery.go"),
		[]byte("pkg/mod/"),
		[]byte("/middleware/"),
	}
	for _, line := range bytes.Split(stackTrace, []byte("\n")) {
		if !bytes.Contains(line, []byte(".go:")) {
			continue
		}
		skipLine := false
		for _, p := range skip {
			if bytes.Contains(line, p) {
				skipLine = true
				break
			}
		}
		if skipLine {
			continue
		}
		clean := strings.TrimSpace(string(line))
		if matches := stackLineRegex.FindStringSubmatch(clean); len(matches) > 1 {
			return matches[1]
		}
		return clean
	}
	return ""
}
