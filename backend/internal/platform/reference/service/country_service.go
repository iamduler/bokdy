package service

import (
	"context"

	"bokdy/internal/platform/reference/repository"
)

type CountryService struct {
	countries repository.CountryRepository
}

func NewCountryService(countries repository.CountryRepository) *CountryService {
	return &CountryService{countries: countries}
}

func (s *CountryService) ListActive(ctx context.Context) ([]repository.Country, error) {
	if s == nil || s.countries == nil {
		return nil, nil
	}
	return s.countries.ListActive(ctx)
}
