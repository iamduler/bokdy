package service

import (
	"context"
	"strings"
	"time"

	"bokdy/internal/identity/entity"
	iderrors "bokdy/internal/identity/errors"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/mail"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

type AccountKind string

const (
	KindPlayer AccountKind = "player"
	KindAdmin  AccountKind = "admin"
	KindOwner  AccountKind = "owner"
)

func SystemAdminFor(kind AccountKind) bool {
	return kind == KindAdmin
}

type AccountInput struct {
	Email       string
	Password    string
	FullName    string
	FirstName   string
	LastName    string
	Phone       string
	DisplayName string
}

type NormalizedAccount struct {
	Email       string
	FullName    string
	FirstName   string
	LastName    string
	Phone       string
	DisplayName string
}

type ContactReset struct {
	ClearEmail bool
	ClearPhone bool
}

func ValidateNewAccount(in AccountInput) (NormalizedAccount, error) {
	return normalizeAccount(in, true)
}

func ValidateProfile(in AccountInput) (NormalizedAccount, error) {
	return normalizeAccount(in, false)
}

func normalizeAccount(in AccountInput, requirePassword bool) (NormalizedAccount, error) {
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if email == "" || !strings.Contains(email, "@") || strings.ContainsAny(email, " \t") {
		return NormalizedAccount{}, apperr.New(apperr.CodeValidation, "invalid email")
	}
	if requirePassword {
		if err := entity.ValidatePassword(in.Password); err != nil {
			return NormalizedAccount{}, err
		}
	}
	first := strings.TrimSpace(in.FirstName)
	last := strings.TrimSpace(in.LastName)
	if first == "" {
		return NormalizedAccount{}, apperr.New(apperr.CodeValidation, "first name is required")
	}
	full := strings.TrimSpace(last + " " + first)
	return NormalizedAccount{
		Email: email, FullName: full, FirstName: first, LastName: last,
		Phone: strings.TrimSpace(in.Phone), DisplayName: full,
	}, nil
}

func RejectTakenContact(self uuid.UUID, emailOwner *entity.User, phone string, phoneOwner *entity.Identity) error {
	if emailOwner != nil && emailOwner.ID != self {
		return iderrors.ErrEmailTaken
	}
	if strings.TrimSpace(phone) != "" && phoneOwner != nil && phoneOwner.UserID != self {
		return iderrors.ErrPhoneTaken
	}
	return nil
}

func ContactVerificationReset(oldEmail, newEmail, oldPhone, newPhone string) ContactReset {
	return ContactReset{
		ClearEmail: !strings.EqualFold(strings.TrimSpace(oldEmail), strings.TrimSpace(newEmail)),
		ClearPhone: strings.TrimSpace(oldPhone) != strings.TrimSpace(newPhone),
	}
}

func BuildProvisionedUser(kind AccountKind, now time.Time) *entity.User {
	return &entity.User{
		Status:        entity.UserStatusPending,
		IsSystemAdmin: SystemAdminFor(kind),
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

type LocalProvisioner interface {
	AccountAvailable(ctx context.Context, email, phone string, self uuid.UUID) error
	ProvisionLocalUser(ctx context.Context, tx pgx.Tx, kind AccountKind, norm NormalizedAccount, password string) (*entity.User, string, error)
	SendVerification(ctx context.Context, email, token string)
}

func (s *AuthService) AccountAvailable(ctx context.Context, email, phone string, self uuid.UUID) error {
	existing, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup email")
	}
	var phoneOwner *entity.Identity
	if strings.TrimSpace(phone) != "" {
		phoneOwner, err = s.idents.FindByPhone(ctx, phone)
		if err != nil {
			return apperr.Wrap(err, apperr.CodeInternal, "lookup phone")
		}
	}
	return RejectTakenContact(self, existing, phone, phoneOwner)
}

func (s *AuthService) ProvisionLocalUser(ctx context.Context, tx pgx.Tx, kind AccountKind, norm NormalizedAccount, password string) (*entity.User, string, error) {
	now := time.Now().UTC()
	user := BuildProvisionedUser(kind, now)
	user.ID = id.MustNewUUID()
	user.PublicID = id.MustNewPublicID()
	localeID := i18n.LocaleVIID
	countryID := i18n.CountryVNID
	profile := &entity.UserProfile{
		ID: id.MustNewUUID(), UserID: user.ID, FirstName: norm.FirstName, LastName: norm.LastName,
		FullName: norm.FullName, DisplayName: norm.DisplayName, LocaleID: &localeID,
		Timezone: i18n.DefaultTimezone, CountryID: &countryID,
		PreferredCurrencyCode: i18n.DefaultCurrencyCode,
		Theme:                 entity.ThemeSystem, DateFormat: entity.DateFormatDMY,
		CreatedAt: now, UpdatedAt: now,
	}
	ident := &entity.Identity{
		ID: id.MustNewUUID(), UserID: user.ID, Provider: entity.ProviderLocal,
		ProviderSubject: norm.Email, Email: norm.Email, Phone: norm.Phone, IsPrimary: true,
		CreatedAt: now, UpdatedAt: now,
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", apperr.Wrap(err, apperr.CodeInternal, "hash password")
	}
	verifyToken, verifyHash := randomToken()
	if err := s.users.Create(ctx, tx, user, profile); err != nil {
		return nil, "", err
	}
	if err := s.idents.Create(ctx, tx, ident); err != nil {
		return nil, "", err
	}
	if err := s.creds.UpsertPassword(ctx, tx, user.ID, string(hash)); err != nil {
		return nil, "", err
	}
	if _, err := s.idents.CreateVerification(ctx, tx, ident.ID, verifyHash, now.Add(24*time.Hour)); err != nil {
		return nil, "", err
	}
	return user, verifyToken, nil
}

func (s *AuthService) SendVerification(ctx context.Context, email, token string) {
	if s == nil || s.mailer == nil || token == "" {
		return
	}
	_ = s.mailer.Send(ctx, mail.Message{
		To: email, Subject: "Verify your Bokdy account",
		Body: "Verification token: " + token,
	})
}
