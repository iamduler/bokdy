package otelx

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"

	"go.opentelemetry.io/otel/trace"
)

const zeroTraceID = "00000000000000000000000000000000"

// NormalizeTraceID accepts a 32-char hex id or a UUID (with dashes) and
// returns lowercase hex suitable as an OpenTelemetry trace id.
func NormalizeTraceID(raw string) (string, bool) {
	s := strings.ToLower(strings.TrimSpace(raw))
	s = strings.ReplaceAll(s, "-", "")
	if len(s) != 32 {
		return "", false
	}
	for _, c := range s {
		if (c < '0' || c > '9') && (c < 'a' || c > 'f') {
			return "", false
		}
	}
	if s == zeroTraceID {
		return "", false
	}
	return s, true
}

// NewTraceIDHex returns a random 32-char hex trace id.
func NewTraceIDHex() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return strings.Repeat("0", 31) + "1"
	}
	out := hex.EncodeToString(b[:])
	if out == zeroTraceID {
		return strings.Repeat("0", 31) + "1"
	}
	return out
}

func newSpanIDHex() string {
	var b [8]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "0000000000000001"
	}
	out := hex.EncodeToString(b[:])
	if out == "0000000000000000" {
		return "0000000000000001"
	}
	return out
}

// EnsureIncomingTraceparent synthesizes a W3C traceparent from X-Trace-ID
// when the client only sent the Loki join header (UUID or 32 hex).
func EnsureIncomingTraceparent(r *http.Request) {
	if r == nil {
		return
	}
	if strings.TrimSpace(r.Header.Get("traceparent")) != "" {
		return
	}
	hexID, ok := NormalizeTraceID(r.Header.Get("X-Trace-ID"))
	if !ok {
		return
	}
	r.Header.Set("traceparent", fmt.Sprintf("00-%s-%s-01", hexID, newSpanIDHex()))
}

// TraceparentHeader formats the current span as a W3C traceparent value.
func TraceparentHeader(sc trace.SpanContext) string {
	if !sc.IsValid() {
		return ""
	}
	flags := "00"
	if sc.IsSampled() {
		flags = "01"
	}
	return fmt.Sprintf("00-%s-%s-%s", sc.TraceID().String(), sc.SpanID().String(), flags)
}
