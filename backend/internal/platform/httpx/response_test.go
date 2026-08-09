package httpx

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"bokdy/internal/platform/apperr"

	"github.com/gin-gonic/gin"
)

func TestErrorSetsContextCode(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/x", nil)
	Error(c, apperr.NotFound("missing"))
	got, _ := c.Get(ErrorCodeKey)
	if got != "not_found" {
		t.Fatalf("error_code=%v", got)
	}
	if w.Code != http.StatusNotFound {
		t.Fatalf("status=%d", w.Code)
	}
}
