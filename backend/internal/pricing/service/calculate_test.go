package service

import (
	"testing"
	"time"

	"bokdy/internal/pricing/entity"

	"github.com/google/uuid"
)

func TestCalculateQuoteBaseAndPeak(t *testing.T) {
	courtID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	versionID := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	ruleID := uuid.MustParse("33333333-3333-3333-3333-333333333333")
	// Friday 2026-08-14 17:00–19:00 UTC; peak 18:00–22:00 Fri +100%/hour → 1h base@100k + 1h peak +100k = 300k?
	// base 2h * 100000 = 200000; overlap 60min with +100% of portion = +100000; total 300000
	starts := time.Date(2026, 8, 14, 17, 0, 0, 0, time.UTC)
	ends := time.Date(2026, 8, 14, 19, 0, 0, 0, time.UTC)
	rules := []entity.TimeRule{{
		ID: ruleID, Weekdays: []int16{5}, // Friday
		StartsAt:       time.Date(0, 1, 1, 18, 0, 0, 0, time.UTC),
		EndsAt:         time.Date(0, 1, 1, 22, 0, 0, 0, time.UTC),
		AdjustmentType: entity.AdjSurcharge, ValueType: entity.ValuePercentage, Value: 100,
	}}
	q := calculateQuote(100_000, rules, versionID, courtID, starts, ends)
	if q.BaseAmount != 200_000 {
		t.Fatalf("base=%v", q.BaseAmount)
	}
	if len(q.Adjustments) != 1 || q.Adjustments[0].Amount != 100_000 {
		t.Fatalf("adj=%+v", q.Adjustments)
	}
	if q.TotalAmount != 300_000 {
		t.Fatalf("total=%v", q.TotalAmount)
	}
}

func TestCalculateQuoteFixedSurcharge(t *testing.T) {
	starts := time.Date(2026, 8, 14, 10, 0, 0, 0, time.UTC)
	ends := time.Date(2026, 8, 14, 11, 0, 0, 0, time.UTC)
	rules := []entity.TimeRule{{
		ID: uuid.New(), Weekdays: []int16{5},
		StartsAt:       time.Date(0, 1, 1, 9, 0, 0, 0, time.UTC),
		EndsAt:         time.Date(0, 1, 1, 12, 0, 0, 0, time.UTC),
		AdjustmentType: entity.AdjSurcharge, ValueType: entity.ValueFixed, Value: 20_000,
	}}
	q := calculateQuote(50_000, rules, uuid.New(), uuid.New(), starts, ends)
	if q.BaseAmount != 50_000 || q.TotalAmount != 70_000 {
		t.Fatalf("got base=%v total=%v", q.BaseAmount, q.TotalAmount)
	}
}

func TestRoundVND(t *testing.T) {
	if roundVND(1.4) != 1 || roundVND(1.5) != 2 {
		t.Fatal("round")
	}
}
