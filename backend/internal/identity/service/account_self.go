package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"bokdy/db/generated/sqlc"
	"bokdy/internal/identity/entity"
	iderrors "bokdy/internal/identity/errors"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

func (s *AuthService) requirePassword(ctx context.Context, userID uuid.UUID, current string) error {
	if strings.TrimSpace(current) == "" {
		return apperr.Validation("current password is required")
	}
	hash, err := s.creds.GetPasswordHash(ctx, userID)
	if err != nil || hash == "" || bcrypt.CompareHashAndPassword([]byte(hash), []byte(current)) != nil {
		return iderrors.ErrInvalidCredentials
	}
	return nil
}

func (s *AuthService) ChangePassword(ctx context.Context, userID uuid.UUID, next string) error {
	if err := entity.ValidatePassword(next); err != nil {
		return err
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(next), bcrypt.DefaultCost)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "hash password")
	}
	return persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.creds.UpsertPassword(ctx, tx, userID, string(hashed))
	})
}

func (s *AuthService) ChangeEmail(ctx context.Context, userID uuid.UUID, currentPassword, nextEmail string) error {
	nextEmail = strings.ToLower(strings.TrimSpace(nextEmail))
	if nextEmail == "" || !strings.Contains(nextEmail, "@") || strings.ContainsAny(nextEmail, " \t") {
		return apperr.Validation("invalid email")
	}
	if err := s.requirePassword(ctx, userID, currentPassword); err != nil {
		return err
	}
	if err := s.AccountAvailable(ctx, nextEmail, "", userID); err != nil {
		return err
	}
	ident, err := s.idents.FindPrimaryByUserID(ctx, userID)
	if err != nil || ident == nil {
		return iderrors.ErrUserNotFound
	}
	raw, tokenHash := randomToken()
	expires := time.Now().UTC().Add(24 * time.Hour)
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.idents.UpdatePrimaryEmail(ctx, tx, userID, nextEmail); err != nil {
			return err
		}
		if err := s.users.ClearEmailVerified(ctx, tx, userID); err != nil {
			return err
		}
		if _, err := s.idents.CreateVerification(ctx, tx, ident.ID, tokenHash, expires); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "UserEmailChanged", AggregateType: "User", AggregateID: userID,
			ActorType: events.ActorUser, ActorID: &userID, EntityType: "User", EntityID: userID,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "change email")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	s.SendVerification(ctx, nextEmail, raw)
	return nil
}

func (s *AuthService) ChangePhone(ctx context.Context, userID uuid.UUID, currentPassword, phone string) error {
	if err := s.requirePassword(ctx, userID, currentPassword); err != nil {
		return err
	}
	_, _, _, err := s.UpdateProfile(ctx, userID, UpdateProfileInput{Phone: &phone})
	return err
}

// ResendEmailVerification mints a new email verification token for the signed-in user.
// Already verified or missing email is a no-op (204).
func (s *AuthService) ResendEmailVerification(ctx context.Context, userID uuid.UUID) error {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup user")
	}
	if user == nil {
		return iderrors.ErrUserNotFound
	}
	if user.EmailVerifiedAt != nil {
		return nil
	}
	ident, err := s.idents.FindPrimaryByUserID(ctx, userID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup identity")
	}
	if ident == nil {
		return iderrors.ErrUserNotFound
	}
	email := strings.ToLower(strings.TrimSpace(ident.Email))
	if email == "" {
		return nil
	}
	raw, tokenHash := randomToken()
	expires := time.Now().UTC().Add(24 * time.Hour)
	if err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		_, err := s.idents.CreateVerification(ctx, tx, ident.ID, tokenHash, expires)
		return err
	}); err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "resend email verification")
	}
	s.SendVerification(ctx, email, raw)
	return nil
}

func (s *AuthService) Deactivate(ctx context.Context, userID uuid.UUID, currentPassword string) error {
	if err := s.requirePassword(ctx, userID, currentPassword); err != nil {
		return err
	}
	var outboxID uuid.UUID
	err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.users.UpdateStatus(ctx, tx, userID, entity.UserStatusDeactivated); err != nil {
			return err
		}
		if err := s.sessions.RevokeAllForUser(ctx, tx, userID); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "UserDeactivated", AggregateType: "User", AggregateID: userID,
			ActorType: events.ActorUser, ActorID: &userID, EntityType: "User", EntityID: userID,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "deactivate user")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *AuthService) queries() (*dbsqlc.Queries, error) {
	if s.q == nil {
		return nil, apperr.New(apperr.CodeInternal, "profile store is not configured")
	}
	return s.q, nil
}

func (s *AuthService) EnrollTOTP(ctx context.Context, userID uuid.UUID) (string, error) {
	q, err := s.queries()
	if err != nil {
		return "", err
	}
	secret, err := GenerateTOTPSecret()
	if err != nil {
		return "", err
	}
	err = q.UpsertTOTPMethod(ctx, dbsqlc.UpsertTOTPMethodParams{
		ID: id.MustNewUUID(), UserID: userID, SecretEnc: &secret, IsEnabled: false,
	})
	if err != nil {
		return "", apperr.Wrap(err, apperr.CodeInternal, "enroll totp")
	}
	return secret, nil
}

func (s *AuthService) ConfirmTOTP(ctx context.Context, userID, sessionID uuid.UUID, code string) error {
	q, err := s.queries()
	if err != nil {
		return err
	}
	method, err := q.GetTOTPMethod(ctx, userID)
	if err != nil {
		return iderrors.ErrInvalidToken
	}
	if !VerifyTOTP(method.SecretEnc, code, time.Now().UTC()) {
		return iderrors.ErrInvalidToken
	}
	now := time.Now().UTC()
	if err := q.ConfirmTOTPMethod(ctx, dbsqlc.ConfirmTOTPMethodParams{UserID: userID, VerifiedAt: &now}); err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "confirm totp")
	}
	if sessionID != uuid.Nil {
		_ = q.MarkSessionMFAVerified(ctx, dbsqlc.MarkSessionMFAVerifiedParams{ID: sessionID, MfaVerifiedAt: &now, UserID: userID})
	}
	return nil
}

func (s *AuthService) MFAStatus(ctx context.Context, userID, sessionID uuid.UUID) (enabled bool, sessionOK bool, err error) {
	q, err := s.queries()
	if err != nil {
		return false, false, err
	}
	method, err := q.GetTOTPMethod(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, true, nil
		}
		return false, false, err
	}
	var verified *time.Time
	if sessionID != uuid.Nil {
		verified, _ = q.SessionMFAVerified(ctx, dbsqlc.SessionMFAVerifiedParams{ID: sessionID, UserID: userID})
	}
	return method.IsEnabled, MFAAllows(method.IsEnabled, verified), nil
}

func (s *AuthService) AdminMFARequired(ctx context.Context, userID, sessionID uuid.UUID) error {
	q, err := s.queries()
	if err != nil {
		return err
	}
	profile, err := q.GetPlatformAdminProfile(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return err
	}
	if !profile.IsMfaRequired {
		return nil
	}
	verified, err := q.SessionMFAVerified(ctx, dbsqlc.SessionMFAVerifiedParams{ID: sessionID, UserID: userID})
	if err != nil || !MFAAllows(true, verified) {
		return apperr.New(apperr.CodeForbidden, "mfa is required")
	}
	return nil
}
