package handler

import (
	"bokdy/internal/membership/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	svc *service.Service
}

func New(svc *service.Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	group := rg.Group("/membership", jwt, middleware.OptionalOrganization())
	group.GET("/accounts", h.ListMine)
	group.GET("/accounts/:id/ledger", h.Ledger)
	group.GET("/accounts/:id/vouchers", h.Vouchers)
	group.POST("/accounts/:id/vouchers", h.IssueVoucher)
}

func (h *Handler) ListMine(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	rows, err := h.svc.ListMine(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, rows)
}

func (h *Handler) Ledger(c *gin.Context) {
	accountID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid account")
		return
	}
	rows, err := h.svc.Ledger(c.Request.Context(), accountID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, rows)
}

type voucherBody struct {
	Code  string `json:"code"`
	Title string `json:"title"`
}

func (h *Handler) Vouchers(c *gin.Context) {
	accountID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid account")
		return
	}
	rows, err := h.svc.Vouchers(c.Request.Context(), accountID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, rows)
}

func (h *Handler) IssueVoucher(c *gin.Context) {
	accountID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid account")
		return
	}
	var req voucherBody
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.svc.IssueVoucher(c.Request.Context(), accountID, req.Code, req.Title); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}
