package postgres

import "github.com/google/uuid"

func nullStr(s string) any {
	if s == "" {
		return nil
	}
	return s
}

func nullUUID(id *uuid.UUID) any {
	if id == nil || *id == uuid.Nil {
		return nil
	}
	return *id
}
