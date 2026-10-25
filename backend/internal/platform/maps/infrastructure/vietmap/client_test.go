package vietmap

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAutocompleteParsesSuggestions(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/autocomplete/v4" {
			t.Fatalf("path %s", r.URL.Path)
		}
		if got := r.URL.Query().Get("display_type"); got != "5" {
			t.Fatalf("display_type=%s, want 5", got)
		}
		_ = json.NewEncoder(w).Encode([]map[string]any{
			{
				"ref_id":  "auto:abc",
				"display": "197 Trần Phú, Phường Chợ Quán, Thành phố Hồ Chí Minh",
				"name":    "197 Trần Phú",
				"address": "Phường Chợ Quán, Thành phố Hồ Chí Minh",
				"boundaries": []map[string]any{
					{"type": 2, "name": "Chợ Quán", "prefix": "Phường", "full_name": "Phường Chợ Quán"},
					{"type": 0, "name": "Hồ Chí Minh", "prefix": "Thành phố", "full_name": "Thành phố Hồ Chí Minh"},
				},
				"data_old": map[string]any{
					"display": "197 Trần Phú, Phường Chợ Quán, Quận 5, Thành phố Hồ Chí Minh",
				},
			},
		})
	}))
	defer srv.Close()

	c := NewClient("test-key")
	c.baseURL = srv.URL
	items, err := c.Autocomplete(context.Background(), "197 tran", nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 1 || items[0].RefID != "auto:abc" {
		t.Fatalf("got %#v", items)
	}
	if len(items[0].Boundaries) != 2 {
		t.Fatalf("boundaries %#v", items[0].Boundaries)
	}
}

func TestPlaceParsesObject(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ref_id":  "auto:abc",
			"display": "197 Trần Phú",
			"name":    "197 Trần Phú",
			"address": "Phường Chợ Quán",
			"lat":     10.75,
			"lng":     106.67,
		})
	}))
	defer srv.Close()

	c := NewClient("test-key")
	c.baseURL = srv.URL
	place, err := c.Place(context.Background(), "auto:abc")
	if err != nil {
		t.Fatal(err)
	}
	if place.Lat != 10.75 || place.Lng != 106.67 {
		t.Fatalf("coords %#v", place)
	}
}
