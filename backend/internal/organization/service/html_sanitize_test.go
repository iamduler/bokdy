package service

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestSanitizeDescriptionHTML(t *testing.T) {
	got := sanitizeDescriptionHTML(`<p>Hello <script>alert(1)</script><b>world</b></p>`)
	if got == "" {
		t.Fatal("expected non-empty sanitized HTML")
	}
	if strings.Contains(got, "<script>") {
		t.Fatalf("script not stripped: %q", got)
	}
	if !strings.Contains(got, "world") {
		t.Fatalf("lost content: %q", got)
	}
}

func TestSanitizeShortIntro(t *testing.T) {
	runes := make([]rune, 250)
	for i := range runes {
		runes[i] = 'a'
	}
	got := sanitizeShortIntro(string(runes))
	if utf8.RuneCountInString(got) != 200 {
		t.Fatalf("want 200 runes, got %d", utf8.RuneCountInString(got))
	}
}
