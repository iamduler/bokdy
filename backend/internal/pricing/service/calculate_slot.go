package service

import (
	"encoding/json"
	"time"
	_ "time/tzdata"

	"bokdy/internal/pricing/entity"
	pricingerrors "bokdy/internal/pricing/errors"

	"github.com/google/uuid"
)

const defaultBranchTimezone = "Asia/Ho_Chi_Minh"

func branchLocation(tz string) *time.Location {
	if tz == "" {
		tz = defaultBranchTimezone
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		loc, err = time.LoadLocation(defaultBranchTimezone)
		if err != nil {
			return time.FixedZone("ICT", 7*60*60)
		}
	}
	return loc
}

func clockMinutes(t time.Time) int {
	return t.Hour()*60 + t.Minute()
}

type slotQuoteContext struct {
	Unlimited      bool
	HolidayDates   map[string]struct{}
	HolidayWindows []entity.HolidayWindow
}

func calculateSlotQuote(
	base float64,
	slotMin int,
	allowed []int,
	rules []entity.TimeRule,
	loc *time.Location,
	versionID, courtID uuid.UUID,
	starts, ends time.Time,
	quoteCtx slotQuoteContext,
) (entity.Quote, error) {
	starts, ends = starts.UTC(), ends.UTC()
	localStart := starts.In(loc)
	durationMin := int(ends.Sub(starts).Minutes())
	if localStart.Second() != 0 || localStart.Nanosecond() != 0 || clockMinutes(localStart)%slotMin != 0 {
		return entity.Quote{}, pricingerrors.ErrSlotMisaligned
	}
	if durationMin <= 0 || durationMin%slotMin != 0 || durationMin > 24*60 {
		return entity.Quote{}, pricingerrors.ErrInvalidDuration
	}
	if !quoteCtx.Unlimited && !containsInt(allowed, durationMin) {
		return entity.Quote{}, pricingerrors.ErrDurationNotAllowed
	}

	lines := make([]entity.QuoteLine, 0, durationMin/slotMin)
	var total float64
	for offset := 0; offset < durationMin; offset += slotMin {
		slotStart := starts.Add(time.Duration(offset) * time.Minute)
		slotEnd := slotStart.Add(time.Duration(slotMin) * time.Minute)
		amount, ruleID, windowName, err := slotPrice(slotStart.In(loc), base, rules, quoteCtx)
		if err != nil {
			return entity.Quote{}, err
		}
		lines = append(lines, entity.QuoteLine{
			StartsAt: slotStart, EndsAt: slotEnd, Amount: roundVND(amount), RuleID: ruleID, WindowName: windowName,
		})
		total += amount
	}
	q := entity.Quote{
		Currency: entity.DefaultCurrency, BaseAmount: roundVND(total), Lines: lines,
		TotalAmount: roundVND(total), PriceVersionID: versionID, CourtID: courtID,
		StartsAt: starts, EndsAt: ends, DurationMin: durationMin,
		Timezone: loc.String(), SlotUnitMinutes: slotMin,
	}
	q.Snapshot = quoteSnapshot(q, "slot")
	return q, nil
}

func slotPrice(local time.Time, base float64, rules []entity.TimeRule, quoteCtx slotQuoteContext) (float64, *uuid.UUID, string, error) {
	if _, holiday := quoteCtx.HolidayDates[local.Format("2006-01-02")]; holiday {
		return holidaySlotPrice(local, base, quoteCtx.HolidayWindows)
	}
	weekday := int16(local.Weekday())
	clock := clockMinutes(local)
	var amount *float64
	var ruleID *uuid.UUID
	var windowName string
	for i := range rules {
		rule := &rules[i]
		if rule.SlotAmount == nil || !containsWeekday(rule.Weekdays, int(weekday)) {
			continue
		}
		open, close := clockMinutes(rule.StartsAt), clockMinutes(rule.EndsAt)
		if clock < open || clock >= close {
			continue
		}
		if amount != nil && *amount != *rule.SlotAmount {
			return 0, nil, "", pricingerrors.ErrPricingConflict
		}
		value := *rule.SlotAmount
		amount = &value
		id := rule.ID
		ruleID = &id
		windowName = rule.Name
	}
	if amount == nil {
		return base, nil, "", nil
	}
	return *amount, ruleID, windowName, nil
}

func holidaySlotPrice(local time.Time, base float64, windows []entity.HolidayWindow) (float64, *uuid.UUID, string, error) {
	clock := clockMinutes(local)
	var amount *float64
	var ruleID *uuid.UUID
	var windowName string
	for i := range windows {
		window := &windows[i]
		open, close := clockMinutes(window.StartsAt), clockMinutes(window.EndsAt)
		if clock < open || clock >= close {
			continue
		}
		if amount != nil && *amount != window.Amount {
			return 0, nil, "", pricingerrors.ErrPricingConflict
		}
		value := window.Amount
		amount = &value
		id := window.ID
		ruleID = &id
		windowName = window.Name
	}
	if amount == nil {
		return base, nil, "", nil
	}
	return *amount, ruleID, windowName, nil
}

func containsInt(values []int, want int) bool {
	for _, v := range values {
		if v == want {
			return true
		}
	}
	return false
}

func quoteSnapshot(q entity.Quote, engine string) []byte {
	lines := make([]map[string]any, 0, len(q.Lines))
	for _, line := range q.Lines {
		item := map[string]any{
			"starts_at": line.StartsAt.UTC().Format(time.RFC3339),
			"ends_at":   line.EndsAt.UTC().Format(time.RFC3339),
			"amount":    line.Amount,
		}
		if line.RuleID != nil {
			item["rule_id"] = line.RuleID.String()
		}
		if line.WindowName != "" {
			item["window_name"] = line.WindowName
		}
		lines = append(lines, item)
	}
	raw, err := json.Marshal(map[string]any{
		"engine":            engine,
		"timezone":          q.Timezone,
		"slot_unit_minutes": q.SlotUnitMinutes,
		"price_version_id":  q.PriceVersionID.String(),
		"currency":          q.Currency,
		"total_amount":      q.TotalAmount,
		"lines":             lines,
	})
	if err != nil {
		return []byte(`{}`)
	}
	return raw
}
