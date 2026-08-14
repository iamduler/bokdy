package postgres

import (
	"context"
	"errors"
	"time"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/scheduling/entity"
	"bokdy/internal/scheduling/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ScheduleRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewScheduleRepo(pool *pgxpool.Pool) *ScheduleRepo {
	return &ScheduleRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.ScheduleRepository = (*ScheduleRepo)(nil)
var _ repository.MarketplaceRepository = (*ScheduleRepo)(nil)

func (r *ScheduleRepo) ReplaceBusinessHours(ctx context.Context, tx pgx.Tx, locationID uuid.UUID, hours []entity.BusinessHour) error {
	q := r.q.WithTx(tx)
	if err := q.DeleteBusinessHoursByLocation(ctx, locationID); err != nil {
		return err
	}
	for i := range hours {
		h := &hours[i]
		if err := q.InsertBusinessHour(ctx, dbsqlc.InsertBusinessHourParams{
			ID: h.ID, LocationID: locationID, Weekday: int16(h.Weekday),
			OpensAt: toPgTime(h.OpensAt), ClosesAt: toPgTime(h.ClosesAt), IsClosed: h.IsClosed,
			CreatedAt: h.CreatedAt, UpdatedAt: h.UpdatedAt,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (r *ScheduleRepo) ListBusinessHours(ctx context.Context, locationID uuid.UUID) ([]entity.BusinessHour, error) {
	rows, err := r.q.ListBusinessHours(ctx, locationID)
	if err != nil {
		return nil, err
	}
	out := make([]entity.BusinessHour, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.BusinessHour{
			ID: row.ID, LocationID: row.LocationID, Weekday: entity.Weekday(row.Weekday),
			OpensAt: fromPgTime(row.OpensAt), ClosesAt: fromPgTime(row.ClosesAt), IsClosed: row.IsClosed,
			CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		})
	}
	return out, nil
}

func (r *ScheduleRepo) CreateHoliday(ctx context.Context, tx pgx.Tx, h *entity.SpecialSchedule) error {
	return r.q.WithTx(tx).CreateHoliday(ctx, dbsqlc.CreateHolidayParams{
		ID: h.ID, TenantID: h.TenantID, LocationID: uuidPtr(h.LocationID),
		NameEn: nullStr(h.NameEn), NameVi: nullStr(h.NameVi),
		StartsAt: h.StartsAt, EndsAt: h.EndsAt, IsClosed: h.IsClosed,
		OpensAt: toPgTimePtr(h.OpensAt), ClosesAt: toPgTimePtr(h.ClosesAt), CreatedAt: h.CreatedAt,
	})
}

func (r *ScheduleRepo) ListHolidays(ctx context.Context, locationID uuid.UUID, from, to time.Time) ([]entity.SpecialSchedule, error) {
	rows, err := r.q.ListHolidaysOverlapping(ctx, dbsqlc.ListHolidaysOverlappingParams{
		LocationID: uuidPtr(locationID), RangeStart: from, RangeEnd: to,
	})
	if err != nil {
		return nil, err
	}
	out := make([]entity.SpecialSchedule, 0, len(rows))
	for _, row := range rows {
		h := entity.SpecialSchedule{
			ID: row.ID, TenantID: row.TenantID, NameEn: row.NameEn, NameVi: row.NameVi,
			StartsAt: row.StartsAt, EndsAt: row.EndsAt, IsClosed: row.IsClosed,
			OpensAt: fromPgTimePtr(row.OpensAt), ClosesAt: fromPgTimePtr(row.ClosesAt), CreatedAt: row.CreatedAt,
		}
		if row.LocationID != nil {
			h.LocationID = *row.LocationID
		}
		out = append(out, h)
	}
	return out, nil
}

func (r *ScheduleRepo) CreateBlock(ctx context.Context, tx pgx.Tx, b *entity.ResourceBlock) error {
	return r.q.WithTx(tx).CreateResourceBlock(ctx, dbsqlc.CreateResourceBlockParams{
		ID: b.ID, ResourceID: b.ResourceID, BlockType: dbsqlc.SchedulingBlockType(b.BlockType),
		ReferenceType: nullStr(b.ReferenceType), ReferenceID: b.ReferenceID,
		StartsAt: b.StartsAt, EndsAt: b.EndsAt, Reason: nullStr(b.Reason), CreatedAt: b.CreatedAt,
	})
}

func (r *ScheduleRepo) DeleteBlock(ctx context.Context, tx pgx.Tx, resourceID, blockID uuid.UUID) error {
	return r.q.WithTx(tx).DeleteResourceBlock(ctx, dbsqlc.DeleteResourceBlockParams{ResourceID: resourceID, ID: blockID})
}

func (r *ScheduleRepo) FindBlock(ctx context.Context, resourceID, blockID uuid.UUID) (*entity.ResourceBlock, error) {
	row, err := r.q.FindResourceBlock(ctx, dbsqlc.FindResourceBlockParams{ResourceID: resourceID, ID: blockID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &entity.ResourceBlock{
		ID: row.ID, ResourceID: row.ResourceID, BlockType: entity.BlockType(row.BlockType),
		ReferenceType: row.ReferenceType, ReferenceID: row.ReferenceID,
		StartsAt: row.StartsAt, EndsAt: row.EndsAt, Reason: row.Reason, CreatedAt: row.CreatedAt,
	}, nil
}

func (r *ScheduleRepo) ListBlocks(ctx context.Context, resourceID uuid.UUID, from, to time.Time) ([]entity.ResourceBlock, error) {
	rows, err := r.q.ListResourceBlocksOverlapping(ctx, dbsqlc.ListResourceBlocksOverlappingParams{
		ResourceID: resourceID, RangeStart: from, RangeEnd: to,
	})
	if err != nil {
		return nil, err
	}
	out := make([]entity.ResourceBlock, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.ResourceBlock{
			ID: row.ID, ResourceID: row.ResourceID, BlockType: entity.BlockType(row.BlockType),
			ReferenceType: row.ReferenceType, ReferenceID: row.ReferenceID,
			StartsAt: row.StartsAt, EndsAt: row.EndsAt, Reason: row.Reason, CreatedAt: row.CreatedAt,
		})
	}
	return out, nil
}

func (r *ScheduleRepo) CountConflictingManualBlocks(ctx context.Context, resourceID uuid.UUID, from, to time.Time) (int64, error) {
	return r.q.CountConflictingBlocks(ctx, dbsqlc.CountConflictingBlocksParams{
		ResourceID: resourceID, RangeEnd: to, RangeStart: from,
	})
}

func (r *ScheduleRepo) UpsertMaintenanceBlock(ctx context.Context, tx pgx.Tx, b *entity.ResourceBlock) error {
	return r.q.WithTx(tx).UpsertMaintenanceBlock(ctx, dbsqlc.UpsertMaintenanceBlockParams{
		ID: b.ID, ResourceID: b.ResourceID, ReferenceType: nullStr(b.ReferenceType), ReferenceID: b.ReferenceID,
		StartsAt: b.StartsAt, EndsAt: b.EndsAt, Reason: nullStr(b.Reason), CreatedAt: b.CreatedAt,
	})
}

func (r *ScheduleRepo) DeleteMaintenanceBlock(ctx context.Context, tx pgx.Tx, resourceID, maintenanceID uuid.UUID) error {
	return r.q.WithTx(tx).DeleteMaintenanceBlock(ctx, dbsqlc.DeleteMaintenanceBlockParams{
		ResourceID: resourceID, ReferenceID: uuidPtr(maintenanceID),
	})
}

func (r *ScheduleRepo) DeleteMaintenanceBlocksByResource(ctx context.Context, tx pgx.Tx, resourceID uuid.UUID) error {
	return r.q.WithTx(tx).DeleteMaintenanceBlocksByResource(ctx, resourceID)
}

func (r *ScheduleRepo) UpsertReservationBlock(ctx context.Context, tx pgx.Tx, b *entity.ResourceBlock) error {
	return r.q.WithTx(tx).UpsertReservationBlock(ctx, dbsqlc.UpsertReservationBlockParams{
		ID: b.ID, ResourceID: b.ResourceID, ReferenceType: nullStr(b.ReferenceType), ReferenceID: b.ReferenceID,
		StartsAt: b.StartsAt, EndsAt: b.EndsAt, Reason: nullStr(b.Reason), CreatedAt: b.CreatedAt,
	})
}

func (r *ScheduleRepo) UpsertBookingBlock(ctx context.Context, tx pgx.Tx, b *entity.ResourceBlock) error {
	return r.q.WithTx(tx).UpsertBookingBlock(ctx, dbsqlc.UpsertBookingBlockParams{
		ID: b.ID, ResourceID: b.ResourceID, ReferenceType: nullStr(b.ReferenceType), ReferenceID: b.ReferenceID,
		StartsAt: b.StartsAt, EndsAt: b.EndsAt, Reason: nullStr(b.Reason), CreatedAt: b.CreatedAt,
	})
}

func (r *ScheduleRepo) DeleteTypedBlock(ctx context.Context, tx pgx.Tx, resourceID uuid.UUID, blockType entity.BlockType, referenceID uuid.UUID) error {
	return r.q.WithTx(tx).DeleteTypedBlock(ctx, dbsqlc.DeleteTypedBlockParams{
		ResourceID: resourceID, BlockType: dbsqlc.SchedulingBlockType(blockType), ReferenceID: uuidPtr(referenceID),
	})
}

func (r *ScheduleRepo) CountOverlappingBlocks(ctx context.Context, resourceID uuid.UUID, from, to time.Time) (int64, error) {
	return r.q.CountOverlappingBlocks(ctx, dbsqlc.CountOverlappingBlocksParams{
		ResourceID: resourceID, RangeEnd: to, RangeStart: from,
	})
}

func (r *ScheduleRepo) CountOverlappingBlocksExcept(ctx context.Context, resourceID uuid.UUID, from, to time.Time, excludeReferenceID uuid.UUID) (int64, error) {
	return r.q.CountOverlappingBlocksExcludingReference(ctx, dbsqlc.CountOverlappingBlocksExcludingReferenceParams{
		ResourceID: resourceID, RangeEnd: to, RangeStart: from, ExcludeReferenceID: uuidPtr(excludeReferenceID),
	})
}

func (r *ScheduleRepo) DeleteSlotsFrom(ctx context.Context, tx pgx.Tx, resourceID uuid.UUID, from time.Time) error {
	q := r.q.WithTx(tx)
	if err := q.DeleteTimeSlotsFrom(ctx, dbsqlc.DeleteTimeSlotsFromParams{ResourceID: resourceID, StartsAt: from}); err != nil {
		return err
	}
	return q.DeleteProjectionsFrom(ctx, dbsqlc.DeleteProjectionsFromParams{ResourceID: resourceID, Column2: toPgDate(from)})
}

func (r *ScheduleRepo) UpsertProjection(ctx context.Context, tx pgx.Tx, p *entity.AvailabilityProjection) error {
	id, err := r.q.WithTx(tx).UpsertAvailabilityProjection(ctx, dbsqlc.UpsertAvailabilityProjectionParams{
		ID: p.ID, ResourceID: p.ResourceID, ProjectionDate: toPgDate(p.ProjectionDate),
		AvailableMinutes: int32(p.AvailableMinutes), OccupiedMinutes: int32(p.OccupiedMinutes),
		Status: dbsqlc.SchedulingProjectionStatus(p.Status), GeneratedAt: p.GeneratedAt,
	})
	if err != nil {
		return err
	}
	p.ID = id
	return nil
}

func (r *ScheduleRepo) InsertTimeSlots(ctx context.Context, tx pgx.Tx, slots []entity.TimeSlot) error {
	q := r.q.WithTx(tx)
	for i := range slots {
		s := &slots[i]
		if err := q.InsertTimeSlot(ctx, dbsqlc.InsertTimeSlotParams{
			ID: s.ID, ResourceID: s.ResourceID, StartsAt: s.StartsAt, EndsAt: s.EndsAt,
			IsAvailable: s.IsAvailable, Source: nullStr(s.Source), ProjectionID: s.ProjectionID, GeneratedAt: s.GeneratedAt,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (r *ScheduleRepo) ListTimeSlots(ctx context.Context, resourceID uuid.UUID, from, to time.Time, availableOnly bool) ([]entity.TimeSlot, error) {
	rows, err := r.q.ListTimeSlots(ctx, dbsqlc.ListTimeSlotsParams{
		ResourceID: resourceID, RangeStart: from, RangeEnd: to, AvailableOnly: availableOnly,
	})
	if err != nil {
		return nil, err
	}
	out := make([]entity.TimeSlot, 0, len(rows))
	for _, row := range rows {
		out = append(out, entity.TimeSlot{
			ID: row.ID, ResourceID: row.ResourceID, StartsAt: row.StartsAt, EndsAt: row.EndsAt,
			IsAvailable: row.IsAvailable, Source: row.Source, ProjectionID: row.ProjectionID, GeneratedAt: row.GeneratedAt,
		})
	}
	return out, nil
}

func (r *ScheduleRepo) ListCourtIDsByLocation(ctx context.Context, locationID uuid.UUID) ([]uuid.UUID, error) {
	return r.q.ListActiveCourtIDsByLocation(ctx, locationID)
}

func (r *ScheduleRepo) FindCourtForSync(ctx context.Context, courtID uuid.UUID) (*repository.CourtSyncRow, error) {
	row, err := r.q.FindCourtForSync(ctx, courtID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &repository.CourtSyncRow{
		ID: row.ID, LocationID: row.LocationID, TenantID: row.TenantID, Status: row.Status,
		CourtTypeID: row.CourtTypeID, SlotDurationMinutes: int(row.SlotDurationMinutes), PublicID: row.PublicID,
	}, nil
}

func (r *ScheduleRepo) FindOpenMaintenance(ctx context.Context, courtID uuid.UUID) (*repository.MaintenanceRow, error) {
	row, err := r.q.FindOpenMaintenance(ctx, courtID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &repository.MaintenanceRow{ID: row.ID, StartedAt: row.StartedAt}, nil
}

func (r *ScheduleRepo) SearchBranches(ctx context.Context, q string, limit int) ([]repository.MarketplaceBranch, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := r.q.SearchMarketplaceBranches(ctx, dbsqlc.SearchMarketplaceBranchesParams{Q: q, RowLimit: int32(limit)})
	if err != nil {
		return nil, err
	}
	out := make([]repository.MarketplaceBranch, 0, len(rows))
	for _, row := range rows {
		out = append(out, marketplaceBranch(row.ID, row.PublicID, row.OrganizationID, row.Code, row.NameEn, row.NameVi, row.Phone, row.Email, row.Timezone, row.Status, row.City, row.District, row.AddressLine1))
	}
	return out, nil
}

func (r *ScheduleRepo) FindBranchByPublicID(ctx context.Context, publicID string) (*repository.MarketplaceBranch, error) {
	row, err := r.q.FindMarketplaceBranchByPublicID(ctx, publicID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	b := marketplaceBranch(row.ID, row.PublicID, row.OrganizationID, row.Code, row.NameEn, row.NameVi, row.Phone, row.Email, row.Timezone, row.Status, row.City, row.District, row.AddressLine1)
	return &b, nil
}

func (r *ScheduleRepo) ListPublicCourts(ctx context.Context, locationID uuid.UUID) ([]repository.MarketplaceCourt, error) {
	rows, err := r.q.ListMarketplaceCourts(ctx, locationID)
	if err != nil {
		return nil, err
	}
	out := make([]repository.MarketplaceCourt, 0, len(rows))
	for _, row := range rows {
		c := repository.MarketplaceCourt{
			ID: row.ID, PublicID: row.PublicID, LocationID: row.LocationID, Code: row.Code,
			NameEn: row.NameEn, NameVi: row.NameVi, Status: row.Status, IsBookable: row.IsBookable, SlotMinutes: int(row.SlotMinutes),
		}
		if row.CourtTypeID != nil {
			c.CourtTypeID = *row.CourtTypeID
		}
		out = append(out, c)
	}
	return out, nil
}

func (r *ScheduleRepo) FindCourtByPublicID(ctx context.Context, publicID string) (*repository.MarketplaceCourt, error) {
	row, err := r.q.FindMarketplaceCourtByPublicID(ctx, publicID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	c := &repository.MarketplaceCourt{
		ID: row.ID, PublicID: row.PublicID, LocationID: row.LocationID, Code: row.Code,
		NameEn: row.NameEn, NameVi: row.NameVi, Status: row.Status, IsBookable: row.IsBookable, SlotMinutes: int(row.SlotMinutes),
	}
	if row.CourtTypeID != nil {
		c.CourtTypeID = *row.CourtTypeID
	}
	return c, nil
}

func marketplaceBranch(id uuid.UUID, publicID string, orgID uuid.UUID, code, nameEn, nameVi, phone, email, tz, status, city, district, addr1 string) repository.MarketplaceBranch {
	return repository.MarketplaceBranch{
		ID: id, PublicID: publicID, OrganizationID: orgID, Code: code, NameEn: nameEn, NameVi: nameVi,
		Phone: phone, Email: email, Timezone: tz, Status: status, City: city, District: district, AddressLine1: addr1,
	}
}
