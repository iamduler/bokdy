package postgres

import (
	"context"
	"errors"

	dbsqlc "bokdy/db/generated/sqlc"
	"bokdy/internal/crm/entity"
	"bokdy/internal/crm/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CustomerRepo struct {
	pool *pgxpool.Pool
	q    *dbsqlc.Queries
}

func NewCustomerRepo(pool *pgxpool.Pool) *CustomerRepo {
	return &CustomerRepo{pool: pool, q: dbsqlc.New(pool)}
}

var _ repository.CustomerRepository = (*CustomerRepo)(nil)

func (r *CustomerRepo) Create(ctx context.Context, tx pgx.Tx, customer *entity.Customer) error {
	q := r.q.WithTx(tx)
	if err := q.CreateCustomer(ctx, dbsqlc.CreateCustomerParams{
		ID: customer.ID, PublicID: customer.PublicID, TenantID: customer.TenantID, Code: customer.Code,
		CustomerType: dbsqlc.CrmCustomerType(customer.CustomerType), Status: dbsqlc.CrmCustomerStatus(customer.Status),
		UserID: customer.UserID, OrganizationName: nullStr(customer.OrganizationName), OwnerStaffID: customer.OwnerStaffID,
		Source: nullStr(customer.Source), AcquiredAt: customer.AcquiredAt, CreatedAt: customer.CreatedAt, UpdatedAt: customer.UpdatedAt,
	}); err != nil {
		return err
	}
	if customer.Profile != nil {
		p := customer.Profile
		if err := q.CreateCustomerProfile(ctx, dbsqlc.CreateCustomerProfileParams{
			ID: p.ID, CustomerID: customer.ID, FirstName: nullStr(p.FirstName), LastName: nullStr(p.LastName),
			FullName: nullStr(p.FullName), UpdatedAt: p.UpdatedAt,
		}); err != nil {
			return err
		}
	}
	for i := range customer.Contacts {
		c := &customer.Contacts[i]
		if err := q.CreateCustomerContact(ctx, dbsqlc.CreateCustomerContactParams{
			ID: c.ID, CustomerID: customer.ID, ContactType: dbsqlc.CrmContactType(c.ContactType), Value: c.Value,
			Label: nullStr(c.Label), IsVerified: c.IsVerified, IsPrimary: c.IsPrimary, CreatedAt: c.CreatedAt, UpdatedAt: c.UpdatedAt,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (r *CustomerRepo) FindByID(ctx context.Context, tenantID, customerID uuid.UUID) (*entity.Customer, error) {
	row, err := r.q.FindCustomerByID(ctx, dbsqlc.FindCustomerByIDParams{TenantID: tenantID, ID: customerID})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return r.hydrate(ctx, fromFindByID(row))
}

func (r *CustomerRepo) FindByIDAnyTenant(ctx context.Context, customerID uuid.UUID) (*entity.Customer, error) {
	row, err := r.q.FindCustomerByIDAnyTenant(ctx, customerID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return r.hydrate(ctx, fromFindByIDAny(row))
}

func (r *CustomerRepo) FindByUserAndTenant(ctx context.Context, tenantID, userID uuid.UUID) (*entity.Customer, error) {
	row, err := r.q.FindCustomerByUserAndTenant(ctx, dbsqlc.FindCustomerByUserAndTenantParams{TenantID: tenantID, UserID: uuidPtr(userID)})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return r.hydrate(ctx, fromFindByUser(row))
}

func (r *CustomerRepo) ListByUser(ctx context.Context, userID uuid.UUID) ([]entity.Customer, error) {
	rows, err := r.q.ListCustomersByUser(ctx, uuidPtr(userID))
	if err != nil {
		return nil, err
	}
	out := make([]entity.Customer, 0, len(rows))
	for _, row := range rows {
		c, err := r.hydrate(ctx, fromListByUser(row))
		if err != nil {
			return nil, err
		}
		out = append(out, *c)
	}
	return out, nil
}

func (r *CustomerRepo) FindByPhone(ctx context.Context, tenantID uuid.UUID, phone string) (*entity.Customer, error) {
	row, err := r.q.FindCustomerByPhone(ctx, dbsqlc.FindCustomerByPhoneParams{TenantID: tenantID, Phone: phone})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return r.hydrate(ctx, fromFindByPhone(row))
}

func (r *CustomerRepo) ListByTenant(ctx context.Context, tenantID uuid.UUID, q string, status *entity.CustomerStatus, limit int) ([]entity.Customer, error) {
	var statusFilter *string
	if status != nil {
		s := string(*status)
		statusFilter = &s
	}
	if limit <= 0 {
		limit = 50
	}
	rows, err := r.q.ListCustomersByTenant(ctx, dbsqlc.ListCustomersByTenantParams{
		TenantID: tenantID, StatusFilter: statusFilter, Q: q, RowLimit: int32(limit),
	})
	if err != nil {
		return nil, err
	}
	out := make([]entity.Customer, 0, len(rows))
	for _, row := range rows {
		c, err := r.hydrate(ctx, fromListByTenant(row))
		if err != nil {
			return nil, err
		}
		out = append(out, *c)
	}
	return out, nil
}

func (r *CustomerRepo) Update(ctx context.Context, tx pgx.Tx, customer *entity.Customer) error {
	return r.q.WithTx(tx).UpdateCustomer(ctx, dbsqlc.UpdateCustomerParams{
		TenantID: customer.TenantID, ID: customer.ID, Code: customer.Code,
		OrganizationName: nullStr(customer.OrganizationName), Source: nullStr(customer.Source),
	})
}

func (r *CustomerRepo) UpdateStatus(ctx context.Context, tx pgx.Tx, tenantID, customerID uuid.UUID, status entity.CustomerStatus) error {
	return r.q.WithTx(tx).UpdateCustomerStatus(ctx, dbsqlc.UpdateCustomerStatusParams{
		TenantID: tenantID, ID: customerID, Status: dbsqlc.CrmCustomerStatus(status),
	})
}

func (r *CustomerRepo) LinkUser(ctx context.Context, tx pgx.Tx, tenantID, customerID, userID uuid.UUID, status entity.CustomerStatus) error {
	return r.q.WithTx(tx).LinkCustomerUser(ctx, dbsqlc.LinkCustomerUserParams{
		TenantID: tenantID, ID: customerID, UserID: uuidPtr(userID), Status: dbsqlc.CrmCustomerStatus(status),
	})
}

func (r *CustomerRepo) UpdateProfile(ctx context.Context, tx pgx.Tx, profile *entity.CustomerProfile) error {
	return r.q.WithTx(tx).UpdateCustomerProfile(ctx, dbsqlc.UpdateCustomerProfileParams{
		CustomerID: profile.CustomerID, FirstName: nullStr(profile.FirstName), LastName: nullStr(profile.LastName),
		FullName: nullStr(profile.FullName),
	})
}

func (r *CustomerRepo) UpsertPrimaryContact(ctx context.Context, tx pgx.Tx, contact *entity.CustomerContact) error {
	q := r.q.WithTx(tx)
	n, err := q.UpdatePrimaryContactValue(ctx, dbsqlc.UpdatePrimaryContactValueParams{
		CustomerID: contact.CustomerID, ContactType: dbsqlc.CrmContactType(contact.ContactType),
		Value: contact.Value, Label: nullStr(contact.Label),
	})
	if err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	return q.CreateCustomerContact(ctx, dbsqlc.CreateCustomerContactParams{
		ID: contact.ID, CustomerID: contact.CustomerID, ContactType: dbsqlc.CrmContactType(contact.ContactType),
		Value: contact.Value, Label: nullStr(contact.Label), IsVerified: contact.IsVerified, IsPrimary: true,
		CreatedAt: contact.CreatedAt, UpdatedAt: contact.UpdatedAt,
	})
}

func (r *CustomerRepo) hydrate(ctx context.Context, c *entity.Customer) (*entity.Customer, error) {
	if c == nil {
		return nil, nil
	}
	prof, err := r.q.GetCustomerProfile(ctx, c.ID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	if err == nil {
		c.Profile = &entity.CustomerProfile{
			ID: prof.ID, CustomerID: prof.CustomerID, FirstName: prof.FirstName, LastName: prof.LastName,
			FullName: prof.FullName, UpdatedAt: prof.UpdatedAt,
		}
	}
	contacts, err := r.q.ListCustomerContacts(ctx, c.ID)
	if err != nil {
		return nil, err
	}
	c.Contacts = make([]entity.CustomerContact, 0, len(contacts))
	for _, row := range contacts {
		c.Contacts = append(c.Contacts, entity.CustomerContact{
			ID: row.ID, CustomerID: row.CustomerID, ContactType: entity.ContactType(row.ContactType),
			Value: row.Value, Label: row.Label, IsVerified: row.IsVerified, IsPrimary: row.IsPrimary,
			CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		})
	}
	return c, nil
}

func fromFindByID(row dbsqlc.FindCustomerByIDRow) *entity.Customer {
	return &entity.Customer{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, Code: row.Code,
		CustomerType: entity.CustomerType(row.CustomerType), Status: entity.CustomerStatus(row.Status),
		UserID: row.UserID, OrganizationName: row.OrganizationName, OwnerStaffID: row.OwnerStaffID, Source: row.Source,
		AcquiredAt: row.AcquiredAt, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
}

func fromFindByIDAny(row dbsqlc.FindCustomerByIDAnyTenantRow) *entity.Customer {
	return &entity.Customer{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, Code: row.Code,
		CustomerType: entity.CustomerType(row.CustomerType), Status: entity.CustomerStatus(row.Status),
		UserID: row.UserID, OrganizationName: row.OrganizationName, OwnerStaffID: row.OwnerStaffID, Source: row.Source,
		AcquiredAt: row.AcquiredAt, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
}

func fromFindByUser(row dbsqlc.FindCustomerByUserAndTenantRow) *entity.Customer {
	return &entity.Customer{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, Code: row.Code,
		CustomerType: entity.CustomerType(row.CustomerType), Status: entity.CustomerStatus(row.Status),
		UserID: row.UserID, OrganizationName: row.OrganizationName, OwnerStaffID: row.OwnerStaffID, Source: row.Source,
		AcquiredAt: row.AcquiredAt, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
}

func fromListByUser(row dbsqlc.ListCustomersByUserRow) *entity.Customer {
	return &entity.Customer{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, Code: row.Code,
		CustomerType: entity.CustomerType(row.CustomerType), Status: entity.CustomerStatus(row.Status),
		UserID: row.UserID, OrganizationName: row.OrganizationName, OwnerStaffID: row.OwnerStaffID, Source: row.Source,
		AcquiredAt: row.AcquiredAt, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
}

func fromFindByPhone(row dbsqlc.FindCustomerByPhoneRow) *entity.Customer {
	return &entity.Customer{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, Code: row.Code,
		CustomerType: entity.CustomerType(row.CustomerType), Status: entity.CustomerStatus(row.Status),
		UserID: row.UserID, OrganizationName: row.OrganizationName, OwnerStaffID: row.OwnerStaffID, Source: row.Source,
		AcquiredAt: row.AcquiredAt, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
}

func fromListByTenant(row dbsqlc.ListCustomersByTenantRow) *entity.Customer {
	return &entity.Customer{
		ID: row.ID, PublicID: row.PublicID, TenantID: row.TenantID, Code: row.Code,
		CustomerType: entity.CustomerType(row.CustomerType), Status: entity.CustomerStatus(row.Status),
		UserID: row.UserID, OrganizationName: row.OrganizationName, OwnerStaffID: row.OwnerStaffID, Source: row.Source,
		AcquiredAt: row.AcquiredAt, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt, DeletedAt: row.DeletedAt,
	}
}
