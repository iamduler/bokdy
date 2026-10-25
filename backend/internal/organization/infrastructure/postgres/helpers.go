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

func toInt32Ptr(v *int) *int32 {
	if v == nil {
		return nil
	}
	n := int32(*v)
	return &n
}

func fromInt32Ptr(v *int32) *int {
	if v == nil {
		return nil
	}
	n := int(*v)
	return &n
}
