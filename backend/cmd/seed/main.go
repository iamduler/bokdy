package main

import (
	"context"
	"path/filepath"
	"strings"
	"time"

	"bokdy/internal/identity/entity"
	identitypg "bokdy/internal/identity/infrastructure/postgres"
	"bokdy/internal/platform/config"
	"bokdy/internal/platform/env"
	"bokdy/internal/platform/i18n"
	"bokdy/internal/platform/id"
	"bokdy/internal/platform/logging"
	"bokdy/internal/platform/persistence"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	moduleRoot := env.MustGetWorkingDir()
	monoRoot := env.FindMonorepoRoot(moduleRoot)
	_ = godotenv.Load(filepath.Join(moduleRoot, "configs", ".env"))
	_ = godotenv.Load(filepath.Join(monoRoot, ".env"))

	cfg := config.Load()
	logging.InitLogger(cfg, logging.DefaultOptions(filepath.Join(moduleRoot, "logs"), "seed.log"))

	db, err := persistence.NewDatabase(cfg)
	if err != nil {
		logging.Log.Fatal().Err(err).Msg("db")
	}
	defer db.Close()

	ctx := context.Background()
	if err := seedRoles(ctx, db); err != nil {
		logging.Log.Fatal().Err(err).Msg("seed roles")
	}
	if err := seedBootstrapAdmin(ctx, db, cfg); err != nil {
		logging.Log.Fatal().Err(err).Msg("seed admin")
	}
	logging.Log.Info().Msg("seed completed")
}

func seedRoles(ctx context.Context, db *persistence.Database) error {
	type roleDef struct{ code, nameEn, nameVi, scope, descEn, descVi string }
	roles := []roleDef{
		{"system_admin", "System Admin", "Quản trị hệ thống", "system", "Platform administrator", "Quản trị viên nền tảng"},
		{"org_owner", "Organization Owner", "Chủ tổ chức", "tenant", "Owns an organization", "Chủ sở hữu tổ chức"},
		{"org_staff", "Organization Staff", "Nhân viên tổ chức", "tenant", "Staff member", "Nhân viên"},
		{"player", "Player", "Người chơi", "system", "End-user player", "Người chơi"},
	}
	perms := []struct{ code, nameEn, nameVi string }{
		{"identity.read", "Read identity", "Xem danh tính"},
		{"organization.read", "Read organization", "Xem tổ chức"},
		{"organization.write", "Write organization", "Sửa tổ chức"},
		{"admin.access", "Access admin console", "Truy cập quản trị"},
	}

	return persistence.WithinTx(ctx, db.Pool, func(tx pgx.Tx) error {
		permIDs := map[string]uuid.UUID{}
		for _, p := range perms {
			var existing uuid.UUID
			err := tx.QueryRow(ctx, `SELECT id FROM identity.permissions WHERE code=$1`, p.code).Scan(&existing)
			if err != nil {
				existing = id.MustNewUUID()
				if _, err := tx.Exec(ctx, `
					INSERT INTO identity.permissions (id, code, name_en, name_vi, created_at, updated_at)
					VALUES ($1,$2,$3,$4,now(),now())`, existing, p.code, p.nameEn, p.nameVi); err != nil {
					return err
				}
			}
			permIDs[p.code] = existing
		}

		for _, r := range roles {
			var roleID uuid.UUID
			err := tx.QueryRow(ctx, `SELECT id FROM identity.roles WHERE code=$1`, r.code).Scan(&roleID)
			if err != nil {
				roleID = id.MustNewUUID()
				if _, err := tx.Exec(ctx, `
					INSERT INTO identity.roles (id, code, name_en, name_vi, scope, description_en, description_vi, created_at, updated_at)
					VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now())`, roleID, r.code, r.nameEn, r.nameVi, r.scope, r.descEn, r.descVi); err != nil {
					return err
				}
			}
			want := []string{"identity.read", "organization.read"}
			switch r.code {
			case "system_admin":
				want = []string{"identity.read", "organization.read", "organization.write", "admin.access"}
			case "org_owner":
				want = []string{"identity.read", "organization.read", "organization.write"}
			}
			for _, code := range want {
				if _, err := tx.Exec(ctx, `
					INSERT INTO identity.role_permissions (role_id, permission_id)
					VALUES ($1,$2) ON CONFLICT DO NOTHING`, roleID, permIDs[code]); err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func seedBootstrapAdmin(ctx context.Context, db *persistence.Database, cfg *config.Config) error {
	email := strings.ToLower(strings.TrimSpace(cfg.Bootstrap.Email))
	if email == "" || cfg.Bootstrap.Password == "" {
		logging.Log.Info().Msg("bootstrap admin skipped (env empty)")
		return nil
	}

	users := identitypg.NewUserRepo(db.Pool)
	existing, err := users.FindByEmail(ctx, email)
	if err != nil {
		return err
	}
	if existing != nil {
		logging.Log.Info().Str("email", email).Msg("bootstrap admin already exists")
		return nil
	}

	now := time.Now().UTC()
	userID := id.MustNewUUID()
	hash, err := bcrypt.GenerateFromPassword([]byte(cfg.Bootstrap.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	localeID := i18n.LocaleVIID
	user := &entity.User{
		ID: userID, PublicID: id.MustNewPublicID(), Status: entity.UserStatusActive,
		IsSystemAdmin: true, CreatedAt: now, UpdatedAt: now,
	}
	profile := &entity.UserProfile{
		UserID: userID, FullName: cfg.Bootstrap.Name, DisplayName: cfg.Bootstrap.Name,
		LocaleID: &localeID, CreatedAt: now, UpdatedAt: now,
	}
	ident := &entity.Identity{
		ID: id.MustNewUUID(), UserID: userID, Provider: entity.ProviderLocal,
		ProviderSubject: email, Email: email, IsPrimary: true, CreatedAt: now, UpdatedAt: now,
	}

	return persistence.WithinTx(ctx, db.Pool, func(tx pgx.Tx) error {
		if err := users.Create(ctx, tx, user, profile); err != nil {
			return err
		}
		idents := identitypg.NewIdentityRepo(db.Pool)
		if err := idents.Create(ctx, tx, ident); err != nil {
			return err
		}
		creds := identitypg.NewCredentialRepo(db.Pool)
		if err := creds.UpsertPassword(ctx, tx, userID, string(hash)); err != nil {
			return err
		}
		roles := identitypg.NewRoleRepo(db.Pool)
		role, err := roles.FindByCode(ctx, "system_admin")
		if err != nil || role == nil {
			return err
		}
		return roles.Assign(ctx, tx, &entity.UserRole{
			ID: id.MustNewUUID(), UserID: userID, RoleID: role.ID,
		})
	})
}
