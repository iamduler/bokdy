package handler

import (
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type platformRoleBody struct {
	RoleID string `json:"role_id"`
}

func (h *AdminUserHandler) AssignPlatformRole(c *gin.Context) {
	actor, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	target, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid user")
		return
	}
	var req platformRoleBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	roleID, err := uuid.Parse(req.RoleID)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid role_id")
		return
	}
	if err := h.admin.AssignPlatformRole(c.Request.Context(), actor, target, roleID); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}
