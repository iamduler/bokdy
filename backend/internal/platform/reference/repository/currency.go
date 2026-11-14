package repository

import "context"

type Currency struct {
	Code      string
	NameEn    string
	NameVi    string
	Symbol    string
	IsDefault bool
}

type CurrencyRepository interface {
	ListActive(ctx context.Context) ([]Currency, error)
}
