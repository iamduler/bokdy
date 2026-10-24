package postgres

import (
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
)

func toNumericGeo(v float64) pgtype.Numeric {
	var n pgtype.Numeric
	_ = n.Scan(fmt.Sprintf("%.7f", v))
	return n
}

func fromNumericPtr(n pgtype.Numeric) *float64 {
	if !n.Valid {
		return nil
	}
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return nil
	}
	v := f.Float64
	return &v
}

func toNumericGeoPtr(v *float64) pgtype.Numeric {
	if v == nil {
		return pgtype.Numeric{}
	}
	return toNumericGeo(*v)
}
