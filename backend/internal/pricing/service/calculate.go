package service

import (
	"math"
	"time"

	"bokdy/internal/pricing/entity"

	"github.com/google/uuid"
)

func roundVND(x float64) float64 {
	return math.Round(x)
}

func containsWeekday(days []int16, dow int) bool {
	for _, d := range days {
		if int(d) == dow {
			return true
		}
	}
	return false
}

func calculateQuote(
	hourlyRate float64,
	rules []entity.TimeRule,
	versionID, courtID uuid.UUID,
	starts, ends time.Time,
) entity.Quote {
	durationMin := int(ends.Sub(starts).Minutes())
	if durationMin < 0 {
		durationMin = 0
	}
	hours := float64(durationMin) / 60.0
	base := hourlyRate * hours
	var adjs []entity.QuoteAdjustment
	adjTotal := 0.0

	for _, rule := range rules {
		overlap := overlapMinutes(starts, ends, rule)
		if overlap <= 0 {
			continue
		}
		portionHours := float64(overlap) / 60.0
		portionBase := hourlyRate * portionHours
		var amt float64
		switch rule.ValueType {
		case entity.ValuePercentage:
			amt = portionBase * (rule.Value / 100.0)
		default:
			amt = rule.Value * portionHours
		}
		if rule.AdjustmentType == entity.AdjDiscount {
			amt = -amt
		}
		adjs = append(adjs, entity.QuoteAdjustment{
			RuleID: rule.ID, AdjustmentType: rule.AdjustmentType, ValueType: rule.ValueType,
			Value: rule.Value, OverlapMinutes: overlap, Amount: roundVND(amt),
		})
		adjTotal += amt
	}

	total := roundVND(base + adjTotal)
	if total < 0 {
		total = 0
	}
	return entity.Quote{
		Currency: entity.DefaultCurrency, BaseAmount: roundVND(base), Adjustments: adjs,
		TotalAmount: total, PriceVersionID: versionID, CourtID: courtID,
		StartsAt: starts, EndsAt: ends, DurationMin: durationMin,
	}
}

func overlapMinutes(bookingStart, bookingEnd time.Time, rule entity.TimeRule) int {
	total := 0
	day := time.Date(bookingStart.Year(), bookingStart.Month(), bookingStart.Day(), 0, 0, 0, 0, time.UTC)
	endDay := time.Date(bookingEnd.Year(), bookingEnd.Month(), bookingEnd.Day(), 0, 0, 0, 0, time.UTC)
	for d := day; !d.After(endDay); d = d.AddDate(0, 0, 1) {
		if !containsWeekday(rule.Weekdays, int(d.Weekday())) {
			continue
		}
		winStart := time.Date(d.Year(), d.Month(), d.Day(), rule.StartsAt.Hour(), rule.StartsAt.Minute(), rule.StartsAt.Second(), 0, time.UTC)
		winEnd := time.Date(d.Year(), d.Month(), d.Day(), rule.EndsAt.Hour(), rule.EndsAt.Minute(), rule.EndsAt.Second(), 0, time.UTC)
		start := maxTime(bookingStart, winStart)
		end := minTime(bookingEnd, winEnd)
		if end.After(start) {
			total += int(end.Sub(start).Minutes())
		}
	}
	return total
}

func maxTime(a, b time.Time) time.Time {
	if a.After(b) {
		return a
	}
	return b
}

func minTime(a, b time.Time) time.Time {
	if a.Before(b) {
		return a
	}
	return b
}
