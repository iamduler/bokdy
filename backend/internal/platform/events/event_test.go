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
		{"UnknownFact", "other"},
	}
	for _, tc := range cases {
		if got := ActionForEvent(tc.event); got != tc.want {
			t.Fatalf("%s: got %q want %q", tc.event, got, tc.want)
		}
	}
}
