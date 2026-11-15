package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"bokdy/internal/booking/repository"
	"bokdy/internal/platform/apperr"
)

type stubBookingRepo struct {
	repository.BookingRepository
	list  func(context.Context, repository.AdminBookingFilter) ([]repository.AdminBooking, int, error)
	stats func(context.Context, repository.AdminBookingStatsFilter) (repository.AdminBookingStats, error)
}

func (s stubBookingRepo) ListAdmin(ctx context.Context, filter repository.AdminBookingFilter) ([]repository.AdminBooking, int, error) {
	return s.list(ctx, filter)
}

func (s stubBookingRepo) DirectoryStats(ctx context.Context, filter repository.AdminBookingStatsFilter) (repository.AdminBookingStats, error) {
	return s.stats(ctx, filter)
}

func TestAdminListAllLeavesTenantUnset(t *testing.T) {
	var got repository.AdminBookingFilter
	svc := &BookingService{repo: stubBookingRepo{
		list: func(_ context.Context, filter repository.AdminBookingFilter) ([]repository.AdminBooking, int, error) {
			got = filter
			return []repository.AdminBooking{{CustomerName: "An"}}, 8, nil
		},
	}}
	page, err := svc.AdminListAll(context.Background(), AdminBookingQuery{Q: " bk ", LimitRaw: "20"})
	if err != nil {
		t.Fatal(err)
	}
	if page.Total != 8 || got.TenantID != nil || got.UserID != nil || got.Q != "bk" || got.Limit != 20 {
		t.Fatalf("page=%#v filter=%#v", page, got)
	}
}

func TestAdminDirectoryStatsIgnoresStatusAndRejectsRange(t *testing.T) {
	from := time.Date(2026, 3, 2, 0, 0, 0, 0, time.UTC)
	to := from.Add(-time.Hour)
	svc := &BookingService{repo: stubBookingRepo{}}
	_, err := svc.AdminDirectoryStats(context.Background(), AdminBookingQuery{From: &from, To: &to})
	var app *apperr.Error
	if !errors.As(err, &app) || app.Code != apperr.CodeValidation {
		t.Fatalf("err = %v", err)
	}
}

func TestAdminDirectoryStatsForwardsSearchAndRange(t *testing.T) {
	from := time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC)
	to := from.Add(24 * time.Hour)
	var got repository.AdminBookingStatsFilter
	svc := &BookingService{repo: stubBookingRepo{
		stats: func(_ context.Context, filter repository.AdminBookingStatsFilter) (repository.AdminBookingStats, error) {
			got = filter
			return repository.AdminBookingStats{Total: 5, Pending: 1, Confirmed: 2, Completed: 2}, nil
		},
	}}
	stats, err := svc.AdminDirectoryStats(context.Background(), AdminBookingQuery{Q: "  an ", From: &from, To: &to})
	if err != nil {
		t.Fatal(err)
	}
	if got.Q != "an" || got.From == nil || !got.From.Equal(from) || got.To == nil || !got.To.Equal(to) {
		t.Fatalf("filter = %#v", got)
	}
	if stats.Total != 5 || stats.Confirmed != 2 {
		t.Fatalf("stats = %#v", stats)
	}
}
