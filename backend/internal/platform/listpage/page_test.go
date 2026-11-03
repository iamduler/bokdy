package listpage

import (
	"errors"
	"testing"

	"bokdy/internal/platform/apperr"
)

func TestParseClampsLimitAndRejectsBadPage(t *testing.T) {
	allowed := []string{"created_at", "name"}

	q, err := Parse("", "", "", "", allowed, "created_at")
	if err != nil {
		t.Fatal(err)
	}
	if q.Limit != DefaultLimit || q.Offset != 0 || q.Sort != "created_at" || !q.Desc {
		t.Fatalf("defaults: %+v", q)
	}

	q, err = Parse("200", "40", "name", "asc", allowed, "created_at")
	if err != nil {
		t.Fatal(err)
	}
	if q.Limit != MaxLimit || q.Offset != 40 || q.Sort != "name" || q.Desc {
		t.Fatalf("clamped: %+v", q)
	}

	if _, err = Parse("20", "-1", "", "", allowed, "created_at"); !isValidation(err) {
		t.Fatalf("negative offset: %v", err)
	}
	if _, err = Parse("20", "nope", "", "", allowed, "created_at"); !isValidation(err) {
		t.Fatalf("bad offset: %v", err)
	}
	if _, err = Parse("20", "0", "nope", "", allowed, "created_at"); !isValidation(err) {
		t.Fatalf("bad sort: %v", err)
	}
	if _, err = Parse("abc", "0", "", "", allowed, "created_at"); !isValidation(err) {
		t.Fatalf("bad limit: %v", err)
	}
}

func isValidation(err error) bool {
	var app *apperr.Error
	return errors.As(err, &app) && app.Code == apperr.CodeValidation
}
