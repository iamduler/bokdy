package entity

import "testing"

func TestValidatePassword(t *testing.T) {
	ok := "ChangeMe1!"
	if err := ValidatePassword(ok); err != nil {
		t.Fatalf("valid password rejected: %v", err)
	}
	bads := []string{
		"",
		"short1!",
		"alllowercase1!",
		"ALLUPPERCASE1!",
		"NoDigits!!",
		"NoSpecial1Aa",
		"abcdefgh",
	}
	for _, pw := range bads {
		if err := ValidatePassword(pw); err == nil {
			t.Fatalf("expected weak password for %q", pw)
		}
	}
}
