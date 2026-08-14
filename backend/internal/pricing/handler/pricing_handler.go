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
	CourtTypeID string  `json:"court_type_id" binding:"required,uuid"`
	Amount      float64 `json:"amount"`
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
	StartsAt      string  `json:"starts_at" binding:"required"`
	EndsAt        string  `json:"ends_at" binding:"required"`
}

type categoryPriceDTO struct {
	CourtTypeID string  `json:"court_type_id"`
	Amount      float64 `json:"amount"`
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

type quoteDTO struct {
	Currency       string               `json:"currency"`
	BaseAmount     float64              `json:"base_amount"`
	Adjustments    []quoteAdjustmentDTO `json:"adjustments"`
	TotalAmount    float64              `json:"total_amount"`
	PriceVersionID string               `json:"price_version_id"`
	CourtID        string               `json:"court_id"`
	StartsAt       string               `json:"starts_at"`
	EndsAt         string               `json:"ends_at"`
	DurationMin    int                  `json:"duration_minutes"`
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
		id, err := uuid.Parse(r.CourtTypeID)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid court_type_id"))
			return
		}
		rates = append(rates, service.CategoryRateInput{CourtTypeID: id, Amount: r.Amount})
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
	in := service.CalculateInput{CourtPublicID: req.CourtPublicID, StartsAt: starts, EndsAt: ends}
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
			dto.Rates = append(dto.Rates, categoryPriceDTO{CourtTypeID: r.CategoryID.String(), Amount: r.Amount})
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
	return quoteDTO{
		Currency: q.Currency, BaseAmount: q.BaseAmount, Adjustments: adjs, TotalAmount: q.TotalAmount,
		PriceVersionID: q.PriceVersionID.String(), CourtID: q.CourtID.String(),
		StartsAt: q.StartsAt.Format(time.RFC3339), EndsAt: q.EndsAt.Format(time.RFC3339), DurationMin: q.DurationMin,
	}
}
