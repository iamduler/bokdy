package entity

import "testing"

func TestBookingTransitionGuards(t *testing.T) {
	cases := []struct {
		status       Status
		confirm      bool
		checkIn      bool
		complete     bool
		cancel       bool
		reschedule   bool
		occupiesTime bool
	}{
		{StatusPending, true, false, false, true, true, true},
		{StatusConfirmed, false, true, true, true, true, true},
		{StatusCheckedIn, false, false, true, true, false, true},
		{StatusInProgress, false, false, true, false, false, true},
		{StatusCompleted, false, false, false, false, false, false},
		{StatusCanceled, false, false, false, false, false, false},
	}
	for _, tc := range cases {
		b := &Booking{Status: tc.status}
		if got := b.CanConfirm(); got != tc.confirm {
			t.Fatalf("%s CanConfirm: got %v want %v", tc.status, got, tc.confirm)
		}
		if got := b.CanCheckIn(); got != tc.checkIn {
			t.Fatalf("%s CanCheckIn: got %v want %v", tc.status, got, tc.checkIn)
		}
		if got := b.CanComplete(); got != tc.complete {
			t.Fatalf("%s CanComplete: got %v want %v", tc.status, got, tc.complete)
		}
		if got := b.CanCancel(); got != tc.cancel {
			t.Fatalf("%s CanCancel: got %v want %v", tc.status, got, tc.cancel)
		}
		if got := b.CanReschedule(); got != tc.reschedule {
			t.Fatalf("%s CanReschedule: got %v want %v", tc.status, got, tc.reschedule)
		}
		if got := b.OccupiesCourt(); got != tc.occupiesTime {
			t.Fatalf("%s OccupiesCourt: got %v want %v", tc.status, got, tc.occupiesTime)
		}
	}
}

func TestParseStatus(t *testing.T) {
	cases := []struct {
		raw  string
		want Status
		ok   bool
	}{
		{"pending", StatusPending, true},
		{"confirmed", StatusConfirmed, true},
		{"checked_in", StatusCheckedIn, true},
		{"in_progress", StatusInProgress, true},
		{"completed", StatusCompleted, true},
		{"canceled", StatusCanceled, true},
		{"cancelled", "", false},
		{"expired", "", false},
		{"", "", false},
	}
	for _, tc := range cases {
		got, ok := ParseStatus(tc.raw)
		if ok != tc.ok || got != tc.want {
			t.Fatalf("%q: got (%q,%v) want (%q,%v)", tc.raw, got, ok, tc.want, tc.ok)
		}
	}
}

func TestCourtAcceptsBookings(t *testing.T) {
	cases := map[string]bool{
		"active":      true,
		"inactive":    false,
		"maintenance": false,
		"archived":    false,
	}
	for status, want := range cases {
		court := &CourtRef{Status: status}
		if got := court.AcceptsBookings(); got != want {
			t.Fatalf("%s: got %v want %v", status, got, want)
		}
	}
}

func TestNumberFor(t *testing.T) {
	if got := NumberFor("01J8ZXKQ9M4T7VB2C3D4E5F6G7"); got != "BKG-01J8ZXKQ9M" {
		t.Fatalf("got %q", got)
	}
	if got := InvoiceNumberFor("01J8ZXKQ9M4T7VB2C3D4E5F6G7"); got != "INV-01J8ZXKQ9M" {
		t.Fatalf("got %q", got)
	}
}
