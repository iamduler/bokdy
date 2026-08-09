package apperr

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestEnvelopeCodesMatchCatalog(t *testing.T) {
	want := loadCatalog(t).Envelope
	got := make([]string, 0, len(EnvelopeCodes()))
	for _, c := range EnvelopeCodes() {
		got = append(got, string(c))
	}
	assertSameSet(t, "envelope", want, got)
}

type errorCatalog struct {
	Envelope []string `json:"envelope"`
	Details  []string `json:"details"`
}

func loadCatalog(t *testing.T) errorCatalog {
	t.Helper()
	path := findCatalog(t)
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var cat errorCatalog
	if err := json.Unmarshal(raw, &cat); err != nil {
		t.Fatal(err)
	}
	return cat
}

func findCatalog(t *testing.T) string {
	t.Helper()
	dir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 12; i++ {
		p := filepath.Join(dir, "packages/config/error-codes.json")
		if _, err := os.Stat(p); err == nil {
			return p
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	t.Fatal("packages/config/error-codes.json not found")
	return ""
}

func assertSameSet(t *testing.T, label string, want, got []string) {
	t.Helper()
	w := toSet(want)
	g := toSet(got)
	for k := range w {
		if !g[k] {
			t.Errorf("%s: catalog has %q missing from Go", label, k)
		}
	}
	for k := range g {
		if !w[k] {
			t.Errorf("%s: Go has %q missing from catalog", label, k)
		}
	}
}

func toSet(vals []string) map[string]bool {
	out := make(map[string]bool, len(vals))
	for _, v := range vals {
		out[v] = true
	}
	return out
}
