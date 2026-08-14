package entity

import (
	"testing"
	"time"
)

func TestReservationTransitionGuards(t *testing.T) {
	cases := []struct {
		status       Status
		wantCancel   bool
		wantConverts bool
	}{
		{StatusPending, true, true},
		{StatusConverted, false, false},
		{StatusCanceled, false, false},
		{StatusExpired, false, false},
	}
	for _, tc := range cases {
		r := &Reservation{Status: tc.status}
		if got := r.CanCancel(); got != tc.wantCancel {
			t.Fatalf("%s CanCancel: got %v want %v", tc.status, got, tc.wantCancel)
		}
		if got := r.CanConvert(); got != tc.wantConverts {
			t.Fatalf("%s CanConvert: got %v want %v", tc.status, got, tc.wantConverts)
		}
	}
}

func TestReservationHasExpired(t *testing.T) {
	now := time.Date(2026, 8, 14, 10, 0, 0, 0, time.UTC)
	r := &Reservation{ExpiresAt: now.Add(HoldTTL)}
	if r.HasExpired(now) {
		t.Fatal("fresh hold must not be expired")
	}
	if r.HasExpired(now.Add(HoldTTL)) {
		t.Fatal("hold must survive until the TTL boundary")
	}
	if !r.HasExpired(now.Add(HoldTTL + time.Second)) {
		t.Fatal("hold must expire past the TTL")
	}
}

func TestCourtAcceptsHolds(t *testing.T) {
	cases := map[string]bool{
		"active":      true,
		"inactive":    false,
		"maintenance": false,
		"archived":    false,
	}
	for status, want := range cases {
		court := &CourtRef{Status: status}
		if got := court.AcceptsHolds(); got != want {
			t.Fatalf("%s: got %v want %v", status, got, want)
		}
	}
}

func TestParseSource(t *testing.T) {
	cases := []struct {
		raw  string
		want Source
		ok   bool
	}{
		{"web", SourceWeb, true},
		{"mobile", SourceMobile, true},
		{"staff", SourceStaff, true},
		{"api", SourceAPI, true},
		{"admin", SourceAdmin, true},
		{"pigeon", "", false},
		{"", "", false},
	}
	for _, tc := range cases {
		got, ok := ParseSource(tc.raw)
		if ok != tc.ok || got != tc.want {
			t.Fatalf("%q: got (%q,%v) want (%q,%v)", tc.raw, got, ok, tc.want, tc.ok)
		}
	}
}

func TestNumberFor(t *testing.T) {
	if got := NumberFor("01J8ZXKQ9M4T7VB2C3D4E5F6G7"); got != "RSV-01J8ZXKQ9M" {
		t.Fatalf("got %q", got)
	}
	if got := NumberFor("SHORT"); got != "RSV-SHORT" {
		t.Fatalf("got %q", got)
	}
}
