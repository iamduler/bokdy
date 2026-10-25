package service

import (
	"testing"

	"bokdy/internal/platform/maps"
)

func TestNormalizeProvinceLabel(t *testing.T) {
	cases := map[string]string{
		"Thành phố Hồ Chí Minh": "ho chi minh",
		"Tỉnh Lâm Đồng":         "lam dong",
		"TP. Hà Nội":            "ha noi",
		"Tỉnh Bà Rịa-Vũng Tàu":  "ba ria vung tau",
		"Tỉnh Bà Rịa - Vũng Tàu": "ba ria vung tau",
	}
	for in, want := range cases {
		got := normalizeProvinceLabel(in)
		if got != want {
			t.Fatalf("%q → %q, want %q", in, got, want)
		}
	}
}

func TestNormalizeWardLabel(t *testing.T) {
	got := normalizeWardLabel("Phường Bến Nghé")
	if got != "ben nghe" {
		t.Fatalf("got %q", got)
	}
}

func TestLabelsFromBoundariesTypes(t *testing.T) {
	labels := labelsFromBoundaries([]maps.Boundary{
		{Type: 0, Name: "Hồ Chí Minh", FullName: "Thành phố Hồ Chí Minh"},
		{Type: 2, Name: "Bến Nghé", FullName: "Phường Bến Nghé"},
	})
	if len(labels.ProvinceLabels) == 0 || normalizeProvinceLabel(labels.ProvinceLabels[0]) != "ho chi minh" {
		t.Fatalf("province %#v", labels.ProvinceLabels)
	}
	if len(labels.WardLabels) == 0 || normalizeWardLabel(labels.WardLabels[0]) != "ben nghe" {
		t.Fatalf("ward %#v", labels.WardLabels)
	}
}

func TestExtractPrefixedFromDisplay(t *testing.T) {
	display := "197 Trần Phú, Phường Bến Nghé, Thành phố Hồ Chí Minh"
	provinces := extractPrefixed(display, provincePrefixRe)
	if len(provinces) == 0 || normalizeProvinceLabel(provinces[0]) != "ho chi minh" {
		t.Fatalf("provinces %#v", provinces)
	}
	wards := extractPrefixed(display, wardPrefixRe)
	if len(wards) == 0 || normalizeWardLabel(wards[0]) != "ben nghe" {
		t.Fatalf("wards %#v", wards)
	}
}
