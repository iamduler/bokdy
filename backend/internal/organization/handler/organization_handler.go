package handler

import (
	"context"
	"io"
	"net/http"
	"time"

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

type headquartersRequest struct {
	ProvinceID   string `json:"province_id"`
	WardID       string `json:"ward_id"`
	AddressLine1 string `json:"address_line_1"`
	AddressLine2 string `json:"address_line_2"`
}

type createOrgRequest struct {
	Name             string               `json:"name"`
	NameEn           string               `json:"name_en"`
	NameVi           string               `json:"name_vi"`
	LegalName        string               `json:"legal_name"`
	OrganizationType string               `json:"organization_type"`
	Slug             string               `json:"slug"`
	Code             string               `json:"code"`
	TaxCode          string               `json:"tax_code"`
	Email            string               `json:"email"`
	Phone            string               `json:"phone"`
	Website          string               `json:"website"`
	Headquarters     *headquartersRequest `json:"headquarters"`
}

type updateOrgRequest struct {
	NameEn           *string              `json:"name_en"`
	NameVi           *string              `json:"name_vi"`
	LegalName        *string              `json:"legal_name"`
	OrganizationType *string              `json:"organization_type"`
	Slug             *string              `json:"slug"`
	TaxCode          *string              `json:"tax_code"`
	Email            *string              `json:"email"`
	Phone            *string              `json:"phone"`
	Website          *string              `json:"website"`
	Headquarters     *headquartersRequest `json:"headquarters"`
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
	Title    *string `json:"title"`
	BranchID *string `json:"branch_id" binding:"omitempty,uuid"`
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
	NameEn           string `json:"name_en,omitempty"`
	NameVi           string `json:"name_vi,omitempty"`
	LegalName        string `json:"legal_name,omitempty"`
	OrganizationType string `json:"organization_type,omitempty"`
	Slug             string `json:"slug,omitempty"`
	TaxCode          string `json:"tax_code,omitempty"`
	Email            string `json:"email,omitempty"`
	Phone            string `json:"phone,omitempty"`
	Website          string `json:"website,omitempty"`
	LogoFileID       string `json:"logo_file_id,omitempty"`
	BannerFileID     string `json:"banner_file_id,omitempty"`
	Status           string `json:"status"`
	Headquarters     *hqDTO `json:"headquarters,omitempty"`
}

type hqDTO struct {
	ProvinceID   string      `json:"province_id,omitempty"`
	WardID       string      `json:"ward_id,omitempty"`
	AddressLine1 string      `json:"address_line_1,omitempty"`
	AddressLine2 string      `json:"address_line_2,omitempty"`
	Former       []formerDTO `json:"former,omitempty"`
}

type formerDTO struct {
	ProvinceFormerID string `json:"province_former_id"`
	DistrictFormerID string `json:"district_former_id"`
	WardFormerID     string `json:"ward_former_id"`
}

type staffRoleDTO struct {
	ID   string `json:"id"`
	Code string `json:"code"`
}

type staffDTO struct {
	ID          string         `json:"id"`
	UserID      string         `json:"user_id"`
	Email       string         `json:"email,omitempty"`
	DisplayName string         `json:"display_name,omitempty"`
	Title       string         `json:"title,omitempty"`
	BranchID    string         `json:"branch_id,omitempty"`
	Status      string         `json:"status"`
	Roles       []staffRoleDTO `json:"roles"`
}

type inviteDTO struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	RoleCode  string `json:"role_code"`
	Token     string `json:"token"`
	ExpiresAt string `json:"expires_at"`
}

type invitationListDTO struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	RoleCode  string `json:"role_code"`
	Status    string `json:"status"`
	ExpiresAt string `json:"expires_at"`
	CreatedAt string `json:"created_at"`
}

func (h *OrganizationHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	orgs := rg.Group("/organizations", jwt, middleware.OptionalOrganization())
	{
		orgs.POST("", h.Create)
		orgs.GET("", h.ListMine)
		orgs.POST("/invitations/accept", h.AcceptInvitation)
		orgs.POST("/invitations/reject", h.RejectInvitation)
		orgs.GET("/slug-available", h.SlugAvailable)
		orgs.GET("/:id", h.Get)
		orgs.PATCH("/:id", h.Update)
		orgs.POST("/:id/media", h.UploadMedia)
		rg.GET("/files/:id", jwt, h.DownloadFile)
		orgs.GET("/:id/staff", h.ListStaff)
		orgs.POST("/:id/staff", h.AddStaff)
		orgs.PATCH("/:id/staff/:staffId", h.UpdateStaff)
		orgs.POST("/:id/staff/:staffId/suspend", h.SuspendStaff)
		orgs.POST("/:id/staff/:staffId/restore", h.RestoreStaff)
		orgs.DELETE("/:id/staff/:staffId", h.RemoveStaff)
		orgs.POST("/:id/staff/:staffId/roles", h.AssignRole)
		orgs.DELETE("/:id/staff/:staffId/roles/:roleId", h.RemoveRole)
		orgs.GET("/:id/invitations", h.ListInvitations)
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
	hq, err := parseHeadquarters(req.Headquarters)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	org, err := h.orgs.Create(c.Request.Context(), uid, service.CreateOrganizationInput{
		Name: req.Name, NameEn: req.NameEn, NameVi: req.NameVi, LegalName: req.LegalName,
		OrganizationType: req.OrganizationType, Slug: req.Slug, Code: req.Code, TaxCode: req.TaxCode,
		Email: req.Email, Phone: req.Phone, Website: req.Website, Headquarters: hq,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	dto, err := h.present(c, org)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, dto)
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
	dto, err := h.present(c, org)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, dto)
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
	hq, err := parseHeadquarters(req.Headquarters)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	org, err := h.orgs.Update(c.Request.Context(), orgID, uid, service.UpdateOrganizationInput{
		NameEn: req.NameEn, NameVi: req.NameVi, LegalName: req.LegalName, OrganizationType: req.OrganizationType,
		Slug: req.Slug, TaxCode: req.TaxCode, Email: req.Email, Phone: req.Phone, Website: req.Website,
		Headquarters: hq,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	dto, err := h.present(c, org)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, dto)
}

func toOrgDTO(ctx context.Context, org *entity.Organization) orgDTO {
	dto := orgDTO{
		ID: org.ID.String(), PublicID: org.PublicID, TenantID: org.TenantID.String(), Code: org.Code,
		Name:   i18n.DisplayName(i18n.FromContext(ctx), org.NameEn, org.NameVi),
		NameEn: org.NameEn, NameVi: org.NameVi, LegalName: org.LegalName,
		OrganizationType: string(org.OrganizationType), Slug: org.Slug, TaxCode: org.TaxCode,
		Email: org.Email, Phone: org.Phone, Website: org.Website, Status: string(org.Status),
	}
	if org.LogoFileID != nil {
		dto.LogoFileID = org.LogoFileID.String()
	}
	if org.BannerFileID != nil {
		dto.BannerFileID = org.BannerFileID.String()
	}
	return dto
}

func (h *OrganizationHandler) present(c *gin.Context, org *entity.Organization) (orgDTO, error) {
	dto := toOrgDTO(c.Request.Context(), org)
	rows, err := h.orgs.ListHeadquarters(c.Request.Context(), org.ID)
	if err != nil {
		return orgDTO{}, err
	}
	if len(rows) == 0 {
		return dto, nil
	}
	hq := &hqDTO{}
	for _, row := range rows {
		if row.DivisionScheme == entity.AdminDivisionCurrentV2 {
			if row.ProvinceID != nil {
				hq.ProvinceID = row.ProvinceID.String()
			}
			if row.WardID != nil {
				hq.WardID = row.WardID.String()
			}
			hq.AddressLine1 = row.AddressLine1
			hq.AddressLine2 = row.AddressLine2
			continue
		}
		if row.ProvinceFormerID == nil || row.DistrictFormerID == nil || row.WardFormerID == nil {
			continue
		}
		hq.Former = append(hq.Former, formerDTO{
			ProvinceFormerID: row.ProvinceFormerID.String(),
			DistrictFormerID: row.DistrictFormerID.String(),
			WardFormerID:     row.WardFormerID.String(),
		})
	}
	dto.Headquarters = hq
	return dto, nil
}

func parseHeadquarters(req *headquartersRequest) (*service.HeadquartersInput, error) {
	if req == nil {
		return nil, nil
	}
	out := &service.HeadquartersInput{AddressLine1: req.AddressLine1, AddressLine2: req.AddressLine2}
	if req.ProvinceID != "" {
		id, err := uuid.Parse(req.ProvinceID)
		if err != nil {
			return nil, apperr.New(apperr.CodeValidation, "invalid province_id")
		}
		out.ProvinceID = id
	}
	if req.WardID != "" {
		id, err := uuid.Parse(req.WardID)
		if err != nil {
			return nil, apperr.New(apperr.CodeValidation, "invalid ward_id")
		}
		out.WardID = id
	}
	return out, nil
}

func (h *OrganizationHandler) SlugAvailable(c *gin.Context) {
	exclude := uuid.Nil
	if raw := c.Query("exclude_id"); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid exclude_id"))
			return
		}
		exclude = id
	}
	ok, err := h.orgs.SlugAvailable(c.Request.Context(), c.Query("slug"), exclude)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, gin.H{"available": ok, "slug": c.Query("slug")})
}

func (h *OrganizationHandler) UploadMedia(c *gin.Context) {
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
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "file is required"))
		return
	}
	defer file.Close()
	body, err := io.ReadAll(io.LimitReader(file, 5<<20+1))
	if err != nil {
		httpx.Error(c, apperr.Wrap(err, apperr.CodeBadRequest, "read file"))
		return
	}
	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = http.DetectContentType(body)
	}
	org, err := h.orgs.SaveImage(c.Request.Context(), orgID, uid, c.PostForm("kind"), header.Filename, mimeType, body)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	dto, err := h.present(c, org)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, dto)
}

func (h *OrganizationHandler) DownloadFile(c *gin.Context) {
	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid file id"))
		return
	}
	path, mime, err := h.orgs.OpenFile(c.Request.Context(), fileID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	if mime != "" {
		c.Header("Content-Type", mime)
	}
	c.File(path)
}

func toStaffDTO(row service.StaffWithRoles) staffDTO {
	roles := make([]staffRoleDTO, 0, len(row.Roles))
	for _, r := range row.Roles {
		roles = append(roles, staffRoleDTO{ID: r.ID.String(), Code: r.Code})
	}
	dto := staffDTO{
		ID: row.Member.ID.String(), UserID: row.Member.UserID.String(),
		Email: row.Email, DisplayName: row.DisplayName, Title: row.Member.Title,
		Status: string(row.Member.Status), Roles: roles,
	}
	if row.Member.BranchID != nil {
		dto.BranchID = row.Member.BranchID.String()
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

func (h *OrganizationHandler) ListInvitations(c *gin.Context) {
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
	list, err := h.orgs.ListInvitations(c.Request.Context(), orgID, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]invitationListDTO, 0, len(list))
	for _, inv := range list {
		out = append(out, invitationListDTO{
			ID: inv.ID.String(), Email: inv.Email, RoleCode: inv.RoleCode,
			Status: string(inv.Status),
			ExpiresAt: inv.ExpiresAt.UTC().Format(time.RFC3339),
			CreatedAt: inv.CreatedAt.UTC().Format(time.RFC3339),
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
	if req.BranchID != nil {
		loc, err := uuid.Parse(*req.BranchID)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid branch_id"))
			return
		}
		in.BranchID = &loc
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
