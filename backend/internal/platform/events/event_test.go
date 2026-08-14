package events

import "testing"

func TestActionForEvent(t *testing.T) {
	cases := []struct {
		event string
		want  string
	}{
		{"UserRegistered", "created"},
		{"UserProfileUpdated", "updated"},
		{"UserVerified", "status_change"},
		{"UserLoggedIn", "login"},
		{"UserLoginFailed", "login"},
		{"UserLoggedOut", "logout"},
		{"SessionRefreshed", "login"},
		{"PasswordReset", "updated"},
		{"OrganizationCreated", "created"},
		{"BranchCreated", "created"},
		{"BranchOpened", "status_change"},
		{"InvitationRejected", "status_change"},
		{"CustomerRegistered", "created"},
		{"CustomerUpdated", "updated"},
		{"CustomerBlacklisted", "status_change"},
		{"CustomerRestored", "status_change"},
		{"CourtCreated", "created"},
		{"CourtTypeUpdated", "updated"},
		{"CourtOpened", "status_change"},
		{"CourtMaintenanceScheduled", "status_change"},
		{"WeeklyScheduleUpdated", "updated"},
		{"TimeBlocked", "created"},
		{"TimeUnblocked", "deleted"},
		{"AvailabilitySynchronized", "updated"},
		{"PricingVersionCreated", "created"},
		{"PricingVersionPublished", "updated"},
		{"PricingVersionArchived", "deleted"},
		{"ReservationCreated", "created"},
		{"ReservationCanceled", "status_change"},
		{"ReservationExpired", "status_change"},
		{"ReservationConverted", "status_change"},
		{"BookingCreated", "created"},
		{"BookingConfirmed", "status_change"},
		{"BookingCheckedIn", "status_change"},
		{"BookingCompleted", "status_change"},
		{"BookingCanceled", "status_change"},
		{"BookingExpired", "status_change"},
		{"BookingRescheduled", "updated"},
		{"BookingPriceCalculated", "updated"},
		{"InvoiceIssued", "created"},
		{"PaymentCreated", "created"},
		{"PaymentSucceeded", "status_change"},
		{"PaymentFailed", "status_change"},
		{"PaymentExpired", "status_change"},
		{"PaymentRefunded", "created"},
		{"InvoicePaid", "status_change"},
		{"InvoiceVoided", "status_change"},
		{"RoleRemoved", "deleted"},
		{"UnknownFact", "other"},
	}
	for _, tc := range cases {
		if got := ActionForEvent(tc.event); got != tc.want {
			t.Fatalf("%s: got %q want %q", tc.event, got, tc.want)
		}
	}
}
