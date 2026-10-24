package service

import (
	"testing"

	"bokdy/internal/platform/entitycode"
)

func TestNextBranchCodeFromMaxSeq(t *testing.T) {
	cases := []struct {
		max  int
		want string
	}{
		{0, "BRN00001"},
		{1, "BRN00002"},
		{41, "BRN00042"},
	}
	for _, tc := range cases {
		got := entitycode.Format(entitycode.Branch, tc.max+1)
		if got != tc.want {
			t.Fatalf("max=%d got %q want %q", tc.max, got, tc.want)
		}
	}
}
