package service

import (
	"testing"
	"time"

	"bokdy/internal/scheduling/entity"

	"github.com/google/uuid"
)

func TestDayWindowWeeklyAndHoliday(t *testing.T) {
	day := time.Date(2026, 8, 14, 0, 0, 0, 0, time.UTC) // Friday
	opens := time.Date(0, 1, 1, 8, 0, 0, 0, time.UTC)
	closes := time.Date(0, 1, 1, 22, 0, 0, 0, time.UTC)
	hours := map[entity.Weekday]entity.BusinessHour{
		entity.Weekday(day.Weekday()): {Weekday: entity.Weekday(day.Weekday()), OpensAt: opens, ClosesAt: closes},
	}

	o, c, closed := dayWindow(day, entity.Weekday(day.Weekday()), hours, nil)
	if closed || !o.Equal(combine(day, opens)) || !c.Equal(combine(day, closes)) {
		t.Fatalf("weekly window: closed=%v open=%v close=%v", closed, o, c)
	}

	holidays := []entity.SpecialSchedule{{
		StartsAt: day, EndsAt: day.Add(24 * time.Hour), IsClosed: true,
	}}
	_, _, closed = dayWindow(day, entity.Weekday(day.Weekday()), hours, holidays)
	if !closed {
		t.Fatal("expected closed holiday")
	}

	specialOpen := time.Date(0, 1, 1, 10, 0, 0, 0, time.UTC)
	specialClose := time.Date(0, 1, 1, 14, 0, 0, 0, time.UTC)
	holidays = []entity.SpecialSchedule{{
		StartsAt: day, EndsAt: day.Add(24 * time.Hour), IsClosed: false,
		OpensAt: &specialOpen, ClosesAt: &specialClose,
	}}
	o, c, closed = dayWindow(day, entity.Weekday(day.Weekday()), hours, holidays)
	if closed || o.Hour() != 10 || c.Hour() != 14 {
		t.Fatalf("special hours: closed=%v open=%v close=%v", closed, o, c)
	}
}

func TestBuildDaySlotsBlocks(t *testing.T) {
	day := time.Date(2026, 8, 14, 0, 0, 0, 0, time.UTC)
	opens := time.Date(0, 1, 1, 9, 0, 0, 0, time.UTC)
	closes := time.Date(0, 1, 1, 11, 0, 0, 0, time.UTC)
	hours := map[entity.Weekday]entity.BusinessHour{
		entity.Weekday(day.Weekday()): {OpensAt: opens, ClosesAt: closes},
	}
	courtID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	blockStart := combine(day, time.Date(0, 1, 1, 9, 0, 0, 0, time.UTC))
	blockEnd := combine(day, time.Date(0, 1, 1, 10, 0, 0, 0, time.UTC))
	blocks := []entity.ResourceBlock{{
		ResourceID: courtID, StartsAt: blockStart, EndsAt: blockEnd, BlockType: entity.BlockManual,
	}}
	slots, avail, occ := buildDaySlots(day, hours, nil, blocks, courtID, 60, true, time.Now().UTC())
	if len(slots) != 2 {
		t.Fatalf("want 2 slots got %d", len(slots))
	}
	if slots[0].IsAvailable || !slots[1].IsAvailable {
		t.Fatalf("slot availability: %+v %+v", slots[0], slots[1])
	}
	if avail != 60 || occ != 60 {
		t.Fatalf("minutes avail=%d occ=%d", avail, occ)
	}
	slots, avail, occ = buildDaySlots(day, hours, nil, nil, courtID, 60, false, time.Now().UTC())
	if len(slots) != 0 || avail != 0 || occ != 0 {
		t.Fatal("inactive court should yield no slots")
	}
}
