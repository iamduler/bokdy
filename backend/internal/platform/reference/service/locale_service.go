package service

import (
	"context"

	"bokdy/internal/platform/reference/repository"
)

type LocaleService struct {
	locales repository.LocaleRepository
}

func NewLocaleService(locales repository.LocaleRepository) *LocaleService {
	return &LocaleService{locales: locales}
}

func (s *LocaleService) ListActive(ctx context.Context) ([]repository.Locale, error) {
	return s.locales.ListActive(ctx)
}
