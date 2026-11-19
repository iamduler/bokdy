package service

import (
	"errors"
	"testing"

	orgerrors "bokdy/internal/organization/errors"
	"bokdy/internal/platform/apperr"
)

func TestBranchBulkCode(t *testing.T) {
	if branchBulkCode(orgerrors.ErrInvalidBranchStatus) != "INVALID_STATUS" {
		t.Fatal("status")
	}
	if branchBulkCode(orgerrors.ErrBranchNotFound) != "NOT_FOUND" {
		t.Fatal("missing")
	}
	if branchBulkCode(errors.New("db")) != "INTERNAL" {
		t.Fatal("internal")
	}
}

func TestStaffBulkCode(t *testing.T) {
	if staffBulkCode(orgerrors.ErrStaffNotFound) != "NOT_FOUND" {
		t.Fatal("missing")
	}
	if staffBulkCode(orgerrors.ErrLastOwner) != string(apperr.CodeValidation) {
		t.Fatal("last owner")
	}
}

func TestAbortBulk(t *testing.T) {
	if !abortBulk(orgerrors.ErrOwnerRequired) {
		t.Fatal("forbidden aborts")
	}
	if abortBulk(orgerrors.ErrBranchNotFound) {
		t.Fatal("not found stays in the batch")
	}
}
