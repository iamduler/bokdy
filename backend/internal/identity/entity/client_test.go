package entity

import "testing"

func TestParseClient(t *testing.T) {
	tests := []struct {
		in      string
		want    Client
		wantErr bool
	}{
		{"player", ClientPlayer, false},
		{" Owner ", ClientOwner, false},
		{"ADMIN", ClientAdmin, false},
		{"", "", true},
		{"mobile", "", true},
	}
	for _, tt := range tests {
		got, err := ParseClient(tt.in)
		if tt.wantErr {
			if err == nil {
				t.Fatalf("ParseClient(%q) expected error", tt.in)
			}
			continue
		}
		if err != nil || got != tt.want {
			t.Fatalf("ParseClient(%q)=%q err=%v", tt.in, got, err)
		}
	}
}

func TestClientGates(t *testing.T) {
	if ClientAdmin.AllowsRegister() {
		t.Fatal("admin must not register")
	}
	if !ClientPlayer.AllowsRegister() || !ClientOwner.AllowsRegister() {
		t.Fatal("player/owner register")
	}
	if !ClientAdmin.AllowsLogin(true) || ClientAdmin.AllowsLogin(false) {
		t.Fatal("admin login requires system admin")
	}
	if ClientPlayer.AllowsLogin(true) || !ClientPlayer.AllowsLogin(false) {
		t.Fatal("player login rejects system admin")
	}
	if ClientOwner.AllowsLogin(true) {
		t.Fatal("owner login rejects system admin")
	}
}

func TestParseThemeAndDateFormat(t *testing.T) {
	if _, ok := ParseTheme("dark"); !ok {
		t.Fatal("theme dark")
	}
	if _, ok := ParseTheme("neon"); ok {
		t.Fatal("theme neon")
	}
	if _, ok := ParseDateFormat("dmy"); !ok {
		t.Fatal("date dmy")
	}
	if _, ok := ParseDateFormat("iso"); ok {
		t.Fatal("date iso")
	}
}
