-- +goose Up
ALTER TABLE identity.user_profiles
    ADD COLUMN province_id uuid REFERENCES reference.province (id),
    ADD COLUMN ward_id uuid REFERENCES reference.ward (id),
    ADD COLUMN address_line varchar(255),
    ADD COLUMN banner_file_id uuid REFERENCES platform.files (id);

CREATE INDEX user_profiles_province_id_idx ON identity.user_profiles (province_id);
CREATE INDEX user_profiles_ward_id_idx ON identity.user_profiles (ward_id);

INSERT INTO organization.tenants (id, public_id, code, name_en, name_vi, slug, status)
SELECT '01900000-0000-7000-8000-0000000000f1', '00000000000000000000000001', 'platform', 'Platform', 'Nền tảng', 'platform', 'active'
WHERE NOT EXISTS (
    SELECT 1 FROM organization.tenants WHERE id = '01900000-0000-7000-8000-0000000000f1'
);

INSERT INTO reference.countries (id, iso2, iso3, name_en, name_vi, phone_code, is_active)
VALUES
    ('01900000-0000-7000-8000-000000000003', 'TH', 'THA', 'Thailand', 'Thái Lan', '+66', true),
    ('01900000-0000-7000-8000-000000000004', 'SG', 'SGP', 'Singapore', 'Singapore', '+65', true),
    ('01900000-0000-7000-8000-000000000005', 'MY', 'MYS', 'Malaysia', 'Malaysia', '+60', true),
    ('01900000-0000-7000-8000-000000000006', 'ID', 'IDN', 'Indonesia', 'Indonesia', '+62', true),
    ('01900000-0000-7000-8000-000000000007', 'PH', 'PHL', 'Philippines', 'Philippines', '+63', true),
    ('01900000-0000-7000-8000-000000000008', 'LA', 'LAO', 'Laos', 'Lào', '+856', true),
    ('01900000-0000-7000-8000-000000000009', 'KH', 'KHM', 'Cambodia', 'Campuchia', '+855', true),
    ('01900000-0000-7000-8000-00000000000a', 'MM', 'MMR', 'Myanmar', 'Myanmar', '+95', true),
    ('01900000-0000-7000-8000-00000000000b', 'BN', 'BRN', 'Brunei', 'Brunei', '+673', true),
    ('01900000-0000-7000-8000-00000000000c', 'CN', 'CHN', 'China', 'Trung Quốc', '+86', true),
    ('01900000-0000-7000-8000-00000000000d', 'JP', 'JPN', 'Japan', 'Nhật Bản', '+81', true),
    ('01900000-0000-7000-8000-00000000000e', 'KR', 'KOR', 'South Korea', 'Hàn Quốc', '+82', true),
    ('01900000-0000-7000-8000-00000000000f', 'TW', 'TWN', 'Taiwan', 'Đài Loan', '+886', true),
    ('01900000-0000-7000-8000-000000000010', 'HK', 'HKG', 'Hong Kong', 'Hồng Kông', '+852', true),
    ('01900000-0000-7000-8000-000000000011', 'MO', 'MAC', 'Macao', 'Ma Cao', '+853', true),
    ('01900000-0000-7000-8000-000000000012', 'GB', 'GBR', 'United Kingdom', 'Vương quốc Anh', '+44', true),
    ('01900000-0000-7000-8000-000000000013', 'FR', 'FRA', 'France', 'Pháp', '+33', true),
    ('01900000-0000-7000-8000-000000000014', 'DE', 'DEU', 'Germany', 'Đức', '+49', true),
    ('01900000-0000-7000-8000-000000000015', 'IT', 'ITA', 'Italy', 'Ý', '+39', true),
    ('01900000-0000-7000-8000-000000000016', 'ES', 'ESP', 'Spain', 'Tây Ban Nha', '+34', true),
    ('01900000-0000-7000-8000-000000000017', 'NL', 'NLD', 'Netherlands', 'Hà Lan', '+31', true),
    ('01900000-0000-7000-8000-000000000018', 'BE', 'BEL', 'Belgium', 'Bỉ', '+32', true),
    ('01900000-0000-7000-8000-000000000019', 'CH', 'CHE', 'Switzerland', 'Thụy Sĩ', '+41', true),
    ('01900000-0000-7000-8000-00000000001a', 'SE', 'SWE', 'Sweden', 'Thụy Điển', '+46', true),
    ('01900000-0000-7000-8000-00000000001b', 'NO', 'NOR', 'Norway', 'Na Uy', '+47', true),
    ('01900000-0000-7000-8000-00000000001c', 'DK', 'DNK', 'Denmark', 'Đan Mạch', '+45', true),
    ('01900000-0000-7000-8000-00000000001d', 'PL', 'POL', 'Poland', 'Ba Lan', '+48', true),
    ('01900000-0000-7000-8000-00000000001e', 'PT', 'PRT', 'Portugal', 'Bồ Đào Nha', '+351', true),
    ('01900000-0000-7000-8000-00000000001f', 'AT', 'AUT', 'Austria', 'Áo', '+43', true),
    ('01900000-0000-7000-8000-000000000020', 'IE', 'IRL', 'Ireland', 'Ireland', '+353', true),
    ('01900000-0000-7000-8000-000000000021', 'FI', 'FIN', 'Finland', 'Phần Lan', '+358', true),
    ('01900000-0000-7000-8000-000000000022', 'CA', 'CAN', 'Canada', 'Canada', '+1', true),
    ('01900000-0000-7000-8000-000000000023', 'MX', 'MEX', 'Mexico', 'Mexico', '+52', true),
    ('01900000-0000-7000-8000-000000000024', 'BR', 'BRA', 'Brazil', 'Brazil', '+55', true),
    ('01900000-0000-7000-8000-000000000025', 'AR', 'ARG', 'Argentina', 'Argentina', '+54', true),
    ('01900000-0000-7000-8000-000000000026', 'AU', 'AUS', 'Australia', 'Úc', '+61', true),
    ('01900000-0000-7000-8000-000000000027', 'NZ', 'NZL', 'New Zealand', 'New Zealand', '+64', true),
    ('01900000-0000-7000-8000-000000000028', 'AE', 'ARE', 'United Arab Emirates', 'Các Tiểu vương quốc Ả Rập Thống nhất', '+971', true),
    ('01900000-0000-7000-8000-000000000029', 'IN', 'IND', 'India', 'Ấn Độ', '+91', true),
    ('01900000-0000-7000-8000-00000000002a', 'QA', 'QAT', 'Qatar', 'Qatar', '+974', true)
ON CONFLICT (iso2) DO NOTHING;

INSERT INTO reference.currencies (code, name_en, name_vi, symbol, decimal_places, is_default, is_active)
VALUES
    ('EUR', 'Euro', 'Euro', '€', 2, false, true),
    ('GBP', 'Pound Sterling', 'Bảng Anh', '£', 2, false, true),
    ('JPY', 'Japanese Yen', 'Yên Nhật', '¥', 0, false, true),
    ('CNY', 'Chinese Yuan', 'Nhân dân tệ', '¥', 2, false, true),
    ('KRW', 'South Korean Won', 'Won Hàn Quốc', '₩', 0, false, true),
    ('SGD', 'Singapore Dollar', 'Đô la Singapore', 'S$', 2, false, true),
    ('THB', 'Thai Baht', 'Baht Thái', '฿', 2, false, true),
    ('AUD', 'Australian Dollar', 'Đô la Úc', 'A$', 2, false, true),
    ('CAD', 'Canadian Dollar', 'Đô la Canada', 'C$', 2, false, true),
    ('HKD', 'Hong Kong Dollar', 'Đô la Hồng Kông', 'HK$', 2, false, true),
    ('MYR', 'Malaysian Ringgit', 'Ringgit Malaysia', 'RM', 2, false, true),
    ('IDR', 'Indonesian Rupiah', 'Rupiah Indonesia', 'Rp', 0, false, true),
    ('PHP', 'Philippine Peso', 'Peso Philippines', '₱', 2, false, true),
    ('TWD', 'New Taiwan Dollar', 'Đô la Đài Loan', 'NT$', 2, false, true),
    ('LAK', 'Lao Kip', 'Kip Lào', '₭', 0, false, true),
    ('KHR', 'Cambodian Riel', 'Riel Campuchia', '៛', 0, false, true)
ON CONFLICT (code) DO NOTHING;

-- +goose Down
UPDATE identity.user_profiles
SET preferred_currency_code = 'VND'
WHERE preferred_currency_code IN (
    'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'SGD', 'THB', 'AUD', 'CAD', 'HKD', 'MYR', 'IDR', 'PHP', 'TWD', 'LAK', 'KHR'
);

DELETE FROM reference.currencies
WHERE code IN (
    'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'SGD', 'THB', 'AUD', 'CAD', 'HKD', 'MYR', 'IDR', 'PHP', 'TWD', 'LAK', 'KHR'
);

UPDATE identity.user_profiles
SET country_id = '01900000-0000-7000-8000-000000000001'
WHERE country_id IN (
    '01900000-0000-7000-8000-000000000003', '01900000-0000-7000-8000-000000000004',
    '01900000-0000-7000-8000-000000000005', '01900000-0000-7000-8000-000000000006',
    '01900000-0000-7000-8000-000000000007', '01900000-0000-7000-8000-000000000008',
    '01900000-0000-7000-8000-000000000009', '01900000-0000-7000-8000-00000000000a',
    '01900000-0000-7000-8000-00000000000b', '01900000-0000-7000-8000-00000000000c',
    '01900000-0000-7000-8000-00000000000d', '01900000-0000-7000-8000-00000000000e',
    '01900000-0000-7000-8000-00000000000f', '01900000-0000-7000-8000-000000000010',
    '01900000-0000-7000-8000-000000000011', '01900000-0000-7000-8000-000000000012',
    '01900000-0000-7000-8000-000000000013', '01900000-0000-7000-8000-000000000014',
    '01900000-0000-7000-8000-000000000015', '01900000-0000-7000-8000-000000000016',
    '01900000-0000-7000-8000-000000000017', '01900000-0000-7000-8000-000000000018',
    '01900000-0000-7000-8000-000000000019', '01900000-0000-7000-8000-00000000001a',
    '01900000-0000-7000-8000-00000000001b', '01900000-0000-7000-8000-00000000001c',
    '01900000-0000-7000-8000-00000000001d', '01900000-0000-7000-8000-00000000001e',
    '01900000-0000-7000-8000-00000000001f', '01900000-0000-7000-8000-000000000020',
    '01900000-0000-7000-8000-000000000021', '01900000-0000-7000-8000-000000000022',
    '01900000-0000-7000-8000-000000000023', '01900000-0000-7000-8000-000000000024',
    '01900000-0000-7000-8000-000000000025', '01900000-0000-7000-8000-000000000026',
    '01900000-0000-7000-8000-000000000027', '01900000-0000-7000-8000-000000000028',
    '01900000-0000-7000-8000-000000000029', '01900000-0000-7000-8000-00000000002a'
);

DELETE FROM reference.countries
WHERE id IN (
    '01900000-0000-7000-8000-000000000003', '01900000-0000-7000-8000-000000000004',
    '01900000-0000-7000-8000-000000000005', '01900000-0000-7000-8000-000000000006',
    '01900000-0000-7000-8000-000000000007', '01900000-0000-7000-8000-000000000008',
    '01900000-0000-7000-8000-000000000009', '01900000-0000-7000-8000-00000000000a',
    '01900000-0000-7000-8000-00000000000b', '01900000-0000-7000-8000-00000000000c',
    '01900000-0000-7000-8000-00000000000d', '01900000-0000-7000-8000-00000000000e',
    '01900000-0000-7000-8000-00000000000f', '01900000-0000-7000-8000-000000000010',
    '01900000-0000-7000-8000-000000000011', '01900000-0000-7000-8000-000000000012',
    '01900000-0000-7000-8000-000000000013', '01900000-0000-7000-8000-000000000014',
    '01900000-0000-7000-8000-000000000015', '01900000-0000-7000-8000-000000000016',
    '01900000-0000-7000-8000-000000000017', '01900000-0000-7000-8000-000000000018',
    '01900000-0000-7000-8000-000000000019', '01900000-0000-7000-8000-00000000001a',
    '01900000-0000-7000-8000-00000000001b', '01900000-0000-7000-8000-00000000001c',
    '01900000-0000-7000-8000-00000000001d', '01900000-0000-7000-8000-00000000001e',
    '01900000-0000-7000-8000-00000000001f', '01900000-0000-7000-8000-000000000020',
    '01900000-0000-7000-8000-000000000021', '01900000-0000-7000-8000-000000000022',
    '01900000-0000-7000-8000-000000000023', '01900000-0000-7000-8000-000000000024',
    '01900000-0000-7000-8000-000000000025', '01900000-0000-7000-8000-000000000026',
    '01900000-0000-7000-8000-000000000027', '01900000-0000-7000-8000-000000000028',
    '01900000-0000-7000-8000-000000000029', '01900000-0000-7000-8000-00000000002a'
);

ALTER TABLE identity.user_profiles DROP COLUMN IF EXISTS banner_file_id;
ALTER TABLE identity.user_profiles DROP COLUMN IF EXISTS address_line;
ALTER TABLE identity.user_profiles DROP COLUMN IF EXISTS ward_id;
ALTER TABLE identity.user_profiles DROP COLUMN IF EXISTS province_id;

DELETE FROM organization.tenants
WHERE id = '01900000-0000-7000-8000-0000000000f1'
  AND NOT EXISTS (
      SELECT 1 FROM platform.files WHERE tenant_id = '01900000-0000-7000-8000-0000000000f1'
  );
