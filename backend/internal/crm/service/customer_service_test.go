package service

import "testing"

func TestGenerateCustomerCode(t *testing.T) {
	code := generateCustomerCode("Nguyen Van A", "0901234567")
	if code == "" {
		t.Fatal("expected non-empty code")
	}
	code2 := generateCustomerCode("", "0901234567")
	if code2 == "" {
		t.Fatal("expected phone-based code")
	}
}

func TestNormalizePhone(t *testing.T) {
	if got := normalizePhone("  0901  "); got != "0901" {
		t.Fatalf("got %q", got)
	}
}
