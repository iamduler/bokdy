package handler

import (
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"bokdy/internal/catalog/entity"
	"bokdy/internal/catalog/service"
	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Allow video payloads up to service max; image validation is stricter in the service.
const maxGalleryUploadBytes = 50 << 20

type courtGalleryItemDTO struct {
	ID        string `json:"id"`
	FileID    string `json:"file_id"`
	MimeType  string `json:"mime_type"`
	CaptionEn string `json:"caption_en,omitempty"`
	CaptionVi string `json:"caption_vi,omitempty"`
	SortOrder int    `json:"sort_order"`
	IsCover   bool   `json:"is_cover"`
	CreatedAt string `json:"created_at,omitempty"`
}

type updateCourtGalleryRequest struct {
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

type putCourtAmenitiesRequest struct {
	AmenityIDs []string `json:"amenity_ids"`
}

func (h *CatalogHandler) ListCourtGallery(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	items, err := h.catalog.ListCourtGallery(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]courtGalleryItemDTO, 0, len(items))
	for i := range items {
		out = append(out, toCourtGalleryDTO(&items[i]))
	}
	httpx.OK(c, out)
}

func (h *CatalogHandler) UploadCourtGallery(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "file is required"))
		return
	}
	defer file.Close()
	body, err := io.ReadAll(io.LimitReader(file, maxGalleryUploadBytes+1))
	if err != nil {
		httpx.Error(c, apperr.Wrap(err, apperr.CodeBadRequest, "read file"))
		return
	}
	mimeType := normalizeGalleryMime(header.Header.Get("Content-Type"), header.Filename, body)
	item, err := h.catalog.AddCourtGalleryImage(c.Request.Context(), id, uid, header.Filename, mimeType, body)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, toCourtGalleryDTO(item))
}

func (h *CatalogHandler) UpdateCourtGallery(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	mediaID, err := uuid.Parse(c.Param("mediaId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid media id"))
		return
	}
	var req updateCourtGalleryRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	item, err := h.catalog.UpdateCourtGalleryItem(c.Request.Context(), id, mediaID, uid, service.UpdateCourtGalleryInput{
		CaptionEn: req.CaptionEn, CaptionVi: req.CaptionVi, SortOrder: req.SortOrder, IsCover: req.IsCover,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toCourtGalleryDTO(item))
}

func (h *CatalogHandler) DeleteCourtGallery(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	mediaID, err := uuid.Parse(c.Param("mediaId"))
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeBadRequest, "invalid media id"))
		return
	}
	if err := h.catalog.DeleteCourtGalleryItem(c.Request.Context(), id, mediaID, uid); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *CatalogHandler) GetCourtAmenities(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	items, err := h.catalog.GetCourtAmenities(c.Request.Context(), id, uid)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAmenityDTOs(c, items))
}

func (h *CatalogHandler) PutCourtAmenities(c *gin.Context) {
	uid, id, ok := userAndUUID(c, "invalid court id")
	if !ok {
		return
	}
	var req putCourtAmenitiesRequest
	if !httpx.BindJSON(c, &req) {
		return
	}
	ids, ok := parseUUIDList(c, req.AmenityIDs, "invalid amenity_ids")
	if !ok {
		return
	}
	items, err := h.catalog.ReplaceCourtAmenities(c.Request.Context(), id, uid, ids)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toAmenityDTOs(c, items))
}

func toCourtGalleryDTO(item *entity.CourtMedia) courtGalleryItemDTO {
	return courtGalleryItemDTO{
		ID: item.ID.String(), FileID: item.FileID.String(), MimeType: item.MimeType,
		CaptionEn: item.CaptionEn, CaptionVi: item.CaptionVi,
		SortOrder: item.SortOrder, IsCover: item.IsCover,
		CreatedAt: item.CreatedAt.UTC().Format(time.RFC3339),
	}
}

func toAmenityDTOs(c *gin.Context, items []entity.Amenity) []amenityDTO {
	locale := i18n.FromContext(c.Request.Context())
	out := make([]amenityDTO, 0, len(items))
	for i := range items {
		a := &items[i]
		out = append(out, amenityDTO{
			ID: a.ID.String(), Code: a.Code, Name: i18n.DisplayName(locale, a.NameEn, a.NameVi),
			NameEn: a.NameEn, NameVi: a.NameVi, Icon: a.Icon, IsActive: a.IsActive,
		})
	}
	return out
}

// normalizeGalleryMime prefers a known Content-Type; falls back to extension then sniffing.
func normalizeGalleryMime(headerType, filename string, body []byte) string {
	ct := strings.TrimSpace(strings.Split(headerType, ";")[0])
	if entity.IsGalleryImage(ct) || entity.IsGalleryVideo(ct) {
		return ct
	}
	switch strings.ToLower(filepath.Ext(filename)) {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".mp4":
		return "video/mp4"
	case ".webm":
		return "video/webm"
	}
	detected := http.DetectContentType(body)
	detected = strings.TrimSpace(strings.Split(detected, ";")[0])
	if entity.IsGalleryImage(detected) || entity.IsGalleryVideo(detected) {
		return detected
	}
	return ct
}
