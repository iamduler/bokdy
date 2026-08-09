package i18n

import (
	"context"
	"testing"

	"bokdy/internal/platform/requestctx"
)

func TestParseLocale(t *testing.T) {
	cases := []struct {
		in   string
		want string
	}{
		{"", "vi"},
		{"   ", "vi"},
		{"vi", "vi"},
		{"vi-VN", "vi"},
		{"en", "en"},
		{"en-US,vi;q=0.8", "en"},
		{"th,en;q=0.9", "en"},
		{"th,fr", "vi"},
		{"EN-GB", "en"},
	}
	for _, tc := range cases {
		if got := ParseLocale(tc.in); got != tc.want {
			t.Fatalf("ParseLocale(%q)=%q want %q", tc.in, got, tc.want)
		}
	}
}

func TestDisplayName(t *testing.T) {
	if got := DisplayName("vi", "Court A", "Sân A"); got != "Sân A" {
		t.Fatalf("vi: %q", got)
	}
	if got := DisplayName("en", "Court A", "Sân A"); got != "Court A" {
		t.Fatalf("en: %q", got)
	}
	if got := DisplayName("en", "", "Sân A"); got != "Sân A" {
		t.Fatalf("en fallback vi: %q", got)
	}
	if got := DisplayName("vi", "Court A", ""); got != "Court A" {
		t.Fatalf("vi fallback en: %q", got)
	}
	if got := DisplayName("th", "Court A", "Sân A", map[string]string{"th": "สนาม A"}); got != "สนาม A" {
		t.Fatalf("extra th: %q", got)
	}
	if got := DisplayName("th", "Court A", "Sân A"); got != "Sân A" {
		t.Fatalf("unknown locale fallback: %q", got)
	}
}

func TestFromContext(t *testing.T) {
	if got := FromContext(context.Background()); got != DefaultLocale {
		t.Fatalf("empty ctx: %q", got)
	}
	ctx := requestctx.WithLocale(context.Background(), LocaleEN)
	if got := FromContext(ctx); got != LocaleEN {
		t.Fatalf("en ctx: %q", got)
	}
}
