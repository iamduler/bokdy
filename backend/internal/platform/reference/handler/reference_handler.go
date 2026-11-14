package handler

import (
	"strings"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/i18n"
	refrepo "bokdy/internal/platform/reference/repository"
	"bokdy/internal/platform/reference/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const adminUnitsCacheControl = "public, max-age=86400"

type ReferenceHandler struct {
	locales    *service.LocaleService
	countries  *service.CountryService
	currencies *service.CurrencyService
	timezones  *service.TimezoneService
	adminUnits *service.AdminUnitService
}

func NewReferenceHandler(
	locales *service.LocaleService,
	countries *service.CountryService,
	currencies *service.CurrencyService,
	timezones *service.TimezoneService,
	adminUnits *service.AdminUnitService,
) *ReferenceHandler {
	return &ReferenceHandler{
		locales: locales, countries: countries, currencies: currencies,
		timezones: timezones, adminUnits: adminUnits,
	}
}

type localeDTO struct {
	ID         string `json:"id"`
	Code       string `json:"code"`
	Name       string `json:"name"`
	NativeName string `json:"native_name"`
	Emoji      string `json:"emoji"`
	IsDefault  bool   `json:"is_default"`
}

type adminUnitDTO struct {
	ID     string `json:"id"`
	Code   string `json:"code"`
	Name   string `json:"name"`
	NameEn string `json:"name_en"`
	NameVi string `json:"name_vi"`
}

func (h *ReferenceHandler) RegisterRoutes(rg *gin.RouterGroup) {
	ref := rg.Group("/reference")
	ref.GET("/locales", h.ListLocales)
	ref.GET("/countries", h.ListCountries)
	ref.GET("/currencies", h.ListCurrencies)
	ref.GET("/timezones", h.ListTimezones)
	units := ref.Group("/admin-units")
	units.GET("/provinces", h.ListProvinces)
	units.GET("/districts", h.ListDistricts)
	units.GET("/wards", h.ListWards)
}

func (h *ReferenceHandler) ListLocales(c *gin.Context) {
	items, err := h.locales.ListActive(c.Request.Context())
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, toLocaleDTOs(items))
}

type countryDTO struct {
	ID   string `json:"id"`
	ISO2 string `json:"iso2"`
	Name string `json:"name"`
}

func (h *ReferenceHandler) ListCountries(c *gin.Context) {
	if h.countries == nil {
		httpx.OK(c, []countryDTO{})
		return
	}
	items, err := h.countries.ListActive(c.Request.Context())
	if err != nil {
		httpx.Error(c, err)
		return
	}
	locale := i18n.FromContext(c.Request.Context())
	out := make([]countryDTO, 0, len(items))
	for _, item := range items {
		out = append(out, countryDTO{
			ID: item.ID.String(), ISO2: item.ISO2,
			Name: i18n.DisplayName(locale, item.NameEn, item.NameVi),
		})
	}
	httpx.OK(c, out)
}

type currencyDTO struct {
	Code      string `json:"code"`
	Name      string `json:"name"`
	Symbol    string `json:"symbol"`
	IsDefault bool   `json:"is_default"`
}

func (h *ReferenceHandler) ListCurrencies(c *gin.Context) {
	if h.currencies == nil {
		httpx.OK(c, []currencyDTO{})
		return
	}
	items, err := h.currencies.ListActive(c.Request.Context())
	if err != nil {
		httpx.Error(c, err)
		return
	}
	locale := i18n.FromContext(c.Request.Context())
	out := make([]currencyDTO, 0, len(items))
	for _, item := range items {
		out = append(out, currencyDTO{
			Code: item.Code, Symbol: item.Symbol, IsDefault: item.IsDefault,
			Name: i18n.DisplayName(locale, item.NameEn, item.NameVi),
		})
	}
	httpx.OK(c, out)
}

type timezoneDTO struct {
	Name      string `json:"name"`
	SortOrder int32  `json:"sort_order"`
}

func (h *ReferenceHandler) ListTimezones(c *gin.Context) {
	if h.timezones == nil {
		httpx.OK(c, []timezoneDTO{})
		return
	}
	items, err := h.timezones.ListActive(c.Request.Context())
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]timezoneDTO, 0, len(items))
	for _, item := range items {
		out = append(out, timezoneDTO{Name: item.Name, SortOrder: item.SortOrder})
	}
	httpx.OK(c, out)
}

func (h *ReferenceHandler) ListProvinces(c *gin.Context) {
	scheme, err := service.ParseScheme(c.Query("scheme"))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	items, err := h.adminUnits.ListProvinces(c.Request.Context(), scheme)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	c.Header("Cache-Control", adminUnitsCacheControl)
	httpx.OK(c, toAdminUnitDTOs(c, items))
}

func (h *ReferenceHandler) ListDistricts(c *gin.Context) {
	raw := strings.TrimSpace(c.Query("province_id"))
	if raw == "" {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "province_id is required"))
		return
	}
	provinceID, err := uuid.Parse(raw)
	if err != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid province_id"))
		return
	}
	items, err := h.adminUnits.ListDistricts(c.Request.Context(), provinceID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	c.Header("Cache-Control", adminUnitsCacheControl)
	httpx.OK(c, toAdminUnitDTOs(c, items))
}

func (h *ReferenceHandler) ListWards(c *gin.Context) {
	scheme, err := service.ParseScheme(c.Query("scheme"))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	var provinceID, districtID *uuid.UUID
	if raw := strings.TrimSpace(c.Query("province_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid province_id"))
			return
		}
		provinceID = &id
	}
	if raw := strings.TrimSpace(c.Query("district_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid district_id"))
			return
		}
		districtID = &id
	}
	items, err := h.adminUnits.ListWards(c.Request.Context(), scheme, provinceID, districtID, c.Query("q"))
	if err != nil {
		httpx.Error(c, err)
		return
	}
	ttl := adminUnitsCacheControl
	if strings.TrimSpace(c.Query("q")) != "" {
		c.Header("Cache-Control", "public, max-age=3600")
	} else {
		c.Header("Cache-Control", ttl)
	}
	httpx.OK(c, toAdminUnitDTOs(c, items))
}

func toLocaleDTOs(items []refrepo.Locale) []localeDTO {
	out := make([]localeDTO, 0, len(items))
	for _, item := range items {
		out = append(out, localeDTO{
			ID: item.ID.String(), Code: item.Code, Name: item.Name,
			NativeName: item.NativeName, Emoji: item.Emoji, IsDefault: item.IsDefault,
		})
	}
	return out
}

func toAdminUnitDTOs(c *gin.Context, items []refrepo.AdminUnit) []adminUnitDTO {
	locale := i18n.FromContext(c.Request.Context())
	out := make([]adminUnitDTO, 0, len(items))
	for _, item := range items {
		out = append(out, adminUnitDTO{
			ID: item.ID.String(), Code: item.Code,
			Name:   i18n.DisplayName(locale, item.NameEn, item.NameVi),
			NameEn: item.NameEn, NameVi: item.NameVi,
		})
	}
	return out
}

// LocaleHandler is kept for backward-compatible wiring call sites.
type LocaleHandler = ReferenceHandler

func NewLocaleHandler(locales *service.LocaleService) *ReferenceHandler {
	return NewReferenceHandler(locales, nil, nil, nil, nil)
}
