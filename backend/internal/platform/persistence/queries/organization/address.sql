-- name: DeleteOrganizationAddresses :exec
DELETE FROM organization.organization_addresses WHERE organization_id = $1;

-- name: InsertOrganizationAddress :exec
INSERT INTO organization.organization_addresses (
    id, organization_id, division_scheme, province_former_id, district_former_id, ward_former_id,
    province_id, ward_id, address_line_1, address_line_2, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now());

-- name: ListOrganizationAddresses :many
SELECT id, organization_id, division_scheme, province_former_id, district_former_id, ward_former_id,
       province_id, ward_id, COALESCE(address_line_1, '') AS address_line_1, COALESCE(address_line_2, '') AS address_line_2
FROM organization.organization_addresses
WHERE organization_id = $1
ORDER BY division_scheme, ward_former_id NULLS FIRST;

-- name: ListFormerWardsForCurrent :many
SELECT wf.id AS ward_former_id, wf.district_former_id, df.province_former_id
FROM reference.ward_former_successors s
JOIN reference.ward_former wf ON wf.id = s.ward_former_id
JOIN reference.district_former df ON df.id = wf.district_former_id
WHERE s.ward_id = $1;
