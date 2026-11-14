package service

import (
	"context"

	"bokdy/internal/platform/reference/repository"
)

type TimezoneService struct {
	timezones repository.TimezoneRepository
}

func NewTimezoneService(timezones repository.TimezoneRepository) *TimezoneService {
	return &TimezoneService{timezones: timezones}
}

func (s *TimezoneService) ListActive(ctx context.Context) ([]repository.Timezone, error) {
	if s == nil || s.timezones == nil {
		return nil, nil
	}
	return s.timezones.ListActive(ctx)
}
