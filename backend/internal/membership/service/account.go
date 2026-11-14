package service

import (
	"context"

	"bokdy/db/generated/sqlc"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/id"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Service struct {
	q *dbsqlc.Queries
}

func New(q *dbsqlc.Queries) *Service { return &Service{q: q} }

func (s *Service) AwardBooking(ctx context.Context, tx pgx.Tx, bookingID uuid.UUID) error {
	if s == nil || s.q == nil {
		return nil
	}
	return s.q.WithTx(tx).AwardBookingPoints(ctx, dbsqlc.AwardBookingPointsParams{
		BookingID: &bookingID, ID: id.MustNewUUID(),
	})
}

type OpenAccountInput struct {
	OrganizationID uuid.UUID
	UserID         uuid.UUID
	TierName       string
	Points         int32
	ValidUntil     string
}

func (s *Service) OpenAccount(ctx context.Context, in OpenAccountInput) (uuid.UUID, error) {
	if in.TierName == "" {
		return uuid.Nil, apperr.Validation("tier name is required")
	}
	accountID := id.MustNewUUID()
	err := s.q.CreateMembershipAccount(ctx, dbsqlc.CreateMembershipAccountParams{
		ID: accountID, PublicID: id.MustNewPublicID(), OrganizationID: in.OrganizationID, UserID: in.UserID,
		TierName: in.TierName, Column6: dbsqlc.MembershipAccountStatusActive, PointsBalance: in.Points, Column8: in.ValidUntil,
	})
	if err != nil {
		return uuid.Nil, apperr.Wrap(err, apperr.CodeInternal, "open membership")
	}
	return accountID, nil
}

func (s *Service) ListMine(ctx context.Context, userID uuid.UUID) ([]dbsqlc.ListMembershipAccountsByUserRow, error) {
	return s.q.ListMembershipAccountsByUser(ctx, userID)
}

func (s *Service) Ledger(ctx context.Context, accountID uuid.UUID) ([]dbsqlc.MembershipPointLedger, error) {
	return s.q.ListPointLedger(ctx, accountID)
}

func (s *Service) Vouchers(ctx context.Context, accountID uuid.UUID) ([]dbsqlc.MembershipVoucher, error) {
	return s.q.ListVouchers(ctx, accountID)
}

func (s *Service) IssueVoucher(ctx context.Context, accountID uuid.UUID, code, title string) error {
	if code == "" || title == "" {
		return apperr.Validation("voucher code and title are required")
	}
	return s.q.CreateVoucher(ctx, dbsqlc.CreateVoucherParams{
		ID: id.MustNewUUID(), PublicID: id.MustNewPublicID(), AccountID: accountID, Code: code, Title: title,
	})
}
