package repository

import (
	"context"

	"github.com/google/uuid"
)

type Locale struct {
	ID         uuid.UUID
	Code       string
	Name       string
	NativeName string
	Emoji      string
	IsDefault  bool
}

type LocaleRepository interface {
	ListActive(ctx context.Context) ([]Locale, error)
}
