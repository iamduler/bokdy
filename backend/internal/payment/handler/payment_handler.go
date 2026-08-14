package handler

import (
	"context"
	"time"

	bookingentity "bokdy/internal/booking/entity"
	"bokdy/internal/payment/entity"
	"bokdy/internal/payment/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/middleware"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PaymentHandler struct {
	payments *service.PaymentService
}

func NewPaymentHandler(payments *service.PaymentService) *PaymentHandler {
	return &PaymentHandler{payments: payments}
}

type createPaymentRequest struct {
	InvoiceID string `json:"invoice_id" binding:"required,uuid"`
	Method    string `json:"method" binding:"required"`
}

type invoiceDTO struct {
	ID             string  `json:"id"`
	PublicID       string  `json:"public_id"`
	InvoiceNo      string  `json:"invoice_no"`
	BookingID      string  `json:"booking_id"`
	CustomerID     string  `json:"customer_id"`
	Status         string  `json:"status"`
	Currency       string  `json:"currency"`
	Subtotal       float64 `json:"subtotal"`
	DiscountAmount float64 `json:"discount_amount"`
	TaxAmount      float64 `json:"tax_amount"`
	TotalAmount    float64 `json:"total_amount"`
	RefundedAmount float64 `json:"refunded_amount"`
	IssuedAt       string  `json:"issued_at"`
	DueAt          *string `json:"due_at,omitempty"`
	PaidAt         *string `json:"paid_at,omitempty"`
	CreatedAt      string  `json:"created_at"`
}

type paymentDTO struct {
	ID          string  `json:"id"`
	InvoiceID   string  `json:"invoice_id"`
	CustomerID  string  `json:"customer_id"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	Status      string  `json:"status"`
	Method      string  `json:"method"`
	ExpiresAt   *string `json:"expires_at,omitempty"`
	SucceededAt *string `json:"succeeded_at,omitempty"`
	CreatedAt   string  `json:"created_at"`
}

type refundDTO struct {
	ID        string  `json:"id"`
	PaymentID string  `json:"payment_id"`
	InvoiceID string  `json:"invoice_id"`
	Amount    float64 `json:"amount"`
	Currency  string  `json:"currency"`
	Status    string  `json:"status"`
	CreatedAt string  `json:"created_at"`
}

func (h *PaymentHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	org := middleware.OptionalOrganization()
	invoices := rg.Group("/invoices", jwt, org)
	{
		invoices.GET("/:id", h.GetInvoice)
		invoices.POST("/:id/void", h.VoidInvoice)
	}
	payments := rg.Group("/payments", jwt, org)
	{
		payments.POST("", h.Create)
		payments.POST("/:id/complete", h.Complete)
		payments.POST("/:id/fail", h.Fail)
		payments.POST("/:id/refund", h.Refund)
	}
	rg.GET("/bookings/:id/invoice", jwt, org, h.GetInvoiceByBooking)
}

func (h *PaymentHandler) GetInvoice(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid invoice id")
	if !ok {
		return
	}
	inv, err := h.payments.GetInvoice(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toInvoiceDTO(inv))
}

func (h *PaymentHandler) GetInvoiceByBooking(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid booking id")
	if !ok {
		return
	}
	inv, err := h.payments.GetInvoiceByBooking(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toInvoiceDTO(inv))
}

func (h *PaymentHandler) VoidInvoice(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid invoice id")
	if !ok {
		return
	}
	inv, err := h.payments.VoidInvoice(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toInvoiceDTO(inv))
}

func (h *PaymentHandler) Create(c *gin.Context) {
	uid, ok := userID(c)
	if !ok {
		return
	}
	var req createPaymentRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	invoiceID, err := uuid.Parse(req.InvoiceID)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid invoice_id")
		return
	}
	method, okMethod := entity.ParseMethod(req.Method)
	if !okMethod {
		httpx.Fail(c, apperr.CodeValidation, "method must be cash or mock")
		return
	}
	intent, created, err := h.payments.Create(c.Request.Context(), uid, service.CreateInput{
		InvoiceID: invoiceID, Method: method,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	dto := toPaymentDTO(intent)
	if created {
		httpx.Created(c, dto)
		return
	}
	httpx.OK(c, dto)
}

func (h *PaymentHandler) Complete(c *gin.Context) {
	h.mutatePayment(c, h.payments.Complete)
}

func (h *PaymentHandler) Fail(c *gin.Context) {
	h.mutatePayment(c, h.payments.Fail)
}

func (h *PaymentHandler) Refund(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid payment id")
	if !ok {
		return
	}
	refund, err := h.payments.Refund(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toRefundDTO(refund))
}

type paymentAction func(ctx context.Context, intentID, actor uuid.UUID) (*entity.Intent, error)

func (h *PaymentHandler) mutatePayment(c *gin.Context, action paymentAction) {
	uid, id, ok := userAndUUID(c, "invalid payment id")
	if !ok {
		return
	}
	intent, err := action(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toPaymentDTO(intent))
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

func toInvoiceDTO(inv *bookingentity.Invoice) invoiceDTO {
	return invoiceDTO{
		ID: inv.ID.String(), PublicID: inv.PublicID, InvoiceNo: inv.InvoiceNo,
		BookingID: inv.BookingID.String(), CustomerID: inv.CustomerID.String(),
		Status: string(inv.Status), Currency: inv.Currency, Subtotal: inv.Subtotal,
		DiscountAmount: inv.DiscountAmount, TaxAmount: inv.TaxAmount, TotalAmount: inv.TotalAmount,
		RefundedAmount: inv.RefundedAmount, IssuedAt: inv.IssuedAt.Format(time.RFC3339),
		DueAt: formatOptional(inv.DueAt), PaidAt: formatOptional(inv.PaidAt),
		CreatedAt: inv.CreatedAt.Format(time.RFC3339),
	}
}

func toPaymentDTO(intent *entity.Intent) paymentDTO {
	return paymentDTO{
		ID: intent.ID.String(), InvoiceID: intent.InvoiceID.String(), CustomerID: intent.CustomerID.String(),
		Amount: intent.Amount, Currency: intent.Currency, Status: string(intent.Status),
		Method: string(intent.MethodType), ExpiresAt: formatOptional(intent.ExpiresAt),
		SucceededAt: formatOptional(intent.SucceededAt), CreatedAt: intent.CreatedAt.Format(time.RFC3339),
	}
}

func toRefundDTO(refund *entity.Refund) refundDTO {
	return refundDTO{
		ID: refund.ID.String(), PaymentID: refund.PaymentIntentID.String(),
		InvoiceID: refund.InvoiceID.String(), Amount: refund.Amount, Currency: refund.Currency,
		Status: string(refund.Status), CreatedAt: refund.CreatedAt.Format(time.RFC3339),
	}
}

func formatOptional(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := t.Format(time.RFC3339)
	return &s
}
