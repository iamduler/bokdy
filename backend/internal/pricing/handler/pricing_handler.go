package handler

import (
	"time"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/requestctx"
	"bokdy/internal/pricing/entity"
	"bokdy/internal/pricing/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PricingHandler struct {
	pricing *service.PricingService
}

func NewPricingHandler(pricing *service.PricingService) *PricingHandler {
	return &PricingHandler{pricing: pricing}
}

type categoryRateRequest struct {
	SportID string  `json:"sport_id" binding:"required,uuid"`
	Amount  float64 `json:"amount"`
}

type timeRuleRequest struct {
	Weekdays       []int16 `json:"weekdays" binding:"required,min=1"`
	StartsAt       string  `json:"starts_at" binding:"required"`
	EndsAt         string  `json:"ends_at" binding:"required"`
	AdjustmentType string  `json:"adjustment_type" binding:"required"`
	ValueType      string  `json:"value_type" binding:"required"`
	Value          float64 `json:"value"`
	Priority       int     `json:"priority"`
}

type createVersionRequest struct {
	Rates     []categoryRateRequest `json:"rates" binding:"required,min=1"`
	TimeRules []timeRuleRequest     `json:"time_rules"`
}

type calculateRequest struct {
	CourtID       *string `json:"court_id" binding:"omitempty,uuid"`
	CourtPublicID string  `json:"court_public_id"`
	CustomerType  string  `json:"customer_type"`
	StartsAt      string  `json:"starts_at" binding:"required"`
	EndsAt        string  `json:"ends_at" binding:"required"`
}

type categoryPriceDTO struct {
	SportID string  `json:"sport_id"`
	Amount  float64 `json:"amount"`
}

type timeRuleDTO struct {
	ID             string  `json:"id"`
	Weekdays       []int16 `json:"weekdays"`
	StartsAt       string  `json:"starts_at"`
	EndsAt         string  `json:"ends_at"`
	AdjustmentType string  `json:"adjustment_type"`
	ValueType      string  `json:"value_type"`
	Value          float64 `json:"value"`
	Priority       int     `json:"priority"`
}

type priceVersionDTO struct {
	ID            string             `json:"id"`
	Version       int                `json:"version"`
	Status        string             `json:"status"`
	EffectiveFrom string             `json:"effective_from"`
	EffectiveTo   *string            `json:"effective_to,omitempty"`
	PublishedAt   *string            `json:"published_at,omitempty"`
	Rates         []categoryPriceDTO `json:"rates,omitempty"`
	TimeRules     []timeRuleDTO      `json:"time_rules,omitempty"`
}

type quoteAdjustmentDTO struct {
	RuleID         string  `json:"rule_id"`
	AdjustmentType string  `json:"adjustment_type"`
	ValueType      string  `json:"value_type"`
	Value          float64 `json:"value"`
	OverlapMinutes int     `json:"overlap_minutes"`
	Amount         float64 `json:"amount"`
}

type quoteLineDTO struct {
	StartsAt   string  `json:"starts_at"`
	EndsAt     string  `json:"ends_at"`
	Amount     float64 `json:"amount"`
	RuleID     string  `json:"rule_id,omitempty"`
	WindowName string  `json:"window_name,omitempty"`
}

type quoteDTO struct {
	Currency        string               `json:"currency"`
	BaseAmount      float64              `json:"base_amount"`
	Adjustments     []quoteAdjustmentDTO `json:"adjustments"`
	Lines           []quoteLineDTO       `json:"lines,omitempty"`
	TotalAmount     float64              `json:"total_amount"`
	PriceVersionID  string               `json:"price_version_id"`
	CourtID         string               `json:"court_id"`
	StartsAt        string               `json:"starts_at"`
	EndsAt          string               `json:"ends_at"`
	DurationMin     int                  `json:"duration_minutes"`
	Timezone        string               `json:"timezone,omitempty"`
	SlotUnitMinutes int                  `json:"slot_unit_minutes,omitempty"`
}

type profileWindowRequest struct {
	Name     string  `json:"name"`
	Weekdays []int16 `json:"weekdays"`
	StartsAt string  `json:"starts_at"`
	EndsAt   string  `json:"ends_at"`
	Amount   float64 `json:"amount"`
}

type dayGroupRequest struct {
	Name     string                 `json:"name"`
	Weekdays []int16                `json:"weekdays"`
	Windows  []profileWindowRequest `json:"windows"`
}

type holidayWindowRequest struct {
	Name     string  `json:"name"`
	StartsAt string  `json:"starts_at"`
	EndsAt   string  `json:"ends_at"`
	Amount   float64 `json:"amount"`
}

type holidayDateRequest struct {
	Date   string `json:"holiday_on"`
	Name   string `json:"name"`
	Effect string `json:"effect"`
}

type replaceHolidaysRequest struct {
	Holidays []holidayDateRequest `json:"holidays"`
}

type saveProfileRequest struct {
	SportID           string                 `json:"sport_id"`
	Name              string                 `json:"name"`
	CustomerType      string                 `json:"customer_type"`
	SlotUnitMinutes   int                    `json:"slot_unit_minutes"`
	UnlimitedDuration bool                   `json:"unlimited_duration"`
	Durations         []int                  `json:"durations"`
	BaseAmount        float64                `json:"base_amount"`
	DayGroups         []dayGroupRequest      `json:"day_groups"`
	HolidayWindows    []holidayWindowRequest `json:"holiday_windows"`
	Windows           []profileWindowRequest `json:"windows"`
}

type profileWindowDTO struct {
	ID       string  `json:"id,omitempty"`
	Name     string  `json:"name,omitempty"`
	Weekdays []int16 `json:"weekdays"`
	StartsAt string  `json:"starts_at"`
	EndsAt   string  `json:"ends_at"`
	Amount   float64 `json:"amount"`
}

type dayGroupDTO struct {
	ID       string             `json:"id,omitempty"`
	Name     string             `json:"name"`
	Weekdays []int16            `json:"weekdays"`
	Windows  []profileWindowDTO `json:"windows"`
}

type holidayWindowDTO struct {
	ID       string  `json:"id,omitempty"`
	Name     string  `json:"name"`
	StartsAt string  `json:"starts_at"`
	EndsAt   string  `json:"ends_at"`
	Amount   float64 `json:"amount"`
}

type holidayDateDTO struct {
	ID     string `json:"id,omitempty"`
	Date   string `json:"holiday_on"`
	Name   string `json:"name"`
	Effect string `json:"effect,omitempty"`
	Source string `json:"source,omitempty"`
}

type profileDTO struct {
	ID                string             `json:"id"`
	Code              string             `json:"code"`
	Name              string             `json:"name"`
	BranchID          string             `json:"branch_id"`
	SportID           string             `json:"sport_id"`
	CustomerType      string             `json:"customer_type"`
	SlotUnitMinutes   int                `json:"slot_unit_minutes"`
	UnlimitedDuration bool               `json:"unlimited_duration"`
	Durations         []int              `json:"durations"`
	BaseAmount        *float64           `json:"base_amount"`
	Windows           []profileWindowDTO `json:"windows"`
	DayGroups         []dayGroupDTO      `json:"day_groups"`
	HolidayWindows    []holidayWindowDTO `json:"holiday_windows"`
	Version           int                `json:"version,omitempty"`
	Status            string             `json:"status,omitempty"`
	Published         bool               `json:"published"`
	UpdatedAt         string             `json:"updated_at"`
}

type sportPricingDTO struct {
	SportID       string       `json:"sport_id"`
	SuggestedBase *float64     `json:"suggested_base_amount,omitempty"`
	Profiles      []profileDTO `json:"profiles"`
}

func (h *PricingHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	versions := rg.Group("/price-versions", jwt, middleware.OptionalOrganization())
	{
		versions.POST("", h.CreateVersion)
		versions.GET("", h.ListVersions)
		versions.GET("/:id", h.GetVersion)
		versions.POST("/:id/publish", h.PublishVersion)
		versions.POST("/:id/archive", h.ArchiveVersion)
	}
	rg.POST("/pricing/calculate", h.Calculate)
	profiles := rg.Group("/pricing-profiles", jwt, middleware.OptionalOrganization())
	profiles.GET("/:id", h.GetProfile)
	branches := rg.Group("/branches", jwt, middleware.OptionalOrganization())
	branches.GET("/:id/pricing-profiles", h.ListProfiles)
	branches.POST("/:id/pricing-profiles", h.CreateProfile)
	branches.PUT("/:id/pricing-profiles/:profileId", h.SaveProfile)
	branches.POST("/:id/pricing-profiles/:profileId/activate", h.ActivateProfile)
	branches.POST("/:id/pricing-profiles/:profileId/duplicate", h.DuplicateProfile)
	branches.GET("/:id/holidays", h.ListHolidays)
	branches.PUT("/:id/holidays", h.ReplaceHolidays)
	orgs := rg.Group("/organizations", jwt, middleware.OptionalOrganization())
	orgs.GET("/:id/holidays", h.ListOrganizationHolidays)
	orgs.PUT("/:id/holidays", h.ReplaceOrganizationHolidays)
}

func (h *PricingHandler) RegisterAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/holidays", h.ListCalendarHolidays)
	admin.PUT("/holidays", h.ReplaceCalendarHolidays)
}

func (h *PricingHandler) CreateVersion(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	var req createVersionRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	rates := make([]service.CategoryRateInput, 0, len(req.Rates))
	for _, r := range req.Rates {
		id, err := uuid.Parse(r.SportID)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid sport_id"))
			return
		}
		rates = append(rates, service.CategoryRateInput{SportID: id, Amount: r.Amount})
	}
	rules := make([]service.TimeRuleInput, 0, len(req.TimeRules))
	for _, tr := range req.TimeRules {
		rules = append(rules, service.TimeRuleInput{
			Weekdays: tr.Weekdays, OpensAt: tr.StartsAt, ClosesAt: tr.EndsAt,
			AdjustmentType: tr.AdjustmentType, ValueType: tr.ValueType, Value: tr.Value, Priority: tr.Priority,
		})
	}
	v, err := h.pricing.CreateVersion(c.Request.Context(), uid, service.CreateVersionInput{Rates: rates, TimeRules: rules})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toVersionDTO(v, true))
}

func (h *PricingHandler) ListVersions(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	items, err := h.pricing.ListVersions(c.Request.Context(), uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]priceVersionDTO, 0, len(items))
	for i := range items {
		out = append(out, toVersionDTO(&items[i], false))
	}
	httpx.OK(c, out)
}

func (h *PricingHandler) GetVersion(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid price version id")
	if !ok {
		return
	}
	v, err := h.pricing.GetVersion(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toVersionDTO(v, true))
}

func (h *PricingHandler) PublishVersion(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid price version id")
	if !ok {
		return
	}
	v, err := h.pricing.PublishVersion(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toVersionDTO(v, true))
}

func (h *PricingHandler) ArchiveVersion(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid price version id")
	if !ok {
		return
	}
	if err := h.pricing.ArchiveVersion(c.Request.Context(), id, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *PricingHandler) Calculate(c *gin.Context) {
	var req calculateRequest
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
	in := service.CalculateInput{CourtPublicID: req.CourtPublicID, CustomerType: req.CustomerType, StartsAt: starts, EndsAt: ends}
	if req.CourtID != nil && *req.CourtID != "" {
		id, err := uuid.Parse(*req.CourtID)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid court_id"))
			return
		}
		in.CourtID = &id
	}
	q, err := h.pricing.Calculate(c.Request.Context(), in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toQuoteDTO(q))
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
	return t.Format("15:04")
}

func toVersionDTO(v *entity.PriceVersion, detail bool) priceVersionDTO {
	dto := priceVersionDTO{
		ID: v.ID.String(), Version: v.Version, Status: string(v.Status),
		EffectiveFrom: v.EffectiveFrom.Format(time.RFC3339),
	}
	if v.EffectiveTo != nil {
		s := v.EffectiveTo.Format(time.RFC3339)
		dto.EffectiveTo = &s
	}
	if v.PublishedAt != nil {
		s := v.PublishedAt.Format(time.RFC3339)
		dto.PublishedAt = &s
	}
	if detail {
		dto.Rates = make([]categoryPriceDTO, 0, len(v.Rates))
		for _, r := range v.Rates {
			dto.Rates = append(dto.Rates, categoryPriceDTO{SportID: r.SportID.String(), Amount: r.Amount})
		}
		dto.TimeRules = make([]timeRuleDTO, 0, len(v.TimeRules))
		for _, tr := range v.TimeRules {
			dto.TimeRules = append(dto.TimeRules, timeRuleDTO{
				ID: tr.ID.String(), Weekdays: tr.Weekdays, StartsAt: clockStr(tr.StartsAt), EndsAt: clockStr(tr.EndsAt),
				AdjustmentType: string(tr.AdjustmentType), ValueType: string(tr.ValueType), Value: tr.Value, Priority: tr.Priority,
			})
		}
	}
	return dto
}

func toQuoteDTO(q *entity.Quote) quoteDTO {
	adjs := make([]quoteAdjustmentDTO, 0, len(q.Adjustments))
	for _, a := range q.Adjustments {
		adjs = append(adjs, quoteAdjustmentDTO{
			RuleID: a.RuleID.String(), AdjustmentType: string(a.AdjustmentType), ValueType: string(a.ValueType),
			Value: a.Value, OverlapMinutes: a.OverlapMinutes, Amount: a.Amount,
		})
	}
	lines := make([]quoteLineDTO, 0, len(q.Lines))
	for _, line := range q.Lines {
		dto := quoteLineDTO{
			StartsAt: line.StartsAt.UTC().Format(time.RFC3339),
			EndsAt:   line.EndsAt.UTC().Format(time.RFC3339),
			Amount:   line.Amount,
		}
		if line.RuleID != nil {
			dto.RuleID = line.RuleID.String()
		}
		dto.WindowName = line.WindowName
		lines = append(lines, dto)
	}
	return quoteDTO{
		Currency: q.Currency, BaseAmount: q.BaseAmount, Adjustments: adjs, Lines: lines, TotalAmount: q.TotalAmount,
		PriceVersionID: q.PriceVersionID.String(), CourtID: q.CourtID.String(),
		StartsAt: q.StartsAt.Format(time.RFC3339), EndsAt: q.EndsAt.Format(time.RFC3339), DurationMin: q.DurationMin,
		Timezone: q.Timezone, SlotUnitMinutes: q.SlotUnitMinutes,
	}
}

func (h *PricingHandler) ListProfiles(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid branch id"))
		return
	}
	views, err := h.pricing.ListBranchProfiles(c.Request.Context(), uid, branchID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]sportPricingDTO, 0, len(views))
	for i := range views {
		profiles := make([]profileDTO, 0, len(views[i].Profiles))
		for j := range views[i].Profiles {
			profiles = append(profiles, toProfileDTO(&views[i].Profiles[j]))
		}
		out = append(out, sportPricingDTO{
			SportID: views[i].SportID.String(), SuggestedBase: views[i].SuggestedBase, Profiles: profiles,
		})
	}
	httpx.OK(c, out)
}

func (h *PricingHandler) GetProfile(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	profileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid price list id"))
		return
	}
	view, err := h.pricing.GetProfile(c.Request.Context(), uid, profileID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toProfileDTO(view))
}

func (h *PricingHandler) CreateProfile(c *gin.Context) {
	h.writeProfile(c, uuid.Nil, false)
}

func (h *PricingHandler) SaveProfile(c *gin.Context) {
	profileID, err := uuid.Parse(c.Param("profileId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid price list id"))
		return
	}
	h.writeProfile(c, profileID, false)
}

func (h *PricingHandler) ActivateProfile(c *gin.Context) {
	profileID, err := uuid.Parse(c.Param("profileId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid price list id"))
		return
	}
	h.writeProfile(c, profileID, true)
}

func (h *PricingHandler) writeProfile(c *gin.Context, profileID uuid.UUID, activate bool) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid branch id"))
		return
	}
	var req saveProfileRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	in := service.SaveProfileInput{
		BranchID: branchID, ProfileID: profileID, Name: req.Name, CustomerType: req.CustomerType,
		SlotUnitMinutes: req.SlotUnitMinutes, UnlimitedDuration: req.UnlimitedDuration,
		Durations: req.Durations, BaseAmount: req.BaseAmount,
		DayGroups: dayGroupsFromRequest(req.DayGroups), HolidayWindows: holidayWindowsFromRequest(req.HolidayWindows),
		Windows: windowsFromRequest(req.Windows),
	}
	if profileID == uuid.Nil {
		sportID, err := uuid.Parse(req.SportID)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid sport id"))
			return
		}
		in.SportID = sportID
	}
	var view *service.ProfileView
	if activate {
		view, err = h.pricing.ActivateBranchProfile(c.Request.Context(), uid, in)
	} else if profileID == uuid.Nil {
		view, err = h.pricing.CreateBranchProfile(c.Request.Context(), uid, in)
	} else {
		view, err = h.pricing.SaveBranchProfile(c.Request.Context(), uid, in)
	}
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toProfileDTO(view))
}

func windowsFromRequest(windows []profileWindowRequest) []service.SlotWindowInput {
	out := make([]service.SlotWindowInput, 0, len(windows))
	for _, window := range windows {
		out = append(out, service.SlotWindowInput{
			Name: window.Name, Weekdays: window.Weekdays, OpensAt: window.StartsAt, ClosesAt: window.EndsAt, Amount: window.Amount,
		})
	}
	return out
}

func dayGroupsFromRequest(groups []dayGroupRequest) []service.DayGroupInput {
	out := make([]service.DayGroupInput, 0, len(groups))
	for _, group := range groups {
		out = append(out, service.DayGroupInput{
			Name: group.Name, Weekdays: group.Weekdays, Windows: windowsFromRequest(group.Windows),
		})
	}
	return out
}

func holidayWindowsFromRequest(windows []holidayWindowRequest) []service.HolidayWindowInput {
	out := make([]service.HolidayWindowInput, 0, len(windows))
	for _, window := range windows {
		out = append(out, service.HolidayWindowInput{
			Name: window.Name, OpensAt: window.StartsAt, ClosesAt: window.EndsAt, Amount: window.Amount,
		})
	}
	return out
}

func toProfileDTO(view *service.ProfileView) profileDTO {
	windows := make([]profileWindowDTO, 0, len(view.Windows))
	for _, rule := range view.Windows {
		amount := rule.Value
		if rule.SlotAmount != nil {
			amount = *rule.SlotAmount
		}
		windows = append(windows, profileWindowDTO{
			ID: rule.ID.String(), Name: rule.Name, Weekdays: rule.Weekdays,
			StartsAt: rule.StartsAt.Format("15:04"), EndsAt: rule.EndsAt.Format("15:04"),
			Amount: amount,
		})
	}
	groups := make([]dayGroupDTO, 0, len(view.DayGroups))
	for _, group := range view.DayGroups {
		groupWindows := make([]profileWindowDTO, 0, len(group.Windows))
		for _, rule := range group.Windows {
			amount := rule.Value
			if rule.SlotAmount != nil {
				amount = *rule.SlotAmount
			}
			groupWindows = append(groupWindows, profileWindowDTO{
				ID: rule.ID.String(), Name: rule.Name, Weekdays: rule.Weekdays,
				StartsAt: rule.StartsAt.Format("15:04"), EndsAt: rule.EndsAt.Format("15:04"), Amount: amount,
			})
		}
		groups = append(groups, dayGroupDTO{
			ID: group.ID.String(), Name: group.Name, Weekdays: group.Weekdays, Windows: groupWindows,
		})
	}
	holidays := make([]holidayWindowDTO, 0, len(view.HolidayWindows))
	for _, window := range view.HolidayWindows {
		holidays = append(holidays, holidayWindowDTO{
			ID: window.ID.String(), Name: window.Name,
			StartsAt: window.StartsAt.Format("15:04"), EndsAt: window.EndsAt.Format("15:04"), Amount: window.Amount,
		})
	}
	durations := view.Durations
	if durations == nil {
		durations = []int{}
	}
	return profileDTO{
		ID: view.ID.String(), Code: view.Code, Name: view.Name, BranchID: view.BranchID.String(), SportID: view.SportID.String(),
		CustomerType: view.CustomerType, SlotUnitMinutes: view.SlotUnitMinutes, UnlimitedDuration: view.UnlimitedDuration,
		Durations: durations, BaseAmount: view.BaseAmount, Windows: windows, DayGroups: groups, HolidayWindows: holidays,
		Version: view.Version, Status: view.Status, Published: view.Published,
		UpdatedAt: view.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func (h *PricingHandler) DuplicateProfile(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid branch id"))
		return
	}
	profileID, err := uuid.Parse(c.Param("profileId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid price list id"))
		return
	}
	view, err := h.pricing.DuplicateBranchProfile(c.Request.Context(), uid, branchID, profileID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toProfileDTO(view))
}

func (h *PricingHandler) ListHolidays(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid branch id"))
		return
	}
	rows, err := h.pricing.ListBranchHolidays(c.Request.Context(), uid, branchID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, gin.H{"holidays": resolvedHolidayDTOs(rows)})
}

func (h *PricingHandler) ReplaceHolidays(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid branch id"))
		return
	}
	var req replaceHolidaysRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	rows, err := h.pricing.ReplaceBranchHolidays(c.Request.Context(), uid, branchID, holidayInputs(req.Holidays))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, gin.H{"holidays": resolvedHolidayDTOs(rows)})
}

func (h *PricingHandler) ListOrganizationHolidays(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	organizationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid organization id"))
		return
	}
	rows, err := h.pricing.ListOrganizationHolidays(c.Request.Context(), uid, organizationID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, gin.H{"holidays": organizationHolidayDTOs(rows)})
}

func (h *PricingHandler) ReplaceOrganizationHolidays(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	organizationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid organization id"))
		return
	}
	var req replaceHolidaysRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	rows, err := h.pricing.ReplaceOrganizationHolidays(c.Request.Context(), uid, organizationID, holidayInputs(req.Holidays))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, gin.H{"holidays": organizationHolidayDTOs(rows)})
}

func (h *PricingHandler) ListCalendarHolidays(c *gin.Context) {
	rows, err := h.pricing.ListCalendarHolidays(c.Request.Context())
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, gin.H{"holidays": calendarHolidayDTOs(rows)})
}

func (h *PricingHandler) ReplaceCalendarHolidays(c *gin.Context) {
	var req replaceHolidaysRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	rows, err := h.pricing.ReplaceCalendarHolidays(c.Request.Context(), holidayInputs(req.Holidays))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, gin.H{"holidays": calendarHolidayDTOs(rows)})
}

func holidayInputs(rows []holidayDateRequest) []service.HolidayDateInput {
	in := make([]service.HolidayDateInput, 0, len(rows))
	for _, holiday := range rows {
		in = append(in, service.HolidayDateInput{Date: holiday.Date, Name: holiday.Name, Effect: holiday.Effect})
	}
	return in
}

func resolvedHolidayDTOs(rows []entity.ResolvedHoliday) []holidayDateDTO {
	out := make([]holidayDateDTO, 0, len(rows))
	for _, row := range rows {
		out = append(out, holidayDateDTO{Date: row.Date, Name: row.Name, Source: row.Source, Effect: row.Effect})
	}
	return out
}

func organizationHolidayDTOs(rows []entity.OrganizationHoliday) []holidayDateDTO {
	out := make([]holidayDateDTO, 0, len(rows))
	for _, row := range rows {
		out = append(out, holidayDateDTO{ID: row.ID.String(), Date: row.Date, Name: row.Name, Effect: row.Effect})
	}
	return out
}

func calendarHolidayDTOs(rows []entity.CalendarHoliday) []holidayDateDTO {
	out := make([]holidayDateDTO, 0, len(rows))
	for _, row := range rows {
		out = append(out, holidayDateDTO{ID: row.ID.String(), Date: row.Date, Name: row.Name})
	}
	return out
}
