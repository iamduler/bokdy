package service_test

import (
	"testing"

	iderrors "bokdy/internal/identity/errors"
)

func TestWeakPasswordError(t *testing.T) {
	if iderrors.ErrWeakPassword == nil {
		t.Fatal("expected weak password error")
	}
	if got := iderrors.ErrWeakPassword.Error(); got == "" {
		t.Fatal("empty error")
	}
}

func TestEmailTakenError(t *testing.T) {
	if iderrors.ErrEmailTaken == nil {
		t.Fatal("expected email taken error")
	}
}
