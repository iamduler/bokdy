package handler

import (
	"bokdy/internal/identity/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type passwordBody struct {
	CurrentPassword string `json:"current_password"`
	Password        string `json:"password"`
}

type emailBody struct {
	CurrentPassword string `json:"current_password"`
	Email           string `json:"email"`
}

type phoneBody struct {
	CurrentPassword string `json:"current_password"`
	Phone           string `json:"phone"`
}

type codeBody struct {
	Code string `json:"code"`
}

type favoriteBody struct {
	TargetType string `json:"target_type"`
	TargetID   string `json:"target_id"`
}

type sportBody struct {
	SportID      string `json:"sport_id"`
	SkillLevelID string `json:"skill_level_id"`
	DominantHand string `json:"dominant_hand"`
	PlayingStyle string `json:"playing_style"`
	Experience   string `json:"experience"`
}

func (h *AuthHandler) registerProfileRoutes(identity *gin.RouterGroup) {
	identity.POST("/password", h.ChangePassword)
	identity.POST("/email", h.ChangeEmail)
	identity.POST("/phone", h.ChangePhone)
	identity.POST("/deactivate", h.Deactivate)
	identity.GET("/mfa", h.MFAStatus)
	identity.POST("/mfa/enroll", h.EnrollTOTP)
	identity.POST("/mfa/confirm", h.ConfirmTOTP)
	identity.GET("/player", h.GetPlayer)
	identity.PUT("/player", h.SavePlayer)
	identity.GET("/skill-catalog", h.SkillCatalog)
	identity.GET("/sports", h.ListSports)
	identity.PUT("/sports", h.SaveSport)
	identity.DELETE("/sports/:sportId", h.DeleteSport)
	identity.GET("/favorites", h.ListFavorites)
	identity.POST("/favorites", h.AddFavorite)
	identity.DELETE("/favorites", h.RemoveFavorite)
	identity.GET("/activity", h.Activity)
	identity.GET("/players/:userId", h.ViewPlayer)
	identity.GET("/employee", h.GetEmployee)
	identity.PUT("/employee", h.SaveEmployee)
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	var req passwordBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.auth.ChangePassword(c.Request.Context(), uid, req.CurrentPassword, req.Password); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AuthHandler) ChangeEmail(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	var req emailBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.auth.ChangeEmail(c.Request.Context(), uid, req.CurrentPassword, req.Email); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AuthHandler) ChangePhone(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	var req phoneBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.auth.ChangePhone(c.Request.Context(), uid, req.CurrentPassword, req.Phone); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AuthHandler) Deactivate(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	var req passwordBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.auth.Deactivate(c.Request.Context(), uid, req.CurrentPassword); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AuthHandler) MFAStatus(c *gin.Context) {
	uid, sid, ok := currentUser(c)
	if !ok {
		return
	}
	enabled, sessionOK, err := h.auth.MFAStatus(c.Request.Context(), uid, sid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, gin.H{"enabled": enabled, "session_verified": sessionOK})
}

func (h *AuthHandler) EnrollTOTP(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	secret, err := h.auth.EnrollTOTP(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, gin.H{"secret": secret})
}

func (h *AuthHandler) ConfirmTOTP(c *gin.Context) {
	uid, sid, ok := currentUser(c)
	if !ok {
		return
	}
	var req codeBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.auth.ConfirmTOTP(c.Request.Context(), uid, sid, req.Code); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AuthHandler) GetPlayer(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	view, err := h.auth.GetPlayerProfile(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, view)
}

func (h *AuthHandler) SavePlayer(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	var req service.PlayerProfileInput
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.auth.SavePlayerProfile(c.Request.Context(), uid, req); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AuthHandler) SkillCatalog(c *gin.Context) {
	if _, _, ok := currentUser(c); !ok {
		return
	}
	rows, err := h.auth.ListSkillCatalog(c.Request.Context())
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, rows)
}

func (h *AuthHandler) ListSports(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	rows, err := h.auth.ListSportProfiles(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, rows)
}

func (h *AuthHandler) SaveSport(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	var req sportBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	sportID, err := uuid.Parse(req.SportID)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid sport_id")
		return
	}
	skillID, err := uuid.Parse(req.SkillLevelID)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid skill_level_id")
		return
	}
	if err := h.auth.SaveSportProfile(c.Request.Context(), uid, sportID, skillID, req.DominantHand, req.PlayingStyle, req.Experience); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AuthHandler) DeleteSport(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	sportID, err := uuid.Parse(c.Param("sportId"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid sport id")
		return
	}
	if err := h.auth.DeleteSportProfile(c.Request.Context(), uid, sportID); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AuthHandler) ListFavorites(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	rows, err := h.auth.ListFavorites(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, rows)
}

func (h *AuthHandler) AddFavorite(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	var req favoriteBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	targetID, err := uuid.Parse(req.TargetID)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid target_id")
		return
	}
	if err := h.auth.AddFavorite(c.Request.Context(), uid, req.TargetType, targetID); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AuthHandler) RemoveFavorite(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	var req favoriteBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	targetID, err := uuid.Parse(req.TargetID)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid target_id")
		return
	}
	if err := h.auth.RemoveFavorite(c.Request.Context(), uid, req.TargetType, targetID); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AuthHandler) Activity(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	row, err := h.auth.PlayerActivity(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, row)
}

func (h *AuthHandler) ViewPlayer(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	target, err := uuid.Parse(c.Param("userId"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid user")
		return
	}
	view, err := h.auth.ViewPlayer(c.Request.Context(), uid, target)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, view)
}

func (h *AuthHandler) GetEmployee(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	row, err := h.auth.GetAdminEmployee(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, row)
}

func (h *AuthHandler) SaveEmployee(c *gin.Context) {
	uid, _, ok := currentUser(c)
	if !ok {
		return
	}
	var req service.AdminEmployeeInput
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.auth.SaveAdminEmployee(c.Request.Context(), uid, uid, req); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}
