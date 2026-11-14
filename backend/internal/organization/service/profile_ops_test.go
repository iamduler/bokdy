package service

import (
	"context"
	"testing"

	"bokdy/internal/platform/apperr"

	"github.com/google/uuid"
)

func TestTransferOwnershipRejectsSamePerson(t *testing.T) {
	svc := &OrganizationService{}
	userID := uuid.MustParse("dddddddd-dddd-4ddd-8ddd-dddddddddddd")
	err := svc.TransferOwnership(context.Background(), userID, userID, userID)
	typed, ok := err.(*apperr.Error)
	if !ok || typed.Code != apperr.CodeValidation {
		t.Fatalf("got %v", err)
	}
}
