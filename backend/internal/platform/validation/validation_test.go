package validation

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin/binding"
)

func TestDetailCodesMatchCatalog(t *testing.T) {
	want := loadCatalog(t).Details
	assertSameSet(t, "details", want, DetailCodes())
}

func TestPasswordPolicyDetailCode(t *testing.T) {
	if err := InitValidator(); err != nil {
		t.Fatal(err)
	}
	if err := RegisterStringRule("password_policy", func(s string) bool {
		return false
	}); err != nil {
		t.Fatal(err)
	}
	type req struct {
		Password string `json:"password" binding:"password_policy"`
	}
	err := binding.Validator.ValidateStruct(&req{Password: "weak"})
	details := Details(err)
	if len(details) != 1 || details[0].Field != "password" || details[0].Code != DetailPasswordPolicy {
		t.Fatalf("details=%+v", details)
	}
}

func TestDetailsUsesJSONTags(t *testing.T) {
	if err := InitValidator(); err != nil {
		t.Fatal(err)
	}
	type loginReq struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	err := binding.Validator.ValidateStruct(&loginReq{})
	details := Details(err)
	if len(details) != 2 {
		t.Fatalf("details=%+v", details)
	}
	byField := map[string]string{}
	for _, d := range details {
		byField[d.Field] = d.Code
	}
	if byField["email"] != DetailRequired || byField["password"] != DetailRequired {
		t.Fatalf("details=%+v", details)
	}
}

type errorCatalog struct {
	Envelope []string `json:"envelope"`
	Details  []string `json:"details"`
}

func loadCatalog(t *testing.T) errorCatalog {
	t.Helper()
	dir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 12; i++ {
		p := filepath.Join(dir, "packages/config/error-codes.json")
		if _, err := os.Stat(p); err == nil {
			raw, err := os.ReadFile(p)
			if err != nil {
				t.Fatal(err)
			}
			var cat errorCatalog
			if err := json.Unmarshal(raw, &cat); err != nil {
				t.Fatal(err)
			}
			return cat
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	t.Fatal("packages/config/error-codes.json not found")
	return errorCatalog{}
}

func assertSameSet(t *testing.T, label string, want, got []string) {
	t.Helper()
	w := map[string]bool{}
	g := map[string]bool{}
	for _, v := range want {
		w[v] = true
	}
	for _, v := range got {
		g[v] = true
	}
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
