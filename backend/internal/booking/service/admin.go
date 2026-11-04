package service

import (
	"context"
	"strings"
	"time"

	"bokdy/internal/booking/entity"
	bookingerrors "bokdy/internal/booking/errors"
	"bokdy/internal/booking/repository"
	orgentity "bokdy/internal/organization/entity"
	orgerrors "bokdy/internal/organization/errors"
	paymententity "bokdy/internal/payment/entity"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/listpage"

	"github.com/google/uuid"
)

var adminBookingSorts = []string{"starts_at", "status", "created_at", "total_amount"}

type AdminBookingQuery struct {
	Q         string
	Status    *entity.Status
	From      *time.Time
	To        *time.Time
	LimitRaw  string
	OffsetRaw string
	Sort      string
	Order     string
}

type AdminBookingDetail struct {
	Booking repository.AdminBooking
	Invoice *entity.Invoice
	Intent  *paymententity.Intent
}

func (s *BookingService) AdminList(ctx context.Context, orgID uuid.UUID, query AdminBookingQuery) (listpage.Page[repository.AdminBooking], error) {
	org, err := s.adminOrg(ctx, orgID)
	if err != nil {
		return listpage.Page[repository.AdminBooking]{}, err
	}
	page, filter, err := s.adminFilter(query)
	if err != nil {
		return listpage.Page[repository.AdminBooking]{}, err
	}
	filter.TenantID = &org.TenantID
	return s.adminPage(ctx, filter, page)
}

func (s *BookingService) AdminListByUser(ctx context.Context, userID uuid.UUID, query AdminBookingQuery) (listpage.Page[repository.AdminBooking], error) {
	page, filter, err := s.adminFilter(query)
	if err != nil {
		return listpage.Page[repository.AdminBooking]{}, err
	}
	filter.UserID = &userID
	return s.adminPage(ctx, filter, page)
}

func (s *BookingService) AdminGet(ctx context.Context, orgID, bookingID uuid.UUID) (*AdminBookingDetail, error) {
	org, err := s.adminOrg(ctx, orgID)
	if err != nil {
		return nil, err
	}
	rows, _, err := s.repo.ListAdmin(ctx, repository.AdminBookingFilter{
		BookingID: &bookingID, TenantID: &org.TenantID, Limit: 1, Sort: "starts_at", Desc: true,
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get booking")
	}
	if len(rows) == 0 {
		return nil, bookingerrors.ErrBookingNotFound
	}
	row := rows[0]
	invoice, err := s.invoices.FindByBooking(ctx, row.Booking.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get invoice")
	}
	var intent *paymententity.Intent
	if invoice != nil {
		intent, err = s.intents.FindLatestByInvoice(ctx, invoice.ID)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "get payment intent")
		}
	}
	return &AdminBookingDetail{Booking: row, Invoice: invoice, Intent: intent}, nil
}

func (s *BookingService) adminOrg(ctx context.Context, orgID uuid.UUID) (*orgentity.Organization, error) {
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
	}
	if org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	return org, nil
}

func (s *BookingService) adminFilter(query AdminBookingQuery) (listpage.Query, repository.AdminBookingFilter, error) {
	page, err := listpage.Parse(query.LimitRaw, query.OffsetRaw, query.Sort, query.Order, adminBookingSorts, "starts_at")
	if err != nil {
		return listpage.Query{}, repository.AdminBookingFilter{}, err
	}
	if query.From != nil && query.To != nil && !query.To.After(*query.From) {
		return listpage.Query{}, repository.AdminBookingFilter{}, apperr.New(apperr.CodeValidation, "to must be after from")
	}
	return page, repository.AdminBookingFilter{
		Status: query.Status, From: query.From, To: query.To,
		Q: strings.TrimSpace(query.Q), Limit: page.Limit, Offset: page.Offset,
		Sort: page.Sort, Desc: page.Desc,
	}, nil
}

func (s *BookingService) adminPage(ctx context.Context, filter repository.AdminBookingFilter, page listpage.Query) (listpage.Page[repository.AdminBooking], error) {
	rows, total, err := s.repo.ListAdmin(ctx, filter)
	if err != nil {
		return listpage.Page[repository.AdminBooking]{}, apperr.Wrap(err, apperr.CodeInternal, "list bookings")
	}
	return listpage.New(rows, total, page.Limit, page.Offset), nil
}
