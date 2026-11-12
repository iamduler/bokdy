package service

import (
	"context"
	"errors"
	"testing"

	identityentity "bokdy/internal/identity/entity"
	idrepo "bokdy/internal/identity/repository"
	idservice "bokdy/internal/identity/service"
	"bokdy/internal/organization/entity"
	orgerrors "bokdy/internal/organization/errors"
	"bokdy/internal/platform/apperr"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func TestCreateStaffUserRejectsBeforeStore(t *testing.T) {
	svc := &OrganizationService{}
	valid := idservice.AccountInput{Email: "a@b.co", Password: "Abcdef1!", FirstName: "An", LastName: "Le"}
	_, err := svc.CreateStaffUser(context.Background(), uuid.Nil, CreateStaffUserInput{
		Account: idservice.AccountInput{Email: "missing-at", Password: "Abcdef1!", FullName: "An"},
	})
	var app *apperr.Error
	if !errors.As(err, &app) || app.Message != "invalid email" {
		t.Fatal(err)
	}
	_, err = svc.CreateStaffUser(context.Background(), uuid.Nil, CreateStaffUserInput{
		Account: valid, RoleCode: "org_staff",
	})
	if !errors.As(err, &app) || app.Message != "organization is required" {
		t.Fatal(err)
	}
	_, err = svc.CreateStaffUser(context.Background(), uuid.Nil, CreateStaffUserInput{
		OrganizationID: uuid.New(), RoleCode: "custom_manager", Account: valid,
	})
	if !errors.Is(err, orgerrors.ErrSeededRoleOnly) {
		t.Fatal(err)
	}
}

func TestReplaceStaffRoleRejectsCustom(t *testing.T) {
	svc := &OrganizationService{}
	err := svc.ReplaceStaffRole(context.Background(), uuid.New(), uuid.New(), uuid.New(), "custom_manager", "")
	if !errors.Is(err, orgerrors.ErrSeededRoleOnly) {
		t.Fatal(err)
	}
}

type fakeRoles struct {
	has   bool
	count int
}

func (f fakeRoles) FindByCode(context.Context, string) (*identityentity.Role, error) {
	return nil, nil
}
func (f fakeRoles) FindByID(context.Context, uuid.UUID) (*identityentity.Role, error) {
	return nil, nil
}
func (f fakeRoles) Assign(context.Context, pgx.Tx, *identityentity.UserRole) error { return nil }
func (f fakeRoles) Remove(context.Context, pgx.Tx, uuid.UUID, uuid.UUID, uuid.UUID) error {
	return nil
}
func (f fakeRoles) ListByUser(context.Context, uuid.UUID) ([]identityentity.UserRole, error) {
	return nil, nil
}
func (f fakeRoles) ListByUserTenant(context.Context, uuid.UUID, uuid.UUID) ([]identityentity.UserRole, error) {
	return nil, nil
}
func (f fakeRoles) HasTenantRole(context.Context, uuid.UUID, uuid.UUID, string) (bool, error) {
	return f.has, nil
}
func (f fakeRoles) CountTenantRole(context.Context, uuid.UUID, string) (int, error) {
	return f.count, nil
}

var _ idrepo.RoleRepository = fakeRoles{}

func TestGuardLastOwner(t *testing.T) {
	org := &entity.Organization{TenantID: uuid.New()}
	member := &entity.StaffMember{UserID: uuid.New()}
	svc := &OrganizationService{roles: fakeRoles{has: true, count: 1}}
	if err := svc.guardLastOwner(context.Background(), org, member); !errors.Is(err, orgerrors.ErrLastOwner) {
		t.Fatal(err)
	}
	svc.roles = fakeRoles{has: true, count: 2}
	if err := svc.guardLastOwner(context.Background(), org, member); err != nil {
		t.Fatal(err)
	}
	svc.roles = fakeRoles{has: false, count: 1}
	if err := svc.guardLastOwner(context.Background(), org, member); err != nil {
		t.Fatal(err)
	}
}
