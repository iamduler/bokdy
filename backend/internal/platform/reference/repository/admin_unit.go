package repository

import (
	"context"

	"github.com/google/uuid"
)

const VNCountryID = "01900000-0000-7000-8000-000000000001"

type DivisionScheme string

const (
	DivisionFormerV3  DivisionScheme = "former_v3"
	DivisionCurrentV2 DivisionScheme = "current_v2"
)

type AdminUnit struct {
	ID     uuid.UUID
	Code   string
	NameEn string
	NameVi string
}

type AdminUnitRepository interface {
	ListProvinces(ctx context.Context, scheme DivisionScheme) ([]AdminUnit, error)
	ListDistrictsFormer(ctx context.Context, provinceFormerID uuid.UUID) ([]AdminUnit, error)
	ListWards(ctx context.Context, scheme DivisionScheme, parentID uuid.UUID, q string) ([]AdminUnit, error)
	ProvinceExists(ctx context.Context, scheme DivisionScheme, id uuid.UUID) (bool, error)
	DistrictFormerExists(ctx context.Context, id uuid.UUID) (bool, error)
}
