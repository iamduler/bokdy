package service

import (
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestNormalizeDimensions(t *testing.T) {
	got, err := normalizeDimensions("  13.4 x 6.1 m ")
	if err != nil || got != "13.4 x 6.1 m" {
		t.Fatalf("got %q, %v", got, err)
	}
	if _, err := normalizeDimensions(strings.Repeat("x", 101)); err == nil {
		t.Fatal("expected error for dimensions over 100 characters")
	}
	if _, err := normalizeDimensions(strings.Repeat("ê", 100)); err != nil {
		t.Fatalf("100 runes must pass: %v", err)
	}
}

func TestSanitizeDescriptionHTML(t *testing.T) {
	got := sanitizeDescriptionHTML(`<p>Hi</p><script>alert(1)</script>`)
	if strings.Contains(got, "script") || !strings.Contains(got, "<p>Hi</p>") {
		t.Fatalf("unexpected sanitize result %q", got)
	}
}

func TestUniqueUUIDs(t *testing.T) {
	a, b := uuid.New(), uuid.New()
	got := uniqueUUIDs([]uuid.UUID{a, uuid.Nil, b, a})
	if len(got) != 2 || got[0] != a || got[1] != b {
		t.Fatalf("unexpected %v", got)
	}
}
