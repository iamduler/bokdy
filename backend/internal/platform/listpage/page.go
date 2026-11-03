package listpage

import (
	"strconv"
	"strings"

	"bokdy/internal/platform/apperr"
)

const (
	DefaultLimit = 50
	MaxLimit     = 100
)

type Query struct {
	Limit  int
	Offset int
	Sort   string
	Desc   bool
}

// Page is the list payload inside the HTTP `{ data }` envelope.
type Page[T any] struct {
	Items  []T `json:"items"`
	Total  int `json:"total"`
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
}

func New[T any](items []T, total, limit, offset int) Page[T] {
	if items == nil {
		items = []T{}
	}
	return Page[T]{Items: items, Total: total, Limit: limit, Offset: offset}
}

func Parse(limitRaw, offsetRaw, sort, order string, allowed []string, defaultSort string) (Query, error) {
	limit, err := parseLimit(limitRaw)
	if err != nil {
		return Query{}, err
	}
	offset, err := parseOffset(offsetRaw)
	if err != nil {
		return Query{}, err
	}
	key, desc, err := parseSort(sort, order, allowed, defaultSort)
	if err != nil {
		return Query{}, err
	}
	return Query{Limit: limit, Offset: offset, Sort: key, Desc: desc}, nil
}

func parseLimit(raw string) (int, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return DefaultLimit, nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return 0, apperr.New(apperr.CodeValidation, "invalid limit")
	}
	if n <= 0 {
		return DefaultLimit, nil
	}
	if n > MaxLimit {
		return MaxLimit, nil
	}
	return n, nil
}

func parseOffset(raw string) (int, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return 0, nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < 0 {
		return 0, apperr.New(apperr.CodeValidation, "invalid offset")
	}
	return n, nil
}

func parseSort(sort, order string, allowed []string, defaultSort string) (string, bool, error) {
	key := strings.TrimSpace(sort)
	if key == "" {
		key = defaultSort
	}
	ok := false
	for _, item := range allowed {
		if item == key {
			ok = true
			break
		}
	}
	if !ok {
		return "", false, apperr.New(apperr.CodeValidation, "invalid sort")
	}
	switch strings.ToLower(strings.TrimSpace(order)) {
	case "", "desc":
		return key, true, nil
	case "asc":
		return key, false, nil
	default:
		return "", false, apperr.New(apperr.CodeValidation, "invalid order")
	}
}
