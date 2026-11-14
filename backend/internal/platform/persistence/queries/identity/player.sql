-- name: GetPlayerProfile :one
SELECT id, user_id, COALESCE(bio, '') AS bio, COALESCE(preferred_playing_times, '') AS preferred_playing_times,
       COALESCE(preferred_locations, '') AS preferred_locations, visibility::text AS visibility,
       is_open_to_invitations, is_discoverable, is_activity_visible, created_at, updated_at
FROM identity.player_profiles
WHERE user_id = $1;

-- name: UpsertPlayerProfile :exec
INSERT INTO identity.player_profiles (
    id, user_id, bio, preferred_playing_times, preferred_locations, visibility,
    is_open_to_invitations, is_discoverable, is_activity_visible, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6::identity.profile_visibility, $7, $8, $9, now(), now())
ON CONFLICT (user_id) DO UPDATE SET
    bio = EXCLUDED.bio,
    preferred_playing_times = EXCLUDED.preferred_playing_times,
    preferred_locations = EXCLUDED.preferred_locations,
    visibility = EXCLUDED.visibility,
    is_open_to_invitations = EXCLUDED.is_open_to_invitations,
    is_discoverable = EXCLUDED.is_discoverable,
    is_activity_visible = EXCLUDED.is_activity_visible,
    updated_at = now();

-- name: ListPlayerSportProfiles :many
SELECT p.id, p.user_id, p.sport_id, s.code AS sport_code, s.name_en AS sport_name_en, s.name_vi AS sport_name_vi,
       p.skill_level_id, l.code AS skill_code, l.name_en AS skill_name_en, l.name_vi AS skill_name_vi,
       COALESCE(p.dominant_hand, '') AS dominant_hand, COALESCE(p.playing_style, '') AS playing_style,
       COALESCE(p.experience, '') AS experience, p.updated_at
FROM identity.player_sport_profiles p
JOIN catalog.sports s ON s.id = p.sport_id
JOIN catalog.sport_skill_levels l ON l.id = p.skill_level_id
WHERE p.user_id = $1
ORDER BY s.code;

-- name: UpsertPlayerSportProfile :exec
INSERT INTO identity.player_sport_profiles (
    id, user_id, sport_id, skill_level_id, dominant_hand, playing_style, experience, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
ON CONFLICT (user_id, sport_id) DO UPDATE SET
    skill_level_id = EXCLUDED.skill_level_id,
    dominant_hand = EXCLUDED.dominant_hand,
    playing_style = EXCLUDED.playing_style,
    experience = EXCLUDED.experience,
    updated_at = now();

-- name: DeletePlayerSportProfile :exec
DELETE FROM identity.player_sport_profiles WHERE user_id = $1 AND sport_id = $2;

-- name: ListPlayerFavorites :many
SELECT id, user_id, target_type::text AS target_type, target_id, created_at
FROM identity.player_favorites
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: AddPlayerFavorite :exec
INSERT INTO identity.player_favorites (id, user_id, target_type, target_id, created_at)
VALUES ($1, $2, $3::identity.favorite_target, $4, now())
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- name: DeletePlayerFavorite :exec
DELETE FROM identity.player_favorites WHERE user_id = $1 AND target_type = $2::identity.favorite_target AND target_id = $3;

-- name: PlayerActivitySummary :one
SELECT
    COUNT(*)::int AS total_bookings,
    COUNT(*) FILTER (WHERE b.status = 'completed')::int AS completed_bookings,
    COUNT(*) FILTER (WHERE b.status = 'canceled')::int AS canceled_bookings,
    COALESCE(SUM(EXTRACT(EPOCH FROM (b.ends_at - b.starts_at)) / 3600) FILTER (WHERE b.status = 'completed'), 0)::float8 AS playing_hours,
    COALESCE(SUM(b.total_amount) FILTER (WHERE b.status = 'completed'), 0)::float8 AS total_spending,
    MAX(b.ends_at) FILTER (WHERE b.status = 'completed') AS last_played_at
FROM booking.bookings b
JOIN crm.customers c ON c.id = b.customer_id
WHERE c.user_id = $1;
