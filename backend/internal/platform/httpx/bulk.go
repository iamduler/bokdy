package httpx

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"bokdy/internal/platform/apperr"
)

const maxBulkIDs = 100

type bulkIDsBody struct {
	IDs []string `json:"ids"`
}

// ParseBulkIDs reads `{ "ids": [...] }`. Empty, oversized, or invalid ids are 422.
// Duplicate ids are kept once, in first-seen order.
func ParseBulkIDs(c *gin.Context) ([]uuid.UUID, bool) {
	var body bulkIDsBody
	if err := c.ShouldBindJSON(&body); err != nil || len(body.IDs) == 0 || len(body.IDs) > maxBulkIDs {
		Error(c, apperr.New(apperr.CodeValidation, "ids must contain 1 to 100 items"))
		return nil, false
	}
	ids := make([]uuid.UUID, 0, len(body.IDs))
	seen := make(map[uuid.UUID]struct{}, len(body.IDs))
	for _, raw := range body.IDs {
		id, err := uuid.Parse(raw)
		if err != nil {
			Error(c, apperr.New(apperr.CodeValidation, "invalid id"))
			return nil, false
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		ids = append(ids, id)
	}
	return ids, true
}
