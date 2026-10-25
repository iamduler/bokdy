package service

import (
	"strings"
	"unicode/utf8"

	"github.com/microcosm-cc/bluemonday"
)

const maxShortIntroRunes = 200

var descriptionPolicy = bluemonday.UGCPolicy()

// sanitizeDescriptionHTML allowlists safe HTML tags for branch description_* fields.
func sanitizeDescriptionHTML(raw string) string {
	return strings.TrimSpace(descriptionPolicy.Sanitize(raw))
}

// sanitizeShortIntro trims and enforces the 200-rune limit for short_intro_* fields.
func sanitizeShortIntro(raw string) string {
	s := strings.TrimSpace(raw)
	if utf8.RuneCountInString(s) <= maxShortIntroRunes {
		return s
	}
	runes := []rune(s)
	return string(runes[:maxShortIntroRunes])
}
