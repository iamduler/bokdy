-- name: ListActiveTimezones :many
SELECT id, name, sort_order
FROM reference.timezones
WHERE is_active = true
ORDER BY sort_order ASC, name ASC;
