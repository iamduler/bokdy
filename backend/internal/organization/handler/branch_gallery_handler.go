package handler

import (
	"io"
	"net/http"
	"time"

	"bokdy/internal/organization/entity"
	"bokdy/internal/organization/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/requestctx"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type galleryItemDTO struct {
	ID        string `json:"id"`
	FileID    string `json:"file_id"`
	CaptionEn string `json:"caption_en,omitempty"`
	CaptionVi string `json:"caption_vi,omitempty"`
	SortOrder int    `json:"sort_order"`
	IsCover   bool   `json:"is_cover"`
	CreatedAt string `json:"created_at,omitempty"`
}

type updateGalleryRequest struct {
	CaptionEn *string `json:"caption_en"`
	CaptionVi *string `json:"caption_vi"`
	SortOrder *int    `json:"sort_order"`
	IsCover   *bool   `json:"is_cover"`
}

type amenityDTO struct {
	ID       string `json:"id"`
	Code     string `json:"code"`
	Name     string `json:"name"`
	NameEn   string `json:"name_en"`
	NameVi   string `json:"name_vi"`
	Icon     string `json:"icon,omitempty"`
	IsActive bool   `json:"is_active,omitempty"`
}

type putAmenitiesRequest struct {
	AmenityIDs []string `json:"amenity_ids"`
}

func (h *BranchHandler) ListGallery(c *gin.Context) {
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
	items, err := h.branches.ListGallery(c.Request.Context(), branchID, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]galleryItemDTO, 0, len(items))
	for i := range items {
		out = append(out, toGalleryDTO(&items[i]))
	}
	httpx.OK(c, out)
}

func (h *BranchHandler) UploadGallery(c *gin.Context) {
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
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "file is required"))
		return
	}
	defer file.Close()
	body, err := io.ReadAll(io.LimitReader(file, 5<<20+1))
	if err != nil {
		httpx.Error(c, apperr.Wrap(err, apperr.CodeBadRequest, "read file"))
		return
	}
	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = http.DetectContentType(body)
	}
	item, err := h.branches.AddGalleryImage(c.Request.Context(), branchID, uid, header.Filename, mimeType, body)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toGalleryDTO(item))
}

func (h *BranchHandler) UpdateGallery(c *gin.Context) {
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
	mediaID, err := uuid.Parse(c.Param("mediaId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid media id"))
		return
	}
	var req updateGalleryRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	item, err := h.branches.UpdateGalleryItem(c.Request.Context(), branchID, mediaID, uid, service.UpdateGalleryInput{
		CaptionEn: req.CaptionEn, CaptionVi: req.CaptionVi, SortOrder: req.SortOrder, IsCover: req.IsCover,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toGalleryDTO(item))
}

func (h *BranchHandler) DeleteGallery(c *gin.Context) {
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
	mediaID, err := uuid.Parse(c.Param("mediaId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid media id"))
		return
	}
	if err := h.branches.DeleteGalleryItem(c.Request.Context(), branchID, mediaID, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *BranchHandler) ListAmenities(c *gin.Context) {
	items, err := h.branches.ListAmenities(c.Request.Context())
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]amenityDTO, 0, len(items))
	for i := range items {
		out = append(out, toAmenityDTO(c, &items[i]))
	}
	httpx.OK(c, out)
}

func (h *BranchHandler) GetAmenities(c *gin.Context) {
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
	items, err := h.branches.GetBranchAmenities(c.Request.Context(), branchID, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]amenityDTO, 0, len(items))
	for i := range items {
		out = append(out, toAmenityDTO(c, &items[i]))
	}
	httpx.OK(c, out)
}

func (h *BranchHandler) PutAmenities(c *gin.Context) {
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
	var req putAmenitiesRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	ids := make([]uuid.UUID, 0, len(req.AmenityIDs))
	for _, raw := range req.AmenityIDs {
		id, err := uuid.Parse(raw)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid amenity_ids"))
			return
		}
		ids = append(ids, id)
	}
	items, err := h.branches.ReplaceBranchAmenities(c.Request.Context(), branchID, uid, ids)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]amenityDTO, 0, len(items))
	for i := range items {
		out = append(out, toAmenityDTO(c, &items[i]))
	}
	httpx.OK(c, out)
}

func toGalleryDTO(item *entity.LocationMedia) galleryItemDTO {
	return galleryItemDTO{
		ID: item.ID.String(), FileID: item.FileID.String(),
		CaptionEn: item.CaptionEn, CaptionVi: item.CaptionVi,
		SortOrder: item.SortOrder, IsCover: item.IsCover,
		CreatedAt: item.CreatedAt.UTC().Format(time.RFC3339),
	}
}

func toAmenityDTO(c *gin.Context, a *entity.Amenity) amenityDTO {
	return amenityDTO{
		ID: a.ID.String(), Code: a.Code,
		Name: i18n.DisplayName(i18n.FromContext(c.Request.Context()), a.NameEn, a.NameVi),
		NameEn: a.NameEn, NameVi: a.NameVi, Icon: a.Icon, IsActive: a.IsActive,
	}
}
