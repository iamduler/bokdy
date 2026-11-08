package service

import (
	"testing"
	"time"

	"bokdy/internal/pricing/entity"
	pricingerrors "bokdy/internal/pricing/errors"

	"github.com/google/uuid"
)

func TestSlotQuoteAcrossWindows(t *testing.T) {
	loc := branchLocation("Asia/Ho_Chi_Minh")
	// 15:30–17:00 +07 is 08:30–10:00 UTC.
	starts := time.Date(2026, 11, 10, 8, 30, 0, 0, time.UTC)
	ends := time.Date(2026, 11, 10, 10, 0, 0, 0, time.UTC)
	day := int16(starts.In(loc).Weekday())
	low, high := 40_000.0, 60_000.0
	rules := []entity.TimeRule{
		{ID: uuid.New(), Weekdays: []int16{day}, StartsAt: clock(6, 0), EndsAt: clock(16, 0), SlotAmount: &low},
		{ID: uuid.New(), Weekdays: []int16{day}, StartsAt: clock(16, 0), EndsAt: clock(22, 0), SlotAmount: &high},
	}
	q, err := calculateSlotQuote(40_000, 30, []int{30, 60, 90, 120}, rules, loc, uuid.New(), uuid.New(), starts, ends, slotQuoteContext{})
	if err != nil {
		t.Fatal(err)
	}
	if q.TotalAmount != 160_000 || len(q.Lines) != 3 {
		t.Fatalf("total=%v lines=%d", q.TotalAmount, len(q.Lines))
	}
	if q.Lines[0].Amount != 40_000 || q.Lines[1].Amount != 60_000 || q.Lines[2].Amount != 60_000 {
		t.Fatalf("lines=%+v", q.Lines)
	}
}

func TestSlotQuoteRejectsUnalignedStart(t *testing.T) {
	loc := branchLocation("Asia/Ho_Chi_Minh")
	starts := time.Date(2026, 11, 10, 8, 15, 0, 0, time.UTC)
	ends := starts.Add(30 * time.Minute)
	_, err := calculateSlotQuote(40_000, 30, []int{30}, nil, loc, uuid.New(), uuid.New(), starts, ends, slotQuoteContext{})
	if err != pricingerrors.ErrSlotMisaligned {
		t.Fatalf("err=%v", err)
	}
}

func TestSlotQuoteConflict(t *testing.T) {
	loc := time.UTC
	starts := time.Date(2026, 11, 10, 10, 0, 0, 0, time.UTC)
	ends := starts.Add(30 * time.Minute)
	day := int16(starts.Weekday())
	a, b := 10_000.0, 20_000.0
	rules := []entity.TimeRule{
		{ID: uuid.New(), Weekdays: []int16{day}, StartsAt: clock(9, 0), EndsAt: clock(12, 0), SlotAmount: &a},
		{ID: uuid.New(), Weekdays: []int16{day}, StartsAt: clock(9, 0), EndsAt: clock(12, 0), SlotAmount: &b},
	}
	_, err := calculateSlotQuote(10_000, 30, []int{30}, rules, loc, uuid.New(), uuid.New(), starts, ends, slotQuoteContext{})
	if err != pricingerrors.ErrPricingConflict {
		t.Fatalf("err=%v", err)
	}
}

func TestSlotQuoteHolidayReplacesWeekday(t *testing.T) {
	loc := branchLocation("Asia/Ho_Chi_Minh")
	starts := time.Date(2026, 1, 1, 1, 0, 0, 0, time.UTC) // 08:00 ICT
	ends := starts.Add(30 * time.Minute)
	day := int16(starts.In(loc).Weekday())
	weekday := 40_000.0
	holidayID := uuid.New()
	rules := []entity.TimeRule{{
		ID: uuid.New(), Name: "Ngày thường", Weekdays: []int16{day},
		StartsAt: clock(6, 0), EndsAt: clock(22, 0), SlotAmount: &weekday,
	}}
	q, err := calculateSlotQuote(40_000, 30, []int{30}, rules, loc, uuid.New(), uuid.New(), starts, ends, slotQuoteContext{
		HolidayDates: map[string]struct{}{"2026-01-01": {}},
		HolidayWindows: []entity.HolidayWindow{{
			ID: holidayID, Name: "Tết", StartsAt: clock(6, 0), EndsAt: clock(22, 0), Amount: 80_000,
		}},
	})
	if err != nil {
		t.Fatal(err)
	}
	if q.TotalAmount != 80_000 || q.Lines[0].WindowName != "Tết" || q.Lines[0].RuleID == nil || *q.Lines[0].RuleID != holidayID {
		t.Fatalf("quote=%+v", q.Lines)
	}
}

func TestSlotQuoteHolidayGapUsesBase(t *testing.T) {
	loc := branchLocation("Asia/Ho_Chi_Minh")
	starts := time.Date(2026, 1, 1, 1, 0, 0, 0, time.UTC)
	ends := starts.Add(30 * time.Minute)
	day := int16(starts.In(loc).Weekday())
	weekday := 40_000.0
	rules := []entity.TimeRule{{
		ID: uuid.New(), Weekdays: []int16{day}, StartsAt: clock(6, 0), EndsAt: clock(22, 0), SlotAmount: &weekday,
	}}
	q, err := calculateSlotQuote(25_000, 30, []int{30}, rules, loc, uuid.New(), uuid.New(), starts, ends, slotQuoteContext{
		HolidayDates: map[string]struct{}{"2026-01-01": {}},
		HolidayWindows: []entity.HolidayWindow{{
			ID: uuid.New(), Name: "Tối", StartsAt: clock(18, 0), EndsAt: clock(22, 0), Amount: 80_000,
		}},
	})
	if err != nil {
		t.Fatal(err)
	}
	if q.TotalAmount != 25_000 || q.Lines[0].RuleID != nil {
		t.Fatalf("quote=%+v", q.Lines)
	}
}

func TestSlotQuoteUnlimitedDuration(t *testing.T) {
	loc := time.UTC
	starts := time.Date(2026, 11, 10, 10, 0, 0, 0, time.UTC)
	ends := starts.Add(150 * time.Minute)
	q, err := calculateSlotQuote(10_000, 30, nil, nil, loc, uuid.New(), uuid.New(), starts, ends, slotQuoteContext{Unlimited: true})
	if err != nil || q.TotalAmount != 50_000 || len(q.Lines) != 5 {
		t.Fatalf("quote=%v err=%v lines=%d", q.TotalAmount, err, len(q.Lines))
	}
	_, err = calculateSlotQuote(10_000, 30, nil, nil, loc, uuid.New(), uuid.New(), starts, ends, slotQuoteContext{})
	if err != pricingerrors.ErrDurationNotAllowed {
		t.Fatalf("err=%v", err)
	}
}

func clock(hour, minute int) time.Time {
	return time.Date(0, 1, 1, hour, minute, 0, 0, time.UTC)
}
