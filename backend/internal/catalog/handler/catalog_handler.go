package handler

import (
	"context"
	"time"

	"bokdy/internal/catalog/entity"
	"bokdy/internal/catalog/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CatalogHandler struct {
	catalog *service.CatalogService
}

func NewCatalogHandler(catalog *service.CatalogService) *CatalogHandler {
	return &CatalogHandler{catalog: catalog}
}

type createCourtTypeRequest struct {
	NameEn              string `json:"name_en"`
	NameVi              string `json:"name_vi"`
	Code                string `json:"code"`
	SlotDurationMinutes int    `json:"slot_duration_minutes" binding:"required"`
}

type updateCourtTypeRequest struct {
	NameEn              *string `json:"name_en"`
	NameVi              *string `json:"name_vi"`
	Code                *string `json:"code"`
	SlotDurationMinutes *int    `json:"slot_duration_minutes"`
}

type createCourtRequest struct {
	BranchID    string `json:"branch_id" binding:"required,uuid"`
	CourtTypeID string `json:"court_type_id" binding:"required,uuid"`
	NameEn      string `json:"name_en"`
	NameVi      string `json:"name_vi"`
	Code        string `json:"code"`
}

type updateCourtRequest struct {
	NameEn      *string `json:"name_en"`
	NameVi      *string `json:"name_vi"`
	Code        *string `json:"code"`
	CourtTypeID *string `json:"court_type_id" binding:"omitempty,uuid"`
}

type scheduleMaintenanceRequest struct {
	Title     string  `json:"title"`
	Reason    string  `json:"reason"`
	StartedAt *string `json:"started_at"`
}

type courtTypeDTO struct {
	ID                  string `json:"id"`
	Code                string `json:"code"`
	Name                string `json:"name"`
	NameEn              string `json:"name_en,omitempty"`
	NameVi              string `json:"name_vi,omitempty"`
	Status              string `json:"status"`
	SlotDurationMinutes int    `json:"slot_duration_minutes"`
}

type courtDTO struct {
	ID          string `json:"id"`
	PublicID    string `json:"public_id"`
	BranchID    string `json:"branch_id"`
	CourtTypeID string `json:"court_type_id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	NameEn      string `json:"name_en,omitempty"`
	NameVi      string `json:"name_vi,omitempty"`
	Status      string `json:"status"`
	IsBookable  bool   `json:"is_bookable"`
}

func (h *CatalogHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	types := rg.Group("/court-types", jwt, middleware.OptionalOrganization())
	{
		types.POST("", h.CreateCourtType)
		types.GET("", h.ListCourtTypes)
		types.GET("/:id", h.GetCourtType)
		types.PATCH("/:id", h.UpdateCourtType)
		types.POST("/:id/archive", h.ArchiveCourtType)
	}
	courts := rg.Group("/courts", jwt, middleware.OptionalOrganization())
	{
		courts.POST("", h.CreateCourt)
		courts.GET("", h.ListCourts)
		courts.GET("/:id", h.GetCourt)
		courts.PATCH("/:id", h.UpdateCourt)
		courts.POST("/:id/open", h.OpenCourt)
		courts.POST("/:id/close", h.CloseCourt)
		courts.POST("/:id/maintenance", h.ScheduleMaintenance)
		courts.POST("/:id/maintenance/complete", h.CompleteMaintenance)
		courts.POST("/:id/archive", h.ArchiveCourt)
	}
}

func (h *CatalogHandler) CreateCourtType(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	var req createCourtTypeRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	t, err := h.catalog.CreateCourtType(c.Request.Context(), uid, service.CreateCourtTypeInput{
		NameEn: req.NameEn, NameVi: req.NameVi, Code: req.Code, SlotDurationMinutes: req.SlotDurationMinutes,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toCourtTypeDTO(c.Request.Context(), t))
}

func (h *CatalogHandler) ListCourtTypes(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	var status *entity.CategoryStatus
	if raw := c.Query("status"); raw != "" {
		s := entity.CategoryStatus(raw)
		status = &s
	}
	items, err := h.catalog.ListCourtTypes(c.Request.Context(), uid, status)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]courtTypeDTO, 0, len(items))
	for i := range items {
		out = append(out, toCourtTypeDTO(c.Request.Context(), &items[i]))
	}
	httpx.OK(c, out)
}

func (h *CatalogHandler) GetCourtType(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid court type id")
	if !ok {
		return
	}
	t, err := h.catalog.GetCourtType(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toCourtTypeDTO(c.Request.Context(), t))
}

func (h *CatalogHandler) UpdateCourtType(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid court type id")
	if !ok {
		return
	}
	var req updateCourtTypeRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	t, err := h.catalog.UpdateCourtType(c.Request.Context(), id, uid, service.UpdateCourtTypeInput{
		NameEn: req.NameEn, NameVi: req.NameVi, Code: req.Code, SlotDurationMinutes: req.SlotDurationMinutes,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toCourtTypeDTO(c.Request.Context(), t))
}

func (h *CatalogHandler) ArchiveCourtType(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid court type id")
	if !ok {
		return
	}
	if err := h.catalog.ArchiveCourtType(c.Request.Context(), id, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *CatalogHandler) CreateCourt(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	var req createCourtRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	branchID, err := uuid.Parse(req.BranchID)
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid branch_id"))
		return
	}
	typeID, err := uuid.Parse(req.CourtTypeID)
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid court_type_id"))
		return
	}
	court, err := h.catalog.CreateCourt(c.Request.Context(), uid, service.CreateCourtInput{
		BranchID: branchID, CourtTypeID: typeID, NameEn: req.NameEn, NameVi: req.NameVi, Code: req.Code,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toCourtDTO(c.Request.Context(), court))
}

func (h *CatalogHandler) ListCourts(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	var branchID *uuid.UUID
	if raw := c.Query("branch_id"); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid branch_id"))
			return
		}
		branchID = &id
	}
	items, err := h.catalog.ListCourts(c.Request.Context(), uid, branchID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]courtDTO, 0, len(items))
	for i := range items {
		out = append(out, toCourtDTO(c.Request.Context(), &items[i]))
	}
	httpx.OK(c, out)
}

func (h *CatalogHandler) GetCourt(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	court, err := h.catalog.GetCourt(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toCourtDTO(c.Request.Context(), court))
}

func (h *CatalogHandler) UpdateCourt(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	var req updateCourtRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	in := service.UpdateCourtInput{NameEn: req.NameEn, NameVi: req.NameVi, Code: req.Code}
	if req.CourtTypeID != nil && *req.CourtTypeID != "" {
		typeID, err := uuid.Parse(*req.CourtTypeID)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid court_type_id"))
			return
		}
		in.CourtTypeID = &typeID
	}
	court, err := h.catalog.UpdateCourt(c.Request.Context(), id, uid, in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toCourtDTO(c.Request.Context(), court))
}

func (h *CatalogHandler) OpenCourt(c *gin.Context) {
	h.courtAction(c, h.catalog.OpenCourt)
}

func (h *CatalogHandler) CloseCourt(c *gin.Context) {
	h.courtAction(c, h.catalog.CloseCourt)
}

func (h *CatalogHandler) ArchiveCourt(c *gin.Context) {
	h.courtAction(c, h.catalog.ArchiveCourt)
}

func (h *CatalogHandler) CompleteMaintenance(c *gin.Context) {
	h.courtAction(c, h.catalog.CompleteMaintenance)
}

func (h *CatalogHandler) ScheduleMaintenance(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	var req scheduleMaintenanceRequest
	_ = c.ShouldBindJSON(&req)
	in := service.ScheduleMaintenanceInput{Title: req.Title, Reason: req.Reason}
	if req.StartedAt != nil && *req.StartedAt != "" {
		t, err := time.Parse(time.RFC3339, *req.StartedAt)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid started_at"))
			return
		}
		in.StartedAt = &t
	}
	if err := h.catalog.ScheduleMaintenance(c.Request.Context(), id, uid, in); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *CatalogHandler) courtAction(c *gin.Context, fn func(context.Context, uuid.UUID, uuid.UUID) error) {
	uid, id, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	if err := fn(c.Request.Context(), id, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func userID(c *gin.Context) (uuid.UUID, bool) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return uuid.Nil, false
	}
	return uid, true
}

func userAndUUID(c *gin.Context, invalidMsg string) (uuid.UUID, uuid.UUID, bool) {
	uid, ok := userID(c)
	if !ok {
		return uuid.Nil, uuid.Nil, false
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, invalidMsg))
		return uuid.Nil, uuid.Nil, false
	}
	return uid, id, true
}

func toCourtTypeDTO(ctx context.Context, t *entity.CourtType) courtTypeDTO {
	return courtTypeDTO{
		ID: t.ID.String(), Code: t.Code,
		Name:   i18n.DisplayName(i18n.FromContext(ctx), t.NameEn, t.NameVi),
		NameEn: t.NameEn, NameVi: t.NameVi, Status: string(t.Status),
		SlotDurationMinutes: t.SlotDurationMinutes,
	}
}

func toCourtDTO(ctx context.Context, court *entity.Court) courtDTO {
	return courtDTO{
		ID: court.ID.String(), PublicID: court.PublicID, BranchID: court.LocationID.String(),
		CourtTypeID: court.CourtTypeID.String(), Code: court.Code,
		Name:   i18n.DisplayName(i18n.FromContext(ctx), court.NameEn, court.NameVi),
		NameEn: court.NameEn, NameVi: court.NameVi, Status: string(court.Status), IsBookable: court.IsBookable,
	}
}
