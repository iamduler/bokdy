package postgres

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func nullStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func uuidPtr(id uuid.UUID) *uuid.UUID {
	return &id
}

func toPgTime(t time.Time) pgtype.Time {
	d := time.Duration(t.Hour())*time.Hour +
		time.Duration(t.Minute())*time.Minute +
		time.Duration(t.Second())*time.Second
	return pgtype.Time{Microseconds: d.Microseconds(), Valid: true}
}

func toPgTimePtr(t *time.Time) pgtype.Time {
	if t == nil {
		return pgtype.Time{}
	}
	return toPgTime(*t)
}

func fromPgTime(t pgtype.Time) time.Time {
	if !t.Valid {
		return time.Time{}
	}
	return time.Unix(0, 0).UTC().Add(time.Duration(t.Microseconds) * time.Microsecond)
}

func fromPgTimePtr(t pgtype.Time) *time.Time {
	if !t.Valid {
		return nil
	}
	v := fromPgTime(t)
	return &v
}

func toPgDate(t time.Time) pgtype.Date {
	return pgtype.Date{Time: time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC), Valid: true}
}
