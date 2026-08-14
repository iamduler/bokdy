package entity

import "testing"

func TestParseOrganizationStatus(t *testing.T) {
	cases := []struct {
		raw  string
		want OrganizationStatus
		ok   bool
	}{
		{"active", OrganizationActive, true},
		{"inactive", OrganizationInactive, true},
		{"suspended", OrganizationSuspended, true},
		{"archived", OrganizationArchived, true},
		{"trial", "", false},
		{"", "", false},
	}
	for _, tc := range cases {
		got, ok := ParseOrganizationStatus(tc.raw)
		if ok != tc.ok || got != tc.want {
			t.Fatalf("%q: got (%q,%v) want (%q,%v)", tc.raw, got, ok, tc.want, tc.ok)
		}
	}
}

func TestOrganizationTransitions(t *testing.T) {
	active := &Organization{Status: OrganizationActive}
	if !active.CanSuspend() || active.CanRestore() || active.BlocksActivate() || !active.IsOperable() {
		t.Fatal("active guards")
	}
	suspended := &Organization{Status: OrganizationSuspended}
	if suspended.CanSuspend() || !suspended.CanRestore() || !suspended.BlocksActivate() || suspended.IsOperable() {
		t.Fatal("suspended guards")
	}
	inactive := &Organization{Status: OrganizationInactive}
	if inactive.CanSuspend() || inactive.IsOperable() || inactive.BlocksActivate() {
		t.Fatal("inactive guards")
	}
}

func TestTenantOperable(t *testing.T) {
	if !(&Tenant{Status: TenantTrial}).IsOperable() {
		t.Fatal("trial is operable")
	}
	if !(&Tenant{Status: TenantActive}).IsOperable() {
		t.Fatal("active is operable")
	}
	if (&Tenant{Status: TenantSuspended}).IsOperable() || !(&Tenant{Status: TenantSuspended}).BlocksActivate() {
		t.Fatal("suspended tenant")
	}
	if (&Tenant{Status: TenantCanceled}).IsOperable() {
		t.Fatal("canceled tenant")
	}
}
