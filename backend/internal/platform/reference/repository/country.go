package repository

import (
	"context"

	"github.com/google/uuid"
)

type Country struct {
	ID     uuid.UUID
	ISO2   string
	NameEn string
	NameVi string
}

type CountryRepository interface {
	ListActive(ctx context.Context) ([]Country, error)
}
