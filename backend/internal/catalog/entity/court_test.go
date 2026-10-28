package entity

import "testing"

func TestParseCourtSurface(t *testing.T) {
	cases := []struct {
		raw  string
		want CourtSurface
	}{
		{"pvc", CourtSurfacePVC},
		{"wood", CourtSurfaceWood},
		{"hard_court", CourtSurfaceHardCourt},
		{"grass", CourtSurfaceGrass},
		{"artificial_turf", CourtSurfaceArtificialTurf},
		{"clay", CourtSurfaceClay},
		{"rubber", CourtSurfaceRubber},
		{"other", CourtSurfaceOther},
		{"unspecified", CourtSurfaceUnspecified},
		{"", CourtSurfaceUnspecified},
		{"carpet", CourtSurfaceUnspecified},
	}
	for _, tc := range cases {
		if got := ParseCourtSurface(tc.raw); got != tc.want {
			t.Fatalf("ParseCourtSurface(%q) = %q, want %q", tc.raw, got, tc.want)
		}
	}
}
