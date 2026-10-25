package handler

import (
	"strconv"
	"strings"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/httpx"
	"bokdy/internal/platform/maps"
	"bokdy/internal/platform/maps/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type MapsHandler struct {
	svc *service.MapsService
}

func NewMapsHandler(svc *service.MapsService) *MapsHandler {
	return &MapsHandler{svc: svc}
}

func (h *MapsHandler) RegisterRoutes(rg *gin.RouterGroup, jwt gin.HandlerFunc) {
	g := rg.Group("/maps", jwt)
	g.GET("/autocomplete", h.Autocomplete)
	g.GET("/search", h.Search)
	g.GET("/places", h.Place)
	g.GET("/reverse", h.Reverse)
	g.GET("/route", h.Route)
	g.GET("/config", h.Config)
}

type suggestionDTO struct {
	RefID   string `json:"ref_id"`
	Display string `json:"display"`
	Name    string `json:"name,omitempty"`
	Address string `json:"address,omitempty"`
}

type placeDTO struct {
	RefID       string  `json:"ref_id"`
	Display     string  `json:"display"`
	Name        string  `json:"name,omitempty"`
	Address     string  `json:"address,omitempty"`
	AddressLine string  `json:"address_line,omitempty"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
}

type reverseDTO struct {
	placeDTO
	ProvinceID *uuid.UUID `json:"province_id"`
	WardID     *uuid.UUID `json:"ward_id"`
}

type routeDTO struct {
	DistanceM   float64     `json:"distance_m"`
	TimeMs      float64     `json:"time_ms"`
	Coordinates []latLngDTO `json:"coordinates"`
	BBox        [4]float64  `json:"bbox"`
}

type latLngDTO struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type mapsConfigDTO struct {
	StyleURL        string `json:"style_url"`
	MapKey          string `json:"map_key"`
	RasterTileURL   string `json:"raster_tile_url"`
	RasterTileSize  int    `json:"raster_tile_size"`
	ViewURLTemplate string `json:"view_url_template"`
}

func (h *MapsHandler) Autocomplete(c *gin.Context) {
	h.runSuggest(c, true)
}

func (h *MapsHandler) Search(c *gin.Context) {
	h.runSuggest(c, false)
}

func (h *MapsHandler) runSuggest(c *gin.Context, autocomplete bool) {
	q := strings.TrimSpace(c.Query("q"))
	focus, ok := parseOptionalFocus(c)
	if !ok {
		return
	}
	var (
		items []maps.PlaceSuggestion
		err   error
	)
	if autocomplete {
		items, err = h.svc.Autocomplete(c.Request.Context(), q, focus)
	} else {
		items, err = h.svc.Search(c.Request.Context(), q, focus)
	}
	if err != nil {
		httpx.Error(c, err)
		return
	}
	out := make([]suggestionDTO, 0, len(items))
	for _, item := range items {
		out = append(out, suggestionDTO{
			RefID: item.RefID, Display: item.Display, Name: item.Name, Address: item.Address,
		})
	}
	httpx.OK(c, out)
}

func (h *MapsHandler) Place(c *gin.Context) {
	refID := strings.TrimSpace(c.Query("ref_id"))
	item, err := h.svc.Place(c.Request.Context(), refID)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, placeDTO{
		RefID: item.RefID, Display: item.Display, Name: item.Name, Address: item.Address,
		AddressLine: item.AddressLine, Latitude: item.Lat, Longitude: item.Lng,
	})
}

func (h *MapsHandler) Reverse(c *gin.Context) {
	lat, err1 := strconv.ParseFloat(c.Query("lat"), 64)
	lng, err2 := strconv.ParseFloat(c.Query("lng"), 64)
	if err1 != nil || err2 != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "lat and lng are required"))
		return
	}
	item, err := h.svc.Reverse(c.Request.Context(), lat, lng)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, reverseDTO{
		placeDTO: placeDTO{
			RefID: item.RefID, Display: item.Display, Name: item.Name, Address: item.Address,
			AddressLine: item.AddressLine, Latitude: item.Lat, Longitude: item.Lng,
		},
		ProvinceID: item.ProvinceID,
		WardID:     item.WardID,
	})
}

func (h *MapsHandler) Route(c *gin.Context) {
	fromLat, err1 := strconv.ParseFloat(c.Query("from_lat"), 64)
	fromLng, err2 := strconv.ParseFloat(c.Query("from_lng"), 64)
	toLat, err3 := strconv.ParseFloat(c.Query("to_lat"), 64)
	toLng, err4 := strconv.ParseFloat(c.Query("to_lng"), 64)
	if err1 != nil || err2 != nil || err3 != nil || err4 != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "from_lat, from_lng, to_lat, to_lng are required"))
		return
	}
	vehicle := strings.TrimSpace(c.Query("vehicle"))
	if vehicle == "" {
		vehicle = "car"
	}
	item, err := h.svc.Route(
		c.Request.Context(),
		maps.LatLng{Lat: fromLat, Lng: fromLng},
		maps.LatLng{Lat: toLat, Lng: toLng},
		vehicle,
	)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	coords := make([]latLngDTO, 0, len(item.Coordinates))
	for _, p := range item.Coordinates {
		coords = append(coords, latLngDTO{Lat: p.Lat, Lng: p.Lng})
	}
	httpx.OK(c, routeDTO{
		DistanceM: item.DistanceM, TimeMs: item.TimeMs, Coordinates: coords, BBox: item.BBox,
	})
}

func (h *MapsHandler) Config(c *gin.Context) {
	cfg, err := h.svc.Config()
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, mapsConfigDTO{
		StyleURL:        cfg.StyleURL,
		MapKey:          cfg.MapKey,
		RasterTileURL:   cfg.RasterTileURL,
		RasterTileSize:  cfg.RasterTileSize,
		ViewURLTemplate: cfg.ViewURLTemplate,
	})
}

func parseOptionalFocus(c *gin.Context) (*maps.LatLng, bool) {
	latRaw, lngRaw := c.Query("lat"), c.Query("lng")
	if latRaw == "" && lngRaw == "" {
		return nil, true
	}
	lat, err1 := strconv.ParseFloat(latRaw, 64)
	lng, err2 := strconv.ParseFloat(lngRaw, 64)
	if err1 != nil || err2 != nil {
		httpx.Error(c, apperr.New(apperr.CodeValidation, "invalid lat or lng"))
		return nil, false
	}
	return &maps.LatLng{Lat: lat, Lng: lng}, true
}
