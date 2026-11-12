package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"bokdy/internal/identity/entity"
	iderrors "bokdy/internal/identity/errors"
	"bokdy/internal/platform/apperr"

	"github.com/google/uuid"
)

func TestValidateNewAccount(t *testing.T) {
	validPassword := "Abcdef1!"
	tests := []struct {
		name     string
		in       AccountInput
		wantErr  string
		wantFull string
	}{
		{name: "empty email", in: AccountInput{Password: validPassword, FirstName: "An"}, wantErr: "invalid email"},
		{name: "email without at", in: AccountInput{Email: "not-an-email", Password: validPassword, FirstName: "An"}, wantErr: "invalid email"},
		{name: "weak password", in: AccountInput{Email: "a@b.co", Password: "short", FirstName: "An"}, wantErr: iderrors.ErrWeakPassword.Message},
		{name: "missing name", in: AccountInput{Email: "a@b.co", Password: validPassword, FullName: "Ignored"}, wantErr: "first name is required"},
		{name: "name from parts", in: AccountInput{Email: " A@B.co ", Password: validPassword, FirstName: "An", LastName: "Le", FullName: "Ignored", DisplayName: "Nick"}, wantFull: "Le An"},
		{name: "given name only", in: AccountInput{Email: "a@b.co", Password: validPassword, FirstName: " An "}, wantFull: "An"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ValidateNewAccount(tt.in)
			if tt.wantErr == "" {
				if err != nil {
					t.Fatal(err)
				}
				if got.Email != "a@b.co" || got.FullName != tt.wantFull || got.DisplayName != tt.wantFull {
					t.Fatalf("normalized %+v", got)
				}
				return
			}
			var app *apperr.Error
			if !errors.As(err, &app) || app.Message != tt.wantErr {
				t.Fatalf("got %v", err)
			}
		})
	}
}

func TestCreateAccountRejectsBeforeStore(t *testing.T) {
	svc := &AdminUserService{}
	_, err := svc.CreatePlayer(context.Background(), uuid.Nil, AccountInput{
		Email: "a@b.co", Password: "short", FullName: "An",
	})
	if !errors.Is(err, iderrors.ErrWeakPassword) {
		t.Fatal(err)
	}
	_, err = svc.CreateAdmin(context.Background(), uuid.Nil, AccountInput{
		Email: "a@b.co", Password: "Abcdef1!", FullName: "An Le",
	})
	var app *apperr.Error
	if !errors.As(err, &app) || app.Message != "first name is required" {
		t.Fatal(err)
	}
}

func TestUpdateProfileRejectsBeforeStore(t *testing.T) {
	svc := &AdminUserService{}
	_, err := svc.UpdateProfile(context.Background(), uuid.New(), AccountInput{Email: "bad", FullName: "An"})
	var app *apperr.Error
	if !errors.As(err, &app) || app.Message != "invalid email" {
		t.Fatal(err)
	}
}

func TestSystemAdminFlag(t *testing.T) {
	now := time.Unix(0, 0).UTC()
	if BuildProvisionedUser(KindPlayer, now).IsSystemAdmin || BuildProvisionedUser(KindOwner, now).IsSystemAdmin {
		t.Fatal("player and owner stay non-admin")
	}
	admin := BuildProvisionedUser(KindAdmin, now)
	if !admin.IsSystemAdmin || admin.Status != entity.UserStatusPending {
		t.Fatalf("admin user %+v", admin)
	}
}

func TestRejectTakenContact(t *testing.T) {
	self := uuid.New()
	other := uuid.New()
	if err := RejectTakenContact(self, &entity.User{ID: other}, "", nil); !errors.Is(err, iderrors.ErrEmailTaken) {
		t.Fatal(err)
	}
	if err := RejectTakenContact(self, &entity.User{ID: self}, "090", &entity.Identity{UserID: other}); !errors.Is(err, iderrors.ErrPhoneTaken) {
		t.Fatal(err)
	}
	if err := RejectTakenContact(self, &entity.User{ID: self}, "090", &entity.Identity{UserID: self}); err != nil {
		t.Fatal(err)
	}
	if err := RejectTakenContact(uuid.Nil, nil, "", &entity.Identity{UserID: other}); err != nil {
		t.Fatal(err)
	}
}

func TestContactVerificationReset(t *testing.T) {
	emailChanged := ContactVerificationReset("A@b.co", "c@b.co", "090", "090")
	if !emailChanged.ClearEmail || emailChanged.ClearPhone {
		t.Fatalf("%+v", emailChanged)
	}
	phoneChanged := ContactVerificationReset("a@b.co", "a@b.co", "090", "091")
	if phoneChanged.ClearEmail || !phoneChanged.ClearPhone {
		t.Fatalf("%+v", phoneChanged)
	}
	same := ContactVerificationReset("a@b.co", " A@b.co ", "090", "090")
	if same.ClearEmail || same.ClearPhone {
		t.Fatalf("%+v", same)
	}
}
