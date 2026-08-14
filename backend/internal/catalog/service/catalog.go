package service

import (
	"context"
	"strings"
	"unicode"

	catalogerrors "bokdy/internal/catalog/errors"
	"bokdy/internal/catalog/repository"
	orgentity "bokdy/internal/organization/entity"
	orgrepository "bokdy/internal/organization/repository"
	orgservice "bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/requestctx"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	defaultListLimit = 50
	minSlotMinutes   = 15
	maxSlotMinutes   = 180
	slotStepMinutes  = 15
)

type CatalogService struct {
	pool     *pgxpool.Pool
	types    repository.CourtTypeRepository
	courts   repository.CourtRepository
	orgs     orgrepository.OrganizationRepository
	branches orgrepository.BranchRepository
	orgSvc   *orgservice.OrganizationService
	outbox   events.Enqueuer
}

func NewCatalogService(
	pool *pgxpool.Pool,
	types repository.CourtTypeRepository,
	courts repository.CourtRepository,
	orgs orgrepository.OrganizationRepository,
	branches orgrepository.BranchRepository,
	orgSvc *orgservice.OrganizationService,
	outbox events.Enqueuer,
) *CatalogService {
	return &CatalogService{
		pool: pool, types: types, courts: courts, orgs: orgs, branches: branches, orgSvc: orgSvc, outbox: outbox,
	}
}

func (s *CatalogService) requireOrgHeader(ctx context.Context) (uuid.UUID, error) {
	orgID, ok := requestctx.OrganizationID(ctx)
	if !ok {
		return uuid.Nil, catalogerrors.ErrOrgHeaderRequired
	}
	return orgID, nil
}

func (s *CatalogService) resolveTenant(ctx context.Context, orgID uuid.UUID) (uuid.UUID, error) {
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil {
		return uuid.Nil, apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
	}
	if org == nil {
		return uuid.Nil, apperr.New(apperr.CodeNotFound, "organization not found")
	}
	return org.TenantID, nil
}

func (s *CatalogService) requireOwnerTenant(ctx context.Context, actor uuid.UUID) (orgID, tenantID uuid.UUID, err error) {
	orgID, err = s.requireOrgHeader(ctx)
	if err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	if err := s.orgSvc.RequireOwner(ctx, orgID, actor); err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	tenantID, err = s.resolveTenant(ctx, orgID)
	if err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	return orgID, tenantID, nil
}

func (s *CatalogService) requireStaffTenant(ctx context.Context, actor uuid.UUID) (orgID, tenantID uuid.UUID, err error) {
	orgID, err = s.requireOrgHeader(ctx)
	if err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	if err := s.orgSvc.RequireMembership(ctx, orgID, actor); err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	tenantID, err = s.resolveTenant(ctx, orgID)
	if err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	return orgID, tenantID, nil
}

func validSlotDuration(minutes int) bool {
	return minutes >= minSlotMinutes && minutes <= maxSlotMinutes && minutes%slotStepMinutes == 0
}

func requireName(nameEn, nameVi string) error {
	if strings.TrimSpace(nameEn) == "" && strings.TrimSpace(nameVi) == "" {
		return catalogerrors.ErrNameRequired
	}
	return nil
}

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	lastDash := false
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(unicode.ToLower(r))
			lastDash = false
			continue
		}
		if !lastDash && b.Len() > 0 {
			b.WriteByte('-')
			lastDash = true
		}
	}
	out := strings.Trim(b.String(), "-")
	if out == "" {
		out = "court-" + id.MustNewPublicID()[:8]
	}
	if len(out) > 100 {
		out = out[:100]
	}
	return out
}

func displayBase(nameEn, nameVi string) string {
	return i18n.FirstNonEmpty(nameVi, nameEn)
}

func (s *CatalogService) loadBranch(ctx context.Context, orgID, branchID uuid.UUID) (*orgentity.Branch, error) {
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil || branch.Status == orgentity.LocationArchived {
		return nil, catalogerrors.ErrBranchNotFound
	}
	return branch, nil
}
