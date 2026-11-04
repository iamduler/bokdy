package handler

import (
	"strings"
	"time"

	"bokdy/internal/booking/entity"
	"bokdy/internal/booking/repository"
	"bokdy/internal/booking/service"
	paymententity "bokdy/internal/payment/entity"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/listpage"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func (h *BookingHandler) RegisterAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/organizations/:id/bookings", h.AdminList)
	admin.GET("/organizations/:id/bookings/:bookingId", h.AdminGet)
}

func (h *BookingHandler) AdminList(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid organization id")
		return
	}
	query, ok := adminBookingQuery(c)
	if !ok {
		return
	}
	page, err := h.bookings.AdminList(c.Request.Context(), orgID, query)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	writeAdminBookingPage(c, page)
}

func (h *BookingHandler) AdminGet(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid organization id")
		return
	}
	bookingID, err := uuid.Parse(c.Param("bookingId"))
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid booking id")
		return
	}
	detail, err := h.bookings.AdminGet(c.Request.Context(), orgID, bookingID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	locale := i18n.FromContext(c.Request.Context())
	httpx.OK(c, adminBookingDetailDTO{
		Booking: toAdminBookingDTO(locale, &detail.Booking),
		Invoice: adminInvoiceDTO(detail.Invoice),
		Payment: adminPaymentDTO(detail.Intent),
	})
}

// AdminListForUser is the player-scoped read. The caller has already confirmed the user is a player.
func (h *BookingHandler) AdminListForUser(c *gin.Context, userID uuid.UUID) {
	query, ok := adminBookingQuery(c)
	if !ok {
		return
	}
	page, err := h.bookings.AdminListByUser(c.Request.Context(), userID, query)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	writeAdminBookingPage(c, page)
}

func adminBookingQuery(c *gin.Context) (service.AdminBookingQuery, bool) {
	query := service.AdminBookingQuery{
		Q:         c.Query("q"),
		LimitRaw:  c.Query("limit"),
		OffsetRaw: c.Query("offset"),
		Sort:      c.Query("sort"),
		Order:     c.Query("order"),
	}
	if raw := strings.TrimSpace(c.Query("status")); raw != "" {
		status, ok := entity.ParseStatus(raw)
		if !ok {
			httpx.Fail(c, apperr.CodeValidation, "invalid status")
			return query, false
		}
		query.Status = &status
	}
	from, ok := parseAdminTime(c, "from")
	if !ok {
		return query, false
	}
	to, ok := parseAdminTime(c, "to")
	if !ok {
		return query, false
	}
	query.From = from
	query.To = to
	return query, true
}

func parseAdminTime(c *gin.Context, field string) (*time.Time, bool) {
	raw := strings.TrimSpace(c.Query(field))
	if raw == "" {
		return nil, true
	}
	parsed, err := time.Parse(time.RFC3339, raw)
	if err != nil {
		httpx.Fail(c, apperr.CodeValidation, "invalid "+field)
		return nil, false
	}
	return &parsed, true
}

type adminBookingDTO struct {
	bookingDTO
	OrganizationID   string  `json:"organization_id"`
	OrganizationName string  `json:"organization_name"`
	CustomerName     *string `json:"customer_name"`
	CustomerEmail    *string `json:"customer_email"`
	BranchName       *string `json:"branch_name"`
	CourtName        *string `json:"court_name"`
}

type adminBookingDetailDTO struct {
	Booking adminBookingDTO `json:"booking"`
	Invoice *invoiceDTO     `json:"invoice"`
	Payment *adminIntentDTO `json:"payment"`
}

type adminIntentDTO struct {
	ID        string  `json:"id"`
	Method    string  `json:"method"`
	Status    string  `json:"status"`
	Amount    float64 `json:"amount"`
	Currency  string  `json:"currency"`
	CreatedAt string  `json:"created_at"`
}

func writeAdminBookingPage(c *gin.Context, page listpage.Page[repository.AdminBooking]) {
	locale := i18n.FromContext(c.Request.Context())
	items := make([]adminBookingDTO, 0, len(page.Items))
	for i := range page.Items {
		items = append(items, toAdminBookingDTO(locale, &page.Items[i]))
	}
	httpx.OK(c, listpage.New(items, page.Total, page.Limit, page.Offset))
}

func toAdminBookingDTO(locale string, row *repository.AdminBooking) adminBookingDTO {
	return adminBookingDTO{
		bookingDTO:       toBookingDTO(&row.Booking),
		OrganizationID:   row.OrganizationID.String(),
		OrganizationName: i18n.DisplayName(locale, row.OrganizationNameEn, row.OrganizationNameVi),
		CustomerName:     optionalText(row.CustomerName),
		CustomerEmail:    optionalText(row.CustomerEmail),
		BranchName:       optionalText(i18n.DisplayName(locale, row.BranchNameEn, row.BranchNameVi)),
		CourtName:        optionalText(i18n.DisplayName(locale, row.CourtNameEn, row.CourtNameVi)),
	}
}

func adminInvoiceDTO(inv *entity.Invoice) *invoiceDTO {
	if inv == nil {
		return nil
	}
	dto := toInvoiceDTO(inv)
	return &dto
}

func adminPaymentDTO(intent *paymententity.Intent) *adminIntentDTO {
	if intent == nil {
		return nil
	}
	return &adminIntentDTO{
		ID: intent.ID.String(), Method: string(intent.MethodType), Status: string(intent.Status),
		Amount: intent.Amount, Currency: intent.Currency, CreatedAt: intent.CreatedAt.Format(time.RFC3339),
	}
}

func optionalText(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}
