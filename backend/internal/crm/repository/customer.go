package repository

import (
	"context"

	"bokdy/internal/crm/entity"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type CustomerRepository interface {
	Create(ctx context.Context, tx pgx.Tx, customer *entity.Customer) error
	FindByID(ctx context.Context, tenantID, customerID uuid.UUID) (*entity.Customer, error)
	FindByIDAnyTenant(ctx context.Context, customerID uuid.UUID) (*entity.Customer, error)
	FindByUserAndTenant(ctx context.Context, tenantID, userID uuid.UUID) (*entity.Customer, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.Customer, error)
	FindByPhone(ctx context.Context, tenantID uuid.UUID, phone string) (*entity.Customer, error)
	ListByTenant(ctx context.Context, tenantID uuid.UUID, q string, status *entity.CustomerStatus, limit int) ([]entity.Customer, error)
	Update(ctx context.Context, tx pgx.Tx, customer *entity.Customer) error
	UpdateStatus(ctx context.Context, tx pgx.Tx, tenantID, customerID uuid.UUID, status entity.CustomerStatus) error
	LinkUser(ctx context.Context, tx pgx.Tx, tenantID, customerID, userID uuid.UUID, status entity.CustomerStatus) error
	UpdateProfile(ctx context.Context, tx pgx.Tx, profile *entity.CustomerProfile) error
	UpsertPrimaryContact(ctx context.Context, tx pgx.Tx, contact *entity.CustomerContact) error
}
