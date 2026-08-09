package service_test

import (
	"testing"

	"bokdy/internal/identity/entity"
	iderrors "bokdy/internal/identity/errors"
)

func TestWeakPasswordError(t *testing.T) {
	if iderrors.ErrWeakPassword == nil || iderrors.ErrWeakPassword.Error() == "" {
		t.Fatal("expected weak password error")
	}
}

func TestEmailTakenError(t *testing.T) {
	if iderrors.ErrEmailTaken == nil {
		t.Fatal("expected email taken error")
	}
}

func TestClientErrors(t *testing.T) {
	if iderrors.ErrClientRequired == nil || iderrors.ErrRegisterForbidden == nil {
		t.Fatal("client errors")
	}
	if entity.ClientAdmin.AllowsRegister() {
		t.Fatal("admin register forbidden")
	}
}
