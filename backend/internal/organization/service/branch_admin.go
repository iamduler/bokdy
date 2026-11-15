package service

import (
	"context"
	"strings"

	"bokdy/internal/organization/entity"
	"bokdy/internal/organization/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/listpage"

	"github.com/google/uuid"
)

var branchSorts = []string{"created_at", "name", "status", "court_count"}

type AdminBranchQuery struct {
	Q              string
	Status         *entity.BranchStatus
	ProvinceID     *uuid.UUID
	OrganizationID *uuid.UUID
	SportID        *uuid.UUID
	LimitRaw       string
	OffsetRaw      string
	Sort           string
	Order          string
}

func (s *BranchService) AdminList(ctx context.Context, query AdminBranchQuery) (listpage.Page[repository.AdminBranch], error) {
	page, err := listpage.Parse(query.LimitRaw, query.OffsetRaw, query.Sort, query.Order, branchSorts, "created_at")
	if err != nil {
		return listpage.Page[repository.AdminBranch]{}, err
	}
	rows, total, err := s.branches.ListAdmin(ctx, repository.AdminBranchFilter{
		Q: strings.TrimSpace(query.Q), Status: query.Status, ProvinceID: query.ProvinceID,
		OrganizationID: query.OrganizationID, SportID: query.SportID,
		Limit: page.Limit, Offset: page.Offset, Sort: page.Sort, Desc: page.Desc,
	})
	if err != nil {
		return listpage.Page[repository.AdminBranch]{}, apperr.Wrap(err, apperr.CodeInternal, "list branches")
	}
	return listpage.New(rows, total, page.Limit, page.Offset), nil
}

func (s *BranchService) AdminDirectoryStats(ctx context.Context, q string, provinceID, organizationID, sportID *uuid.UUID) (repository.AdminBranchStats, error) {
	stats, err := s.branches.DirectoryStats(ctx, strings.TrimSpace(q), provinceID, organizationID, sportID)
	if err != nil {
		return repository.AdminBranchStats{}, apperr.Wrap(err, apperr.CodeInternal, "branch directory stats")
	}
	return stats, nil
}
