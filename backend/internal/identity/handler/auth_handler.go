package handler

import (
	"net/http"

	"bokdy/internal/identity/dto"
	"bokdy/internal/identity/service"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
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
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, errValidation(err))
		return
	}
	user, err := h.auth.Register(c.Request.Context(), service.RegisterInput{
		Email: req.Email, Password: req.Password, FullName: req.FullName,
		FirstName: req.FirstName, LastName: req.LastName,
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
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, errValidation(err))
		return
	}
	ip := c.ClientIP()
	ua := c.Request.UserAgent()
	result, err := h.auth.Login(c.Request.Context(), service.LoginInput{
		Email: req.Email, Password: req.Password, IPAddress: &ip, UserAgent: &ua,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toTokenResponse(result, req.Email))
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, errValidation(err))
		return
	}
	ip := c.ClientIP()
	ua := c.Request.UserAgent()
	result, err := h.auth.Refresh(c.Request.Context(), req.RefreshToken, &ip, &ua)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toTokenResponse(result, ""))
}

func (h *AuthHandler) Verify(c *gin.Context) {
	var req dto.VerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, errValidation(err))
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
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, errValidation(err))
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
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, errValidation(err))
		return
	}
	if err := h.auth.ResetPassword(c.Request.Context(), req.Token, req.NewPassword); err != nil {
		httpx.Error(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	sid, ok := requestctx.SessionID(c.Request.Context())
	if !ok {
		httpx.NoContent(c)
		return
	}
	_ = h.auth.Logout(c.Request.Context(), sid)
	httpx.NoContent(c)
}

func (h *AuthHandler) Me(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, errUnauthorized())
		return
	}
	user, profile, roles, err := h.auth.Me(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	roleCodes := make([]string, 0, len(roles))
	for _, r := range roles {
		roleCodes = append(roleCodes, r.RoleCode)
	}
	fullName := ""
	if profile != nil {
		fullName = profile.FullName
	}
	httpx.OK(c, dto.MeResponse{User: dto.UserDTO{
		ID: user.ID.String(), PublicID: user.PublicID, FullName: fullName,
		Email: requestctx.Email(c.Request.Context()), Status: string(user.Status),
		IsSystemAdmin: user.IsSystemAdmin, Roles: roleCodes,
	}})
}

func toTokenResponse(result *service.AuthResult, email string) dto.TokenResponse {
	fullName := ""
	if result.Profile != nil {
		fullName = result.Profile.FullName
	}
	return dto.TokenResponse{
		AccessToken: result.AccessToken, RefreshToken: result.RefreshToken,
		ExpiresAt: result.ExpiresAt.UTC().Format(timeRFC3339), TokenType: "Bearer",
		User: dto.UserDTO{
			ID: result.User.ID.String(), PublicID: result.User.PublicID, Email: email,
			FullName: fullName, Status: string(result.User.Status), IsSystemAdmin: result.User.IsSystemAdmin,
		},
	}
}

const timeRFC3339 = "2006-01-02T15:04:05Z07:00"
