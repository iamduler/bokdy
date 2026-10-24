package service

import "testing"

func TestBranchSlugifyFromVietnameseName(t *testing.T) {
	if got := slugify("Chi nhánh Quận 7"); got != "chi-nhanh-quan-7" {
		t.Fatalf("got %q", got)
	}
}
