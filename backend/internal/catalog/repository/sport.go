package repository

import (
	"context"

	"bokdy/internal/catalog/entity"

	"github.com/google/uuid"
)

type SportRepository interface {
	List(ctx context.Context) ([]entity.Sport, error)
	FindByIDs(ctx context.Context, ids []uuid.UUID) ([]entity.Sport, error)
}
