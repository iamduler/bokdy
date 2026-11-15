package handler

import (
	"strings"
	"time"

	"bokdy/internal/catalog/entity"
	"bokdy/internal/catalog/repository"
	"bokdy/internal/catalog/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/listpage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type adminCourtDTO struct {
	ID                     string `json:"id"`
	Code                   string `json:"code"`
	Name                   string `json:"name"`
	NameEn                 string `json:"name_en,omitempty"`
	NameVi                 string `json:"name_vi,omitempty"`
	Status                 string `json:"status"`
	Environment            string `json:"environment"`
	OrganizationID         string `json:"organization_id"`
	OrganizationName       string `json:"organization_name"`
	OrganizationLogoFileID string `json:"organization_logo_file_id,omitempty"`
	BranchID               string `json:"branch_id"`
	BranchName             string `json:"branch_name"`
	BranchLogoFileID       string `json:"branch_logo_file_id,omitempty"`
	SportName              string `json:"sport_name"`
	CreatedAt              string `json:"created_at"`
}

type adminCourtStatsDTO struct {
	Total       int `json:"total"`
	Active      int `json:"active"`
	Inactive    int `json:"inactive"`
	Maintenance int `json:"maintenance"`
}

func (h *CatalogHandler) RegisterAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/courts", h.AdminListCourts)
	admin.GET("/courts/stats", h.AdminCourtDirectoryStats)
}

func (h *CatalogHandler) AdminListCourts(c *gin.Context) {
	query, ok := adminCourtQuery(c)
	if !ok {
		return
	}
	page, err := h.catalog.AdminListCourts(c.Request.Context(), query)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	locale := i18n.FromContext(c.Request.Context())
	items := make([]adminCourtDTO, 0, len(page.Items))
	for i := range page.Items {
		items = append(items, toAdminCourtDTO(locale, page.Items[i]))
	}
	httpx.OK(c, listpage.New(items, page.Total, page.Limit, page.Offset))
}

func (h *CatalogHandler) AdminCourtDirectoryStats(c *gin.Context) {
	query, ok := adminCourtQuery(c)
	if !ok {
		return
	}
	stats, err := h.catalog.AdminCourtDirectoryStats(c.Request.Context(), query)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, adminCourtStatsDTO{
		Total: stats.Total, Active: stats.Active, Inactive: stats.Inactive, Maintenance: stats.Maintenance,
	})
}

func adminCourtQuery(c *gin.Context) (service.AdminCourtQuery, bool) {
	query := service.AdminCourtQuery{
		Q:         strings.TrimSpace(c.Query("q")),
		LimitRaw:  c.Query("limit"),
		OffsetRaw: c.Query("offset"),
		Sort:      c.Query("sort"),
		Order:     c.Query("order"),
	}
	if raw := strings.TrimSpace(c.Query("status")); raw != "" {
		status, ok := entity.ParseCourtStatus(raw)
		if !ok {
			httpx.Fail(c, apperr.CodeValidation, "invalid status")
			return query, false
		}
		query.Status = &status
	}
	sportID, environment, ok := adminCourtStatsFilter(c)
	if !ok {
		return query, false
	}
	query.SportID = sportID
	query.Environment = environment
	organizationID, ok := parseOptionalUUIDQuery(c, "organization_id")
	if !ok {
		return query, false
	}
	branchID, ok := parseOptionalUUIDQuery(c, "branch_id")
	if !ok {
		return query, false
	}
	surface, ok := parseCourtSurface(c)
	if !ok {
		return query, false
	}
	query.OrganizationID = organizationID
	query.BranchID = branchID
	query.Surface = surface
	return query, true
}

func parseOptionalUUIDQuery(c *gin.Context, field string) (*uuid.UUID, bool) {
	raw := strings.TrimSpace(c.Query(field))
	if raw == "" {
		return nil, true
	}
	id, err := uuid.Parse(raw)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid "+field)
		return nil, false
	}
	return &id, true
}

func parseCourtSurface(c *gin.Context) (*entity.CourtSurface, bool) {
	raw := strings.TrimSpace(c.Query("surface"))
	if raw == "" {
		return nil, true
	}
	value, ok := entity.ParseCourtSurfaceFilter(raw)
	if !ok {
		httpx.Fail(c, apperr.CodeValidation, "invalid surface")
		return nil, false
	}
	return &value, true
}

func courtFileID(id *uuid.UUID) string {
	if id == nil {
		return ""
	}
	return id.String()
}

func adminCourtStatsFilter(c *gin.Context) (*uuid.UUID, *entity.CourtEnvironment, bool) {
	var sportID *uuid.UUID
	if raw := strings.TrimSpace(c.Query("sport_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			httpx.Fail(c, apperr.CodeValidation, "invalid sport_id")
			return nil, nil, false
		}
		sportID = &id
	}
	var environment *entity.CourtEnvironment
	if raw := strings.TrimSpace(c.Query("environment")); raw != "" {
		value, ok := entity.ParseCourtEnvironmentFilter(raw)
		if !ok {
			httpx.Fail(c, apperr.CodeValidation, "invalid environment")
			return nil, nil, false
		}
		environment = &value
	}
	return sportID, environment, true
}

func toAdminCourtDTO(locale string, row repository.AdminCourt) adminCourtDTO {
	return adminCourtDTO{
		ID: row.ID.String(), Code: row.Code,
		Name:   i18n.DisplayName(locale, row.NameEn, row.NameVi),
		NameEn: row.NameEn, NameVi: row.NameVi,
		Status: string(row.Status), Environment: string(row.Environment),
		OrganizationID:         row.OrganizationID.String(),
		OrganizationName:       i18n.DisplayName(locale, row.OrganizationNameEn, row.OrganizationNameVi),
		OrganizationLogoFileID: courtFileID(row.OrganizationLogoFileID),
		BranchID:               row.BranchID.String(),
		BranchName:             i18n.DisplayName(locale, row.BranchNameEn, row.BranchNameVi),
		BranchLogoFileID:       courtFileID(row.BranchLogoFileID),
		SportName:              i18n.DisplayName(locale, row.SportNameEn, row.SportNameVi),
		CreatedAt:              row.CreatedAt.UTC().Format(time.RFC3339),
	}
}
