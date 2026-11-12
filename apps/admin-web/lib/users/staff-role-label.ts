const STAFF_ROLES = ["org_owner", "org_staff"] as const;

type StaffRoleCode = (typeof STAFF_ROLES)[number];

type StaffRoleTranslator = (
  key: `permissions.roleLabel.${StaffRoleCode}`,
) => string;

function isStaffRole(code: string): code is StaffRoleCode {
  return (STAFF_ROLES as readonly string[]).includes(code);
}

/** Localized org_owner / org_staff. Unknown codes stay as stored. Blank becomes an em dash. */
export function staffRoleLabel(
  t: StaffRoleTranslator,
  code: string | null | undefined,
): string {
  const value = code?.trim() ?? "";
  if (!value) return "—";
  if (isStaffRole(value)) return t(`permissions.roleLabel.${value}`);
  return value;
}
