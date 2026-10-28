package service

import (
	"strings"

	"github.com/microcosm-cc/bluemonday"
)

var descriptionPolicy = bluemonday.UGCPolicy()

// sanitizeDescriptionHTML allowlists safe HTML tags for court description_* fields.
func sanitizeDescriptionHTML(raw string) string {
	return strings.TrimSpace(descriptionPolicy.Sanitize(raw))
}
