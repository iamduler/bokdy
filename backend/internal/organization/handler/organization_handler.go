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
	Phone  string `json:"phone"`
}

type updateOrgRequest struct {
	NameEn *string `json:"name_en"`
	NameVi *string `json:"name_vi"`
	Code   *string `json:"code"`
	Email  *string `json:"email"`
	Phone  *string `json:"phone"`
}

type inviteRequest struct {
	Email    string `json:"email" binding:"required,email"`
	RoleCode string `json:"role_code"`
}

type tokenInviteRequest struct {
	Token string `json:"token" binding:"required"`
}

type addStaffRequest struct {
	UserID   string `json:"user_id" binding:"required,uuid"`
	Title    string `json:"title"`
	RoleCode string `json:"role_code"`
}

type updateStaffRequest struct {
	Title      *string `json:"title"`
	LocationID *string `json:"location_id" binding:"omitempty,uuid"`
}

type assignRoleRequest struct {
	RoleCode string `json:"role_code" binding:"required"`
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
	Phone    string `json:"phone,omitempty"`
	Status   string `json:"status"`
}

type staffDTO struct {
	ID         string   `json:"id"`
	UserID     string   `json:"user_id"`
	Title      string   `json:"title,omitempty"`
	LocationID string   `json:"location_id,omitempty"`
	Status     string   `json:"status"`
	Roles      []string `json:"roles"`
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
		orgs.POST("/invitations/reject", h.RejectInvitation)
		orgs.GET("/:id", h.Get)
		orgs.PATCH("/:id", h.Update)
		orgs.GET("/:id/staff", h.ListStaff)
		orgs.POST("/:id/staff", h.AddStaff)
		orgs.PATCH("/:id/staff/:staffId", h.UpdateStaff)
		orgs.POST("/:id/staff/:staffId/suspend", h.SuspendStaff)
		orgs.POST("/:id/staff/:staffId/restore", h.RestoreStaff)
		orgs.DELETE("/:id/staff/:staffId", h.RemoveStaff)
		orgs.POST("/:id/staff/:staffId/roles", h.AssignRole)
		orgs.DELETE("/:id/staff/:staffId/roles/:roleId", h.RemoveRole)
		orgs.POST("/:id/invitations", h.Invite)
		orgs.POST("/:id/invitations/:invitationId/revoke", h.RevokeInvitation)
	}
}

func (h *OrganizationHandler) Create(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	var req createOrgRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	org, err := h.orgs.Create(c.Request.Context(), uid, service.CreateOrganizationInput{
		Name: req.Name, NameEn: req.NameEn, NameVi: req.NameVi, Code: req.Code, Email: req.Email, Phone: req.Phone,
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

func (h *OrganizationHandler) Get(c *gin.Context) {
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
	org, err := h.orgs.Get(c.Request.Context(), orgID, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toOrgDTO(c.Request.Context(), org))
}

func (h *OrganizationHandler) Update(c *gin.Context) {
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
	var req updateOrgRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	org, err := h.orgs.Update(c.Request.Context(), orgID, uid, service.UpdateOrganizationInput{
		NameEn: req.NameEn, NameVi: req.NameVi, Code: req.Code, Email: req.Email, Phone: req.Phone,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toOrgDTO(c.Request.Context(), org))
}

func toOrgDTO(ctx context.Context, org *entity.Organization) orgDTO {
	return orgDTO{
		ID: org.ID.String(), PublicID: org.PublicID, TenantID: org.TenantID.String(), Code: org.Code,
		Name:   i18n.DisplayName(i18n.FromContext(ctx), org.NameEn, org.NameVi),
		NameEn: org.NameEn, NameVi: org.NameVi, Email: org.Email, Phone: org.Phone, Status: string(org.Status),
	}
}

func toStaffDTO(row service.StaffWithRoles) staffDTO {
	dto := staffDTO{
		ID: row.Member.ID.String(), UserID: row.Member.UserID.String(), Title: row.Member.Title,
		Status: string(row.Member.Status), Roles: row.Roles,
	}
	if dto.Roles == nil {
		dto.Roles = []string{}
	}
	if row.Member.LocationID != nil {
		dto.LocationID = row.Member.LocationID.String()
	}
	return dto
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
		out = append(out, toStaffDTO(m))
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
	if !httpx.BindJSON(c, &req) {
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
	var req tokenInviteRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.orgs.AcceptInvitation(c.Request.Context(), req.Token, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *OrganizationHandler) RejectInvitation(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	var req tokenInviteRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.orgs.RejectInvitation(c.Request.Context(), req.Token, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *OrganizationHandler) RevokeInvitation(c *gin.Context) {
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
	invitationID, err := uuid.Parse(c.Param("invitationId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid invitation id"))
		return
	}
	if err := h.orgs.RevokeInvitation(c.Request.Context(), orgID, invitationID, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *OrganizationHandler) AddStaff(c *gin.Context) {
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
	var req addStaffRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid user_id"))
		return
	}
	row, err := h.orgs.AddStaff(c.Request.Context(), orgID, uid, service.AddStaffInput{
		UserID: userID, Title: req.Title, RoleCode: req.RoleCode,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toStaffDTO(*row))
}

func (h *OrganizationHandler) UpdateStaff(c *gin.Context) {
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
	staffID, err := uuid.Parse(c.Param("staffId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid staff id"))
		return
	}
	var req updateStaffRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	in := service.UpdateStaffInput{Title: req.Title}
	if req.LocationID != nil {
		loc, err := uuid.Parse(*req.LocationID)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid location_id"))
			return
		}
		in.LocationID = &loc
	}
	row, err := h.orgs.UpdateStaff(c.Request.Context(), orgID, staffID, uid, in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toStaffDTO(*row))
}

func (h *OrganizationHandler) SuspendStaff(c *gin.Context) {
	h.staffAction(c, h.orgs.SuspendStaff)
}

func (h *OrganizationHandler) RestoreStaff(c *gin.Context) {
	h.staffAction(c, h.orgs.RestoreStaff)
}

func (h *OrganizationHandler) RemoveStaff(c *gin.Context) {
	h.staffAction(c, h.orgs.RemoveStaff)
}

func (h *OrganizationHandler) staffAction(c *gin.Context, fn func(context.Context, uuid.UUID, uuid.UUID, uuid.UUID) error) {
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
	staffID, err := uuid.Parse(c.Param("staffId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid staff id"))
		return
	}
	if err := fn(c.Request.Context(), orgID, staffID, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *OrganizationHandler) AssignRole(c *gin.Context) {
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
	staffID, err := uuid.Parse(c.Param("staffId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid staff id"))
		return
	}
	var req assignRoleRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	if err := h.orgs.AssignRole(c.Request.Context(), orgID, staffID, uid, service.AssignRoleInput{RoleCode: req.RoleCode}); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *OrganizationHandler) RemoveRole(c *gin.Context) {
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
	staffID, err := uuid.Parse(c.Param("staffId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid staff id"))
		return
	}
	roleID, err := uuid.Parse(c.Param("roleId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid role id"))
		return
	}
	if err := h.orgs.RemoveRole(c.Request.Context(), orgID, staffID, roleID, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}
