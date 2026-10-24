package entitycode

import "testing"

func TestFormat(t *testing.T) {
	if got := Format(Branch, 1); got != "BRN00001" {
		t.Fatalf("got %q", got)
	}
	if got := Format(Branch, 12); got != "BRN00012" {
		t.Fatalf("got %q", got)
	}
	if got := Format(Organization, 0); got != "ORG00001" {
		t.Fatalf("got %q", got)
	}
}
