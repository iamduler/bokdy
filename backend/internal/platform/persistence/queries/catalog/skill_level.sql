-- name: ListSkillLevelsBySport :many
SELECT id, sport_id, code, name_en, name_vi, sort_order
FROM catalog.sport_skill_levels
WHERE sport_id = $1
ORDER BY sort_order;

-- name: ListSportsWithSkills :many
SELECT s.id AS sport_id, s.code AS sport_code, s.name_en AS sport_name_en, s.name_vi AS sport_name_vi,
       l.id AS skill_level_id, l.code AS skill_code, l.name_en AS skill_name_en, l.name_vi AS skill_name_vi, l.sort_order
FROM catalog.sports s
LEFT JOIN catalog.sport_skill_levels l ON l.sport_id = s.id
ORDER BY s.code, l.sort_order;
