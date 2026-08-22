-- name: ListActiveLocales :many
SELECT id, code, name, native_name, emoji, is_default, is_active, created_at, updated_at
FROM reference.locales
WHERE is_active = true
ORDER BY is_default DESC, code ASC;
