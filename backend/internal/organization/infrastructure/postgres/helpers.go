package postgres

import "github.com/google/uuid"

func nullStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func nullUUID(id *uuid.UUID) *uuid.UUID {
	if id == nil || *id == uuid.Nil {
		return nil
	}
	return id
}

func uuidPtr(id uuid.UUID) *uuid.UUID {
	return &id
}
