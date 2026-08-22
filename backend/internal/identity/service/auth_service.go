package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"bokdy/internal/identity/entity"
	iderrors "bokdy/internal/identity/errors"
	"bokdy/internal/identity/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/auth"
	"bokdy/internal/platform/config"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/mail"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	pool     *pgxpool.Pool
	users    repository.UserRepository
	idents   repository.IdentityRepository
	creds    repository.CredentialRepository
	sessions repository.SessionRepository
	roles    repository.RoleRepository
	tokens   auth.TokenService
	mailer   mail.Mailer
	cfg      *config.Config
	outbox   events.Enqueuer
}

func NewAuthService(
	pool *pgxpool.Pool,
	users repository.UserRepository,
	idents repository.IdentityRepository,
	creds repository.CredentialRepository,
	sessions repository.SessionRepository,
	roles repository.RoleRepository,
	tokens auth.TokenService,
	mailer mail.Mailer,
	cfg *config.Config,
	outbox events.Enqueuer,
) *AuthService {
	return &AuthService{
		pool: pool, users: users, idents: idents, creds: creds,
		sessions: sessions, roles: roles, tokens: tokens, mailer: mailer, cfg: cfg, outbox: outbox,
	}
}

type RegisterInput struct {
	Client    entity.Client
	Email     string
	Password  string
	FullName  string
	FirstName string
	LastName  string
	Phone     string
}

type AuthResult struct {
	AccessToken  string
	RefreshToken string
	ExpiresAt    time.Time
	User         *entity.User
	Profile      *entity.UserProfile
}

func (s *AuthService) Register(ctx context.Context, in RegisterInput) (*entity.User, error) {
	if !in.Client.AllowsRegister() {
		return nil, iderrors.ErrRegisterForbidden
	}
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if email == "" || !strings.Contains(email, "@") {
		return nil, apperr.New(apperr.CodeValidation, "invalid email")
	}
	if err := entity.ValidatePassword(in.Password); err != nil {
		return nil, err
	}
	phone := strings.TrimSpace(in.Phone)
	existing, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup email")
	}
	if existing != nil {
		return nil, iderrors.ErrEmailTaken
	}
	if phone != "" {
		taken, err := s.idents.FindByPhone(ctx, phone)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup phone")
		}
		if taken != nil {
			return nil, iderrors.ErrPhoneTaken
		}
	}

	now := time.Now().UTC()
	userID := id.MustNewUUID()
	user := &entity.User{
		ID: userID, PublicID: id.MustNewPublicID(), Status: entity.UserStatusPending,
		CreatedAt: now, UpdatedAt: now,
	}
	fullName := strings.TrimSpace(in.FullName)
	if fullName == "" {
		fullName = strings.TrimSpace(in.FirstName + " " + in.LastName)
	}
	if fullName == "" {
		fullName = email
	}
	localeID := i18n.LocaleVIID
	countryID := i18n.CountryVNID
	profile := &entity.UserProfile{
		ID: id.MustNewUUID(), UserID: userID, FirstName: in.FirstName, LastName: in.LastName,
		FullName: fullName, DisplayName: fullName, LocaleID: &localeID,
		Timezone: i18n.DefaultTimezone, CountryID: &countryID,
		PreferredCurrencyCode: i18n.DefaultCurrencyCode,
		Theme:                 entity.ThemeSystem, DateFormat: entity.DateFormatDMY,
		CreatedAt: now, UpdatedAt: now,
	}
	ident := &entity.Identity{
		ID: id.MustNewUUID(), UserID: userID, Provider: entity.ProviderLocal,
		ProviderSubject: email, Email: email, Phone: phone, IsPrimary: true, CreatedAt: now, UpdatedAt: now,
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "hash password")
	}
	verifyToken, verifyHash := randomToken()

	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.users.Create(ctx, tx, user, profile); err != nil {
			return err
		}
		if err := s.idents.Create(ctx, tx, ident); err != nil {
			return err
		}
		if err := s.creds.UpsertPassword(ctx, tx, userID, string(hash)); err != nil {
			return err
		}
		if _, err := s.idents.CreateVerification(ctx, tx, ident.ID, verifyHash, now.Add(24*time.Hour)); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "UserRegistered", AggregateType: "User", AggregateID: userID,
			ActorType: events.ActorUser, ActorID: &userID, EntityType: "User", EntityID: userID,
			Payload: map[string]any{"email": email}, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "register user")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)

	_ = s.mailer.Send(ctx, mail.Message{
		To: email, Subject: "Verify your Bokdy account",
		Body: "Verification token: " + verifyToken,
	})
	return user, nil
}

func (s *AuthService) VerifyEmail(ctx context.Context, token string) error {
	hash := hashToken(token)
	var outboxID uuid.UUID
	err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		_, userID, err := s.idents.VerifyByTokenHash(ctx, tx, hash)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return iderrors.ErrInvalidToken
			}
			return err
		}
		if err := s.users.MarkEmailVerified(ctx, tx, userID, time.Now().UTC()); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "UserVerified", AggregateType: "User", AggregateID: userID,
			ActorType: events.ActorUser, ActorID: &userID, EntityType: "User", EntityID: userID,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return err
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

type LoginInput struct {
	Client    entity.Client
	Email     string
	Password  string
	IPAddress *string
	UserAgent *string
}

func (s *AuthService) Login(ctx context.Context, in LoginInput) (*AuthResult, error) {
	email := strings.ToLower(strings.TrimSpace(in.Email))
	user, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup user")
	}
	if user == nil {
		return nil, iderrors.ErrInvalidCredentials
	}
	if !in.Client.AllowsLogin(user.IsSystemAdmin) {
		return nil, iderrors.ErrClientForbidden
	}
	hash, err := s.creds.GetPasswordHash(ctx, user.ID)
	if err != nil || hash == "" {
		return nil, iderrors.ErrInvalidCredentials
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil {
		var outboxID uuid.UUID
		uid := user.ID
		_ = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
			if err := s.sessions.RecordLogin(ctx, tx, user.ID, nil, false, in.IPAddress, in.UserAgent); err != nil {
				return err
			}
			oid, err := events.Append(ctx, tx, events.Event{
				Type: "UserLoginFailed", AggregateType: "User", AggregateID: uid,
				ActorType: events.ActorUser, ActorID: &uid, EntityType: "User", EntityID: uid,
				IPAddress: in.IPAddress, UserAgent: in.UserAgent,
				Payload: map[string]any{"email": email},
			})
			outboxID = oid
			return err
		})
		events.AfterCommit(ctx, s.outbox, outboxID)
		return nil, iderrors.ErrInvalidCredentials
	}
	if user.Status != entity.UserStatusActive {
		return nil, iderrors.ErrUserNotActive
	}
	return s.issueSession(ctx, user, in.IPAddress, in.UserAgent, "UserLoggedIn")
}

func (s *AuthService) ListSessions(ctx context.Context, userID, currentSessionID uuid.UUID) ([]entity.SessionSummary, error) {
	sessions, err := s.sessions.ListByUser(ctx, userID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list sessions")
	}
	for i := range sessions {
		sessions[i].IsCurrent = sessions[i].ID == currentSessionID
	}
	return sessions, nil
}

func (s *AuthService) RevokeSessionByUser(ctx context.Context, userID, sessionID uuid.UUID) error {
	var outboxID uuid.UUID
	err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.sessions.RevokeOwnedSession(ctx, tx, userID, sessionID); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return iderrors.ErrSessionNotFound
			}
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "UserLoggedOut", AggregateType: "Session", AggregateID: sessionID,
			ActorType: events.ActorUser, ActorID: &userID, EntityType: "Session", EntityID: sessionID,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return err
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *AuthService) RevokeAllSessions(ctx context.Context, userID uuid.UUID) error {
	var outboxID uuid.UUID
	err := persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.sessions.RevokeAllForUser(ctx, tx, userID); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "UserLoggedOut", AggregateType: "User", AggregateID: userID,
			ActorType: events.ActorUser, ActorID: &userID, EntityType: "User", EntityID: userID,
			Payload: map[string]any{"scope": "all_sessions"},
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "revoke all sessions")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *AuthService) Refresh(ctx context.Context, client entity.Client, refreshToken string, ip, ua *string) (*AuthResult, error) {
	hash := hashToken(refreshToken)
	rt, session, err := s.sessions.FindRefreshByHash(ctx, hash)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup refresh")
	}
	if rt == nil || session == nil || rt.RevokedAt != nil || time.Now().After(rt.ExpiresAt) || session.Status != entity.SessionActive {
		return nil, iderrors.ErrInvalidToken
	}
	user, err := s.users.FindByID(ctx, session.UserID)
	if err != nil || user == nil {
		return nil, iderrors.ErrInvalidToken
	}
	if !client.AllowsLogin(user.IsSystemAdmin) {
		return nil, iderrors.ErrClientForbidden
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.sessions.RevokeSession(ctx, tx, session.ID)
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "revoke old session")
	}
	return s.issueSession(ctx, user, ip, ua, "SessionRefreshed")
}

func (s *AuthService) Logout(ctx context.Context, client entity.Client, userID, sessionID uuid.UUID) error {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup user")
	}
	if user != nil && !client.AllowsLogin(user.IsSystemAdmin) {
		return iderrors.ErrClientForbidden
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.sessions.RevokeSession(ctx, tx, sessionID); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "UserLoggedOut", AggregateType: "Session", AggregateID: sessionID,
			ActorType: events.ActorUser, ActorID: &userID, EntityType: "Session", EntityID: sessionID,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return err
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *AuthService) RequestPasswordReset(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	user, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "lookup user")
	}
	if user == nil {
		return nil // do not leak existence
	}
	token, tokenHash := randomToken()
	var outboxID uuid.UUID
	uid := user.ID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.creds.CreateResetToken(ctx, tx, user.ID, tokenHash, time.Now().UTC().Add(time.Hour)); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "PasswordResetRequested", AggregateType: "User", AggregateID: uid,
			ActorType: events.ActorUser, ActorID: &uid, EntityType: "User", EntityID: uid,
			Payload: map[string]any{"email": email},
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "create reset token")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return s.mailer.Send(ctx, mail.Message{
		To: email, Subject: "Reset your Bokdy password", Body: "Reset token: " + token,
	})
}

func (s *AuthService) ResetPassword(ctx context.Context, token, newPassword string) error {
	if err := entity.ValidatePassword(newPassword); err != nil {
		return err
	}
	hash := hashToken(token)
	pwHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "hash password")
	}
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		userID, err := s.creds.ConsumeResetToken(ctx, tx, hash)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return iderrors.ErrInvalidToken
			}
			return err
		}
		if err := s.creds.UpsertPassword(ctx, tx, userID, string(pwHash)); err != nil {
			return err
		}
		if err := s.sessions.RevokeAllForUser(ctx, tx, userID); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "PasswordReset", AggregateType: "User", AggregateID: userID,
			ActorType: events.ActorUser, ActorID: &userID, EntityType: "User", EntityID: userID,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return err
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *AuthService) Me(ctx context.Context, userID uuid.UUID) (*entity.User, *entity.UserProfile, *entity.Identity, []entity.UserRole, error) {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil, nil, nil, nil, apperr.Wrap(err, apperr.CodeInternal, "lookup user")
	}
	if user == nil {
		return nil, nil, nil, nil, iderrors.ErrUserNotFound
	}
	profile, err := s.users.GetProfile(ctx, userID)
	if err != nil {
		return nil, nil, nil, nil, apperr.Wrap(err, apperr.CodeInternal, "lookup profile")
	}
	ident, err := s.idents.FindPrimaryByUserID(ctx, userID)
	if err != nil {
		return nil, nil, nil, nil, apperr.Wrap(err, apperr.CodeInternal, "lookup identity")
	}
	roles, err := s.roles.ListByUser(ctx, userID)
	if err != nil {
		return nil, nil, nil, nil, apperr.Wrap(err, apperr.CodeInternal, "lookup roles")
	}
	return user, profile, ident, roles, nil
}

type UpdateProfileInput struct {
	FirstName             *string
	LastName              *string
	FullName              *string
	DisplayName           *string
	Phone                 *string
	LocaleID              *string
	Timezone              *string
	CountryID             *string
	PreferredCurrencyCode *string
	Theme                 *string
	DateFormat            *string
}

func (s *AuthService) UpdateProfile(ctx context.Context, userID uuid.UUID, in UpdateProfileInput) (*entity.User, *entity.UserProfile, *entity.Identity, error) {
	user, profile, ident, _, err := s.Me(ctx, userID)
	if err != nil {
		return nil, nil, nil, err
	}
	if profile == nil {
		return nil, nil, nil, iderrors.ErrUserNotFound
	}
	if in.FirstName != nil {
		profile.FirstName = strings.TrimSpace(*in.FirstName)
	}
	if in.LastName != nil {
		profile.LastName = strings.TrimSpace(*in.LastName)
	}
	if in.FullName != nil {
		profile.FullName = strings.TrimSpace(*in.FullName)
	}
	if in.DisplayName != nil {
		profile.DisplayName = strings.TrimSpace(*in.DisplayName)
	}
	if profile.FullName == "" {
		profile.FullName = strings.TrimSpace(profile.FirstName + " " + profile.LastName)
	}
	if in.Timezone != nil {
		profile.Timezone = strings.TrimSpace(*in.Timezone)
	}
	if in.PreferredCurrencyCode != nil {
		code := strings.ToUpper(strings.TrimSpace(*in.PreferredCurrencyCode))
		if code != "" && len(code) != 3 {
			return nil, nil, nil, apperr.Validation("invalid preferred_currency_code")
		}
		profile.PreferredCurrencyCode = code
	}
	if in.Theme != nil {
		theme, ok := entity.ParseTheme(*in.Theme)
		if !ok {
			return nil, nil, nil, apperr.Validation("invalid theme")
		}
		profile.Theme = theme
	}
	if in.DateFormat != nil {
		df, ok := entity.ParseDateFormat(*in.DateFormat)
		if !ok {
			return nil, nil, nil, apperr.Validation("invalid date_format")
		}
		profile.DateFormat = df
	}
	if in.LocaleID != nil {
		idVal, err := parseOptionalUUID(*in.LocaleID)
		if err != nil {
			return nil, nil, nil, apperr.Validation("invalid locale_id")
		}
		profile.LocaleID = idVal
	}
	if in.CountryID != nil {
		idVal, err := parseOptionalUUID(*in.CountryID)
		if err != nil {
			return nil, nil, nil, apperr.Validation("invalid country_id")
		}
		profile.CountryID = idVal
	}

	phoneChanged := false
	newPhone := ""
	if ident != nil {
		newPhone = ident.Phone
	}
	if in.Phone != nil {
		newPhone = strings.TrimSpace(*in.Phone)
		oldPhone := ""
		if ident != nil {
			oldPhone = ident.Phone
		}
		phoneChanged = newPhone != oldPhone
		if phoneChanged && newPhone != "" {
			taken, err := s.idents.FindByPhone(ctx, newPhone)
			if err != nil {
				return nil, nil, nil, apperr.Wrap(err, apperr.CodeInternal, "lookup phone")
			}
			if taken != nil && taken.UserID != userID {
				return nil, nil, nil, iderrors.ErrPhoneTaken
			}
		}
	}

	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.users.UpdateProfile(ctx, tx, profile); err != nil {
			return err
		}
		if phoneChanged {
			if err := s.idents.UpdatePrimaryPhone(ctx, tx, userID, newPhone); err != nil {
				return err
			}
			if err := s.users.ClearPhoneVerified(ctx, tx, userID); err != nil {
				return err
			}
			user.PhoneVerifiedAt = nil
			if ident != nil {
				ident.Phone = newPhone
			}
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "UserProfileUpdated", AggregateType: "User", AggregateID: userID,
			ActorType: events.ActorUser, ActorID: &userID, EntityType: "User", EntityID: userID,
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, nil, nil, apperr.Wrap(err, apperr.CodeInternal, "update profile")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return user, profile, ident, nil
}

func parseOptionalUUID(raw string) (*uuid.UUID, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, nil
	}
	parsed, err := uuid.Parse(raw)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func (s *AuthService) issueSession(ctx context.Context, user *entity.User, ip, ua *string, eventType string) (*AuthResult, error) {
	now := time.Now().UTC()
	sessionID := id.MustNewUUID()
	refreshRaw, refreshHash := randomToken()
	session := &entity.Session{
		ID: sessionID, UserID: user.ID, Status: entity.SessionActive,
		IPAddress: ip, UserAgent: ua, LastActivityAt: &now,
		ExpiresAt: now.Add(s.cfg.Auth.SessionTTL), CreatedAt: now,
	}
	refresh := &entity.RefreshToken{
		ID: id.MustNewUUID(), SessionID: sessionID, TokenHash: refreshHash,
		ExpiresAt: now.Add(s.cfg.Auth.RefreshTokenTTL), CreatedAt: now,
	}

	email, _ := s.findEmail(ctx, user.ID)
	access, exp, err := s.tokens.GenerateAccessToken(user.ID, sessionID, email, user.IsSystemAdmin)
	if err != nil {
		return nil, err
	}

	var outboxID uuid.UUID
	uid := user.ID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.sessions.Create(ctx, tx, session, refresh); err != nil {
			return err
		}
		if err := s.users.TouchLastLogin(ctx, tx, user.ID, now); err != nil {
			return err
		}
		if err := s.sessions.RecordLogin(ctx, tx, user.ID, &sessionID, true, ip, ua); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: eventType, AggregateType: "Session", AggregateID: sessionID,
			ActorType: events.ActorUser, ActorID: &uid, EntityType: "User", EntityID: uid,
			IPAddress: ip, UserAgent: ua,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create session")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)

	profile, _ := s.users.GetProfile(ctx, user.ID)
	return &AuthResult{
		AccessToken: access, RefreshToken: refreshRaw, ExpiresAt: exp, User: user, Profile: profile,
	}, nil
}

func (s *AuthService) findEmail(ctx context.Context, userID uuid.UUID) (string, error) {
	row := s.pool.QueryRow(ctx, `SELECT COALESCE(email,'') FROM identity.identities WHERE user_id=$1 AND is_primary=true LIMIT 1`, userID)
	var email string
	if err := row.Scan(&email); err != nil {
		return "", err
	}
	return email, nil
}

func randomToken() (raw string, hash string) {
	buf := make([]byte, 32)
	_, _ = rand.Read(buf)
	raw = base64.RawURLEncoding.EncodeToString(buf)
	hash = hashToken(raw)
	return raw, hash
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
