package handler

import (
	"bokdy/internal/catalog/service"
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

func (h *CatalogHandler) AdminArchiveMany(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	ids, ok := httpx.ParseBulkIDs(c)
	if !ok {
		return
	}
	result, err := h.catalog.ArchiveCourtsAdmin(c.Request.Context(), uid, ids)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBulkDTO(result))
}

func (h *CatalogHandler) ArchiveBranchCourts(c *gin.Context) {
	uid, ok := requestctx.UserID(c.Request.Context())
	if !ok {
		httpx.Error(c, apperr.New(apperr.CodeUnauthorized, "unauthorized"))
		return
	}
	branchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid branch id"))
		return
	}
	ids, ok := httpx.ParseBulkIDs(c)
	if !ok {
		return
	}
	result, err := h.catalog.ArchiveCourts(c.Request.Context(), branchID, uid, ids)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toBulkDTO(result))
}
