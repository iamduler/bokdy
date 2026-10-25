package service

import (
	"context"
	"regexp"
	"strings"
	"unicode"

	"bokdy/internal/platform/maps"
	refrepo "bokdy/internal/platform/reference/repository"

	"github.com/google/uuid"
	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

// AdminUnitMatcher resolves Vietmap boundary labels onto current_v2 admin UUIDs.
type AdminUnitMatcher struct {
	units refrepo.AdminUnitRepository
}

func NewAdminUnitMatcher(units refrepo.AdminUnitRepository) *AdminUnitMatcher {
	return &AdminUnitMatcher{units: units}
}

type AdminMatch struct {
	ProvinceID *uuid.UUID
	WardID     *uuid.UUID
}

func (m *AdminUnitMatcher) MatchReverse(ctx context.Context, result *maps.ReverseResult) (AdminMatch, error) {
	if m == nil || m.units == nil || result == nil {
		return AdminMatch{}, nil
	}
	labels := labelsFromBoundaries(result.Boundaries)
	// Address trailing/leading bits often carry province/ward names.
	for _, bit := range splitAddress(result.Address) {
		labels.ProvinceLabels = append(labels.ProvinceLabels, bit)
		labels.WardLabels = append(labels.WardLabels, bit)
	}
	if result.Display != "" {
		labels.ProvinceLabels = append(labels.ProvinceLabels, extractPrefixed(result.Display, provincePrefixRe)...)
		labels.WardLabels = append(labels.WardLabels, extractPrefixed(result.Display, wardPrefixRe)...)
	}
	labels.ProvinceLabels = uniqNorm(labels.ProvinceLabels, normalizeProvinceLabel)
	labels.WardLabels = uniqNorm(labels.WardLabels, normalizeWardLabel)

	provinces, err := m.units.ListProvinces(ctx, refrepo.DivisionCurrentV2)
	if err != nil {
		return AdminMatch{}, err
	}
	province := firstMatch(labels.ProvinceLabels, provinces, normalizeProvinceLabel)
	if province != nil {
		pid := province.ID
		out := AdminMatch{ProvinceID: &pid}
		wards, err := m.units.ListWards(ctx, refrepo.DivisionCurrentV2, pid, "")
		if err != nil {
			return out, err
		}
		if ward := firstMatch(labels.WardLabels, wards, normalizeWardLabel); ward != nil {
			wid := ward.ID
			out.WardID = &wid
		}
		return out, nil
	}

	// Vietmap still emits pre-merger province names (e.g. "Bà Rịa-Vũng Tàu") that are
	// absent from current_v2. Fall back: exact ward name match across all provinces.
	return m.matchViaGlobalWard(ctx, provinces, labels.WardLabels)
}

type wardHit struct {
	provinceID uuid.UUID
	wardID     uuid.UUID
}

func (m *AdminUnitMatcher) matchViaGlobalWard(
	ctx context.Context,
	provinces []refrepo.AdminUnit,
	wardLabels []string,
) (AdminMatch, error) {
	if len(wardLabels) == 0 || len(provinces) == 0 {
		return AdminMatch{}, nil
	}
	needles := make([]string, 0, len(wardLabels))
	for _, label := range wardLabels {
		if n := normalizeWardLabel(label); n != "" {
			needles = append(needles, n)
		}
	}
	if len(needles) == 0 {
		return AdminMatch{}, nil
	}

	exact := map[string][]wardHit{}
	for _, prov := range provinces {
		wards, err := m.units.ListWards(ctx, refrepo.DivisionCurrentV2, prov.ID, "")
		if err != nil {
			return AdminMatch{}, err
		}
		for _, ward := range wards {
			key := normalizeWardLabel(ward.NameVi)
			if key == "" {
				key = normalizeWardLabel(ward.NameEn)
			}
			if key == "" {
				continue
			}
			for _, needle := range needles {
				if key == needle {
					exact[needle] = append(exact[needle], wardHit{provinceID: prov.ID, wardID: ward.ID})
				}
			}
		}
	}

	// Prefer the first ward label that maps to exactly one current ward.
	for _, needle := range needles {
		hits := dedupeHits(exact[needle])
		if len(hits) == 1 {
			pid, wid := hits[0].provinceID, hits[0].wardID
			return AdminMatch{ProvinceID: &pid, WardID: &wid}, nil
		}
	}
	return AdminMatch{}, nil
}

func dedupeHits(hits []wardHit) []wardHit {
	seen := map[uuid.UUID]struct{}{}
	out := make([]wardHit, 0, len(hits))
	for _, h := range hits {
		if _, ok := seen[h.wardID]; ok {
			continue
		}
		seen[h.wardID] = struct{}{}
		out = append(out, h)
	}
	return out
}

type boundaryLabels struct {
	ProvinceLabels []string
	WardLabels     []string
}

func labelsFromBoundaries(boundaries []maps.Boundary) boundaryLabels {
	var out boundaryLabels
	for _, b := range boundaries {
		full := strings.TrimSpace(b.FullName)
		if full == "" {
			full = strings.TrimSpace(strings.Join([]string{b.Prefix, b.Name}, " "))
		}
		name := strings.TrimSpace(b.Name)
		if full == "" && name == "" {
			continue
		}
		switch b.Type {
		case 0: // city / province
			if full != "" {
				out.ProvinceLabels = append(out.ProvinceLabels, full)
			}
			if name != "" {
				out.ProvinceLabels = append(out.ProvinceLabels, name)
			}
		case 2: // ward
			if full != "" {
				out.WardLabels = append(out.WardLabels, full)
			}
			if name != "" {
				out.WardLabels = append(out.WardLabels, name)
			}
		}
	}
	return out
}

func firstMatch(labels []string, rows []refrepo.AdminUnit, normalize func(string) string) *refrepo.AdminUnit {
	for _, label := range labels {
		needle := normalize(label)
		if needle == "" {
			continue
		}
		for i := range rows {
			vi := normalize(rows[i].NameVi)
			en := normalize(rows[i].NameEn)
			if vi == needle || en == needle {
				return &rows[i]
			}
		}
		for i := range rows {
			vi := normalize(rows[i].NameVi)
			en := normalize(rows[i].NameEn)
			if (vi != "" && (strings.Contains(vi, needle) || strings.Contains(needle, vi))) ||
				(en != "" && (strings.Contains(en, needle) || strings.Contains(needle, en))) {
				return &rows[i]
			}
		}
	}
	return nil
}

var (
	provincePrefixRe = regexp.MustCompile(`(?i)(?:Tỉnh|Thành phố|TP\.?)\s+([^,]+)`)
	wardPrefixRe     = regexp.MustCompile(`(?i)(?:Xã|Phường|Thị trấn|Thị xã)\s+([^,]+)`)
	provinceLeadRe   = regexp.MustCompile(`^(tinh|thanh pho|tp\.?|province|city)\s+`)
	provinceTrailRe  = regexp.MustCompile(`\s+(tinh|thanh pho|tp\.?|province|city)$`)
	wardLeadRe       = regexp.MustCompile(`^(xa|phuong|thi tran|thi xa|ward|commune|town|village)\s+`)
	wardTrailRe      = regexp.MustCompile(`\s+(xa|phuong|thi tran|thi xa|ward|commune|town|village)$`)
	diacriticStrip   = transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
)

func extractPrefixed(display string, re *regexp.Regexp) []string {
	matches := re.FindAllStringSubmatch(display, -1)
	out := make([]string, 0, len(matches))
	for _, m := range matches {
		if len(m) > 1 {
			if t := strings.TrimSpace(m[1]); t != "" {
				out = append(out, t)
			}
		}
	}
	return out
}

func splitAddress(address string) []string {
	parts := strings.Split(address, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}

func stripDiacritics(raw string) string {
	s, _, err := transform.String(diacriticStrip, raw)
	if err != nil {
		s = raw
	}
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, "đ", "d")
	// Collapse hyphen/dash variants so "Bà Rịa-Vũng Tàu" ≈ "Bà Rịa Vũng Tàu".
	for _, sep := range []string{"-", "–", "—", "−"} {
		s = strings.ReplaceAll(s, sep, " ")
	}
	s = strings.Join(strings.Fields(s), " ")
	return s
}

func normalizeProvinceLabel(raw string) string {
	s := stripDiacritics(raw)
	s = provinceLeadRe.ReplaceAllString(s, "")
	s = provinceTrailRe.ReplaceAllString(s, "")
	return strings.TrimSpace(s)
}

func normalizeWardLabel(raw string) string {
	s := stripDiacritics(raw)
	s = wardLeadRe.ReplaceAllString(s, "")
	s = wardTrailRe.ReplaceAllString(s, "")
	return strings.TrimSpace(s)
}

func uniqNorm(labels []string, normalize func(string) string) []string {
	seen := map[string]struct{}{}
	out := make([]string, 0, len(labels))
	for _, raw := range labels {
		t := strings.TrimSpace(raw)
		if t == "" {
			continue
		}
		key := normalize(t)
		if key == "" {
			continue
		}
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, t)
	}
	return out
}
