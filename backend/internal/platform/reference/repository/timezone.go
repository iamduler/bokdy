package repository

import (
	"context"

	"github.com/google/uuid"
)

type Timezone struct {
	ID        uuid.UUID
	Name      string
	SortOrder int32
}

type TimezoneRepository interface {
	ListActive(ctx context.Context) ([]Timezone, error)
}
