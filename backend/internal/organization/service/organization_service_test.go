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
	got := slugify("  Hello Club!! ")
	if got != "hello-club" {
		t.Fatalf("got %q", got)
	}
}
