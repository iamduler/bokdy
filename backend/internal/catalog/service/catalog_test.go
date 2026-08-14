package service

import "testing"

func TestValidSlotDuration(t *testing.T) {
	ok := []int{15, 30, 45, 60, 90, 180}
	for _, m := range ok {
		if !validSlotDuration(m) {
			t.Fatalf("expected valid %d", m)
		}
	}
	bad := []int{0, 10, 20, 14, 181, 200}
	for _, m := range bad {
		if validSlotDuration(m) {
			t.Fatalf("expected invalid %d", m)
		}
	}
}

func TestSlugify(t *testing.T) {
	if got := slugify("Sân 1"); got == "" {
		t.Fatal("expected non-empty slug")
	}
}
