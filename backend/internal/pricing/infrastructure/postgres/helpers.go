package postgres

import (
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

func nullStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func toPgTime(t time.Time) pgtype.Time {
	d := time.Duration(t.Hour())*time.Hour +
		time.Duration(t.Minute())*time.Minute +
		time.Duration(t.Second())*time.Second
	return pgtype.Time{Microseconds: d.Microseconds(), Valid: true}
}

func fromPgTime(t pgtype.Time) time.Time {
	if !t.Valid {
		return time.Time{}
	}
	return time.Unix(0, 0).UTC().Add(time.Duration(t.Microseconds) * time.Microsecond)
}

func toNumeric(v float64) pgtype.Numeric {
	var n pgtype.Numeric
	_ = n.Scan(fmt.Sprintf("%.2f", v))
	return n
}

func fromNumeric(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return 0
	}
	return f.Float64
}
