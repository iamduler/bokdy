package maps

import "github.com/google/uuid"

// LatLng is a WGS84 coordinate pair.
type LatLng struct {
	Lat float64
	Lng float64
}

// Boundary is an admin boundary hint from the geocoder (not a Bokdy UUID).
type Boundary struct {
	Type     int
	ID       int
	Name     string
	Prefix   string
	FullName string
}

// PlaceSuggestion is an autocomplete/search hit (no coordinates until Place).
type PlaceSuggestion struct {
	RefID      string
	Display    string
	Name       string
	Address    string
	Boundaries []Boundary
}

// PlaceDetail is a resolved place with coordinates.
type PlaceDetail struct {
	RefID       string
	Display     string
	Name        string
	Address     string
	AddressLine string // street / house line suitable for address_line_1
	Lat         float64
	Lng         float64
	City        string
	District    string
	Ward        string
}

// ReverseResult is the nearest address for a coordinate.
type ReverseResult struct {
	RefID       string
	Display     string
	Name        string
	Address     string
	AddressLine string
	Lat         float64
	Lng         float64
	Boundaries  []Boundary
	// Matched Bokdy current_v2 admin units (nil when unmatched).
	ProvinceID *uuid.UUID
	WardID     *uuid.UUID
}

// RouteResult is a driving/motorcycle path between two points.
type RouteResult struct {
	DistanceM   float64
	TimeMs      float64
	Coordinates []LatLng // lat/lng pairs along the path
	BBox        [4]float64 // minLng, minLat, maxLng, maxLat
}
