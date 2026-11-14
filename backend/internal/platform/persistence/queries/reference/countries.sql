-- name: ListActiveCountries :many
SELECT id, iso2, name_en, name_vi
FROM reference.countries
WHERE is_active = true
ORDER BY name_en ASC;
