package service

import (
	"context"
	"strings"
	"time"

	"bokdy/internal/identity/entity"
	iderrors "bokdy/internal/identity/errors"
	"bokdy/internal/identity/repository"
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
	Email     string
	Password  string
	FullName  string
	FirstName string
	LastName  string
	Phone     string
	Extras    ProfileExtras
}

// ProfileExtras carries the optional identity profile columns an admin form edits.
// Names stay on AccountInput and are still composed by normalizeAccount.
type ProfileExtras struct {
	Set                   bool
	Gender                string
	DateOfBirth           string
	LocaleID              string
	Timezone              string
	CountryID             string
	PreferredCurrencyCode string
	Theme                 string
	DateFormat            string
	ProvinceID            string
	WardID                string
	AddressLine           string
}

type NormalizedAccount struct {
	Email     string
	FullName  string
	FirstName string
	LastName  string
	Phone     string
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
	return NormalizedAccount{
		Email: email, FullName: ComposeFullName(first, last), FirstName: first, LastName: last,
		Phone: strings.TrimSpace(in.Phone),
	}, nil
}

// ComposeFullName builds the stored full_name as last name then first name (Vietnamese order).
func ComposeFullName(firstName, lastName string) string {
	return strings.TrimSpace(strings.TrimSpace(lastName) + " " + strings.TrimSpace(firstName))
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
	ProvisionLocalUser(ctx context.Context, tx pgx.Tx, kind AccountKind, norm NormalizedAccount, password string, extras ProfileExtras) (*entity.User, string, error)
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

func (s *AuthService) ProvisionLocalUser(ctx context.Context, tx pgx.Tx, kind AccountKind, norm NormalizedAccount, password string, extras ProfileExtras) (*entity.User, string, error) {
	now := time.Now().UTC()
	user := BuildProvisionedUser(kind, now)
	user.ID = id.MustNewUUID()
	user.PublicID = id.MustNewPublicID()
	localeID := i18n.LocaleVIID
	countryID := i18n.CountryVNID
	profile := &entity.UserProfile{
		ID: id.MustNewUUID(), UserID: user.ID, FirstName: norm.FirstName, LastName: norm.LastName,
		FullName: norm.FullName, LocaleID: &localeID,
		Timezone: i18n.DefaultTimezone, CountryID: &countryID,
		PreferredCurrencyCode: i18n.DefaultCurrencyCode,
		Theme:                 entity.ThemeSystem, DateFormat: entity.DateFormatDMY,
		CreatedAt: now, UpdatedAt: now,
	}
	if err := ValidateProfilePlace(ctx, s.users, extras); err != nil {
		return nil, "", err
	}
	if err := ApplyProfileExtras(profile, extras); err != nil {
		return nil, "", err
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

func ApplyProfileExtras(profile *entity.UserProfile, in ProfileExtras) error {
	if !in.Set || profile == nil {
		return nil
	}
	gender := strings.TrimSpace(in.Gender)
	switch gender {
	case "", "male", "female", "other", "undisclosed":
		profile.Gender = gender
	default:
		return apperr.Validation("invalid gender")
	}
	dob := strings.TrimSpace(in.DateOfBirth)
	if dob != "" {
		if _, err := time.Parse("2006-01-02", dob); err != nil {
			return apperr.Validation("invalid date_of_birth")
		}
	}
	profile.DateOfBirth = dob
	localeID, err := optionalUUID(in.LocaleID, "invalid locale_id")
	if err != nil {
		return err
	}
	if localeID != nil {
		profile.LocaleID = localeID
	}
	countryID, err := optionalUUID(in.CountryID, "invalid country_id")
	if err != nil {
		return err
	}
	if countryID != nil {
		profile.CountryID = countryID
	}
	if tz := strings.TrimSpace(in.Timezone); tz != "" {
		if _, err := time.LoadLocation(tz); err != nil {
			return apperr.Validation("invalid timezone")
		}
		profile.Timezone = tz
	}
	provinceID, err := optionalUUID(in.ProvinceID, "invalid province_id")
	if err != nil {
		return err
	}
	wardID, err := optionalUUID(in.WardID, "invalid ward_id")
	if err != nil {
		return err
	}
	if wardID != nil && provinceID == nil {
		return apperr.Validation("ward requires a province")
	}
	profile.ProvinceID = provinceID
	profile.WardID = wardID
	profile.AddressLine = strings.TrimSpace(in.AddressLine)
	currency := strings.ToUpper(strings.TrimSpace(in.PreferredCurrencyCode))
	if currency != "" && len(currency) != 3 {
		return apperr.Validation("invalid currency")
	}
	if currency != "" {
		profile.PreferredCurrencyCode = currency
	}
	if theme := strings.TrimSpace(in.Theme); theme != "" {
		parsed, ok := entity.ParseTheme(theme)
		if !ok {
			return apperr.Validation("invalid theme")
		}
		profile.Theme = parsed
	}
	if format := strings.TrimSpace(in.DateFormat); format != "" {
		parsed, ok := entity.ParseDateFormat(format)
		if !ok {
			return apperr.Validation("invalid date_format")
		}
		profile.DateFormat = parsed
	}
	return nil
}

func ValidateProfilePlace(ctx context.Context, users repository.UserRepository, in ProfileExtras) error {
	if !in.Set || users == nil {
		return nil
	}
	if code := strings.ToUpper(strings.TrimSpace(in.PreferredCurrencyCode)); code != "" {
		ok, err := users.CurrencyActive(ctx, code)
		if err != nil {
			return apperr.Wrap(err, apperr.CodeInternal, "lookup currency")
		}
		if !ok {
			return apperr.Validation("invalid currency")
		}
	}
	var provinceID uuid.UUID
	if raw := strings.TrimSpace(in.ProvinceID); raw != "" {
		parsed, err := uuid.Parse(raw)
		if err != nil {
			return apperr.Validation("invalid province_id")
		}
		ok, err := users.ProvinceActive(ctx, parsed)
		if err != nil {
			return apperr.Wrap(err, apperr.CodeInternal, "lookup province")
		}
		if !ok {
			return apperr.Validation("invalid province_id")
		}
		provinceID = parsed
	}
	if raw := strings.TrimSpace(in.WardID); raw != "" {
		if provinceID == uuid.Nil {
			return apperr.Validation("ward requires a province")
		}
		parsed, err := uuid.Parse(raw)
		if err != nil {
			return apperr.Validation("invalid ward_id")
		}
		owner, err := users.WardProvince(ctx, parsed)
		if err != nil {
			return apperr.Wrap(err, apperr.CodeInternal, "lookup ward")
		}
		if owner == nil || *owner != provinceID {
			return apperr.Validation("ward does not belong to the province")
		}
	}
	return nil
}

func optionalUUID(raw, message string) (*uuid.UUID, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}
	parsed, err := uuid.Parse(raw)
	if err != nil {
		return nil, apperr.Validation(message)
	}
	return &parsed, nil
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
