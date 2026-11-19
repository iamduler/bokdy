-- name: ListTenantAuditLogs :many
SELECT
    a.id,
    d.event_type,
    a.action::text AS action,
    a.entity_type,
    a.entity_id,
    COALESCE(a.after_data, '{}'::jsonb)::text AS after_data,
    COALESCE(p.full_name, '') AS actor_name,
    a.created_at
FROM platform.audit_logs a
JOIN infrastructure.domain_events d ON d.id = a.domain_event_id
LEFT JOIN identity.user_profiles p ON p.user_id = a.actor_id
WHERE a.tenant_id = $1
ORDER BY a.created_at DESC
LIMIT sqlc.arg(row_limit);
