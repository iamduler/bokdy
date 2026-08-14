package handler

import (
	"context"
	"strconv"
	"time"

	"bokdy/internal/booking/entity"
	"bokdy/internal/booking/repository"
	"bokdy/internal/booking/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type BookingHandler struct {
	bookings *service.BookingService
}

func NewBookingHandler(bookings *service.BookingService) *BookingHandler {
	return &BookingHandler{bookings: bookings}
}

type walkInBookingRequest struct {
	CourtID    string `json:"court_id" binding:"required,uuid"`
	CustomerID string `json:"customer_id" binding:"required,uuid"`
	StartsAt   string `json:"starts_at" binding:"required"`
	EndsAt     string `json:"ends_at" binding:"required"`
}

type rescheduleBookingRequest struct {
	StartsAt string `json:"starts_at" binding:"required"`
	EndsAt   string `json:"ends_at" binding:"required"`
}

type bookingDTO struct {
	ID             string  `json:"id"`
	PublicID       string  `json:"public_id"`
	BookingNo      string  `json:"booking_no"`
	Status         string  `json:"status"`
	ReservationID  *string `json:"reservation_id,omitempty"`
	CustomerID     string  `json:"customer_id"`
	BranchID       string  `json:"branch_id"`
	CourtID        string  `json:"court_id"`
	Currency       string  `json:"currency"`
	Subtotal       float64 `json:"subtotal"`
	DiscountAmount float64 `json:"discount_amount"`
	TaxAmount      float64 `json:"tax_amount"`
	TotalAmount    float64 `json:"total_amount"`
	PriceVersionID *string `json:"price_version_id,omitempty"`
	StartsAt       string  `json:"starts_at"`
	EndsAt         string  `json:"ends_at"`
	ExpiresAt      *string `json:"expires_at,omitempty"`
	ConfirmedAt    *string `json:"confirmed_at,omitempty"`
	CheckedInAt    *string `json:"checked_in_at,omitempty"`
	CompletedAt    *string `json:"completed_at,omitempty"`
	CanceledAt     *string `json:"canceled_at,omitempty"`
	CreatedAt      string  `json:"created_at"`
}

type invoiceDTO struct {
	ID          string  `json:"id"`
	PublicID    string  `json:"public_id"`
	InvoiceNo   string  `json:"invoice_no"`
	Status      string  `json:"status"`
	Currency    string  `json:"currency"`
	TotalAmount float64 `json:"total_amount"`
	IssuedAt    string  `json:"issued_at"`
	DueAt       *string `json:"due_at,omitempty"`
}

type walkInBookingDTO struct {
	Booking bookingDTO `json:"booking"`
	Invoice invoiceDTO `json:"invoice"`
}

func (h *BookingHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	bookings := rg.Group("/bookings", jwt, middleware.OptionalOrganization())
	{
		bookings.POST("/walk-in", h.WalkIn)
		bookings.GET("", h.List)
		bookings.GET("/:id", h.Get)
		bookings.POST("/:id/confirm", h.Confirm)
		bookings.POST("/:id/check-in", h.CheckIn)
		bookings.POST("/:id/complete", h.Complete)
		bookings.POST("/:id/cancel", h.Cancel)
		bookings.POST("/:id/reschedule", h.Reschedule)
	}
	rg.GET("/me/bookings", jwt, h.ListMine)
}

func (h *BookingHandler) WalkIn(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	var req walkInBookingRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	courtID, err := uuid.Parse(req.CourtID)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid court_id")
		return
	}
	customerID, err := uuid.Parse(req.CustomerID)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid customer_id")
		return
	}
	starts, ok := parseTime(c, req.StartsAt, "starts_at")
	if !ok {
		return
	}
	ends, ok := parseTime(c, req.EndsAt, "ends_at")
	if !ok {
		return
	}
	result, err := h.bookings.WalkIn(c.Request.Context(), uid, service.WalkInInput{
		CourtID: courtID, CustomerID: customerID, StartsAt: starts, EndsAt: ends,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, walkInBookingDTO{
		Booking: toBookingDTO(result.Booking),
		Invoice: toInvoiceDTO(result.Invoice),
	})
}

func (h *BookingHandler) List(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	filter := repository.ListFilter{Limit: parseLimit(c)}
	if raw := c.Query("branch_id"); raw != "" {
		branchID, err := uuid.Parse(raw)
		if err != nil {
			httpx.Fail(c, apperr.CodeValidation, "invalid branch_id")
			return
		}
		filter.BranchID = &branchID
	}
	if raw := c.Query("status"); raw != "" {
		status, ok := entity.ParseStatus(raw)
		if !ok {
			httpx.Fail(c, apperr.CodeValidation, "invalid status")
			return
		}
		filter.Status = &status
	}
	if raw := c.Query("from"); raw != "" {
		from, ok := parseTime(c, raw, "from")
		if !ok {
			return
		}
		filter.From = &from
	}
	if raw := c.Query("to"); raw != "" {
		to, ok := parseTime(c, raw, "to")
		if !ok {
			return
		}
		filter.To = &to
	}
	items, err := h.bookings.List(c.Request.Context(), uid, filter)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBookingDTOs(items))
}

func (h *BookingHandler) ListMine(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	items, err := h.bookings.ListMine(c.Request.Context(), uid, parseLimit(c))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBookingDTOs(items))
}

func (h *BookingHandler) Get(c *gin.Context) {
	uid, id, ok := userAndUUID(c)
	if !ok {
		return
	}
	b, err := h.bookings.Get(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBookingDTO(b))
}

func (h *BookingHandler) Confirm(c *gin.Context) {
	h.transition(c, h.bookings.Confirm)
}

func (h *BookingHandler) CheckIn(c *gin.Context) {
	h.transition(c, h.bookings.CheckIn)
}

func (h *BookingHandler) Complete(c *gin.Context) {
	h.transition(c, h.bookings.Complete)
}

func (h *BookingHandler) Cancel(c *gin.Context) {
	h.transition(c, h.bookings.Cancel)
}

func (h *BookingHandler) Reschedule(c *gin.Context) {
	uid, id, ok := userAndUUID(c)
	if !ok {
		return
	}
	var req rescheduleBookingRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	starts, ok := parseTime(c, req.StartsAt, "starts_at")
	if !ok {
		return
	}
	ends, ok := parseTime(c, req.EndsAt, "ends_at")
	if !ok {
		return
	}
	b, err := h.bookings.Reschedule(c.Request.Context(), id, uid, service.RescheduleInput{
		StartsAt: starts, EndsAt: ends,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBookingDTO(b))
}

// statusAction is a booking transition that needs only the id and the actor.
type statusAction func(ctx context.Context, bookingID, actor uuid.UUID) (*entity.Booking, error)

func (h *BookingHandler) transition(c *gin.Context, action statusAction) {
	uid, id, ok := userAndUUID(c)
	if !ok {
		return
	}
	b, err := action(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBookingDTO(b))
}

func userID(c *gin.Context) (uuid.UUID, bool) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return uuid.Nil, false
	}
	return uid, true
}

func userAndUUID(c *gin.Context) (uuid.UUID, uuid.UUID, bool) {
	uid, ok := userID(c)
	if !ok {
		return uuid.Nil, uuid.Nil, false
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeBadRequest, "invalid booking id")
		return uuid.Nil, uuid.Nil, false
	}
	return uid, id, true
}

func parseTime(c *gin.Context, raw, field string) (time.Time, bool) {
	t, err := time.Parse(time.RFC3339, raw)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid "+field)
		return time.Time{}, false
	}
	return t, true
}

func parseLimit(c *gin.Context) int {
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

func toBookingDTOs(items []entity.Booking) []bookingDTO {
	out := make([]bookingDTO, 0, len(items))
	for i := range items {
		out = append(out, toBookingDTO(&items[i]))
	}
	return out
}

func toBookingDTO(b *entity.Booking) bookingDTO {
	dto := bookingDTO{
		ID: b.ID.String(), PublicID: b.PublicID, BookingNo: b.BookingNo, Status: string(b.Status),
		CustomerID: b.CustomerID.String(), BranchID: b.LocationID.String(), CourtID: b.CourtID.String(),
		Currency: b.Currency, Subtotal: b.Subtotal, DiscountAmount: b.DiscountAmount,
		TaxAmount: b.TaxAmount, TotalAmount: b.TotalAmount,
		StartsAt: b.StartsAt.Format(time.RFC3339), EndsAt: b.EndsAt.Format(time.RFC3339),
		CreatedAt: b.CreatedAt.Format(time.RFC3339),
	}
	if b.ReservationID != nil {
		s := b.ReservationID.String()
		dto.ReservationID = &s
	}
	if b.PriceVersionID != nil {
		s := b.PriceVersionID.String()
		dto.PriceVersionID = &s
	}
	dto.ExpiresAt = formatOptional(b.ExpiresAt)
	dto.ConfirmedAt = formatOptional(b.ConfirmedAt)
	dto.CheckedInAt = formatOptional(b.CheckedInAt)
	dto.CompletedAt = formatOptional(b.CompletedAt)
	dto.CanceledAt = formatOptional(b.CanceledAt)
	return dto
}

func toInvoiceDTO(inv *entity.Invoice) invoiceDTO {
	return invoiceDTO{
		ID: inv.ID.String(), PublicID: inv.PublicID, InvoiceNo: inv.InvoiceNo,
		Status: string(inv.Status), Currency: inv.Currency, TotalAmount: inv.TotalAmount,
		IssuedAt: inv.IssuedAt.Format(time.RFC3339), DueAt: formatOptional(inv.DueAt),
	}
}

func formatOptional(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := t.Format(time.RFC3339)
	return &s
}
