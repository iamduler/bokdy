package handler

import (
	"strings"
	"time"

	"bokdy/internal/organization/entity"
	"bokdy/internal/organization/repository"
	"bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/listpage"

	"github.com/gin-gonic/gin"
)

type adminBranchDTO struct {
	ID                     string `json:"id"`
	Code                   string `json:"code"`
	Name                   string `json:"name"`
	NameEn                 string `json:"name_en,omitempty"`
	NameVi                 string `json:"name_vi,omitempty"`
	Status                 string `json:"status"`
	OrganizationID         string `json:"organization_id"`
	OrganizationName       string `json:"organization_name"`
	LogoFileID             string `json:"logo_file_id,omitempty"`
	OrganizationLogoFileID string `json:"organization_logo_file_id,omitempty"`
	ProvinceName           string `json:"province_name,omitempty"`
	AddressLine1           string `json:"address_line_1,omitempty"`
	CourtCount             int    `json:"court_count"`
	CreatedAt              string `json:"created_at"`
}

type adminBranchStatsDTO struct {
	Total       int `json:"total"`
	Active      int `json:"active"`
	Inactive    int `json:"inactive"`
	Maintenance int `json:"maintenance"`
	CourtTotal  int `json:"court_total"`
}

func (h *BranchHandler) RegisterAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/branches", h.AdminList)
	admin.GET("/branches/stats", h.AdminDirectoryStats)
}

func (h *BranchHandler) AdminList(c *gin.Context) {
	query, ok := adminBranchQuery(c)
	if !ok {
		return
	}
	page, err := h.branches.AdminList(c.Request.Context(), query)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	locale := i18n.FromContext(c.Request.Context())
	items := make([]adminBranchDTO, 0, len(page.Items))
	for i := range page.Items {
		items = append(items, toAdminBranchDTO(locale, page.Items[i]))
	}
	httpx.OK(c, listpage.New(items, page.Total, page.Limit, page.Offset))
}

func (h *BranchHandler) AdminDirectoryStats(c *gin.Context) {
	query, ok := adminBranchQuery(c)
	if !ok {
		return
	}
	stats, err := h.branches.AdminDirectoryStats(c.Request.Context(), query.Q, query.ProvinceID, query.OrganizationID, query.SportID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, adminBranchStatsDTO{
		Total: stats.Total, Active: stats.Active, Inactive: stats.Inactive,
		Maintenance: stats.Maintenance, CourtTotal: stats.CourtTotal,
	})
}

func adminBranchQuery(c *gin.Context) (service.AdminBranchQuery, bool) {
	query := service.AdminBranchQuery{
		Q:         strings.TrimSpace(c.Query("q")),
		LimitRaw:  c.Query("limit"),
		OffsetRaw: c.Query("offset"),
		Sort:      c.Query("sort"),
		Order:     c.Query("order"),
	}
	if raw := strings.TrimSpace(c.Query("status")); raw != "" {
		status, ok := entity.ParseBranchStatus(raw)
		if !ok {
			httpx.Fail(c, apperr.CodeValidation, "invalid status")
			return query, false
		}
		query.Status = &status
	}
	provinceID, ok := parseProvinceID(c)
	if !ok {
		return query, false
	}
	query.ProvinceID = provinceID
	organizationID, ok := parseQueryUUID(c, "organization_id")
	if !ok {
		return query, false
	}
	sportID, ok := parseQueryUUID(c, "sport_id")
	if !ok {
		return query, false
	}
	query.OrganizationID = organizationID
	query.SportID = sportID
	return query, true
}

func toAdminBranchDTO(locale string, row repository.AdminBranch) adminBranchDTO {
	return adminBranchDTO{
		ID: row.ID.String(), Code: row.Code,
		Name:   i18n.DisplayName(locale, row.NameEn, row.NameVi),
		NameEn: row.NameEn, NameVi: row.NameVi, Status: string(row.Status),
		OrganizationID:         row.OrganizationID.String(),
		OrganizationName:       i18n.DisplayName(locale, row.OrganizationNameEn, row.OrganizationNameVi),
		LogoFileID:             fileIDText(row.LogoFileID),
		OrganizationLogoFileID: fileIDText(row.OrganizationLogoFileID),
		ProvinceName:           strings.TrimSpace(i18n.DisplayName(locale, row.ProvinceNameEn, row.ProvinceNameVi)),
		AddressLine1:           strings.TrimSpace(row.AddressLine1),
		CourtCount:             row.CourtCount,
		CreatedAt:              row.CreatedAt.UTC().Format(time.RFC3339),
	}
}
