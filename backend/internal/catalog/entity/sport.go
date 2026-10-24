package entity

import (
	"time"

	"github.com/google/uuid"
)

type Sport struct {
	ID        uuid.UUID
	Code      string
	NameEn    string
	NameVi    string
	Icon      string
	CreatedAt time.Time
	UpdatedAt time.Time
}
