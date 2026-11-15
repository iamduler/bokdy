package service

import (
	"context"
	"testing"

	"bokdy/internal/organization/entity"
	"bokdy/internal/organization/repository"

	"github.com/google/uuid"
)

type stubBranchRepo struct {
	repository.BranchRepository
	list  func(context.Context, repository.AdminBranchFilter) ([]repository.AdminBranch, int, error)
	stats func(context.Context, string, *uuid.UUID, *uuid.UUID, *uuid.UUID) (repository.AdminBranchStats, error)
}

func (s stubBranchRepo) ListAdmin(ctx context.Context, filter repository.AdminBranchFilter) ([]repository.AdminBranch, int, error) {
	return s.list(ctx, filter)
}

func (s stubBranchRepo) DirectoryStats(ctx context.Context, q string, provinceID, organizationID, sportID *uuid.UUID) (repository.AdminBranchStats, error) {
	return s.stats(ctx, q, provinceID, organizationID, sportID)
}

func TestBranchAdminListForwardsFilter(t *testing.T) {
	status := entity.BranchActive
	province := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	var got repository.AdminBranchFilter
	svc := &BranchService{branches: stubBranchRepo{
		list: func(_ context.Context, filter repository.AdminBranchFilter) ([]repository.AdminBranch, int, error) {
			got = filter
			return []repository.AdminBranch{{Code: "HN01"}}, 3, nil
		},
	}}
	page, err := svc.AdminList(context.Background(), AdminBranchQuery{
		Q: "  tao  ", Status: &status, ProvinceID: &province,
		LimitRaw: "20", OffsetRaw: "40", Sort: "name", Order: "asc",
	})
	if err != nil {
		t.Fatal(err)
	}
	if page.Total != 3 || len(page.Items) != 1 || page.Items[0].Code != "HN01" {
		t.Fatalf("page = %#v", page)
	}
	if got.Q != "tao" || got.Status == nil || *got.Status != status || got.ProvinceID == nil || *got.ProvinceID != province {
		t.Fatalf("filter = %#v", got)
	}
	if got.Limit != 20 || got.Offset != 40 || got.Sort != "name" || got.Desc {
		t.Fatalf("page filter = %#v", got)
	}
}

func TestBranchAdminListRejectsSort(t *testing.T) {
	svc := &BranchService{branches: stubBranchRepo{}}
	_, err := svc.AdminList(context.Background(), AdminBranchQuery{Sort: "phone"})
	if err == nil {
		t.Fatal("expected invalid sort")
	}
}

func TestBranchDirectoryStatsTrimsQuery(t *testing.T) {
	var gotQ string
	svc := &BranchService{branches: stubBranchRepo{
		stats: func(_ context.Context, q string, _, _, _ *uuid.UUID) (repository.AdminBranchStats, error) {
			gotQ = q
			return repository.AdminBranchStats{Total: 4, Active: 2, CourtTotal: 9}, nil
		},
	}}
	stats, err := svc.AdminDirectoryStats(context.Background(), "  q  ", nil, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if gotQ != "q" || stats.Total != 4 || stats.CourtTotal != 9 {
		t.Fatalf("q=%q stats=%#v", gotQ, stats)
	}
}
