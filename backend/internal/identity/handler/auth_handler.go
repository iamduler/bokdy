package handler

import (
	"net/http"
	"time"

	"bokdy/internal/identity/dto"
	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/service"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	auth *service.AuthService
}

func NewAuthHandler(auth *service.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

func (h *AuthHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	auth := rg.Group("/auth")
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
		auth.POST("/refresh", h.Refresh)
		auth.POST("/verify", h.Verify)
		auth.POST("/password/forgot", h.ForgotPassword)
		auth.POST("/password/reset", h.ResetPassword)
		auth.POST("/logout", jwt, h.Logout)
	}

	identity := rg.Group("/identity", jwt, middleware.OptionalOrganization())
	{
		identity.GET("/me", h.Me)
		identity.PATCH("/me", h.UpdateMe)
		identity.GET("/sessions", h.ListSessions)
		identity.DELETE("/sessions/:id", h.RevokeSession)
		identity.POST("/sessions/revoke-all", h.RevokeAllSessions)
	}
}

func parseClient(c *gin.Context) (entity.Client, error) {
	return entity.ParseClient(c.GetHeader(entity.HeaderClient))
}

func (h *AuthHandler) Register(c *gin.Context) {
	client, err := parseClient(c)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	var req dto.RegisterRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	user, err := h.auth.Register(c.Request.Context(), service.RegisterInput{
		Client: client, Email: req.Email, Password: req.Password, FullName: req.FullName,
		FirstName: req.FirstName, LastName: req.LastName, Phone: req.Phone,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, dto.UserDTO{
		ID: user.ID.String(), PublicID: user.PublicID, Status: string(user.Status), IsSystemAdmin: user.IsSystemAdmin,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	client, err := parseClient(c)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	var req dto.LoginRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	ip := c.ClientIP()
	ua := c.Request.UserAgent()
	result, err := h.auth.Login(c.Request.Context(), service.LoginInput{
		Client: client, Email: req.Email, Password: req.Password, IPAddress: &ip, UserAgent: &ua,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toTokenResponse(result, req.Email))
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	client, err := parseClient(c)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	var req dto.RefreshRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	ip := c.ClientIP()
	ua := c.Request.UserAgent()
	result, err := h.auth.Refresh(c.Request.Context(), client, req.RefreshToken, &ip, &ua)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toTokenResponse(result, ""))
}

func (h *AuthHandler) Verify(c *gin.Context) {
	var req dto.VerifyRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.auth.VerifyEmail(c.Request.Context(), req.Token); err != nil {
		httpx.Error(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req dto.PasswordResetRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.auth.RequestPasswordReset(c.Request.Context(), req.Email); err != nil {
		httpx.Error(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req dto.PasswordResetConfirmRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.auth.ResetPassword(c.Request.Context(), req.Token, req.NewPassword); err != nil {
		httpx.Error(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	client, err := parseClient(c)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	sid, ok := requestctx.SessionID(c.Request.Context())
	if !ok {
		httpx.NoContent(c)
		return
	}
	uid, _ := requestctx.UserID(c.Request.Context())
	if err := h.auth.Logout(c.Request.Context(), client, uid, sid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AuthHandler) Me(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, errUnauthorized())
		return
	}
	user, profile, ident, roles, err := h.auth.Me(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, dto.MeResponse{User: toUserDTO(user, profile, ident, roles, requestctx.Email(c.Request.Context()))})
}

func (h *AuthHandler) UpdateMe(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, errUnauthorized())
		return
	}
	var req dto.UpdateProfileRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	user, profile, ident, err := h.auth.UpdateProfile(c.Request.Context(), uid, service.UpdateProfileInput{
		FirstName: req.FirstName, LastName: req.LastName, FullName: req.FullName, DisplayName: req.DisplayName,
		Phone: req.Phone, LocaleID: req.LocaleID, Timezone: req.Timezone, CountryID: req.CountryID,
		PreferredCurrencyCode: req.PreferredCurrencyCode, Theme: req.Theme, DateFormat: req.DateFormat,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	_, _, _, roles, err := h.auth.Me(c.Request.Context(), uid)
	if err != nil {
		roles = nil
	}
	httpx.OK(c, dto.MeResponse{User: toUserDTO(user, profile, ident, roles, requestctx.Email(c.Request.Context()))})
}

func (h *AuthHandler) ListSessions(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, errUnauthorized())
		return
	}
	currentSessionID, _ := requestctx.SessionID(c.Request.Context())
	sessions, err := h.auth.ListSessions(c.Request.Context(), uid, currentSessionID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]dto.SessionDTO, 0, len(sessions))
	for _, session := range sessions {
		out = append(out, toSessionDTO(session))
	}
	httpx.OK(c, out)
}

func (h *AuthHandler) RevokeSession(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, errUnauthorized())
		return
	}
	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, errInvalidID())
		return
	}
	if err := h.auth.RevokeSessionByUser(c.Request.Context(), uid, sessionID); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AuthHandler) RevokeAllSessions(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, errUnauthorized())
		return
	}
	if err := h.auth.RevokeAllSessions(c.Request.Context(), uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func toUserDTO(user *entity.User, profile *entity.UserProfile, ident *entity.Identity, roles []entity.UserRole, email string) dto.UserDTO {
	roleCodes := make([]string, 0, len(roles))
	for _, r := range roles {
		roleCodes = append(roleCodes, r.RoleCode)
	}
	out := dto.UserDTO{
		ID: user.ID.String(), PublicID: user.PublicID, Email: email,
		Status: string(user.Status), IsSystemAdmin: user.IsSystemAdmin, Roles: roleCodes,
		EmailVerifiedAt: formatUTC(user.EmailVerifiedAt), PhoneVerifiedAt: formatUTC(user.PhoneVerifiedAt),
	}
	if profile != nil {
		out.FullName = profile.FullName
		out.FirstName = profile.FirstName
		out.LastName = profile.LastName
		out.DisplayName = profile.DisplayName
		out.Timezone = profile.Timezone
		out.PreferredCurrencyCode = profile.PreferredCurrencyCode
		out.Theme = string(profile.Theme)
		out.DateFormat = string(profile.DateFormat)
		out.LocaleID = uuidPtrString(profile.LocaleID)
		out.CountryID = uuidPtrString(profile.CountryID)
	}
	if ident != nil {
		if out.Email == "" {
			out.Email = ident.Email
		}
		out.Phone = ident.Phone
	}
	return out
}

func toTokenResponse(result *service.AuthResult, email string) dto.TokenResponse {
	return dto.TokenResponse{
		AccessToken: result.AccessToken, RefreshToken: result.RefreshToken,
		ExpiresAt: result.ExpiresAt.UTC().Format(time.RFC3339), TokenType: "Bearer",
		User: toUserDTO(result.User, result.Profile, nil, nil, email),
	}
}

func formatUTC(t *time.Time) *string {
	if t == nil || t.IsZero() {
		return nil
	}
	s := t.UTC().Format(time.RFC3339)
	return &s
}

func uuidPtrString(id *uuid.UUID) *string {
	if id == nil || *id == uuid.Nil {
		return nil
	}
	s := id.String()
	return &s
}

func toSessionDTO(session entity.SessionSummary) dto.SessionDTO {
	return dto.SessionDTO{
		ID:               session.ID.String(),
		DeviceID:         uuidPtrString(session.DeviceID),
		Status:           string(session.Status),
		IPAddress:        session.IPAddress,
		UserAgent:        session.UserAgent,
		LastActivityAt:   formatUTC(session.LastActivityAt),
		ExpiresAt:        session.ExpiresAt.UTC().Format(time.RFC3339),
		CreatedAt:        session.CreatedAt.UTC().Format(time.RFC3339),
		IsCurrentSession: session.IsCurrent,
	}
}
