package handler

import (
	"context"

	"bokdy/internal/organization/entity"
	"bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type OrganizationHandler struct {
	orgs *service.OrganizationService
}

func NewOrganizationHandler(orgs *service.OrganizationService) *OrganizationHandler {
	return &OrganizationHandler{orgs: orgs}
}

type createOrgRequest struct {
	Name   string `json:"name"`
	NameEn string `json:"name_en"`
	NameVi string `json:"name_vi"`
	Code   string `json:"code"`
	Email  string `json:"email"`
}

type inviteRequest struct {
	Email    string `json:"email" binding:"required,email"`
	RoleCode string `json:"role_code"`
}

type acceptInviteRequest struct {
	Token string `json:"token" binding:"required"`
}

type orgDTO struct {
	ID       string `json:"id"`
	PublicID string `json:"public_id"`
	TenantID string `json:"tenant_id"`
	Code     string `json:"code"`
	Name     string `json:"name"`
	NameEn   string `json:"name_en,omitempty"`
	NameVi   string `json:"name_vi,omitempty"`
	Email    string `json:"email,omitempty"`
	Status   string `json:"status"`
}

type staffDTO struct {
	ID     string `json:"id"`
	UserID string `json:"user_id"`
	Title  string `json:"title,omitempty"`
	Status string `json:"status"`
}

type inviteDTO struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	RoleCode  string `json:"role_code"`
	Token     string `json:"token"`
	ExpiresAt string `json:"expires_at"`
}

func (h *OrganizationHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	orgs := rg.Group("/organizations", jwt, middleware.OptionalOrganization())
	{
		orgs.POST("", h.Create)
		orgs.GET("", h.ListMine)
		orgs.POST("/invitations/accept", h.AcceptInvitation)
		orgs.GET("/:id/staff", h.ListStaff)
		orgs.POST("/:id/invitations", h.Invite)
	}
}

func (h *OrganizationHandler) Create(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	var req createOrgRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, apperr.Wrap(err, apperr.CodeValidation, "invalid request"))
		return
	}
	org, err := h.orgs.Create(c.Request.Context(), uid, service.CreateOrganizationInput{
		Name: req.Name, NameEn: req.NameEn, NameVi: req.NameVi, Code: req.Code, Email: req.Email,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toOrgDTO(c.Request.Context(), org))
}

func (h *OrganizationHandler) ListMine(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	orgs, err := h.orgs.ListMine(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]orgDTO, 0, len(orgs))
	for i := range orgs {
		out = append(out, toOrgDTO(c.Request.Context(), &orgs[i]))
	}
	httpx.OK(c, out)
}

func toOrgDTO(ctx context.Context, org *entity.Organization) orgDTO {
	return orgDTO{
		ID: org.ID.String(), PublicID: org.PublicID, TenantID: org.TenantID.String(), Code: org.Code,
		Name:   i18n.DisplayName(i18n.FromContext(ctx), org.NameEn, org.NameVi),
		NameEn: org.NameEn, NameVi: org.NameVi, Email: org.Email, Status: string(org.Status),
	}
}

func (h *OrganizationHandler) ListStaff(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid organization id"))
		return
	}
	staff, err := h.orgs.ListStaff(c.Request.Context(), orgID, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]staffDTO, 0, len(staff))
	for _, m := range staff {
		out = append(out, staffDTO{
			ID: m.ID.String(), UserID: m.UserID.String(), Title: m.Title, Status: string(m.Status),
		})
	}
	httpx.OK(c, out)
}

func (h *OrganizationHandler) Invite(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid organization id"))
		return
	}
	var req inviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, apperr.Wrap(err, apperr.CodeValidation, "invalid request"))
		return
	}
	inv, err := h.orgs.Invite(c.Request.Context(), orgID, uid, service.InviteInput{
		Email: req.Email, RoleCode: req.RoleCode,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, inviteDTO{
		ID: inv.ID.String(), Email: inv.Email, RoleCode: inv.RoleCode,
		Token: inv.InvitationToken, ExpiresAt: inv.ExpiresAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
	})
}

func (h *OrganizationHandler) AcceptInvitation(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	var req acceptInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.Error(c, apperr.Wrap(err, apperr.CodeValidation, "invalid request"))
		return
	}
	if err := h.orgs.AcceptInvitation(c.Request.Context(), req.Token, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}
