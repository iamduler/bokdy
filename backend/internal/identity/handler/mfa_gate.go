package handler

import (
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (h *AuthHandler) RequireMFA() gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requestctx.UserID(c.Request.Context())
		if !ok {
			httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
			return
		}
		sid, _ := requestctx.SessionID(c.Request.Context())
		if err := h.auth.AdminMFARequired(c.Request.Context(), uid, sid); err != nil {
			httpx.Error(c, err)
			return
		}
		c.Next()
	}
}

func currentUser(c *gin.Context) (uuid.UUID, uuid.UUID, bool) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return uuid.Nil, uuid.Nil, false
	}
	sid, _ := requestctx.SessionID(c.Request.Context())
	return uid, sid, true
}
