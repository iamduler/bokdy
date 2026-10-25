package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	catalogrepo "bokdy/internal/catalog/repository"
	"bokdy/internal/organization/entity"
	orgerrors "bokdy/internal/organization/errors"
	"bokdy/internal/organization/repository"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/entitycode"
	"bokdy/internal/platform/events"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/persistence"
	"bokdy/internal/platform/requestctx"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BranchService struct {
	pool     *pgxpool.Pool
	orgs     repository.OrganizationRepository
	branches repository.BranchRepository
	sports   catalogrepo.SportRepository
	orgSvc   *OrganizationService
	outbox   events.Enqueuer
}

func NewBranchService(
	pool *pgxpool.Pool,
	orgs repository.OrganizationRepository,
	branches repository.BranchRepository,
	sports catalogrepo.SportRepository,
	orgSvc *OrganizationService,
	outbox events.Enqueuer,
) *BranchService {
	return &BranchService{pool: pool, orgs: orgs, branches: branches, sports: sports, orgSvc: orgSvc, outbox: outbox}
}

type BranchAddressInput struct {
	DivisionScheme   entity.AdminDivisionScheme
	CountryID        *uuid.UUID
	ProvinceFormerID *uuid.UUID
	DistrictFormerID *uuid.UUID
	WardFormerID     *uuid.UUID
	ProvinceID       *uuid.UUID
	WardID           *uuid.UUID
	AddressLine1     string
	AddressLine2     string
	Latitude         *float64
	Longitude        *float64
}

type CreateBranchInput struct {
	NameEn        string
	NameVi        string
	Code          string
	Slug          string
	Phone         string
	Email         string
	Timezone      string
	Website       string
	FacebookURL   string
	GoogleMapsURL string
	FoundedYear   *int
	Addresses     []BranchAddressInput
	SportIDs      []uuid.UUID
}

type UpdateBranchInput struct {
	NameEn        *string
	NameVi        *string
	Code          *string
	Slug          *string
	Phone         *string
	Email         *string
	Timezone      *string
	Website       *string
	FacebookURL   *string
	GoogleMapsURL *string
	// FoundedYear sets the year when non-nil. When Website is also set and FoundedYear is nil, clears the year
	// (admin form always sends the profile-link block together).
	FoundedYear   *int
	Addresses     *[]BranchAddressInput
	SportIDs      *[]uuid.UUID
}

func (s *BranchService) requireReader(ctx context.Context, orgID, actor uuid.UUID) error {
	if requestctx.IsSystemAdmin(ctx) {
		return nil
	}
	return s.orgSvc.RequireMembership(ctx, orgID, actor)
}

func (s *BranchService) requireOrgHeader(ctx context.Context) (uuid.UUID, error) {
	orgID, ok := requestctx.OrganizationID(ctx)
	if !ok {
		return uuid.Nil, orgerrors.ErrOrgHeaderRequired
	}
	return orgID, nil
}

func (s *BranchService) Create(ctx context.Context, actor uuid.UUID, in CreateBranchInput) (*entity.Branch, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.orgSvc.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return nil, err
	}
	nameEn := strings.TrimSpace(in.NameEn)
	nameVi := strings.TrimSpace(in.NameVi)
	if nameEn == "" && nameVi == "" {
		return nil, apperr.New(apperr.CodeValidation, "name is required")
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	bu, err := s.orgs.FindDefaultBusinessUnit(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup business unit")
	}
	if bu == nil {
		return nil, apperr.New(apperr.CodeInternal, "default business unit missing")
	}
	// Server-generated BRN00001… — ignore client-supplied code.
	maxSeq, err := s.branches.MaxCodeSeq(ctx, bu.ID, entitycode.Branch)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "next branch code")
	}
	code := entitycode.Format(entitycode.Branch, maxSeq+1)
	taken, err := s.branches.CodeExists(ctx, bu.ID, code, nil)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check branch code")
	}
	if taken {
		return nil, orgerrors.ErrBranchCodeTaken
	}
	nameTaken, err := s.branches.NameExists(ctx, orgID, nameEn, nameVi, nil)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check branch name")
	}
	if nameTaken {
		return nil, orgerrors.ErrBranchNameTaken
	}
	rawSlug := strings.TrimSpace(in.Slug)
	slug, err := s.resolveBranchSlug(ctx, orgID, rawSlug, i18n.FirstNonEmpty(nameVi, nameEn), nil, rawSlug == "")
	if err != nil {
		return nil, err
	}
	sportIDs, err := s.validateSportIDs(ctx, in.SportIDs)
	if err != nil {
		return nil, err
	}
	foundedYear, err := validateFoundedYear(in.FoundedYear)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	branch := &entity.Branch{
		ID: id.MustNewUUID(), PublicID: id.MustNewPublicID(), BusinessUnitID: bu.ID, OrganizationID: orgID,
		Code: code, Slug: slug, NameEn: nameEn, NameVi: nameVi, Phone: strings.TrimSpace(in.Phone), Email: strings.TrimSpace(in.Email),
		Website: strings.TrimSpace(in.Website), FacebookURL: strings.TrimSpace(in.FacebookURL),
		GoogleMapsURL: strings.TrimSpace(in.GoogleMapsURL), FoundedYear: foundedYear,
		Timezone: entity.DefaultBranchTimezone, Status: entity.LocationInactive, CreatedAt: now, UpdatedAt: now,
		SportIDs: sportIDs,
	}
	addrs, err := requireBranchAddresses(in.Addresses)
	if err != nil {
		return nil, err
	}
	addrs, err = expandBranchFormerFromCurrent(ctx, s.orgs, addrs)
	if err != nil {
		return nil, err
	}
	branch.Addresses = addrs
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.branches.Create(ctx, tx, branch); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "BranchCreated", AggregateType: "Branch", AggregateID: branch.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Branch", EntityID: branch.ID,
			Payload: map[string]any{
				"organization_id": orgID.String(), "code": code, "slug": slug, "name_en": nameEn, "name_vi": nameVi,
			},
			OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create branch")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return branch, nil
}

func (s *BranchService) List(ctx context.Context, actor uuid.UUID) ([]entity.Branch, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.requireReader(ctx, orgID, actor); err != nil {
		return nil, err
	}
	branches, err := s.branches.ListByOrg(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "list branches")
	}
	if err := s.attachCourtCounts(ctx, branches); err != nil {
		return nil, err
	}
	return branches, nil
}

func (s *BranchService) Get(ctx context.Context, branchID, actor uuid.UUID) (*entity.Branch, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.requireReader(ctx, orgID, actor); err != nil {
		return nil, err
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return nil, orgerrors.ErrBranchNotFound
	}
	counts, err := s.branches.CountCourtsByLocations(ctx, []uuid.UUID{branch.ID})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "count branch courts")
	}
	branch.CourtCount = counts[branch.ID]
	return branch, nil
}

func (s *BranchService) attachCourtCounts(ctx context.Context, branches []entity.Branch) error {
	if len(branches) == 0 {
		return nil
	}
	ids := make([]uuid.UUID, 0, len(branches))
	for i := range branches {
		ids = append(ids, branches[i].ID)
	}
	counts, err := s.branches.CountCourtsByLocations(ctx, ids)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "count branch courts")
	}
	for i := range branches {
		branches[i].CourtCount = counts[branches[i].ID]
	}
	return nil
}

func (s *BranchService) Update(ctx context.Context, branchID, actor uuid.UUID, in UpdateBranchInput) (*entity.Branch, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.orgSvc.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return nil, err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return nil, orgerrors.ErrBranchNotFound
	}
	if branch.Status == entity.LocationArchived {
		return nil, orgerrors.ErrInvalidBranchStatus
	}
	if in.NameEn != nil {
		branch.NameEn = strings.TrimSpace(*in.NameEn)
	}
	if in.NameVi != nil {
		branch.NameVi = strings.TrimSpace(*in.NameVi)
	}
	if branch.NameEn == "" && branch.NameVi == "" {
		return nil, apperr.New(apperr.CodeValidation, "name is required")
	}
	// Branch code and timezone are immutable via API update.
	nameTaken, err := s.branches.NameExists(ctx, orgID, branch.NameEn, branch.NameVi, &branch.ID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check branch name")
	}
	if nameTaken {
		return nil, orgerrors.ErrBranchNameTaken
	}
	if in.Slug != nil {
		rawSlug := strings.TrimSpace(*in.Slug)
		slug, err := s.resolveBranchSlug(ctx, orgID, rawSlug, i18n.FirstNonEmpty(branch.NameVi, branch.NameEn), &branch.ID, rawSlug == "")
		if err != nil {
			return nil, err
		}
		branch.Slug = slug
	}
	if in.Phone != nil {
		branch.Phone = strings.TrimSpace(*in.Phone)
	}
	if in.Email != nil {
		branch.Email = strings.TrimSpace(*in.Email)
	}
	if in.Website != nil {
		branch.Website = strings.TrimSpace(*in.Website)
		foundedYear, err := validateFoundedYear(in.FoundedYear)
		if err != nil {
			return nil, err
		}
		branch.FoundedYear = foundedYear
	} else if in.FoundedYear != nil {
		foundedYear, err := validateFoundedYear(in.FoundedYear)
		if err != nil {
			return nil, err
		}
		branch.FoundedYear = foundedYear
	}
	if in.FacebookURL != nil {
		branch.FacebookURL = strings.TrimSpace(*in.FacebookURL)
	}
	if in.GoogleMapsURL != nil {
		branch.GoogleMapsURL = strings.TrimSpace(*in.GoogleMapsURL)
	}
	if in.Addresses != nil {
		addrs, err := requireBranchAddresses(*in.Addresses)
		if err != nil {
			return nil, err
		}
		addrs, err = expandBranchFormerFromCurrent(ctx, s.orgs, addrs)
		if err != nil {
			return nil, err
		}
		branch.Addresses = addrs
	} else {
		branch.Addresses = nil
	}
	sportsUpdated := in.SportIDs != nil
	if sportsUpdated {
		sportIDs, err := s.validateSportIDs(ctx, *in.SportIDs)
		if err != nil {
			return nil, err
		}
		branch.SportIDs = sportIDs
	} else {
		branch.SportIDs = nil
	}
	now := time.Now().UTC()
	branch.UpdatedAt = now
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.branches.Update(ctx, tx, branch); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "BranchUpdated", AggregateType: "Branch", AggregateID: branch.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Branch", EntityID: branch.ID, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "update branch")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	if !sportsUpdated {
		sportIDs, err := s.branches.ListSportIDs(ctx, branch.ID)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "list branch sports")
		}
		branch.SportIDs = sportIDs
	}
	return branch, nil
}

func (s *BranchService) SlugAvailable(ctx context.Context, actor uuid.UUID, slug string, excludeBranchID uuid.UUID) (bool, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return false, err
	}
	if err := s.requireReader(ctx, orgID, actor); err != nil {
		return false, err
	}
	normalized := slugify(slug)
	if normalized == "" {
		return false, apperr.New(apperr.CodeValidation, "slug is required")
	}
	var exclude *uuid.UUID
	if excludeBranchID != uuid.Nil {
		exclude = &excludeBranchID
	}
	taken, err := s.branches.SlugExists(ctx, orgID, normalized, exclude)
	if err != nil {
		return false, apperr.Wrap(err, apperr.CodeInternal, "lookup branch slug")
	}
	return !taken, nil
}

func (s *BranchService) resolveBranchSlug(
	ctx context.Context, orgID uuid.UUID, requested, name string, excludeID *uuid.UUID, allowSuffix bool,
) (string, error) {
	custom := strings.TrimSpace(requested) != ""
	base := slugify(requested)
	if !custom {
		base = slugify(name)
	}
	if custom {
		taken, err := s.branches.SlugExists(ctx, orgID, base, excludeID)
		if err != nil {
			return "", apperr.Wrap(err, apperr.CodeInternal, "lookup branch slug")
		}
		if taken {
			return "", orgerrors.ErrSlugTaken
		}
		return base, nil
	}
	candidate := base
	for i := 2; i < 50; i++ {
		taken, err := s.branches.SlugExists(ctx, orgID, candidate, excludeID)
		if err != nil {
			return "", apperr.Wrap(err, apperr.CodeInternal, "lookup branch slug")
		}
		if !taken {
			return candidate, nil
		}
		if !allowSuffix {
			return "", orgerrors.ErrSlugTaken
		}
		candidate = fmt.Sprintf("%s-%d", base, i)
	}
	return "", orgerrors.ErrSlugTaken
}

func (s *BranchService) validateSportIDs(ctx context.Context, ids []uuid.UUID) ([]uuid.UUID, error) {
	if len(ids) == 0 {
		return []uuid.UUID{}, nil
	}
	seen := make(map[uuid.UUID]struct{}, len(ids))
	unique := make([]uuid.UUID, 0, len(ids))
	for _, sportID := range ids {
		if sportID == uuid.Nil {
			continue
		}
		if _, ok := seen[sportID]; ok {
			continue
		}
		seen[sportID] = struct{}{}
		unique = append(unique, sportID)
	}
	if len(unique) == 0 {
		return []uuid.UUID{}, nil
	}
	found, err := s.sports.FindByIDs(ctx, unique)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup sports")
	}
	if len(found) != len(unique) {
		return nil, orgerrors.ErrInvalidSportIDs
	}
	return unique, nil
}

func (s *BranchService) SaveImage(ctx context.Context, branchID, actor uuid.UUID, kind, filename, mime string, body []byte) (*entity.Branch, error) {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return nil, err
	}
	if err := s.orgSvc.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return nil, err
	}
	if kind != "logo" && kind != "banner" {
		return nil, apperr.New(apperr.CodeValidation, "kind must be logo or banner")
	}
	switch mime {
	case "image/jpeg", "image/png", "image/webp":
	default:
		return nil, apperr.New(apperr.CodeValidation, "unsupported image type")
	}
	if len(body) == 0 || len(body) > 5<<20 {
		return nil, apperr.New(apperr.CodeValidation, "image must be between 1 byte and 5MB")
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "lookup organization")
	}
	if org == nil {
		return nil, orgerrors.ErrOrganizationNotFound
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return nil, orgerrors.ErrBranchNotFound
	}
	if branch.Status == entity.LocationArchived {
		return nil, orgerrors.ErrInvalidBranchStatus
	}
	ext := ".bin"
	switch mime {
	case "image/jpeg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	case "image/webp":
		ext = ".webp"
	}
	fileID := id.MustNewUUID()
	rel := filepath.Join(org.TenantID.String(), fileID.String()+ext)
	abs := filepath.Join(s.fileDirOrDefault(), rel)
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "create file directory")
	}
	if err := os.WriteFile(abs, body, 0o644); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "write file")
	}
	sum := sha256.Sum256(body)
	stored := repository.StoredFile{
		ID: fileID, TenantID: org.TenantID, OrgID: org.ID, Path: rel, MimeType: mime,
		Size: int64(len(body)), Checksum: hex.EncodeToString(sum[:]), Filename: filename, Extension: strings.TrimPrefix(ext, "."),
		CreatedBy: actor,
	}
	logoID, bannerID := branch.LogoFileID, branch.BannerFileID
	if kind == "logo" {
		logoID = &fileID
	} else {
		bannerID = &fileID
	}
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.orgs.InsertFile(ctx, tx, stored); err != nil {
			return err
		}
		return s.branches.UpdateMedia(ctx, tx, orgID, branchID, logoID, bannerID)
	})
	if err != nil {
		_ = os.Remove(abs)
		return nil, apperr.Wrap(err, apperr.CodeInternal, "store branch image")
	}
	fresh, ferr := s.branches.FindByID(ctx, orgID, branchID)
	if ferr != nil || fresh == nil {
		branch.LogoFileID, branch.BannerFileID = logoID, bannerID
		return branch, nil
	}
	return fresh, nil
}

func (s *BranchService) fileDirOrDefault() string {
	return s.orgSvc.fileDirOrDefault()
}

func (s *BranchService) Open(ctx context.Context, branchID, actor uuid.UUID) error {
	return s.transitionFrom(ctx, branchID, actor,
		[]entity.LocationStatus{entity.LocationInactive, entity.LocationMaintenance},
		entity.LocationActive, "BranchOpened")
}

func (s *BranchService) Close(ctx context.Context, branchID, actor uuid.UUID) error {
	return s.transitionFrom(ctx, branchID, actor,
		[]entity.LocationStatus{entity.LocationActive, entity.LocationMaintenance},
		entity.LocationInactive, "BranchClosed")
}

func (s *BranchService) Maintenance(ctx context.Context, branchID, actor uuid.UUID) error {
	return s.transitionFrom(ctx, branchID, actor,
		[]entity.LocationStatus{entity.LocationActive, entity.LocationInactive},
		entity.LocationMaintenance, "BranchMaintenanceStarted")
}

func (s *BranchService) Archive(ctx context.Context, branchID, actor uuid.UUID) error {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return err
	}
	if err := s.orgSvc.RequireOwner(ctx, orgID, actor); err != nil {
		return err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return orgerrors.ErrBranchNotFound
	}
	if branch.Status == entity.LocationArchived {
		return orgerrors.ErrInvalidBranchStatus
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.branches.UpdateStatus(ctx, tx, orgID, branchID, entity.LocationArchived); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: "BranchArchived", AggregateType: "Branch", AggregateID: branch.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Branch", EntityID: branch.ID, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "archive branch")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func (s *BranchService) transitionFrom(
	ctx context.Context, branchID, actor uuid.UUID,
	from []entity.LocationStatus, to entity.LocationStatus, eventType string,
) error {
	orgID, err := s.requireOrgHeader(ctx)
	if err != nil {
		return err
	}
	if err := s.orgSvc.RequireOwnerOrAdmin(ctx, orgID, actor); err != nil {
		return err
	}
	org, err := s.orgs.FindByID(ctx, orgID)
	if err != nil || org == nil {
		return orgerrors.ErrOrganizationNotFound
	}
	branch, err := s.branches.FindByID(ctx, orgID, branchID)
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "get branch")
	}
	if branch == nil {
		return orgerrors.ErrBranchNotFound
	}
	okFrom := false
	for _, status := range from {
		if branch.Status == status {
			okFrom = true
			break
		}
	}
	if !okFrom {
		return orgerrors.ErrInvalidBranchStatus
	}
	now := time.Now().UTC()
	var outboxID uuid.UUID
	err = persistence.WithinTx(ctx, s.pool, func(tx pgx.Tx) error {
		if err := s.branches.UpdateStatus(ctx, tx, orgID, branchID, to); err != nil {
			return err
		}
		oid, err := events.Append(ctx, tx, events.Event{
			Type: eventType, AggregateType: "Branch", AggregateID: branch.ID,
			TenantID: &org.TenantID, ActorType: events.ActorUser, ActorID: &actor,
			EntityType: "Branch", EntityID: branch.ID, OccurredAt: now,
		})
		outboxID = oid
		return err
	})
	if err != nil {
		return apperr.Wrap(err, apperr.CodeInternal, "branch status transition")
	}
	events.AfterCommit(ctx, s.outbox, outboxID)
	return nil
}

func requireBranchAddresses(inputs []BranchAddressInput) ([]entity.BranchAddress, error) {
	if len(inputs) == 0 {
		return nil, apperr.New(apperr.CodeValidation, "address is required")
	}
	return toBranchAddresses(inputs)
}

func toBranchAddresses(inputs []BranchAddressInput) ([]entity.BranchAddress, error) {
	out := make([]entity.BranchAddress, 0, len(inputs))
	hasCurrent := false
	for _, in := range inputs {
		scheme := in.DivisionScheme
		if scheme != entity.AdminDivisionFormerV3 && scheme != entity.AdminDivisionCurrentV2 {
			return nil, apperr.New(apperr.CodeValidation, "invalid division_scheme")
		}
		addr := entity.BranchAddress{
			DivisionScheme: scheme,
			CountryID:      in.CountryID,
			AddressLine1:   strings.TrimSpace(in.AddressLine1),
			AddressLine2:   strings.TrimSpace(in.AddressLine2),
			Latitude:       in.Latitude,
			Longitude:      in.Longitude,
		}
		switch scheme {
		case entity.AdminDivisionFormerV3:
			if in.ProvinceFormerID == nil || in.DistrictFormerID == nil || in.WardFormerID == nil {
				return nil, apperr.New(apperr.CodeValidation, "former_v3 requires province_former_id, district_former_id, ward_former_id")
			}
			addr.ProvinceFormerID = in.ProvinceFormerID
			addr.DistrictFormerID = in.DistrictFormerID
			addr.WardFormerID = in.WardFormerID
		case entity.AdminDivisionCurrentV2:
			hasCurrent = true
			if in.ProvinceID == nil || in.WardID == nil {
				return nil, apperr.New(apperr.CodeValidation, "current_v2 requires province_id and ward_id")
			}
			if addr.AddressLine1 == "" {
				return nil, apperr.New(apperr.CodeValidation, "address_line_1 is required")
			}
			if in.Latitude == nil || in.Longitude == nil {
				return nil, apperr.New(apperr.CodeValidation, "latitude and longitude are required")
			}
			if *in.Latitude < -90 || *in.Latitude > 90 || *in.Longitude < -180 || *in.Longitude > 180 {
				return nil, apperr.New(apperr.CodeValidation, "latitude or longitude out of range")
			}
			addr.ProvinceID = in.ProvinceID
			addr.WardID = in.WardID
		}
		out = append(out, addr)
	}
	if !hasCurrent {
		return nil, apperr.New(apperr.CodeValidation, "current_v2 address is required")
	}
	return out, nil
}

func validateFoundedYear(y *int) (*int, error) {
	if y == nil {
		return nil, nil
	}
	if *y < 1800 || *y > 2100 {
		return nil, apperr.New(apperr.CodeValidation, "founded_year out of range")
	}
	v := *y
	return &v, nil
}
