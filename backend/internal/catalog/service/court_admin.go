package service

import (
	"context"
	"strings"

	"bokdy/internal/catalog/entity"
	"bokdy/internal/catalog/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/listpage"

	"github.com/google/uuid"
)

var courtSorts = []string{"created_at", "name", "status"}

type AdminCourtQuery struct {
	Q              string
	Status         *entity.CourtStatus
	SportID        *uuid.UUID
	Environment    *entity.CourtEnvironment
	OrganizationID *uuid.UUID
	BranchID       *uuid.UUID
	Surface        *entity.CourtSurface
	LimitRaw       string
	OffsetRaw      string
	Sort           string
	Order          string
}

func (s *CatalogService) AdminListCourts(ctx context.Context, query AdminCourtQuery) (listpage.Page[repository.AdminCourt], error) {
	page, err := listpage.Parse(query.LimitRaw, query.OffsetRaw, query.Sort, query.Order, courtSorts, "created_at")
	if err != nil {
		return listpage.Page[repository.AdminCourt]{}, err
	}
	rows, total, err := s.courts.ListAdmin(ctx, repository.AdminCourtFilter{
		Q: strings.TrimSpace(query.Q), Status: query.Status, SportID: query.SportID, Environment: query.Environment,
		OrganizationID: query.OrganizationID, BranchID: query.BranchID, Surface: query.Surface,
		Limit: page.Limit, Offset: page.Offset, Sort: page.Sort, Desc: page.Desc,
	})
	if err != nil {
		return listpage.Page[repository.AdminCourt]{}, apperr.Wrap(err, apperr.CodeInternal, "list courts")
	}
	return listpage.New(rows, total, page.Limit, page.Offset), nil
}

func (s *CatalogService) AdminCourtDirectoryStats(ctx context.Context, query AdminCourtQuery) (repository.AdminCourtStats, error) {
	stats, err := s.courts.DirectoryStats(ctx, strings.TrimSpace(query.Q), query.SportID, query.Environment, query.OrganizationID, query.BranchID, query.Surface)
	if err != nil {
		return repository.AdminCourtStats{}, apperr.Wrap(err, apperr.CodeInternal, "court directory stats")
	}
	return stats, nil
}
