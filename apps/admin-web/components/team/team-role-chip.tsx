import { SoftChip, type SoftChipToneKey } from "@/components/entity/soft-chip";
import type { StaffRoleCode } from "@/lib/api/org-staff";

const ROLE_TONE: Record<StaffRoleCode, SoftChipToneKey> = {
  org_owner: "violet",
  org_staff: "sky",
};

type TeamRoleChipProps = {
  code: StaffRoleCode;
  label: string;
  className?: string;
};

/** Domain role label — SoftChip without status dot. */
export function TeamRoleChip({ code, label, className }: TeamRoleChipProps) {
  return (
    <SoftChip
      label={label}
      tone={ROLE_TONE[code]}
      showDot={false}
      className={className}
    />
  );
}
