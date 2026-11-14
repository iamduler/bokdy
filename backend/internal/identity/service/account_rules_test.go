package service

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestSkillBelongsRejectsAnotherSport(t *testing.T) {
	sport := uuid.MustParse("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
	other := uuid.MustParse("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
	if SkillBelongs(other, sport) {
		t.Fatal("skill level from another sport was accepted")
	}
	if !SkillBelongs(sport, sport) {
		t.Fatal("matching sport was rejected")
	}
}

func TestContactChangeRequiresCurrentPassword(t *testing.T) {
	svc := &AuthService{}
	userID := uuid.MustParse("cccccccc-cccc-4ccc-8ccc-cccccccccccc")
	if err := svc.ChangeEmail(context.Background(), userID, "", "next@example.com"); err == nil {
		t.Fatal("email change without a password")
	}
	if err := svc.ChangePhone(context.Background(), userID, " ", "0900000000"); err == nil {
		t.Fatal("phone change without a password")
	}
}

func TestAdminCannotAssignOwnPlatformRole(t *testing.T) {
	if CanAssignOwnPlatformRole("user-1", "user-1") {
		t.Fatal("self assignment was allowed")
	}
	if !CanAssignOwnPlatformRole("user-1", "user-2") {
		t.Fatal("assignment to another user was blocked")
	}
}

func TestMFABlocksUnverifiedAdminSession(t *testing.T) {
	if MFAAllows(true, nil) {
		t.Fatal("missing MFA verification was allowed")
	}
	now := time.Now().UTC()
	if !MFAAllows(true, &now) || !MFAAllows(false, nil) {
		t.Fatal("valid MFA state was blocked")
	}
}

func TestActivityPointsFollowBookingAmount(t *testing.T) {
	if PointsForAmount(25000) != 2 || PointsForAmount(0) != 1 {
		t.Fatal("points formula drifted from the booking award")
	}
}

func TestPrivateProfileHidesDetails(t *testing.T) {
	full := PlayerProfileView{Bio: "secret", Visibility: "private", IsActivityVisible: true}
	hidden := RedactPlayerProfile(full, false)
	if hidden.Bio != "" {
		t.Fatal("private bio was exposed")
	}
	if RedactPlayerProfile(full, true).Bio != "secret" {
		t.Fatal("owner lost their own bio")
	}
}
