package service_test

import (
	"context"
	"errors"
	"testing"

	"bokdy/internal/platform/apperr"
	"bokdy/internal/platform/reference/repository"
	"bokdy/internal/platform/reference/service"

	"github.com/google/uuid"
)

type mockAdminUnitRepo struct {
	provinces  []repository.AdminUnit
	wards      []repository.AdminUnit
	provExists bool
	distExists bool
}

func (m *mockAdminUnitRepo) ListProvinces(_ context.Context, scheme repository.DivisionScheme) ([]repository.AdminUnit, error) {
	return m.provinces, nil
}

func (m *mockAdminUnitRepo) ListDistrictsFormer(_ context.Context, _ uuid.UUID) ([]repository.AdminUnit, error) {
	return nil, nil
}

func (m *mockAdminUnitRepo) ListWards(_ context.Context, _ repository.DivisionScheme, _ uuid.UUID, _ string) ([]repository.AdminUnit, error) {
	return m.wards, nil
}

func (m *mockAdminUnitRepo) ProvinceExists(_ context.Context, _ repository.DivisionScheme, _ uuid.UUID) (bool, error) {
	return m.provExists, nil
}

func (m *mockAdminUnitRepo) DistrictFormerExists(_ context.Context, _ uuid.UUID) (bool, error) {
	return m.distExists, nil
}

func TestAdminUnitService_ListProvinces_invalidScheme(t *testing.T) {
	svc := service.NewAdminUnitService(&mockAdminUnitRepo{})
	_, err := svc.ListProvinces(context.Background(), "invalid")
	if err == nil {
		t.Fatal("expected error")
	}
	var app *apperr.Error
	if !errors.As(err, &app) || app.Code != apperr.CodeValidation {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestAdminUnitService_ListDistricts_notFound(t *testing.T) {
	svc := service.NewAdminUnitService(&mockAdminUnitRepo{provExists: false})
	_, err := svc.ListDistricts(context.Background(), uuid.New())
	if err == nil {
		t.Fatal("expected error")
	}
	var app *apperr.Error
	if !errors.As(err, &app) || app.Code != apperr.CodeNotFound {
		t.Fatalf("expected not found, got %v", err)
	}
}

func TestAdminUnitService_ListWards_currentMissingProvince(t *testing.T) {
	svc := service.NewAdminUnitService(&mockAdminUnitRepo{})
	_, err := svc.ListWards(context.Background(), repository.DivisionCurrentV2, nil, nil, "")
	if err == nil {
		t.Fatal("expected error")
	}
	var app *apperr.Error
	if !errors.As(err, &app) || app.Code != apperr.CodeValidation {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestAdminUnitService_ListWards_formerMissingDistrict(t *testing.T) {
	svc := service.NewAdminUnitService(&mockAdminUnitRepo{})
	_, err := svc.ListWards(context.Background(), repository.DivisionFormerV3, nil, nil, "")
	if err == nil {
		t.Fatal("expected error")
	}
	var app *apperr.Error
	if !errors.As(err, &app) || app.Code != apperr.CodeValidation {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestAdminUnitService_ListWards_shortQuery(t *testing.T) {
	svc := service.NewAdminUnitService(&mockAdminUnitRepo{provExists: true})
	pid := uuid.New()
	_, err := svc.ListWards(context.Background(), repository.DivisionCurrentV2, &pid, nil, "a")
	if err == nil {
		t.Fatal("expected error")
	}
	var app *apperr.Error
	if !errors.As(err, &app) || app.Code != apperr.CodeValidation {
		t.Fatalf("expected validation error, got %v", err)
	}
}

func TestParseScheme(t *testing.T) {
	if _, err := service.ParseScheme("current_v2"); err != nil {
		t.Fatal(err)
	}
	if _, err := service.ParseScheme("bad"); err == nil {
		t.Fatal("expected error for bad scheme")
	}
}
