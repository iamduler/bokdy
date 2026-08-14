package handler

import (
	"time"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/requestctx"
	"bokdy/internal/reservation/entity"
	"bokdy/internal/reservation/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ReservationHandler struct {
	reservations *service.ReservationService
}

func NewReservationHandler(reservations *service.ReservationService) *ReservationHandler {
	return &ReservationHandler{reservations: reservations}
}

type createReservationRequest struct {
	CourtID    string  `json:"court_id" binding:"required,uuid"`
	CustomerID *string `json:"customer_id" binding:"omitempty,uuid"`
	StartsAt   string  `json:"starts_at" binding:"required"`
	EndsAt     string  `json:"ends_at" binding:"required"`
	Source     string  `json:"source"`
}

type reservationDTO struct {
	ID             string  `json:"id"`
	PublicID       string  `json:"public_id"`
	ReservationNo  string  `json:"reservation_no"`
	Status         string  `json:"status"`
	Source         string  `json:"source"`
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
	ExpiresAt      string  `json:"expires_at"`
	CanceledAt     *string `json:"canceled_at,omitempty"`
	ConvertedAt    *string `json:"converted_at,omitempty"`
	CreatedAt      string  `json:"created_at"`
}

type convertedBookingDTO struct {
	ID          string  `json:"id"`
	PublicID    string  `json:"public_id"`
	BookingNo   string  `json:"booking_no"`
	Status      string  `json:"status"`
	ExpiresAt   *string `json:"expires_at,omitempty"`
	InvoiceID   string  `json:"invoice_id"`
	InvoiceNo   string  `json:"invoice_no"`
	Currency    string  `json:"currency"`
	TotalAmount float64 `json:"total_amount"`
}

type convertReservationDTO struct {
	Reservation reservationDTO      `json:"reservation"`
	Booking     convertedBookingDTO `json:"booking"`
}

func (h *ReservationHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	reservations := rg.Group("/reservations", jwt, middleware.OptionalOrganization())
	{
		reservations.POST("", h.Create)
		reservations.GET("/:id", h.Get)
		reservations.POST("/:id/cancel", h.Cancel)
		reservations.POST("/:id/convert", h.Convert)
	}
}

func (h *ReservationHandler) Create(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	var req createReservationRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	courtID, err := uuid.Parse(req.CourtID)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid court_id")
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
	in := service.CreateHoldInput{CourtID: courtID, StartsAt: starts, EndsAt: ends, Source: req.Source}
	if req.CustomerID != nil && *req.CustomerID != "" {
		customerID, err := uuid.Parse(*req.CustomerID)
		if err != nil {
			httpx.Fail(c, apperr.CodeValidation, "invalid customer_id")
			return
		}
		in.CustomerID = &customerID
	}
	res, err := h.reservations.CreateHold(c.Request.Context(), uid, in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toReservationDTO(res))
}

func (h *ReservationHandler) Get(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid reservation id")
	if !ok {
		return
	}
	res, err := h.reservations.Get(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toReservationDTO(res))
}

func (h *ReservationHandler) Cancel(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid reservation id")
	if !ok {
		return
	}
	res, err := h.reservations.Cancel(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toReservationDTO(res))
}

func (h *ReservationHandler) Convert(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid reservation id")
	if !ok {
		return
	}
	result, err := h.reservations.Convert(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, convertReservationDTO{
		Reservation: toReservationDTO(result.Reservation),
		Booking:     toConvertedBookingDTO(result.Booking),
	})
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
		httpx.Fail(c, apperr.CodeBadRequest, invalidMsg)
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

func toReservationDTO(res *entity.Reservation) reservationDTO {
	dto := reservationDTO{
		ID: res.ID.String(), PublicID: res.PublicID, ReservationNo: res.ReservationNo,
		Status: string(res.Status), Source: string(res.Source),
		CustomerID: res.CustomerID.String(), BranchID: res.LocationID.String(),
		CourtID: res.CourtID.String(), Currency: res.Currency,
		Subtotal: res.Subtotal, DiscountAmount: res.DiscountAmount,
		TaxAmount: res.TaxAmount, TotalAmount: res.TotalAmount,
		StartsAt: res.StartsAt.Format(time.RFC3339), EndsAt: res.EndsAt.Format(time.RFC3339),
		ExpiresAt: res.ExpiresAt.Format(time.RFC3339), CreatedAt: res.CreatedAt.Format(time.RFC3339),
	}
	if res.PriceVersionID != nil {
		s := res.PriceVersionID.String()
		dto.PriceVersionID = &s
	}
	if res.CanceledAt != nil {
		s := res.CanceledAt.Format(time.RFC3339)
		dto.CanceledAt = &s
	}
	if res.ConvertedAt != nil {
		s := res.ConvertedAt.Format(time.RFC3339)
		dto.ConvertedAt = &s
	}
	return dto
}

func toConvertedBookingDTO(b *service.CreatedBooking) convertedBookingDTO {
	dto := convertedBookingDTO{
		ID: b.ID.String(), PublicID: b.PublicID, BookingNo: b.BookingNo, Status: b.Status,
		InvoiceID: b.InvoiceID.String(), InvoiceNo: b.InvoiceNo,
		Currency: b.Currency, TotalAmount: b.TotalAmount,
	}
	if b.ExpiresAt != nil {
		s := b.ExpiresAt.Format(time.RFC3339)
		dto.ExpiresAt = &s
	}
	return dto
}
