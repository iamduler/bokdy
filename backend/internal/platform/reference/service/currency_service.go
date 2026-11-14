package service

import (
	"context"

	"bokdy/internal/platform/reference/repository"
)

type CurrencyService struct {
	currencies repository.CurrencyRepository
}

func NewCurrencyService(currencies repository.CurrencyRepository) *CurrencyService {
	return &CurrencyService{currencies: currencies}
}

func (s *CurrencyService) ListActive(ctx context.Context) ([]repository.Currency, error) {
	if s == nil || s.currencies == nil {
		return nil, nil
	}
	return s.currencies.ListActive(ctx)
}
