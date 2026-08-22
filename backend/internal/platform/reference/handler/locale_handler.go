package handler

import (
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/reference/repository"
	"bokdy/internal/platform/reference/service"

	"github.com/gin-gonic/gin"
)

type LocaleHandler struct {
	locales *service.LocaleService
}

func NewLocaleHandler(locales *service.LocaleService) *LocaleHandler {
	return &LocaleHandler{locales: locales}
}

type localeDTO struct {
	ID         string `json:"id"`
	Code       string `json:"code"`
	Name       string `json:"name"`
	NativeName string `json:"native_name"`
	Emoji      string `json:"emoji"`
	IsDefault  bool   `json:"is_default"`
}

func (h *LocaleHandler) RegisterRoutes(rg *gin.RouterGroup) {
	ref := rg.Group("/reference")
	ref.GET("/locales", h.ListLocales)
}

func (h *LocaleHandler) ListLocales(c *gin.Context) {
	items, err := h.locales.ListActive(c.Request.Context())
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toLocaleDTOs(items))
}

func toLocaleDTOs(items []repository.Locale) []localeDTO {
	out := make([]localeDTO, 0, len(items))
	for _, item := range items {
		out = append(out, localeDTO{
			ID:         item.ID.String(),
			Code:       item.Code,
			Name:       item.Name,
			NativeName: item.NativeName,
			Emoji:      item.Emoji,
			IsDefault:  item.IsDefault,
		})
	}
	return out
}
