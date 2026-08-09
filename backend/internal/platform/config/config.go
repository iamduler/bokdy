// Package config loads process configuration from environment variables.
// It is the only platform package allowed to read env defaults directly;
// every other package receives configuration via constructor injection.
package config

import (
	"fmt"
	"strings"
	"time"

	"bokdy/internal/platform/env"
)

// AppConfig describes the running application/environment.
type AppConfig struct {
	Name              string
	Env               string
	Version           string
	LogStdoutChannels bool
}

// IsDevelopment reports whether APP_ENV is "development" (or unset).
func (c AppConfig) IsDevelopment() bool {
	return strings.EqualFold(c.Env, "development") || strings.EqualFold(c.Env, "dev") || strings.EqualFold(c.Env, "local")
}

// IsProduction reports whether APP_ENV is "production".
func (c AppConfig) IsProduction() bool {
	return strings.EqualFold(c.Env, "production")
}

// HTTPConfig configures the HTTP server listen address and timeouts.
type HTTPConfig struct {
	Host         string
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

// Address returns the host:port pair for http.Server.Addr.
func (c HTTPConfig) Address() string {
	return fmt.Sprintf("%s:%s", c.Host, c.Port)
}

// DatabaseConfig configures the PostgreSQL connection pool.
type DatabaseConfig struct {
	URL             string
	Host            string
	Port            string
	User            string
	Password        string
	Name            string
	SSLMode         string
	MaxOpenConns    int32
	MinConns        int32
	MaxConnLifetime time.Duration
}

// DSN returns the connection string. DATABASE_URL always wins; otherwise it
// is assembled from the discrete DB_* parts so local dev can use either style.
func (c DatabaseConfig) DSN() string {
	if c.URL != "" {
		return c.URL
	}
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		c.User, c.Password, c.Host, c.Port, c.Name, c.SSLMode,
	)
}

// RedisConfig configures the Redis client used for caching and Asynq.
type RedisConfig struct {
	Address  string
	Username string
	Password string
	DB       int
}

// AuthConfig configures JWT access/refresh token issuance.
type AuthConfig struct {
	AccessTokenSecret  string
	RefreshTokenSecret string
	AccessTokenTTL     time.Duration
	RefreshTokenTTL    time.Duration
	SessionTTL         time.Duration
	Issuer             string
}

// RateLimitConfig is Redis fixed-window per-IP limiting.
type RateLimitConfig struct {
	RequestsPerSec int
	Burst          int
	Window         time.Duration
}

// Limit is the max hits allowed per Window (Burst wins, else RequestsPerSec).
func (c RateLimitConfig) Limit() int {
	if c.Burst > 0 {
		return c.Burst
	}
	if c.RequestsPerSec > 0 {
		return c.RequestsPerSec
	}
	return 10
}

// DocsConfig configures the Scalar API docs UI.
type DocsConfig struct {
	Enabled     bool
	OpenAPIPath string
}

// BootstrapAdminConfig seeds a first system admin account on cold start.
type BootstrapAdminConfig struct {
	Email    string
	Password string
	Name     string
}

// OTelConfig configures OpenTelemetry export. Empty Endpoint still creates
// local spans (valid trace ids) but does not send OTLP.
type OTelConfig struct {
	ServiceName string
	Endpoint    string
}

// Config aggregates every platform configuration section.
type Config struct {
	App               AppConfig
	HTTP              HTTPConfig
	Database          DatabaseConfig
	Redis             RedisConfig
	Auth              AuthConfig
	RateLimit         RateLimitConfig
	Docs              DocsConfig
	Bootstrap         BootstrapAdminConfig
	OTel              OTelConfig
	PlayerWebURL      string
	OwnerWebURL       string
	AdminWebURL       string
	WorkerMetricsAddr string
}

// RedisAddr returns host:port for Redis / Asynq clients.
func (c *Config) RedisAddr() string {
	return c.Redis.Address
}

// CORSOrigins returns allowed browser origins for the three web apps.
func (c *Config) CORSOrigins() []string {
	return []string{c.PlayerWebURL, c.OwnerWebURL, c.AdminWebURL}
}

// Load reads configuration from the process environment. Callers must load
// .env files (via godotenv) before calling Load.
func Load() *Config {
	appEnv := env.GetEnv("APP_ENV", "development")

	return &Config{
		App: AppConfig{
			Name:              env.GetEnv("APP_NAME", "bokdy"),
			Env:               appEnv,
			Version:           env.GetEnv("APP_VERSION", "0.1.0"),
			LogStdoutChannels: env.GetBoolEnv("LOG_STDOUT", true),
		},
		HTTP: HTTPConfig{
			Host:         env.GetEnv("HTTP_HOST", "0.0.0.0"),
			Port:         env.GetEnv("HTTP_PORT", "8080"),
			ReadTimeout:  env.GetDurationEnv("HTTP_READ_TIMEOUT", 10*time.Second),
			WriteTimeout: env.GetDurationEnv("HTTP_WRITE_TIMEOUT", 10*time.Second),
		},
		Database: DatabaseConfig{
			URL:             env.GetEnv("DATABASE_URL", ""),
			Host:            env.GetEnv("DB_HOST", "localhost"),
			Port:            env.GetEnv("DB_PORT", "5432"),
			User:            env.GetEnv("DB_USER", "bokdy"),
			Password:        env.GetEnv("DB_PASSWORD", "bokdy"),
			Name:            env.GetEnv("DB_NAME", "bokdy"),
			SSLMode:         env.GetEnv("DB_SSLMODE", "disable"),
			MaxOpenConns:    int32(env.GetIntEnv("DATABASE_MAX_OPEN_CONNS", 20)),
			MinConns:        int32(env.GetIntEnv("DATABASE_MIN_CONNS", 2)),
			MaxConnLifetime: env.GetDurationEnv("DATABASE_MAX_CONN_LIFETIME", time.Hour),
		},
		Redis: RedisConfig{
			Address:  redisAddress(),
			Username: env.GetEnv("REDIS_USERNAME", ""),
			Password: env.GetEnv("REDIS_PASSWORD", ""),
			DB:       env.GetIntEnv("REDIS_DB", 0),
		},
		Auth: AuthConfig{
			AccessTokenSecret:  env.GetEnv("AUTH_ACCESS_TOKEN_SECRET", ""),
			RefreshTokenSecret: env.GetEnv("AUTH_REFRESH_TOKEN_SECRET", ""),
			AccessTokenTTL:     env.GetDurationEnv("AUTH_ACCESS_TOKEN_TTL", 15*time.Minute),
			RefreshTokenTTL:    env.GetDurationEnv("AUTH_REFRESH_TOKEN_TTL", 720*time.Hour),
			SessionTTL:         env.GetDurationEnv("AUTH_SESSION_TTL", 720*time.Hour),
			Issuer:             env.GetEnv("AUTH_ISSUER", "bokdy"),
		},
		RateLimit: RateLimitConfig{
			RequestsPerSec: env.GetIntEnv("RATE_LIMIT_REQUESTS_SEC", 5),
			Burst:          env.GetIntEnv("RATE_LIMIT_BURST", 10),
			Window:         env.GetDurationEnv("RATE_LIMIT_WINDOW", time.Second),
		},
		Docs: DocsConfig{
			Enabled:     env.GetBoolEnv("ENABLE_API_DOCS", appEnv == "development"),
			OpenAPIPath: env.GetEnv("OPENAPI_PATH", ""),
		},
		Bootstrap: BootstrapAdminConfig{
			Email:    env.GetEnv("BOOTSTRAP_ADMIN_EMAIL", ""),
			Password: env.GetEnv("BOOTSTRAP_ADMIN_PASSWORD", ""),
			Name:     env.GetEnv("BOOTSTRAP_ADMIN_NAME", "System Admin"),
		},
		PlayerWebURL:      env.GetEnv("PLAYER_WEB_URL", "http://localhost:3000"),
		OwnerWebURL:       env.GetEnv("OWNER_WEB_URL", "http://localhost:3001"),
		AdminWebURL:       env.GetEnv("ADMIN_WEB_URL", "http://localhost:3002"),
		WorkerMetricsAddr: env.GetEnv("WORKER_METRICS_ADDR", ":9091"),
		OTel: OTelConfig{
			ServiceName: env.GetEnv("OTEL_SERVICE_NAME", ""),
			Endpoint:    env.GetEnv("OTEL_EXPORTER_OTLP_ENDPOINT", ""),
		},
	}
}

func redisAddress() string {
	if addr := env.GetEnv("REDIS_ADDRESS", ""); addr != "" {
		return addr
	}
	return env.GetEnv("REDIS_HOST", "localhost") + ":" + env.GetEnv("REDIS_PORT", "6379")
}
