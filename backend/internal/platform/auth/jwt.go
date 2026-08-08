package auth

import (
	"time"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/config"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID        uuid.UUID `json:"sub_uuid"`
	SessionID     uuid.UUID `json:"sid"`
	Email         string    `json:"email"`
	IsSystemAdmin bool      `json:"is_system_admin"`
	jwt.RegisteredClaims
}

type TokenService interface {
	GenerateAccessToken(userID, sessionID uuid.UUID, email string, isSystemAdmin bool) (string, time.Time, error)
	ParseAccessToken(tokenString string) (*Claims, error)
}

type JWTService struct {
	secret []byte
	ttl    time.Duration
	issuer string
}

func NewJWTService(cfg *config.Config) *JWTService {
	return &JWTService{
		secret: []byte(cfg.Auth.AccessTokenSecret),
		ttl:    cfg.Auth.AccessTokenTTL,
		issuer: cfg.Auth.Issuer,
	}
}

func (s *JWTService) GenerateAccessToken(userID, sessionID uuid.UUID, email string, isSystemAdmin bool) (string, time.Time, error) {
	expiresAt := time.Now().UTC().Add(s.ttl)
	claims := Claims{
		UserID:        userID,
		SessionID:     sessionID,
		Email:         email,
		IsSystemAdmin: isSystemAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    s.issuer,
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now().UTC()),
			ID:        uuid.NewString(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(s.secret)
	if err != nil {
		return "", time.Time{}, apperr.Wrap(err, apperr.CodeInternal, "failed to sign access token")
	}
	return signed, expiresAt, nil
}

func (s *JWTService) ParseAccessToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, apperr.Unauthorized("unexpected signing method")
		}
		return s.secret, nil
	})
	if err != nil || !token.Valid {
		return nil, apperr.Unauthorized("invalid token")
	}
	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, apperr.Unauthorized("invalid token claims")
	}
	return claims, nil
}
