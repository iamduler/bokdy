package handler

import (
	"strings"

	"bokdy/internal/organization/entity"
	"bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/listpage"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type suspendOrgRequest struct {
	Reason string `json:"reason" binding:"required"`
}

type adminOrgDTO struct {
	orgDTO
	TenantStatus     string  `json:"tenant_status"`
	BranchCount      int     `json:"branch_count"`
	CourtCount       int     `json:"court_count"`
	OwnerDisplayName *string `json:"owner_display_name"`
	PrimarySport     *string `json:"primary_sport"`
}

type adminDirectoryStatsDTO struct {
	Total       int `json:"total"`
	Active      int `json:"active"`
	Inactive    int `json:"inactive"`
	Suspended   int `json:"suspended"`
	BranchTotal int `json:"branch_total"`
}

func (h *OrganizationHandler) RegisterAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/health", h.AdminHealth)
	admin.GET("/organizations", h.AdminList)
	admin.GET("/organizations/stats", h.AdminDirectoryStats)
	admin.GET("/organizations/:id", h.AdminGet)
	admin.POST("/organizations/:id/activate", h.AdminActivate)
	admin.POST("/organizations/:id/suspend", h.AdminSuspend)
	admin.POST("/organizations/:id/restore", h.AdminRestore)
	admin.POST("/kyc/:id/review", h.ReviewKYC)
}

func (h *OrganizationHandler) AdminHealth(c *gin.Context) {
	httpx.OK(c, gin.H{"status": "ok", "scope": "admin"})
}

func (h *OrganizationHandler) AdminList(c *gin.Context) {
	query := service.AdminListQuery{
		Q:         strings.TrimSpace(c.Query("q")),
		LimitRaw:  c.Query("limit"),
		OffsetRaw: c.Query("offset"),
		Sort:      c.Query("sort"),
		Order:     c.Query("order"),
	}
	if raw := c.Query("status"); raw != "" {
		status, ok := entity.ParseOrganizationStatus(raw)
		if !ok {
			httpx.Fail(c, apperr.CodeValidation, "invalid status")
			return
		}
		query.Status = &status
	}
	provinceID, ok := parseProvinceID(c)
	if !ok {
		return
	}
	query.ProvinceID = provinceID
	page, err := h.orgs.AdminList(c.Request.Context(), query)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]adminOrgDTO, 0, len(page.Items))
	for i := range page.Items {
		out = append(out, toAdminListOrgDTO(c, page.Items[i]))
	}
	httpx.OK(c, listpage.New(out, page.Total, page.Limit, page.Offset))
}

func (h *OrganizationHandler) AdminDirectoryStats(c *gin.Context) {
	provinceID, ok := parseProvinceID(c)
	if !ok {
		return
	}
	stats, err := h.orgs.AdminDirectoryStats(c.Request.Context(), c.Query("q"), provinceID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, adminDirectoryStatsDTO{
		Total: stats.Total, Active: stats.Active, Inactive: stats.Inactive,
		Suspended: stats.Suspended, BranchTotal: stats.BranchTotal,
	})
}

func (h *OrganizationHandler) AdminGet(c *gin.Context) {
	orgID, ok := adminOrgID(c)
	if !ok {
		return
	}
	item, err := h.orgs.AdminGet(c.Request.Context(), orgID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	dto, err := h.toAdminOrgDTO(c, *item)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, dto)
}

func (h *OrganizationHandler) AdminActivate(c *gin.Context) {
	uid, orgID, ok := adminUserAndOrg(c)
	if !ok {
		return
	}
	item, err := h.orgs.Activate(c.Request.Context(), orgID, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	dto, err := h.toAdminOrgDTO(c, *item)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, dto)
}

func (h *OrganizationHandler) AdminSuspend(c *gin.Context) {
	uid, orgID, ok := adminUserAndOrg(c)
	if !ok {
		return
	}
	var req suspendOrgRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	item, err := h.orgs.Suspend(c.Request.Context(), orgID, uid, req.Reason)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	dto, err := h.toAdminOrgDTO(c, *item)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, dto)
}

func (h *OrganizationHandler) AdminRestore(c *gin.Context) {
	uid, orgID, ok := adminUserAndOrg(c)
	if !ok {
		return
	}
	item, err := h.orgs.Restore(c.Request.Context(), orgID, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	dto, err := h.toAdminOrgDTO(c, *item)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, dto)
}

func adminOrgID(c *gin.Context) (uuid.UUID, bool) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeBadRequest, "invalid organization id")
		return uuid.Nil, false
	}
	return orgID, true
}

func adminUserAndOrg(c *gin.Context) (uuid.UUID, uuid.UUID, bool) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return uuid.Nil, uuid.Nil, false
	}
	orgID, ok := adminOrgID(c)
	if !ok {
		return uuid.Nil, uuid.Nil, false
	}
	return uid, orgID, true
}

func parseProvinceID(c *gin.Context) (*uuid.UUID, bool) {
	raw := strings.TrimSpace(c.Query("province_id"))
	if raw == "" {
		return nil, true
	}
	provinceID, err := uuid.Parse(raw)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid province_id")
		return nil, false
	}
	return &provinceID, true
}

func (h *OrganizationHandler) toAdminOrgDTO(c *gin.Context, row service.AdminOrganization) (adminOrgDTO, error) {
	dto, err := h.present(c, row.Organization)
	if err != nil {
		return adminOrgDTO{}, err
	}
	return applyDirectory(c, adminOrgDTO{
		orgDTO:       dto,
		TenantStatus: string(row.TenantStatus),
		BranchCount:  row.BranchCount,
	}, row), nil
}

func toAdminListOrgDTO(c *gin.Context, row service.AdminOrganization) adminOrgDTO {
	return applyDirectory(c, adminOrgDTO{
		orgDTO:       toOrgDTO(c.Request.Context(), row.Organization),
		TenantStatus: string(row.TenantStatus),
		BranchCount:  row.BranchCount,
	}, row)
}

func applyDirectory(c *gin.Context, dto adminOrgDTO, row service.AdminOrganization) adminOrgDTO {
	dto.CourtCount = row.CourtCount
	dto.OwnerDisplayName = optionalText(row.OwnerDisplayName)
	dto.PrimarySport = optionalText(i18n.DisplayName(i18n.FromContext(c.Request.Context()), row.PrimarySportNameEn, row.PrimarySportNameVi))
	return dto
}

func optionalText(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}
