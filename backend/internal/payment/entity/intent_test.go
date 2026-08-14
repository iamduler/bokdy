package entity

import (
	"testing"
	"time"
)

func TestParseMethod(t *testing.T) {
	cases := []struct {
		raw  string
		want MethodType
		ok   bool
	}{
		{"cash", MethodCash, true},
		{"mock", MethodMock, true},
		{"card", "", false},
		{"", "", false},
	}
	for _, tc := range cases {
		got, ok := ParseMethod(tc.raw)
		if ok != tc.ok || got != tc.want {
			t.Fatalf("%q: got (%q,%v) want (%q,%v)", tc.raw, got, ok, tc.want, tc.ok)
		}
	}
}

func TestIntentGuards(t *testing.T) {
	pending := &Intent{Status: IntentPending}
	if !pending.CanComplete() || !pending.CanFail() || pending.CanRefund() || !pending.IsOpen() {
		t.Fatal("pending guards")
	}
	ok := &Intent{Status: IntentSucceeded}
	if ok.CanComplete() || ok.CanFail() || !ok.CanRefund() || !ok.IsOpen() {
		t.Fatal("succeeded guards")
	}
	failed := &Intent{Status: IntentFailed}
	if failed.IsOpen() || failed.CanComplete() || failed.CanRefund() {
		t.Fatal("failed guards")
	}
}

func TestExpiresAtFor(t *testing.T) {
	now := time.Date(2026, 8, 14, 12, 0, 0, 0, time.UTC)
	got := ExpiresAtFor(now, nil)
	if !got.Equal(now.Add(IntentTTL)) {
		t.Fatalf("uncapped: got %s", got)
	}
	soon := now.Add(5 * time.Minute)
	got = ExpiresAtFor(now, &soon)
	if !got.Equal(soon) {
		t.Fatalf("capped: got %s", got)
	}
	later := now.Add(30 * time.Minute)
	got = ExpiresAtFor(now, &later)
	if !got.Equal(now.Add(IntentTTL)) {
		t.Fatalf("booking later than TTL: got %s", got)
	}
}

func TestIsExpiredAt(t *testing.T) {
	now := time.Date(2026, 8, 14, 12, 0, 0, 0, time.UTC)
	past := now.Add(-time.Second)
	i := &Intent{Status: IntentPending, ExpiresAt: &past}
	if !i.IsExpiredAt(now) {
		t.Fatal("expected expired")
	}
	future := now.Add(time.Minute)
	i.ExpiresAt = &future
	if i.IsExpiredAt(now) {
		t.Fatal("not expired yet")
	}
	i.Status = IntentSucceeded
	if i.IsExpiredAt(now) {
		t.Fatal("succeeded is not expired")
	}
}
