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
) *AuthService {
	return &AuthService{
		pool: pool, users: users, idents: idents, creds: creds,
		sessions: sessions, roles: roles, tokens: tokens, mailer: mailer, cfg: cfg,
	}
}

type RegisterInput struct {
	Email     string
	Password  string
	FullName  string
	FirstName string
	LastName  string
}

type AuthResult struct {
	AccessToken  string
	RefreshToken string
	ExpiresAt    time.Time
	User         *entity.User
	Profile      *entity.UserProfile
}

func (s *AuthService) Register(ctx context.Context, in RegisterInput) (*entity.User, error) {
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if email == "" || !strings.Contains(email, "@") {
		return nil, apperr.New(apperr.CodeValidation, "invalid email")
	}
	if len(in.Password) < 8 {
		return nil, iderrors.ErrWeakPassword
	}
	existing, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup email")
	}
	if existing != nil {
		return nil, iderrors.ErrEmailTaken
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
	profile := &entity.UserProfile{
		ID: id.MustNewUUID(), UserID: userID, FirstName: in.FirstName, LastName: in.LastName,
		FullName: fullName, DisplayName: fullName, Locale: "en", CreatedAt: now, UpdatedAt: now,
	}
	ident := &entity.Identity{
		ID: id.MustNewUUID(), UserID: userID, Provider: entity.ProviderLocal,
		ProviderSubject: email, Email: email, IsPrimary: true, CreatedAt: now, UpdatedAt: now,
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "hash password")
	}
	verifyToken, verifyHash := randomToken()

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
		_, err := s.idents.CreateVerification(ctx, tx, ident.ID, verifyHash, now.Add(24*time.Hour))
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "register user")
	}

	_ = s.mailer.Send(ctx, mail.Message{
		To: email, Subject: "Verify your Bokdy account",
		Body: "Verification token: " + verifyToken,
	})
	return user, nil
}

func (s *AuthService) VerifyEmail(ctx context.Context, token string) error {
	hash := hashToken(token)
	return persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		_, userID, err := s.idents.VerifyByTokenHash(ctx, tx, hash)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return iderrors.ErrInvalidToken
			}
			return err
		}
		return s.users.UpdateStatus(ctx, tx, userID, entity.UserStatusActive)
	})
}

type LoginInput struct {
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
	hash, err := s.creds.GetPasswordHash(ctx, user.ID)
	if err != nil || hash == "" {
		return nil, iderrors.ErrInvalidCredentials
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil {
		_ = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
			return s.sessions.RecordLogin(ctx, tx, user.ID, nil, false, in.IPAddress, in.UserAgent)
		})
		return nil, iderrors.ErrInvalidCredentials
	}
	if user.Status != entity.UserStatusActive && user.Status != entity.UserStatusPending {
		return nil, iderrors.ErrUserNotActive
	}
	// Auto-activate pending users on successful login in development scaffold.
	if user.Status == entity.UserStatusPending {
		_ = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
			return s.users.UpdateStatus(ctx, tx, user.ID, entity.UserStatusActive)
		})
		user.Status = entity.UserStatusActive
	}
	return s.issueSession(ctx, user, in.IPAddress, in.UserAgent)
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string, ip, ua *string) (*AuthResult, error) {
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
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.sessions.RevokeSession(ctx, tx, session.ID)
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "revoke old session")
	}
	return s.issueSession(ctx, user, ip, ua)
}

func (s *AuthService) Logout(ctx context.Context, sessionID uuid.UUID) error {
	return persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.sessions.RevokeSession(ctx, tx, sessionID)
	})
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
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		return s.creds.CreateResetToken(ctx, tx, user.ID, tokenHash, time.Now().UTC().Add(time.Hour))
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "create reset token")
	}
	return s.mailer.Send(ctx, mail.Message{
		To: email, Subject: "Reset your Bokdy password", Body: "Reset token: " + token,
	})
}

func (s *AuthService) ResetPassword(ctx context.Context, token, newPassword string) error {
	if len(newPassword) < 8 {
		return iderrors.ErrWeakPassword
	}
	hash := hashToken(token)
	pwHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "hash password")
	}
	return persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		userID, err := s.creds.ConsumeResetToken(ctx, tx, hash)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return iderrors.ErrInvalidToken
			}
			return err
		}
		return s.creds.UpsertPassword(ctx, tx, userID, string(pwHash))
	})
}

func (s *AuthService) Me(ctx context.Context, userID uuid.UUID) (*entity.User, *entity.UserProfile, []entity.UserRole, error) {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil, nil, nil, apperr.Wrap(err, apperr.CodeInternal, "lookup user")
	}
	if user == nil {
		return nil, nil, nil, iderrors.ErrUserNotFound
	}
	profile, err := s.users.GetProfile(ctx, userID)
	if err != nil {
		return nil, nil, nil, apperr.Wrap(err, apperr.CodeInternal, "lookup profile")
	}
	roles, err := s.roles.ListByUser(ctx, userID)
	if err != nil {
		return nil, nil, nil, apperr.Wrap(err, apperr.CodeInternal, "lookup roles")
	}
	return user, profile, roles, nil
}

func (s *AuthService) issueSession(ctx context.Context, user *entity.User, ip, ua *string) (*AuthResult, error) {
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

	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.sessions.Create(ctx, tx, session, refresh); err != nil {
			return err
		}
		if err := s.users.TouchLastLogin(ctx, tx, user.ID, now); err != nil {
			return err
		}
		return s.sessions.RecordLogin(ctx, tx, user.ID, &sessionID, true, ip, ua)
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create session")
	}

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
