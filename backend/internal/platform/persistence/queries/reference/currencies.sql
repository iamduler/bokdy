-- name: ListActiveCurrencies :many
SELECT code, name_en, name_vi, symbol, is_default
FROM reference.currencies
WHERE is_active = true
ORDER BY is_default DESC, code ASC;
