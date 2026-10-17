package service

import "testing"

func TestIsSeededRole(t *testing.T) {
	if !isSeededRole("org_owner") || !isSeededRole("org_staff") {
		t.Fatal("expected seeded roles")
	}
	if isSeededRole("custom_manager") {
		t.Fatal("custom roles must be rejected")
	}
}

func TestSlugify(t *testing.T) {
	if got := slugify("  Hello Club!! "); got != "hello-club" {
		t.Fatalf("got %q", got)
	}
	if got := slugify("Đà Nẵng"); got != "da-nang" {
		t.Fatalf("got %q", got)
	}
	if got := slugify("đường Điện Biên"); got != "duong-dien-bien" {
		t.Fatalf("got %q", got)
	}
}
