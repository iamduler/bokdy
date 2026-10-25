package maps

import "context"

// GeocodingPort is the maps provider seam (Adapter pattern).
// Implementations call an external geocoding/maps API; handlers never import adapters.
type GeocodingPort interface {
	Autocomplete(ctx context.Context, q string, focus *LatLng) ([]PlaceSuggestion, error)
	Search(ctx context.Context, q string, focus *LatLng) ([]PlaceSuggestion, error)
	Place(ctx context.Context, refID string) (*PlaceDetail, error)
	Reverse(ctx context.Context, lat, lng float64) (*ReverseResult, error)
	Route(ctx context.Context, origin, dest LatLng, vehicle string) (*RouteResult, error)
}
