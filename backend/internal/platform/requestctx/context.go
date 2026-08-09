// Package requestctx defines typed helpers for storing/retrieving
// per-request identifiers on context.Context. Context must only carry
// cancellation/tracing metadata, never business objects.
package requestctx

import (
	"context"

	"github.com/google/uuid"
)

type contextKey string

const (
	KeyCorrelationID  contextKey = "correlation_id"
	KeyRequestID      contextKey = "request_id"
	KeyUserID         contextKey = "user_id"
	KeySessionID      contextKey = "session_id"
	KeyOrganizationID contextKey = "organization_id"
	KeyEmail          contextKey = "email"
	KeyIsSystemAdmin  contextKey = "is_system_admin"
	KeyIP             contextKey = "ip"
	KeyUserAgent      contextKey = "user_agent"
	KeyLocale         contextKey = "locale"
)

// With returns a copy of ctx carrying value under key. Empty values are not
// stored so Get cleanly falls back to "".
func With(ctx context.Context, key contextKey, value string) context.Context {
	if value == "" {
		return ctx
	}
	return context.WithValue(ctx, key, value)
}

// Get returns the string stored under key, or "" when absent.
func Get(ctx context.Context, key contextKey) string {
	if v, ok := ctx.Value(key).(string); ok {
		return v
	}
	return ""
}

func WithCorrelationID(ctx context.Context, v string) context.Context {
	return With(ctx, KeyCorrelationID, v)
}

func WithRequestID(ctx context.Context, v string) context.Context {
	return With(ctx, KeyRequestID, v)
}

func CorrelationID(ctx context.Context) string { return Get(ctx, KeyCorrelationID) }
func RequestID(ctx context.Context) string     { return Get(ctx, KeyRequestID) }

func WithUserID(ctx context.Context, id uuid.UUID) context.Context {
	return context.WithValue(ctx, KeyUserID, id)
}

func UserID(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(KeyUserID).(uuid.UUID)
	return id, ok && id != uuid.Nil
}

func WithSessionID(ctx context.Context, id uuid.UUID) context.Context {
	return context.WithValue(ctx, KeySessionID, id)
}

func SessionID(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(KeySessionID).(uuid.UUID)
	return id, ok && id != uuid.Nil
}

func WithOrganizationID(ctx context.Context, id uuid.UUID) context.Context {
	return context.WithValue(ctx, KeyOrganizationID, id)
}

func OrganizationID(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(KeyOrganizationID).(uuid.UUID)
	return id, ok && id != uuid.Nil
}

func WithEmail(ctx context.Context, email string) context.Context {
	return With(ctx, KeyEmail, email)
}

func Email(ctx context.Context) string { return Get(ctx, KeyEmail) }

func WithIsSystemAdmin(ctx context.Context, v bool) context.Context {
	return context.WithValue(ctx, KeyIsSystemAdmin, v)
}

func IsSystemAdmin(ctx context.Context) bool {
	v, _ := ctx.Value(KeyIsSystemAdmin).(bool)
	return v
}

func WithIP(ctx context.Context, v string) context.Context { return With(ctx, KeyIP, v) }
func IP(ctx context.Context) string                        { return Get(ctx, KeyIP) }

func WithUserAgent(ctx context.Context, v string) context.Context {
	return With(ctx, KeyUserAgent, v)
}
func UserAgent(ctx context.Context) string { return Get(ctx, KeyUserAgent) }

func WithLocale(ctx context.Context, v string) context.Context {
	return With(ctx, KeyLocale, v)
}

func Locale(ctx context.Context) string { return Get(ctx, KeyLocale) }
