package handler

import (
	"strconv"
	"strings"

	"bokdy/internal/organization/entity"
	"bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type suspendOrgRequest struct {
	Reason string `json:"reason" binding:"required"`
}

type adminOrgDTO struct {
	orgDTO
	TenantStatus string `json:"tenant_status"`
	BranchCount  int    `json:"branch_count"`
}

func (h *OrganizationHandler) RegisterAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/health", h.AdminHealth)
	admin.GET("/organizations", h.AdminList)
	admin.GET("/organizations/:id", h.AdminGet)
	admin.POST("/organizations/:id/activate", h.AdminActivate)
	admin.POST("/organizations/:id/suspend", h.AdminSuspend)
	admin.POST("/organizations/:id/restore", h.AdminRestore)
}

func (h *OrganizationHandler) AdminHealth(c *gin.Context) {
	httpx.OK(c, gin.H{"status": "ok", "scope": "admin"})
}

func (h *OrganizationHandler) AdminList(c *gin.Context) {
	filter := service.AdminListFilter{Q: strings.TrimSpace(c.Query("q")), Limit: parseAdminLimit(c)}
	if raw := c.Query("status"); raw != "" {
		status, ok := entity.ParseOrganizationStatus(raw)
		if !ok {
			httpx.Fail(c, apperr.CodeValidation, "invalid status")
			return
		}
		filter.Status = &status
	}
	if raw := strings.TrimSpace(c.Query("province_id")); raw != "" {
		provinceID, err := uuid.Parse(raw)
		if err != nil {
			httpx.Fail(c, apperr.CodeValidation, "invalid province_id")
			return
		}
		filter.ProvinceID = &provinceID
	}
	items, err := h.orgs.AdminList(c.Request.Context(), filter)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]adminOrgDTO, 0, len(items))
	for i := range items {
		out = append(out, toAdminOrgDTO(c, items[i]))
	}
	httpx.OK(c, out)
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
	httpx.OK(c, toAdminOrgDTO(c, *item))
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
	httpx.OK(c, toAdminOrgDTO(c, *item))
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
	httpx.OK(c, toAdminOrgDTO(c, *item))
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
	httpx.OK(c, toAdminOrgDTO(c, *item))
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

func parseAdminLimit(c *gin.Context) int {
	raw := c.Query("limit")
	if raw == "" {
		return 0
	}
	limit, err := strconv.Atoi(raw)
	if err != nil {
		return 0
	}
	return limit
}

func toAdminOrgDTO(c *gin.Context, row service.AdminOrganization) adminOrgDTO {
	return adminOrgDTO{
		orgDTO:       toOrgDTO(c.Request.Context(), row.Organization),
		TenantStatus: string(row.TenantStatus),
		BranchCount:  row.BranchCount,
	}
}
