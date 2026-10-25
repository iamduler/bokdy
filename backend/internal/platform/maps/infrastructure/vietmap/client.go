package vietmap

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/maps"
)

const (
	defaultBaseURL = "https://maps.vietmap.vn"
	// display_type=5: main payload = new 2-level admin (ward → province); old 3-level in data_old.
	// Prefer over 6 (old primary) so autocomplete/reverse align with current_v2 matching.
	defaultDisplayType = "5"
	httpTimeout        = 8 * time.Second
)

// Client talks to Vietmap Maps API v4 (server-side apikey only).
type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		apiKey:  strings.TrimSpace(apiKey),
		baseURL: defaultBaseURL,
		httpClient: &http.Client{
			Timeout: httpTimeout,
		},
	}
}

var _ maps.GeocodingPort = (*Client)(nil)

type boundaryDTO struct {
	Type     int    `json:"type"`
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Prefix   string `json:"prefix"`
	FullName string `json:"full_name"`
}

type suggestionDTO struct {
	RefID      string         `json:"ref_id"`
	Display    string         `json:"display"`
	Name       string         `json:"name"`
	Address    string         `json:"address"`
	Boundaries []boundaryDTO  `json:"boundaries"`
	DataNew    *suggestionDTO `json:"data_new"` // populated when display_type=6
	DataOld    *suggestionDTO `json:"data_old"` // populated when display_type=5
	Lat        float64        `json:"lat"`
	Lng        float64        `json:"lng"`
}

type placeDTO struct {
	RefID    string  `json:"ref_id"`
	Display  string  `json:"display"`
	Name     string  `json:"name"`
	Address  string  `json:"address"`
	City     string  `json:"city"`
	District string  `json:"district"`
	Ward     string  `json:"ward"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`
}

type routePathDTO struct {
	Distance      float64         `json:"distance"`
	Time          float64         `json:"time"`
	BBox          []float64       `json:"bbox"`
	Points        json.RawMessage `json:"points"`
	PointsEncoded bool            `json:"points_encoded"`
}

type routeResponseDTO struct {
	Code  string         `json:"code"`
	Paths []routePathDTO `json:"paths"`
}

func (c *Client) Autocomplete(ctx context.Context, q string, focus *maps.LatLng) ([]maps.PlaceSuggestion, error) {
	return c.suggest(ctx, "/api/autocomplete/v4", q, focus)
}

func (c *Client) Search(ctx context.Context, q string, focus *maps.LatLng) ([]maps.PlaceSuggestion, error) {
	return c.suggest(ctx, "/api/search/v4", q, focus)
}

func (c *Client) suggest(ctx context.Context, path, q string, focus *maps.LatLng) ([]maps.PlaceSuggestion, error) {
	if c.apiKey == "" {
		return nil, maps.ErrMapsUnavailable
	}
	q = strings.TrimSpace(q)
	if len([]rune(q)) < 2 {
		return nil, apperr.New(apperr.CodeValidation, "q must be at least 2 characters")
	}
	params := url.Values{}
	params.Set("apikey", c.apiKey)
	params.Set("text", q)
	params.Set("display_type", defaultDisplayType)
	if focus != nil {
		params.Set("focus", fmt.Sprintf("%g,%g", focus.Lat, focus.Lng))
	}
	body, err := c.get(ctx, path, params)
	if err != nil {
		return nil, err
	}
	var raw []suggestionDTO
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "decode suggest")
	}
	out := make([]maps.PlaceSuggestion, 0, len(raw))
	for _, item := range raw {
		mapped := mapSuggestion(item)
		if mapped != nil {
			out = append(out, *mapped)
		}
	}
	return out, nil
}

func mapSuggestion(row suggestionDTO) *maps.PlaceSuggestion {
	refID := strings.TrimSpace(row.RefID)
	if refID == "" {
		refID = strings.TrimSpace(nestedRefID(row.DataNew))
	}
	if refID == "" {
		refID = strings.TrimSpace(nestedRefID(row.DataOld))
	}
	if refID == "" {
		return nil
	}
	// Prefer top-level (new format when display_type=5).
	display := firstNonEmpty(row.Display, nestedDisplay(row.DataNew), nestedDisplay(row.DataOld), row.Name, row.Address)
	if display == "" {
		return nil
	}
	bounds := row.Boundaries
	if len(bounds) == 0 && row.DataNew != nil {
		bounds = row.DataNew.Boundaries
	}
	if len(bounds) == 0 && row.DataOld != nil {
		bounds = row.DataOld.Boundaries
	}
	return &maps.PlaceSuggestion{
		RefID:      refID,
		Display:    display,
		Name:       firstNonEmpty(row.Name, nestedName(row.DataNew), nestedName(row.DataOld), display),
		Address:    firstNonEmpty(row.Address, nestedAddress(row.DataNew), nestedAddress(row.DataOld)),
		Boundaries: mapBoundaries(bounds),
	}
}

func (c *Client) Place(ctx context.Context, refID string) (*maps.PlaceDetail, error) {
	if c.apiKey == "" {
		return nil, maps.ErrMapsUnavailable
	}
	refID = strings.TrimSpace(refID)
	if refID == "" {
		return nil, apperr.New(apperr.CodeValidation, "ref_id is required")
	}
	params := url.Values{}
	params.Set("apikey", c.apiKey)
	params.Set("refid", refID)
	body, err := c.get(ctx, "/api/place/v4", params)
	if err != nil {
		return nil, err
	}
	var raw placeDTO
	if err := json.Unmarshal(body, &raw); err != nil {
		var arr []placeDTO
		if err2 := json.Unmarshal(body, &arr); err2 != nil || len(arr) == 0 {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "decode place")
		}
		raw = arr[0]
	}
	if raw.Lat == 0 && raw.Lng == 0 && raw.RefID == "" && raw.Display == "" {
		return nil, maps.ErrPlaceNotFound
	}
	return &maps.PlaceDetail{
		RefID:       firstNonEmpty(raw.RefID, refID),
		Display:     firstNonEmpty(raw.Display, raw.Name),
		Name:        raw.Name,
		Address:     raw.Address,
		AddressLine: firstNonEmpty(raw.Address, raw.Name, raw.Display),
		Lat:         raw.Lat,
		Lng:         raw.Lng,
		City:        raw.City,
		District:    raw.District,
		Ward:        raw.Ward,
	}, nil
}

func (c *Client) Reverse(ctx context.Context, lat, lng float64) (*maps.ReverseResult, error) {
	if c.apiKey == "" {
		return nil, maps.ErrMapsUnavailable
	}
	if lat < -90 || lat > 90 || lng < -180 || lng > 180 {
		return nil, apperr.New(apperr.CodeValidation, "latitude or longitude out of range")
	}
	params := url.Values{}
	params.Set("apikey", c.apiKey)
	params.Set("lat", strconv.FormatFloat(lat, 'f', -1, 64))
	params.Set("lng", strconv.FormatFloat(lng, 'f', -1, 64))
	params.Set("display_type", defaultDisplayType)
	body, err := c.get(ctx, "/api/reverse/v4", params)
	if err != nil {
		return nil, err
	}
	var arr []suggestionDTO
	if err := json.Unmarshal(body, &arr); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "decode reverse")
	}
	if len(arr) == 0 {
		return nil, maps.ErrPlaceNotFound
	}
	raw := arr[0]
	bounds := raw.Boundaries
	if len(bounds) == 0 && raw.DataNew != nil {
		bounds = raw.DataNew.Boundaries
	}
	if len(bounds) == 0 && raw.DataOld != nil {
		bounds = raw.DataOld.Boundaries
	}
	return &maps.ReverseResult{
		RefID: raw.RefID,
		Display: firstNonEmpty(
			raw.Display, nestedDisplay(raw.DataNew), nestedDisplay(raw.DataOld), raw.Name,
		),
		Name:    firstNonEmpty(raw.Name, nestedName(raw.DataNew), nestedName(raw.DataOld)),
		Address: firstNonEmpty(raw.Address, nestedAddress(raw.DataNew), nestedAddress(raw.DataOld)),
		AddressLine: firstNonEmpty(
			raw.Address, nestedAddress(raw.DataNew), nestedAddress(raw.DataOld), raw.Name, raw.Display,
		),
		Lat:        coalesce(raw.Lat, lat),
		Lng:        coalesce(raw.Lng, lng),
		Boundaries: mapBoundaries(bounds),
	}, nil
}

func (c *Client) Route(ctx context.Context, origin, dest maps.LatLng, vehicle string) (*maps.RouteResult, error) {
	if c.apiKey == "" {
		return nil, maps.ErrMapsUnavailable
	}
	if !validCoord(origin) || !validCoord(dest) {
		return nil, apperr.New(apperr.CodeValidation, "invalid route coordinates")
	}
	vehicle = strings.TrimSpace(vehicle)
	if vehicle == "" {
		vehicle = "car"
	}
	if vehicle != "car" && vehicle != "motorcycle" {
		return nil, apperr.New(apperr.CodeValidation, "vehicle must be car or motorcycle")
	}

	params := url.Values{}
	params.Set("apikey", c.apiKey)
	params.Add("point", fmt.Sprintf("%g,%g", origin.Lat, origin.Lng))
	params.Add("point", fmt.Sprintf("%g,%g", dest.Lat, dest.Lng))
	params.Set("points_encoded", "false")
	params.Set("vehicle", vehicle)
	body, err := c.get(ctx, "/api/route/v4", params)
	if err != nil {
		return nil, err
	}
	var raw routeResponseDTO
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "decode route")
	}
	if len(raw.Paths) == 0 || raw.Code == "NO_ROUTE" {
		return nil, apperr.New(apperr.CodeNotFound, "no route found between points")
	}
	path := raw.Paths[0]
	coords := normalizeRouteCoordinates(path.Points)
	if len(coords) < 2 {
		return nil, apperr.New(apperr.CodeInternal, "route response missing geometry")
	}
	return &maps.RouteResult{
		DistanceM:   path.Distance,
		TimeMs:      path.Time,
		Coordinates: coords,
		BBox:        normalizeRouteBBox(path.BBox, coords),
	}, nil
}

func mapBoundaries(raw []boundaryDTO) []maps.Boundary {
	out := make([]maps.Boundary, 0, len(raw))
	for _, b := range raw {
		name := strings.TrimSpace(b.Name)
		full := strings.TrimSpace(b.FullName)
		if name == "" && full == "" {
			continue
		}
		out = append(out, maps.Boundary{
			Type: b.Type, ID: b.ID, Name: name, Prefix: strings.TrimSpace(b.Prefix), FullName: full,
		})
	}
	return out
}

func normalizeRouteCoordinates(raw json.RawMessage) []maps.LatLng {
	if len(raw) == 0 {
		return nil
	}
	var asObj struct {
		Coordinates [][]float64 `json:"coordinates"`
	}
	if err := json.Unmarshal(raw, &asObj); err == nil && len(asObj.Coordinates) > 0 {
		return pairsToLatLng(asObj.Coordinates)
	}
	var asArr [][]float64
	if err := json.Unmarshal(raw, &asArr); err == nil {
		return pairsToLatLng(asArr)
	}
	return nil
}

func pairsToLatLng(rows [][]float64) []maps.LatLng {
	out := make([]maps.LatLng, 0, len(rows))
	for _, row := range rows {
		if len(row) < 2 {
			continue
		}
		lng, lat := row[0], row[1]
		if !finite(lng) || !finite(lat) {
			continue
		}
		out = append(out, maps.LatLng{Lat: lat, Lng: lng})
	}
	return out
}

func normalizeRouteBBox(raw []float64, coords []maps.LatLng) [4]float64 {
	if len(raw) >= 4 && finite(raw[0]) && finite(raw[1]) && finite(raw[2]) && finite(raw[3]) {
		return [4]float64{raw[0], raw[1], raw[2], raw[3]}
	}
	minLng, minLat := coords[0].Lng, coords[0].Lat
	maxLng, maxLat := minLng, minLat
	for _, c := range coords[1:] {
		if c.Lng < minLng {
			minLng = c.Lng
		}
		if c.Lat < minLat {
			minLat = c.Lat
		}
		if c.Lng > maxLng {
			maxLng = c.Lng
		}
		if c.Lat > maxLat {
			maxLat = c.Lat
		}
	}
	return [4]float64{minLng, minLat, maxLng, maxLat}
}

func (c *Client) get(ctx context.Context, path string, params url.Values) ([]byte, error) {
	u := c.baseURL + path + "?" + params.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "build vietmap request")
	}
	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "vietmap request failed")
	}
	defer res.Body.Close()
	body, err := io.ReadAll(io.LimitReader(res.Body, 2<<20))
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "read vietmap response")
	}
	switch res.StatusCode {
	case http.StatusOK:
		return body, nil
	case http.StatusUnauthorized:
		return nil, maps.ErrMapsUnavailable
	case http.StatusNotFound:
		return nil, maps.ErrPlaceNotFound
	case http.StatusLocked:
		return nil, apperr.New(apperr.CodeTooManyRequests, "maps quota exceeded")
	default:
		return nil, apperr.New(apperr.CodeInternal, fmt.Sprintf("vietmap status %d", res.StatusCode))
	}
}

func nestedDisplay(n *suggestionDTO) string {
	if n == nil {
		return ""
	}
	return n.Display
}
func nestedName(n *suggestionDTO) string {
	if n == nil {
		return ""
	}
	return n.Name
}
func nestedAddress(n *suggestionDTO) string {
	if n == nil {
		return ""
	}
	return n.Address
}
func nestedRefID(n *suggestionDTO) string {
	if n == nil {
		return ""
	}
	return n.RefID
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}

func coalesce(v, fallback float64) float64 {
	if v == 0 {
		return fallback
	}
	return v
}

func validCoord(p maps.LatLng) bool {
	return finite(p.Lat) && finite(p.Lng) && p.Lat >= -90 && p.Lat <= 90 && p.Lng >= -180 && p.Lng <= 180
}

func finite(v float64) bool {
	return !math.IsNaN(v) && !math.IsInf(v, 0)
}
