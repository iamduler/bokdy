package service

import (
	"context"
	"strings"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/maps"
)

// Provider defaults (MeMap-style: only API keys in env; URLs live in code).
const (
	defaultStyleURL        = "https://maps.vietmap.vn/maps/styles/tm/style.json"
	defaultRasterTileURL   = "https://maps.vietmap.vn/tm/{z}/{x}/{y}@2x.png"
	defaultRasterTileSize  = 512
	defaultViewURLTemplate = "https://maps.vietmap.vn/#17/{lat}/{lng}"
)

type MapsConfig struct {
	MapKey string
	// Optional overrides for tests / future providers — empty → defaults above.
	StyleURL        string
	RasterTileURL   string
	RasterTileSize  int
	ViewURLTemplate string
}

type MapsService struct {
	geo    maps.GeocodingPort
	match  *AdminUnitMatcher
	config MapsConfig
}

func NewMapsService(geo maps.GeocodingPort, config MapsConfig, match *AdminUnitMatcher) *MapsService {
	return &MapsService{geo: geo, config: config, match: match}
}

func (s *MapsService) Autocomplete(ctx context.Context, q string, focus *maps.LatLng) ([]maps.PlaceSuggestion, error) {
	return s.geo.Autocomplete(ctx, q, focus)
}

func (s *MapsService) Search(ctx context.Context, q string, focus *maps.LatLng) ([]maps.PlaceSuggestion, error) {
	return s.geo.Search(ctx, q, focus)
}

func (s *MapsService) Place(ctx context.Context, refID string) (*maps.PlaceDetail, error) {
	refID = strings.TrimSpace(refID)
	if refID == "" {
		return nil, apperr.New(apperr.CodeValidation, "ref_id is required")
	}
	return s.geo.Place(ctx, refID)
}

func (s *MapsService) Reverse(ctx context.Context, lat, lng float64) (*maps.ReverseResult, error) {
	result, err := s.geo.Reverse(ctx, lat, lng)
	if err != nil {
		return nil, err
	}
	if s.match != nil {
		matched, matchErr := s.match.MatchReverse(ctx, result)
		if matchErr != nil {
			return nil, matchErr
		}
		result.ProvinceID = matched.ProvinceID
		result.WardID = matched.WardID
	}
	return result, nil
}

func (s *MapsService) Route(ctx context.Context, origin, dest maps.LatLng, vehicle string) (*maps.RouteResult, error) {
	return s.geo.Route(ctx, origin, dest, vehicle)
}

func (s *MapsService) Config() (MapsConfig, error) {
	key := strings.TrimSpace(s.config.MapKey)
	if key == "" {
		return MapsConfig{}, maps.ErrMapsUnavailable
	}
	style := strings.TrimSpace(s.config.StyleURL)
	if style == "" {
		style = defaultStyleURL
	}
	raster := strings.TrimSpace(s.config.RasterTileURL)
	if raster == "" {
		raster = defaultRasterTileURL
	}
	tileSize := s.config.RasterTileSize
	if tileSize != 256 && tileSize != 512 {
		tileSize = defaultRasterTileSize
	}
	view := strings.TrimSpace(s.config.ViewURLTemplate)
	if view == "" {
		view = defaultViewURLTemplate
	}
	return MapsConfig{
		MapKey: key, StyleURL: style,
		RasterTileURL: raster, RasterTileSize: tileSize,
		ViewURLTemplate: view,
	}, nil
}
