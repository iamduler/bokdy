"use client";

import { BranchPricingForm } from "@/components/branches/detail/branch-pricing-form";
import { usePricingProfileDetail } from "@/components/pricing-profiles/pricing-profile-context";
import { useRouter } from "@/i18n/navigation";

export default function EditPricingProfilePage() {
  const router = useRouter();
  const { profile, organizationId, branchId } = usePricingProfileDetail();

  return (
    <BranchPricingForm
      organizationId={organizationId}
      branchId={branchId}
      profile={profile}
      onSaved={() => router.push(`/pricing-profiles/${profile.id}`)}
    />
  );
}
