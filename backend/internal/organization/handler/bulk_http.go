package handler

import (
	"bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type bulkFailureDTO struct {
	ID   string `json:"id"`
	Code string `json:"code"`
}

type bulkResultDTO struct {
	Succeeded []string         `json:"succeeded"`
	Failed    []bulkFailureDTO `json:"failed"`
}

func toBulkDTO(result service.BulkResult) bulkResultDTO {
	failed := make([]bulkFailureDTO, 0, len(result.Failed))
	for _, item := range result.Failed {
		failed = append(failed, bulkFailureDTO{ID: item.ID.String(), Code: item.Code})
	}
	succeeded := make([]string, 0, len(result.Succeeded))
	for _, id := range result.Succeeded {
		succeeded = append(succeeded, id.String())
	}
	return bulkResultDTO{Succeeded: succeeded, Failed: failed}
}

func (h *BranchHandler) ArchiveMany(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid organization id"))
		return
	}
	ids, ok := httpx.ParseBulkIDs(c)
	if !ok {
		return
	}
	result, err := h.branches.ArchiveMany(c.Request.Context(), orgID, uid, ids)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBulkDTO(result))
}

func (h *OrganizationHandler) RemoveStaffMany(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid organization id"))
		return
	}
	ids, ok := httpx.ParseBulkIDs(c)
	if !ok {
		return
	}
	result, err := h.orgs.RemoveStaffMany(c.Request.Context(), orgID, uid, ids)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBulkDTO(result))
}
