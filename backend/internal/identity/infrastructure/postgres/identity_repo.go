package postgres

import (
	"context"
	"errors"
	"time"

	"bokdy/db/generated/sqlc"
	"bokdy/internal/identity/entity"
	"bokdy/internal/identity/repository"
	"bokdy/internal/platform/id"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type IdentityRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewIdentityRepo(pool *pgxpool.Pool) *IdentityRepo {
	return &IdentityRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.IdentityRepository = (*IdentityRepo)(nil)

func (r *IdentityRepo) Create(ctx context.Context, tx pgx.Tx, identity *entity.Identity) error {
	return r.q.WithTx(tx).CreateIdentity(ctx, dbsqlc.CreateIdentityParams{
		ID: identity.ID, UserID: identity.UserID, Provider: dbsqlc.IdentityIdentityProvider(identity.Provider),
		ProviderSubject: identity.ProviderSubject, Email: nullStr(identity.Email), Phone: nullStr(identity.Phone),
		IsPrimary: identity.IsPrimary, CreatedAt: identity.CreatedAt, UpdatedAt: identity.UpdatedAt,
	})
}

func (r *IdentityRepo) FindPrimaryByUserID(ctx context.Context, userID uuid.UUID) (*entity.Identity, error) {
	row, err := r.q.FindPrimaryIdentityByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapIdentity(row.ID, row.UserID, row.Provider, row.ProviderSubject, row.Email, row.Phone, row.IsPrimary, row.CreatedAt, row.UpdatedAt), nil
}

func (r *IdentityRepo) FindByPhone(ctx context.Context, phone string) (*entity.Identity, error) {
	row, err := r.q.FindIdentityByPhone(ctx, nullStr(phone))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapIdentity(row.ID, row.UserID, row.Provider, row.ProviderSubject, row.Email, row.Phone, row.IsPrimary, row.CreatedAt, row.UpdatedAt), nil
}

func (r *IdentityRepo) FindLocalByEmail(ctx context.Context, email string) (*entity.Identity, error) {
	row, err := r.q.FindLocalIdentityByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return mapIdentity(row.ID, row.UserID, row.Provider, row.ProviderSubject, row.Email, row.Phone, row.IsPrimary, row.CreatedAt, row.UpdatedAt), nil
}

func (r *IdentityRepo) UpdatePrimaryPhone(ctx context.Context, tx pgx.Tx, userID uuid.UUID, phone string) error {
	return r.q.WithTx(tx).UpdatePrimaryIdentityPhone(ctx, dbsqlc.UpdatePrimaryIdentityPhoneParams{
		UserID: userID, Phone: nullStr(phone),
	})
}

func (r *IdentityRepo) CreateVerification(ctx context.Context, tx pgx.Tx, identityID uuid.UUID, tokenHash string, expiresAt time.Time) (uuid.UUID, error) {
	vid := id.MustNewUUID()
	err := r.q.WithTx(tx).CreateIdentityVerification(ctx, dbsqlc.CreateIdentityVerificationParams{
		ID: vid, IdentityID: identityID, TokenHash: tokenHash, ExpiresAt: &expiresAt,
	})
	return vid, err
}

func (r *IdentityRepo) VerifyByTokenHash(ctx context.Context, tx pgx.Tx, tokenHash string) (uuid.UUID, uuid.UUID, error) {
	q := r.q.WithTx(tx)
	row, err := q.FindPendingVerificationByTokenHash(ctx, tokenHash)
	if err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	if err := q.MarkVerificationVerified(ctx, row.ID); err != nil {
		return uuid.Nil, uuid.Nil, err
	}
	return row.IdentityID, row.UserID, nil
}

func mapIdentity(
	id, userID uuid.UUID, provider dbsqlc.IdentityIdentityProvider, subject, email, phone string,
	isPrimary bool, createdAt, updatedAt time.Time,
) *entity.Identity {
	return &entity.Identity{
		ID: id, UserID: userID, Provider: entity.IdentityProvider(provider), ProviderSubject: subject,
		Email: email, Phone: phone, IsPrimary: isPrimary, CreatedAt: createdAt, UpdatedAt: updatedAt,
	}
}
