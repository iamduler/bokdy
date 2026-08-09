package i18n

import (
	"context"
	"strings"

	"bokdy/internal/platform/requestctx"

	"github.com/google/uuid"
)

const (
	LocaleVI      = "vi"
	LocaleEN      = "en"
	DefaultLocale = LocaleVI
)

// Seeded in 00004_reference.sql.
var (
	LocaleVIID = uuid.MustParse("01900000-0000-7000-8000-000000000010")
	LocaleENID = uuid.MustParse("01900000-0000-7000-8000-000000000011")
)

func ParseLocale(header string) string {
	header = strings.TrimSpace(header)
	if header == "" {
		return DefaultLocale
	}
	for _, part := range strings.Split(header, ",") {
		tag := strings.TrimSpace(strings.SplitN(part, ";", 2)[0])
		if tag == "" {
			continue
		}
		primary := strings.ToLower(strings.SplitN(tag, "-", 2)[0])
		if primary == LocaleEN || primary == LocaleVI {
			return primary
		}
	}
	return DefaultLocale
}

func DisplayName(locale, nameEn, nameVi string, extra ...map[string]string) string {
	locale = strings.ToLower(strings.TrimSpace(locale))
	if locale != LocaleEN && locale != LocaleVI && len(extra) > 0 && extra[0] != nil {
		if n := strings.TrimSpace(extra[0][locale]); n != "" {
			return n
		}
	}
	if locale == LocaleVI && strings.TrimSpace(nameVi) != "" {
		return strings.TrimSpace(nameVi)
	}
	if locale == LocaleEN && strings.TrimSpace(nameEn) != "" {
		return strings.TrimSpace(nameEn)
	}
	return FirstNonEmpty(nameVi, nameEn)
}

func FirstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if s := strings.TrimSpace(v); s != "" {
			return s
		}
	}
	return ""
}

func FromContext(ctx context.Context) string {
	if loc := requestctx.Locale(ctx); loc != "" {
		return loc
	}
	return DefaultLocale
}
