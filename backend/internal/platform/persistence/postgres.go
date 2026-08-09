// Package persistence wires the PostgreSQL connection pool (pgxpool) and a
// transaction helper. Repositories depend on *pgxpool.Pool / DBTX; only the
// Application layer decides transaction boundaries (see Tx below).
package persistence

import (
	"context"
	"fmt"
	"time"

	"bokdy/internal/platform/config"
	"bokdy/internal/platform/logging"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/tracelog"
)

// Database wraps the process-wide PostgreSQL pool owned by the Application.
type Database struct {
	Pool *pgxpool.Pool
}

// NewDatabase opens and pings a pool from cfg.
func NewDatabase(cfg *config.Config) (*Database, error) {
	pool, err := NewPool(context.Background(), cfg)
	if err != nil {
		return nil, err
	}
	return &Database{Pool: pool}, nil
}

// Ping verifies the database is reachable.
func (d *Database) Ping(ctx context.Context) error {
	if d == nil {
		return fmt.Errorf("persistence: nil database")
	}
	return Ping(ctx, d.Pool)
}

// Close releases the pool.
func (d *Database) Close() {
	if d == nil {
		return
	}
	Close(d.Pool)
}

// WithinTx runs fn inside a single PostgreSQL transaction. The transaction
// is committed when fn returns nil and rolled back otherwise.
func WithinTx(ctx context.Context, pool *pgxpool.Pool, fn func(pgx.Tx) error) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("persistence: begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := fn(tx); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("persistence: commit tx: %w", err)
	}
	return nil
}

// NewPool creates and validates a pgxpool.Pool from cfg. Callers own the
// returned pool's lifecycle and must call Close on shutdown.
func NewPool(ctx context.Context, cfg *config.Config) (*pgxpool.Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(cfg.Database.DSN())
	if err != nil {
		return nil, fmt.Errorf("persistence: parse dsn: %w", err)
	}

	poolConfig.MaxConns = cfg.Database.MaxOpenConns
	poolConfig.MinConns = cfg.Database.MinConns
	poolConfig.MaxConnLifetime = cfg.Database.MaxConnLifetime

	if cfg.App.IsDevelopment() {
		sqlLogger := logging.Channel("sql.log", "sql")
		poolConfig.ConnConfig.Tracer = &tracelog.TraceLog{
			Logger: &PgxZerologTracer{
				Logger:         *sqlLogger,
				SlowQueryLimit: 500 * time.Millisecond,
			},
			LogLevel: tracelog.LogLevelDebug,
		}
	}

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("persistence: create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("persistence: ping: %w", err)
	}

	return pool, nil
}

// Ping verifies the pool can reach PostgreSQL within ctx's deadline.
func Ping(ctx context.Context, pool *pgxpool.Pool) error {
	if pool == nil {
		return fmt.Errorf("persistence: nil pool")
	}
	return pool.Ping(ctx)
}

// Close releases every connection in pool. Safe to call with a nil pool.
func Close(pool *pgxpool.Pool) {
	if pool != nil {
		pool.Close()
	}
}
