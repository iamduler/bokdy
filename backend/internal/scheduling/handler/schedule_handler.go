package handler

import (
	"strconv"
	"time"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/requestctx"
	"bokdy/internal/scheduling/entity"
	schederrors "bokdy/internal/scheduling/errors"
	"bokdy/internal/scheduling/repository"
	"bokdy/internal/scheduling/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ScheduleHandler struct {
	sched *service.ScheduleService
}

func NewScheduleHandler(sched *service.ScheduleService) *ScheduleHandler {
	return &ScheduleHandler{sched: sched}
}

type weekdayHoursRequest struct {
	Weekday  int16  `json:"weekday"`
	OpensAt  string `json:"opens_at"`
	ClosesAt string `json:"closes_at"`
	IsClosed bool   `json:"is_closed"`
}

type putWeeklyScheduleRequest struct {
	Days []weekdayHoursRequest `json:"days" binding:"required,len=7"`
}

type createSpecialRequest struct {
	NameEn   string  `json:"name_en"`
	NameVi   string  `json:"name_vi"`
	StartsAt string  `json:"starts_at" binding:"required"`
	EndsAt   string  `json:"ends_at" binding:"required"`
	IsClosed *bool   `json:"is_closed"`
	OpensAt  *string `json:"opens_at"`
	ClosesAt *string `json:"closes_at"`
}

type createBlockRequest struct {
	StartsAt string `json:"starts_at" binding:"required"`
	EndsAt   string `json:"ends_at" binding:"required"`
	Reason   string `json:"reason"`
}

type businessHourDTO struct {
	Weekday  int16  `json:"weekday"`
	OpensAt  string `json:"opens_at,omitempty"`
	ClosesAt string `json:"closes_at,omitempty"`
	IsClosed bool   `json:"is_closed"`
}

type specialScheduleDTO struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	NameEn   string  `json:"name_en,omitempty"`
	NameVi   string  `json:"name_vi,omitempty"`
	StartsAt string  `json:"starts_at"`
	EndsAt   string  `json:"ends_at"`
	IsClosed bool    `json:"is_closed"`
	OpensAt  *string `json:"opens_at,omitempty"`
	ClosesAt *string `json:"closes_at,omitempty"`
}

type blockDTO struct {
	ID       string `json:"id"`
	CourtID  string `json:"court_id"`
	StartsAt string `json:"starts_at"`
	EndsAt   string `json:"ends_at"`
	Reason   string `json:"reason,omitempty"`
}

type timeSlotDTO struct {
	ID          string `json:"id"`
	CourtID     string `json:"court_id"`
	StartsAt    string `json:"starts_at"`
	EndsAt      string `json:"ends_at"`
	IsAvailable bool   `json:"is_available"`
}

type courtAvailabilityDTO struct {
	CourtID string        `json:"court_id"`
	Slots   []timeSlotDTO `json:"slots"`
}

type marketplaceBranchDTO struct {
	PublicID       string `json:"public_id"`
	OrganizationID string `json:"organization_id"`
	Code           string `json:"code"`
	Name           string `json:"name"`
	NameEn         string `json:"name_en,omitempty"`
	NameVi         string `json:"name_vi,omitempty"`
	Phone          string `json:"phone,omitempty"`
	Email          string `json:"email,omitempty"`
	Timezone       string `json:"timezone,omitempty"`
	Status         string `json:"status"`
	City           string `json:"city,omitempty"`
	District       string `json:"district,omitempty"`
	AddressLine1   string `json:"address_line_1,omitempty"`
}

type marketplaceCourtDTO struct {
	PublicID    string `json:"public_id"`
	CourtTypeID string `json:"court_type_id,omitempty"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	NameEn      string `json:"name_en,omitempty"`
	NameVi      string `json:"name_vi,omitempty"`
	Status      string `json:"status"`
	IsBookable  bool   `json:"is_bookable"`
	SlotMinutes int    `json:"slot_duration_minutes"`
}

type marketplaceBranchProfileDTO struct {
	Branch marketplaceBranchDTO  `json:"branch"`
	Courts []marketplaceCourtDTO `json:"courts"`
}

func (h *ScheduleHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	branches := rg.Group("/branches", jwt, middleware.OptionalOrganization())
	{
		branches.PUT("/:id/schedule", h.PutWeeklySchedule)
		branches.GET("/:id/schedule", h.GetWeeklySchedule)
		branches.POST("/:id/schedule/special", h.CreateSpecial)
		branches.GET("/:id/availability", h.BranchAvailability)
	}
	courts := rg.Group("/courts", jwt, middleware.OptionalOrganization())
	{
		courts.POST("/:id/blocks", h.CreateBlock)
		courts.DELETE("/:id/blocks/:blockId", h.DeleteBlock)
		courts.GET("/:id/availability", h.CourtAvailability)
	}
	market := rg.Group("/marketplace")
	{
		market.GET("/branches", h.SearchMarketplaceBranches)
		market.GET("/branches/:publicId", h.MarketplaceBranchProfile)
		market.GET("/courts/:publicId/availability", h.MarketplaceCourtAvailability)
	}
}

func (h *ScheduleHandler) PutWeeklySchedule(c *gin.Context) {
	uid, branchID, ok := userAndUUID(c, "invalid branch id")
	if !ok {
		return
	}
	var req putWeeklyScheduleRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	days := make([]service.WeekdayHoursInput, 0, len(req.Days))
	for _, d := range req.Days {
		days = append(days, service.WeekdayHoursInput{
			Weekday: d.Weekday, OpensAt: d.OpensAt, ClosesAt: d.ClosesAt, IsClosed: d.IsClosed,
		})
	}
	hours, err := h.sched.PutWeeklySchedule(c.Request.Context(), branchID, uid, days)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBusinessHoursDTO(hours))
}

func (h *ScheduleHandler) GetWeeklySchedule(c *gin.Context) {
	uid, branchID, ok := userAndUUID(c, "invalid branch id")
	if !ok {
		return
	}
	hours, err := h.sched.GetWeeklySchedule(c.Request.Context(), branchID, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBusinessHoursDTO(hours))
}

func (h *ScheduleHandler) CreateSpecial(c *gin.Context) {
	uid, branchID, ok := userAndUUID(c, "invalid branch id")
	if !ok {
		return
	}
	var req createSpecialRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	starts, err := time.Parse(time.RFC3339, req.StartsAt)
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid starts_at"))
		return
	}
	ends, err := time.Parse(time.RFC3339, req.EndsAt)
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid ends_at"))
		return
	}
	isClosed := true
	if req.IsClosed != nil {
		isClosed = *req.IsClosed
	}
	hday, err := h.sched.CreateSpecial(c.Request.Context(), branchID, uid, service.CreateSpecialInput{
		NameEn: req.NameEn, NameVi: req.NameVi, StartsAt: starts, EndsAt: ends,
		IsClosed: isClosed, OpensAt: req.OpensAt, ClosesAt: req.ClosesAt,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toSpecialDTO(c, hday))
}

func (h *ScheduleHandler) CreateBlock(c *gin.Context) {
	uid, courtID, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	var req createBlockRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	starts, err := time.Parse(time.RFC3339, req.StartsAt)
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid starts_at"))
		return
	}
	ends, err := time.Parse(time.RFC3339, req.EndsAt)
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid ends_at"))
		return
	}
	b, err := h.sched.CreateBlock(c.Request.Context(), courtID, uid, service.CreateBlockInput{
		StartsAt: starts, EndsAt: ends, Reason: req.Reason,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toBlockDTO(b))
}

func (h *ScheduleHandler) DeleteBlock(c *gin.Context) {
	uid, courtID, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	blockID, err := uuid.Parse(c.Param("blockId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid block id"))
		return
	}
	if err := h.sched.DeleteBlock(c.Request.Context(), courtID, blockID, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *ScheduleHandler) CourtAvailability(c *gin.Context) {
	uid, courtID, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	from, to, ok := parseRange(c)
	if !ok {
		return
	}
	slots, err := h.sched.CourtAvailability(c.Request.Context(), courtID, uid, from, to)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, gin.H{"court_id": courtID.String(), "slots": toSlotDTOs(slots)})
}

func (h *ScheduleHandler) BranchAvailability(c *gin.Context) {
	uid, branchID, ok := userAndUUID(c, "invalid branch id")
	if !ok {
		return
	}
	from, to, ok := parseRange(c)
	if !ok {
		return
	}
	byCourt, err := h.sched.BranchAvailability(c.Request.Context(), branchID, uid, from, to)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]courtAvailabilityDTO, 0, len(byCourt))
	for courtID, slots := range byCourt {
		out = append(out, courtAvailabilityDTO{CourtID: courtID.String(), Slots: toSlotDTOs(slots)})
	}
	httpx.OK(c, gin.H{"branch_id": branchID.String(), "courts": out})
}

func (h *ScheduleHandler) SearchMarketplaceBranches(c *gin.Context) {
	limit := 50
	if raw := c.Query("limit"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil || n < 1 || n > 100 {
			httpx.Error(c, apperr.New(apperr.CodeValidation, "limit must be 1–100"))
			return
		}
		limit = n
	}
	items, err := h.sched.SearchMarketplaceBranches(c.Request.Context(), c.Query("q"), limit)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]marketplaceBranchDTO, 0, len(items))
	for i := range items {
		out = append(out, toMarketBranchDTO(c, &items[i]))
	}
	httpx.OK(c, out)
}

func (h *ScheduleHandler) MarketplaceBranchProfile(c *gin.Context) {
	b, courts, err := h.sched.MarketplaceBranchProfile(c.Request.Context(), c.Param("publicId"))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	courtDTOs := make([]marketplaceCourtDTO, 0, len(courts))
	for i := range courts {
		courtDTOs = append(courtDTOs, toMarketCourtDTO(c, &courts[i]))
	}
	httpx.OK(c, marketplaceBranchProfileDTO{
		Branch: toMarketBranchDTO(c, b),
		Courts: courtDTOs,
	})
}

func (h *ScheduleHandler) MarketplaceCourtAvailability(c *gin.Context) {
	from, to, ok := parseRange(c)
	if !ok {
		return
	}
	court, slots, err := h.sched.MarketplaceCourtAvailability(c.Request.Context(), c.Param("publicId"), from, to)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, gin.H{
		"court": toMarketCourtDTO(c, court),
		"slots": toSlotDTOs(slots),
	})
}

func parseRange(c *gin.Context) (time.Time, time.Time, bool) {
	fromRaw, toRaw := c.Query("from"), c.Query("to")
	if fromRaw == "" || toRaw == "" {
		httpx.Error(c, schederrors.ErrDateRangeRequired)
		return time.Time{}, time.Time{}, false
	}
	from, err := time.Parse(time.RFC3339, fromRaw)
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid from"))
		return time.Time{}, time.Time{}, false
	}
	to, err := time.Parse(time.RFC3339, toRaw)
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid to"))
		return time.Time{}, time.Time{}, false
	}
	return from, to, true
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

func clockStr(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.Format("15:04")
}

func toBusinessHoursDTO(hours []entity.BusinessHour) []businessHourDTO {
	out := make([]businessHourDTO, 0, len(hours))
	for _, h := range hours {
		dto := businessHourDTO{Weekday: int16(h.Weekday), IsClosed: h.IsClosed}
		if !h.IsClosed {
			dto.OpensAt = clockStr(h.OpensAt)
			dto.ClosesAt = clockStr(h.ClosesAt)
		}
		out = append(out, dto)
	}
	return out
}

func toSpecialDTO(c *gin.Context, h *entity.SpecialSchedule) specialScheduleDTO {
	dto := specialScheduleDTO{
		ID: h.ID.String(), Name: i18n.DisplayName(i18n.FromContext(c.Request.Context()), h.NameEn, h.NameVi),
		NameEn: h.NameEn, NameVi: h.NameVi,
		StartsAt: h.StartsAt.Format(time.RFC3339), EndsAt: h.EndsAt.Format(time.RFC3339), IsClosed: h.IsClosed,
	}
	if h.OpensAt != nil {
		s := clockStr(*h.OpensAt)
		dto.OpensAt = &s
	}
	if h.ClosesAt != nil {
		s := clockStr(*h.ClosesAt)
		dto.ClosesAt = &s
	}
	return dto
}

func toBlockDTO(b *entity.ResourceBlock) blockDTO {
	return blockDTO{
		ID: b.ID.String(), CourtID: b.ResourceID.String(),
		StartsAt: b.StartsAt.Format(time.RFC3339), EndsAt: b.EndsAt.Format(time.RFC3339), Reason: b.Reason,
	}
}

func toSlotDTOs(slots []entity.TimeSlot) []timeSlotDTO {
	out := make([]timeSlotDTO, 0, len(slots))
	for _, s := range slots {
		out = append(out, timeSlotDTO{
			ID: s.ID.String(), CourtID: s.ResourceID.String(),
			StartsAt: s.StartsAt.Format(time.RFC3339), EndsAt: s.EndsAt.Format(time.RFC3339),
			IsAvailable: s.IsAvailable,
		})
	}
	return out
}

func toMarketBranchDTO(c *gin.Context, b *repository.MarketplaceBranch) marketplaceBranchDTO {
	return marketplaceBranchDTO{
		PublicID: b.PublicID, OrganizationID: b.OrganizationID.String(), Code: b.Code,
		Name:   i18n.DisplayName(i18n.FromContext(c.Request.Context()), b.NameEn, b.NameVi),
		NameEn: b.NameEn, NameVi: b.NameVi, Phone: b.Phone, Email: b.Email, Timezone: b.Timezone,
		Status: b.Status, City: b.City, District: b.District, AddressLine1: b.AddressLine1,
	}
}

func toMarketCourtDTO(c *gin.Context, court *repository.MarketplaceCourt) marketplaceCourtDTO {
	dto := marketplaceCourtDTO{
		PublicID: court.PublicID, Code: court.Code,
		Name:   i18n.DisplayName(i18n.FromContext(c.Request.Context()), court.NameEn, court.NameVi),
		NameEn: court.NameEn, NameVi: court.NameVi, Status: court.Status,
		IsBookable: court.IsBookable, SlotMinutes: court.SlotMinutes,
	}
	if court.CourtTypeID != uuid.Nil {
		dto.CourtTypeID = court.CourtTypeID.String()
	}
	return dto
}
