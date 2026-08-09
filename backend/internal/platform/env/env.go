// Package env reads process environment variables and locates the module
// working directory. It has no dependencies on other platform packages so
// every other package (including config and logging) can depend on it.
package env

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// GetEnv returns the value of key, or defaultValue when unset/empty.
func GetEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// GetIntEnv returns the int value of key, or defaultValue when unset/invalid.
func GetIntEnv(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	return parsed
}

// GetBoolEnv returns the bool value of key, or defaultValue when unset/invalid.
func GetBoolEnv(key string, defaultValue bool) bool {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return defaultValue
	}
	switch strings.ToLower(value) {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	}
	return defaultValue
}

// GetDurationEnv returns the time.Duration value of key, or defaultValue when unset/invalid.
func GetDurationEnv(key string, defaultValue time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return defaultValue
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		return defaultValue
	}
	return parsed
}

// MustGetWorkingDir walks up from the current working directory until it
// finds a directory containing go.mod, so the process can locate module
// assets (logs, migrations) regardless of where `go run`/the compiled
// binary is invoked from within the monorepo.
func MustGetWorkingDir() string {
	cwd, err := os.Getwd()
	if err != nil {
		panic("env: failed to get current working directory: " + err.Error())
	}

	dir := cwd
	for {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			// go.mod not found; fall back to the original working directory.
			return cwd
		}
		dir = parent
	}
}

// FindMonorepoRoot walks up from start until it finds go.work or .git.
// Used to resolve repo-level assets such as api/openapi/openapi.yaml.
func FindMonorepoRoot(start string) string {
	dir := start
	for {
		if _, err := os.Stat(filepath.Join(dir, "go.work")); err == nil {
			return dir
		}
		if _, err := os.Stat(filepath.Join(dir, ".git")); err == nil {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return start
		}
		dir = parent
	}
}
