package service

import (
	"context"
	"testing"

	"bokdy/internal/catalog/entity"
	"bokdy/internal/catalog/repository"

	"github.com/google/uuid"
)

type stubCourtRepo struct {
	repository.CourtRepository
	list  func(context.Context, repository.AdminCourtFilter) ([]repository.AdminCourt, int, error)
	stats func(context.Context, string, *uuid.UUID, *entity.CourtEnvironment, *uuid.UUID, *uuid.UUID, *entity.CourtSurface) (repository.AdminCourtStats, error)
}

func (s stubCourtRepo) ListAdmin(ctx context.Context, filter repository.AdminCourtFilter) ([]repository.AdminCourt, int, error) {
	return s.list(ctx, filter)
}

func (s stubCourtRepo) DirectoryStats(ctx context.Context, q string, sportID *uuid.UUID, environment *entity.CourtEnvironment, organizationID, branchID *uuid.UUID, surface *entity.CourtSurface) (repository.AdminCourtStats, error) {
	return s.stats(ctx, q, sportID, environment, organizationID, branchID, surface)
}

func TestCourtAdminListForwardsFilter(t *testing.T) {
	status := entity.CourtActive
	env := entity.CourtEnvironmentIndoor
	sport := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	var got repository.AdminCourtFilter
	svc := &CatalogService{courts: stubCourtRepo{
		list: func(_ context.Context, filter repository.AdminCourtFilter) ([]repository.AdminCourt, int, error) {
			got = filter
			return []repository.AdminCourt{{Code: "C1"}}, 1, nil
		},
	}}
	page, err := svc.AdminListCourts(context.Background(), AdminCourtQuery{
		Q: "  a  ", Status: &status, SportID: &sport, Environment: &env,
		LimitRaw: "10", Sort: "status", Order: "desc",
	})
	if err != nil {
		t.Fatal(err)
	}
	if page.Total != 1 || page.Items[0].Code != "C1" {
		t.Fatalf("page = %#v", page)
	}
	if got.Q != "a" || got.Environment == nil || *got.Environment != env || got.SportID == nil || *got.SportID != sport {
		t.Fatalf("filter = %#v", got)
	}
	if got.Sort != "status" || !got.Desc || got.Limit != 10 {
		t.Fatalf("page filter = %#v", got)
	}
}

func TestCourtAdminListRejectsSort(t *testing.T) {
	svc := &CatalogService{courts: stubCourtRepo{}}
	if _, err := svc.AdminListCourts(context.Background(), AdminCourtQuery{Sort: "surface"}); err == nil {
		t.Fatal("expected invalid sort")
	}
}
