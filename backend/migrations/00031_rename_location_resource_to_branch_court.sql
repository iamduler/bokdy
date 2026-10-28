-- +goose Up
-- Align physical names with API + domain: Branch, Court, CourtType.

-- ── Organization: locations → branches ──────────────────────────────────────
ALTER TYPE organization.location_status RENAME TO branch_status;

ALTER TABLE organization.locations RENAME TO branches;
ALTER TABLE organization.branches RENAME CONSTRAINT locations_pkey TO branches_pkey;
ALTER TABLE organization.branches RENAME CONSTRAINT locations_display_name_chk TO branches_display_name_chk;
ALTER INDEX organization.locations_bu_code_uidx RENAME TO branches_bu_code_uidx;
ALTER INDEX organization.locations_organization_id_idx RENAME TO branches_organization_id_idx;
ALTER INDEX organization.locations_business_unit_id_idx RENAME TO branches_business_unit_id_idx;
ALTER INDEX organization.locations_status_idx RENAME TO branches_status_idx;
ALTER INDEX organization.locations_public_id_key RENAME TO branches_public_id_key;
ALTER INDEX organization.locations_org_slug_uidx RENAME TO branches_org_slug_uidx;

ALTER TABLE organization.location_addresses RENAME TO branch_addresses;
ALTER TABLE organization.branch_addresses RENAME COLUMN location_id TO branch_id;
ALTER INDEX organization.location_addresses_pkey RENAME TO branch_addresses_pkey;
ALTER INDEX organization.location_addresses_location_scheme_uidx RENAME TO branch_addresses_branch_scheme_uidx;
ALTER INDEX organization.location_addresses_district_former_id_idx RENAME TO branch_addresses_district_former_id_idx;
ALTER INDEX organization.location_addresses_province_former_id_idx RENAME TO branch_addresses_province_former_id_idx;
ALTER INDEX organization.location_addresses_province_id_idx RENAME TO branch_addresses_province_id_idx;
ALTER INDEX organization.location_addresses_ward_former_id_idx RENAME TO branch_addresses_ward_former_id_idx;
ALTER INDEX organization.location_addresses_ward_id_idx RENAME TO branch_addresses_ward_id_idx;

ALTER TABLE organization.location_settings RENAME TO branch_settings;
ALTER TABLE organization.branch_settings RENAME COLUMN location_id TO branch_id;
ALTER INDEX organization.location_settings_pkey RENAME TO branch_settings_pkey;
ALTER INDEX organization.location_settings_location_id_key RENAME TO branch_settings_branch_id_key;

ALTER TABLE organization.location_media RENAME TO branch_media;
ALTER TABLE organization.branch_media RENAME COLUMN location_id TO branch_id;
ALTER INDEX organization.location_media_pkey RENAME TO branch_media_pkey;
ALTER INDEX organization.location_media_location_id_idx RENAME TO branch_media_branch_id_idx;
ALTER INDEX organization.location_media_location_sort_idx RENAME TO branch_media_branch_sort_idx;

ALTER TABLE organization.location_sports RENAME TO branch_sports;
ALTER TABLE organization.branch_sports RENAME COLUMN location_id TO branch_id;
ALTER INDEX organization.location_sports_pkey RENAME TO branch_sports_pkey;
ALTER INDEX organization.location_sports_location_sport_uidx RENAME TO branch_sports_branch_sport_uidx;
ALTER INDEX organization.location_sports_location_id_idx RENAME TO branch_sports_branch_id_idx;
ALTER INDEX organization.location_sports_sport_id_idx RENAME TO branch_sports_sport_id_idx;

ALTER TABLE organization.location_amenities RENAME TO branch_amenities;
ALTER TABLE organization.branch_amenities RENAME COLUMN location_id TO branch_id;
ALTER INDEX organization.location_amenities_pkey RENAME TO branch_amenities_pkey;
ALTER INDEX organization.location_amenities_amenity_id_idx RENAME TO branch_amenities_amenity_id_idx;

ALTER TABLE organization.staff_members RENAME COLUMN location_id TO branch_id;

-- ── Catalog: resources → courts, resource_categories → court_types ───────────
ALTER TYPE catalog.resource_status RENAME TO court_status;
ALTER TYPE catalog.resource_category_status RENAME TO court_type_status;

ALTER TABLE catalog.resource_categories RENAME TO court_types;
ALTER INDEX catalog.resource_categories_pkey RENAME TO court_types_pkey;
ALTER INDEX catalog.resource_categories_tenant_code_uidx RENAME TO court_types_tenant_code_uidx;
ALTER INDEX catalog.resource_categories_tenant_id_idx RENAME TO court_types_tenant_id_idx;
ALTER INDEX catalog.resource_categories_status_idx RENAME TO court_types_status_idx;

ALTER TABLE catalog.resources RENAME TO courts;
ALTER TABLE catalog.courts RENAME COLUMN location_id TO branch_id;
ALTER TABLE catalog.courts RENAME COLUMN parent_resource_id TO parent_court_id;
ALTER INDEX catalog.resources_pkey RENAME TO courts_pkey;
ALTER INDEX catalog.resources_public_id_key RENAME TO courts_public_id_key;
ALTER INDEX catalog.courts_location_code_uidx RENAME TO courts_branch_code_uidx;
ALTER INDEX catalog.resources_tenant_id_idx RENAME TO courts_tenant_id_idx;
ALTER INDEX catalog.resources_location_id_idx RENAME TO courts_branch_id_idx;
ALTER INDEX catalog.resources_court_type_id_idx RENAME TO courts_court_type_id_idx;
ALTER INDEX catalog.resources_status_idx RENAME TO courts_status_idx;

ALTER TABLE catalog.resource_maintenances RENAME TO court_maintenances;
ALTER TABLE catalog.court_maintenances RENAME COLUMN resource_id TO court_id;
ALTER INDEX catalog.resource_maintenances_pkey RENAME TO court_maintenances_pkey;
ALTER INDEX catalog.resource_maintenances_resource_id_idx RENAME TO court_maintenances_court_id_idx;
ALTER INDEX catalog.resource_maintenances_status_idx RENAME TO court_maintenances_status_idx;
ALTER INDEX catalog.resource_maintenances_in_progress_uidx RENAME TO court_maintenances_in_progress_uidx;

-- ── Scheduling ──────────────────────────────────────────────────────────────
ALTER TABLE scheduling.business_hours RENAME COLUMN location_id TO branch_id;
ALTER INDEX scheduling.business_hours_location_weekday_uidx RENAME TO business_hours_branch_weekday_uidx;
ALTER INDEX scheduling.business_hours_location_id_idx RENAME TO business_hours_branch_id_idx;

ALTER TABLE scheduling.calendar_holidays RENAME COLUMN location_id TO branch_id;
ALTER INDEX scheduling.calendar_holidays_location_id_idx RENAME TO calendar_holidays_branch_id_idx;

ALTER TABLE scheduling.resource_blocks RENAME TO court_blocks;
ALTER TABLE scheduling.court_blocks RENAME COLUMN resource_id TO court_id;
ALTER TABLE scheduling.court_blocks RENAME CONSTRAINT resource_blocks_range_chk TO court_blocks_range_chk;
ALTER INDEX scheduling.resource_blocks_pkey RENAME TO court_blocks_pkey;
ALTER INDEX scheduling.resource_blocks_resource_id_idx RENAME TO court_blocks_court_id_idx;
ALTER INDEX scheduling.resource_blocks_block_type_idx RENAME TO court_blocks_block_type_idx;
ALTER INDEX scheduling.resource_blocks_starts_at_idx RENAME TO court_blocks_starts_at_idx;
ALTER INDEX scheduling.resource_blocks_ends_at_idx RENAME TO court_blocks_ends_at_idx;
ALTER INDEX scheduling.resource_blocks_maintenance_ref_uidx RENAME TO court_blocks_maintenance_ref_uidx;
ALTER INDEX scheduling.resource_blocks_booking_ref_uidx RENAME TO court_blocks_booking_ref_uidx;
ALTER INDEX scheduling.resource_blocks_reservation_ref_uidx RENAME TO court_blocks_reservation_ref_uidx;

ALTER TABLE scheduling.availability_projections RENAME COLUMN resource_id TO court_id;
ALTER INDEX scheduling.availability_projections_resource_date_uidx RENAME TO availability_projections_court_date_uidx;
ALTER INDEX scheduling.availability_projections_resource_id_idx RENAME TO availability_projections_court_id_idx;

ALTER TABLE scheduling.time_slots RENAME COLUMN resource_id TO court_id;
ALTER INDEX scheduling.time_slots_resource_starts_uidx RENAME TO time_slots_court_starts_uidx;
ALTER INDEX scheduling.time_slots_resource_id_idx RENAME TO time_slots_court_id_idx;

-- ── Reservation / booking ───────────────────────────────────────────────────
ALTER TABLE reservation.reservations RENAME COLUMN location_id TO branch_id;
ALTER TABLE reservation.reservations RENAME COLUMN resource_id TO court_id;
ALTER INDEX reservation.reservations_resource_id_idx RENAME TO reservations_court_id_idx;

ALTER TABLE reservation.reservation_resources RENAME TO reservation_courts;
ALTER TABLE reservation.reservation_courts RENAME COLUMN resource_id TO court_id;
ALTER TABLE reservation.reservation_courts RENAME CONSTRAINT reservation_resources_range_chk TO reservation_courts_range_chk;
ALTER INDEX reservation.reservation_resources_pkey RENAME TO reservation_courts_pkey;
ALTER INDEX reservation.reservation_resources_reservation_id_idx RENAME TO reservation_courts_reservation_id_idx;
ALTER INDEX reservation.reservation_resources_resource_id_idx RENAME TO reservation_courts_court_id_idx;

ALTER TABLE booking.bookings RENAME COLUMN location_id TO branch_id;
ALTER TABLE booking.bookings RENAME COLUMN resource_id TO court_id;
ALTER INDEX booking.bookings_location_id_idx RENAME TO bookings_branch_id_idx;
ALTER INDEX booking.bookings_resource_id_idx RENAME TO bookings_court_id_idx;

ALTER TABLE booking.booking_resources RENAME TO booking_courts;
ALTER TABLE booking.booking_courts RENAME COLUMN resource_id TO court_id;
ALTER TABLE booking.booking_courts RENAME CONSTRAINT booking_resources_range_chk TO booking_courts_range_chk;
ALTER INDEX booking.booking_resources_pkey RENAME TO booking_courts_pkey;
ALTER INDEX booking.booking_resources_booking_id_idx RENAME TO booking_courts_booking_id_idx;
ALTER INDEX booking.booking_resources_resource_id_idx RENAME TO booking_courts_court_id_idx;

-- +goose Down
ALTER TABLE booking.booking_courts RENAME TO booking_resources;
ALTER TABLE booking.booking_resources RENAME COLUMN court_id TO resource_id;
ALTER TABLE booking.booking_resources RENAME CONSTRAINT booking_courts_range_chk TO booking_resources_range_chk;
ALTER INDEX booking.booking_courts_pkey RENAME TO booking_resources_pkey;
ALTER INDEX booking.booking_courts_booking_id_idx RENAME TO booking_resources_booking_id_idx;
ALTER INDEX booking.booking_courts_court_id_idx RENAME TO booking_resources_resource_id_idx;

ALTER TABLE booking.bookings RENAME COLUMN branch_id TO location_id;
ALTER TABLE booking.bookings RENAME COLUMN court_id TO resource_id;
ALTER INDEX booking.bookings_branch_id_idx RENAME TO bookings_location_id_idx;
ALTER INDEX booking.bookings_court_id_idx RENAME TO bookings_resource_id_idx;

ALTER TABLE reservation.reservation_courts RENAME TO reservation_resources;
ALTER TABLE reservation.reservation_resources RENAME COLUMN court_id TO resource_id;
ALTER TABLE reservation.reservation_resources RENAME CONSTRAINT reservation_courts_range_chk TO reservation_resources_range_chk;
ALTER INDEX reservation.reservation_courts_pkey RENAME TO reservation_resources_pkey;
ALTER INDEX reservation.reservation_courts_reservation_id_idx RENAME TO reservation_resources_reservation_id_idx;
ALTER INDEX reservation.reservation_courts_court_id_idx RENAME TO reservation_resources_resource_id_idx;

ALTER TABLE reservation.reservations RENAME COLUMN branch_id TO location_id;
ALTER TABLE reservation.reservations RENAME COLUMN court_id TO resource_id;
ALTER INDEX reservation.reservations_court_id_idx RENAME TO reservations_resource_id_idx;

ALTER TABLE scheduling.time_slots RENAME COLUMN court_id TO resource_id;
ALTER INDEX scheduling.time_slots_court_starts_uidx RENAME TO time_slots_resource_starts_uidx;
ALTER INDEX scheduling.time_slots_court_id_idx RENAME TO time_slots_resource_id_idx;

ALTER TABLE scheduling.availability_projections RENAME COLUMN court_id TO resource_id;
ALTER INDEX scheduling.availability_projections_court_date_uidx RENAME TO availability_projections_resource_date_uidx;
ALTER INDEX scheduling.availability_projections_court_id_idx RENAME TO availability_projections_resource_id_idx;

ALTER TABLE scheduling.court_blocks RENAME TO resource_blocks;
ALTER TABLE scheduling.resource_blocks RENAME COLUMN court_id TO resource_id;
ALTER TABLE scheduling.resource_blocks RENAME CONSTRAINT court_blocks_range_chk TO resource_blocks_range_chk;
ALTER INDEX scheduling.court_blocks_pkey RENAME TO resource_blocks_pkey;
ALTER INDEX scheduling.court_blocks_court_id_idx RENAME TO resource_blocks_resource_id_idx;
ALTER INDEX scheduling.court_blocks_block_type_idx RENAME TO resource_blocks_block_type_idx;
ALTER INDEX scheduling.court_blocks_starts_at_idx RENAME TO resource_blocks_starts_at_idx;
ALTER INDEX scheduling.court_blocks_ends_at_idx RENAME TO resource_blocks_ends_at_idx;
ALTER INDEX scheduling.court_blocks_maintenance_ref_uidx RENAME TO resource_blocks_maintenance_ref_uidx;
ALTER INDEX scheduling.court_blocks_booking_ref_uidx RENAME TO resource_blocks_booking_ref_uidx;
ALTER INDEX scheduling.court_blocks_reservation_ref_uidx RENAME TO resource_blocks_reservation_ref_uidx;

ALTER TABLE scheduling.calendar_holidays RENAME COLUMN branch_id TO location_id;
ALTER INDEX scheduling.calendar_holidays_branch_id_idx RENAME TO calendar_holidays_location_id_idx;

ALTER TABLE scheduling.business_hours RENAME COLUMN branch_id TO location_id;
ALTER INDEX scheduling.business_hours_branch_weekday_uidx RENAME TO business_hours_location_weekday_uidx;
ALTER INDEX scheduling.business_hours_branch_id_idx RENAME TO business_hours_location_id_idx;

ALTER TABLE catalog.court_maintenances RENAME TO resource_maintenances;
ALTER TABLE catalog.resource_maintenances RENAME COLUMN court_id TO resource_id;
ALTER INDEX catalog.court_maintenances_pkey RENAME TO resource_maintenances_pkey;
ALTER INDEX catalog.court_maintenances_court_id_idx RENAME TO resource_maintenances_resource_id_idx;
ALTER INDEX catalog.court_maintenances_status_idx RENAME TO resource_maintenances_status_idx;
ALTER INDEX catalog.court_maintenances_in_progress_uidx RENAME TO resource_maintenances_in_progress_uidx;

ALTER TABLE catalog.courts RENAME COLUMN branch_id TO location_id;
ALTER TABLE catalog.courts RENAME COLUMN parent_court_id TO parent_resource_id;
ALTER TABLE catalog.courts RENAME TO resources;
ALTER INDEX catalog.courts_pkey RENAME TO resources_pkey;
ALTER INDEX catalog.courts_public_id_key RENAME TO resources_public_id_key;
ALTER INDEX catalog.courts_branch_code_uidx RENAME TO courts_location_code_uidx;
ALTER INDEX catalog.courts_tenant_id_idx RENAME TO resources_tenant_id_idx;
ALTER INDEX catalog.courts_branch_id_idx RENAME TO resources_location_id_idx;
ALTER INDEX catalog.courts_court_type_id_idx RENAME TO resources_court_type_id_idx;
ALTER INDEX catalog.courts_status_idx RENAME TO resources_status_idx;

ALTER TABLE catalog.court_types RENAME TO resource_categories;
ALTER INDEX catalog.court_types_pkey RENAME TO resource_categories_pkey;
ALTER INDEX catalog.court_types_tenant_code_uidx RENAME TO resource_categories_tenant_code_uidx;
ALTER INDEX catalog.court_types_tenant_id_idx RENAME TO resource_categories_tenant_id_idx;
ALTER INDEX catalog.court_types_status_idx RENAME TO resource_categories_status_idx;

ALTER TYPE catalog.court_type_status RENAME TO resource_category_status;
ALTER TYPE catalog.court_status RENAME TO resource_status;

ALTER TABLE organization.staff_members RENAME COLUMN branch_id TO location_id;

ALTER TABLE organization.branch_amenities RENAME TO location_amenities;
ALTER TABLE organization.location_amenities RENAME COLUMN branch_id TO location_id;
ALTER INDEX organization.branch_amenities_pkey RENAME TO location_amenities_pkey;
ALTER INDEX organization.branch_amenities_amenity_id_idx RENAME TO location_amenities_amenity_id_idx;

ALTER TABLE organization.branch_sports RENAME TO location_sports;
ALTER TABLE organization.location_sports RENAME COLUMN branch_id TO location_id;
ALTER INDEX organization.branch_sports_pkey RENAME TO location_sports_pkey;
ALTER INDEX organization.branch_sports_branch_sport_uidx RENAME TO location_sports_location_sport_uidx;
ALTER INDEX organization.branch_sports_branch_id_idx RENAME TO location_sports_location_id_idx;
ALTER INDEX organization.branch_sports_sport_id_idx RENAME TO location_sports_sport_id_idx;

ALTER TABLE organization.branch_media RENAME TO location_media;
ALTER TABLE organization.location_media RENAME COLUMN branch_id TO location_id;
ALTER INDEX organization.branch_media_pkey RENAME TO location_media_pkey;
ALTER INDEX organization.branch_media_branch_id_idx RENAME TO location_media_location_id_idx;
ALTER INDEX organization.branch_media_branch_sort_idx RENAME TO location_media_location_sort_idx;

ALTER TABLE organization.branch_settings RENAME TO location_settings;
ALTER TABLE organization.location_settings RENAME COLUMN branch_id TO location_id;
ALTER INDEX organization.branch_settings_pkey RENAME TO location_settings_pkey;
ALTER INDEX organization.branch_settings_branch_id_key RENAME TO location_settings_location_id_key;

ALTER TABLE organization.branch_addresses RENAME TO location_addresses;
ALTER TABLE organization.location_addresses RENAME COLUMN branch_id TO location_id;
ALTER INDEX organization.branch_addresses_pkey RENAME TO location_addresses_pkey;
ALTER INDEX organization.branch_addresses_branch_scheme_uidx RENAME TO location_addresses_location_scheme_uidx;
ALTER INDEX organization.branch_addresses_district_former_id_idx RENAME TO location_addresses_district_former_id_idx;
ALTER INDEX organization.branch_addresses_province_former_id_idx RENAME TO location_addresses_province_former_id_idx;
ALTER INDEX organization.branch_addresses_province_id_idx RENAME TO location_addresses_province_id_idx;
ALTER INDEX organization.branch_addresses_ward_former_id_idx RENAME TO location_addresses_ward_former_id_idx;
ALTER INDEX organization.branch_addresses_ward_id_idx RENAME TO location_addresses_ward_id_idx;

ALTER TABLE organization.branches RENAME TO locations;
ALTER TABLE organization.locations RENAME CONSTRAINT branches_pkey TO locations_pkey;
ALTER TABLE organization.locations RENAME CONSTRAINT branches_display_name_chk TO locations_display_name_chk;
ALTER INDEX organization.branches_bu_code_uidx RENAME TO locations_bu_code_uidx;
ALTER INDEX organization.branches_organization_id_idx RENAME TO locations_organization_id_idx;
ALTER INDEX organization.branches_business_unit_id_idx RENAME TO locations_business_unit_id_idx;
ALTER INDEX organization.branches_status_idx RENAME TO locations_status_idx;
ALTER INDEX organization.branches_public_id_key RENAME TO locations_public_id_key;
ALTER INDEX organization.branches_org_slug_uidx RENAME TO locations_org_slug_uidx;

ALTER TYPE organization.branch_status RENAME TO location_status;
