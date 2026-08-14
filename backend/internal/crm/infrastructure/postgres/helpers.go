package postgres

import "github.com/google/uuid"

func nullStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func uuidPtr(id uuid.UUID) *uuid.UUID {
	return &id
}
