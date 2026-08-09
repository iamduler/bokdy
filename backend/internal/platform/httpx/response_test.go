package httpx

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/validation"

	"github.com/gin-gonic/gin"
)

func TestErrorSetsContextCode(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/x", nil)
	Error(c, apperr.NotFound("missing"))
	got, _ := c.Get(ErrorCodeKey)
	if got != "NOT_FOUND" {
		t.Fatalf("error_code=%v", got)
	}
	if w.Code != http.StatusNotFound {
		t.Fatalf("status=%d", w.Code)
	}
	var body ErrorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Code != "NOT_FOUND" || body.Message != "missing" {
		t.Fatalf("body=%s", w.Body.String())
	}
	if _, ok := decodeMap(t, w)["error"]; ok {
		t.Fatalf("legacy error field present: %s", w.Body.String())
	}
}

func TestErrorUsesPublicMessageNotDump(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/x", nil)
	cause := apperr.Wrap(
		&dumpErr{s: "Key: 'LoginRequest.Email' Error:Field validation for 'Email' failed on the 'required' tag"},
		apperr.CodeValidation,
		"invalid request",
	)
	Error(c, cause)
	raw := w.Body.String()
	if strings.Contains(raw, "LoginRequest") || strings.Contains(raw, "Field validation") {
		t.Fatalf("leaked dump: %s", raw)
	}
	var body ErrorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Code != "VALIDATION" || body.Message != "invalid request" {
		t.Fatalf("body=%s", raw)
	}
}

func TestBindJSONValidationDetails(t *testing.T) {
	gin.SetMode(gin.TestMode)
	if err := validation.InitValidator(); err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	r.POST("/login", func(c *gin.Context) {
		var req struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}
		if !BindJSON(c, &req) {
			return
		}
		OK(c, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
	raw := w.Body.String()
	if strings.Contains(raw, "LoginRequest") || strings.Contains(strings.ToLower(raw), "struct") {
		t.Fatalf("leaked dump: %s", raw)
	}
	var body ErrorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Code != "VALIDATION" {
		t.Fatalf("code=%s", body.Code)
	}
	if len(body.Details) != 2 {
		t.Fatalf("details=%+v", body.Details)
	}
	byField := map[string]string{}
	for _, d := range body.Details {
		byField[d.Field] = d.Code
	}
	if byField["email"] != "REQUIRED" || byField["password"] != "REQUIRED" {
		t.Fatalf("details=%+v", body.Details)
	}
}

func TestBindJSONInvalidBody(t *testing.T) {
	gin.SetMode(gin.TestMode)
	if err := validation.InitValidator(); err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	r.POST("/login", func(c *gin.Context) {
		var req struct {
			Email string `json:"email" binding:"required"`
		}
		if !BindJSON(c, &req) {
			return
		}
		OK(c, gin.H{"ok": true})
	})

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(`{not json`))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
	var body ErrorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Code != "BAD_REQUEST" || body.Message != "invalid json body" {
		t.Fatalf("body=%s", w.Body.String())
	}
	if len(body.Details) != 0 {
		t.Fatalf("details=%+v", body.Details)
	}
}

type dumpErr struct{ s string }

func (e *dumpErr) Error() string { return e.s }

func decodeMap(t *testing.T, w *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var m map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &m); err != nil {
		t.Fatal(err)
	}
	return m
}
