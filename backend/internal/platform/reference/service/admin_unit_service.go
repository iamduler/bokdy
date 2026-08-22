package service

import (
	"context"
	"strings"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/reference/repository"

	"github.com/google/uuid"
)

type AdminUnitService struct {
	units repository.AdminUnitRepository
}

func NewAdminUnitService(units repository.AdminUnitRepository) *AdminUnitService {
	return &AdminUnitService{units: units}
}

func (s *AdminUnitService) ListProvinces(ctx context.Context, scheme repository.DivisionScheme) ([]repository.AdminUnit, error) {
	if err := validateScheme(scheme); err != nil {
		return nil, err
	}
	return s.units.ListProvinces(ctx, scheme)
}

func (s *AdminUnitService) ListDistricts(ctx context.Context, provinceID uuid.UUID) ([]repository.AdminUnit, error) {
	ok, err := s.units.ProvinceExists(ctx, repository.DivisionFormerV3, provinceID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "check province")
	}
	if !ok {
		return nil, apperr.New(apperr.CodeNotFound, "province not found")
	}
	return s.units.ListDistrictsFormer(ctx, provinceID)
}

func (s *AdminUnitService) ListWards(
	ctx context.Context,
	scheme repository.DivisionScheme,
	provinceID, districtID *uuid.UUID,
	q string,
) ([]repository.AdminUnit, error) {
	if err := validateScheme(scheme); err != nil {
		return nil, err
	}
	q = strings.TrimSpace(q)
	if q != "" && len(q) < 2 {
		return nil, apperr.New(apperr.CodeValidation, "q must be at least 2 characters")
	}
	switch scheme {
	case repository.DivisionCurrentV2:
		if provinceID == nil {
			return nil, apperr.New(apperr.CodeValidation, "province_id is required for current_v2")
		}
		ok, err := s.units.ProvinceExists(ctx, scheme, *provinceID)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "check province")
		}
		if !ok {
			return nil, apperr.New(apperr.CodeNotFound, "province not found")
		}
		return s.units.ListWards(ctx, scheme, *provinceID, q)
	case repository.DivisionFormerV3:
		if districtID == nil {
			return nil, apperr.New(apperr.CodeValidation, "district_id is required for former_v3")
		}
		ok, err := s.units.DistrictFormerExists(ctx, *districtID)
		if err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "check district")
		}
		if !ok {
			return nil, apperr.New(apperr.CodeNotFound, "district not found")
		}
		return s.units.ListWards(ctx, scheme, *districtID, q)
	default:
		return nil, apperr.New(apperr.CodeValidation, "invalid division_scheme")
	}
}

func validateScheme(scheme repository.DivisionScheme) error {
	if scheme != repository.DivisionFormerV3 && scheme != repository.DivisionCurrentV2 {
		return apperr.New(apperr.CodeValidation, "invalid division_scheme")
	}
	return nil
}

func ParseScheme(raw string) (repository.DivisionScheme, error) {
	scheme := repository.DivisionScheme(strings.TrimSpace(raw))
	if err := validateScheme(scheme); err != nil {
		return "", err
	}
	return scheme, nil
}
