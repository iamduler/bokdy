package service

import (
	"testing"

	"bokdy/internal/organization/repository"

	"github.com/google/uuid"
)

func TestPickRepresentativeFormer_PreferCodeEqual(t *testing.T) {
	a := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	b := uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
	c := uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")
	rows := []repository.FormerWardRef{
		{WardFormerID: a, WardFormerCode: "10001", WardCode: "20000"},
		{WardFormerID: b, WardFormerCode: "20000", WardCode: "20000"},
		{WardFormerID: c, WardFormerCode: "15000", WardCode: "20000"},
	}
	got := PickRepresentativeFormer(rows)
	if got == nil || got.WardFormerID != b {
		t.Fatalf("want code-equal ward, got %#v", got)
	}
}

func TestPickRepresentativeFormer_LowestCodeWhenNoEqual(t *testing.T) {
	a := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	b := uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
	c := uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")
	rows := []repository.FormerWardRef{
		{WardFormerID: a, WardFormerCode: "30000", WardCode: "20000"},
		{WardFormerID: b, WardFormerCode: "10005", WardCode: "20000"},
		{WardFormerID: c, WardFormerCode: "20001", WardCode: "20000"},
	}
	got := PickRepresentativeFormer(rows)
	if got == nil || got.WardFormerID != b {
		t.Fatalf("want lowest former code, got %#v", got)
	}
}

func TestPickRepresentativeFormer_Empty(t *testing.T) {
	if PickRepresentativeFormer(nil) != nil {
		t.Fatal("expected nil")
	}
}
