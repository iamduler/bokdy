"use client";

import { Button } from "@bokdy/ui";
import { Mail, MapPin, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EntityAvatar } from "@/components/entity/avatar";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { EntityIdentityHeader } from "@/components/entity/identity-header";
import { EntityStatusBadge } from "@/components/entity/status-badge";
import { useProvinces, useWards } from "@/hooks/use-admin-units";
import { currentBranchAddress, type Branch } from "@/lib/api/branches";

import { BranchFormSheet } from "./branch-form-sheet";

export function BranchDetailView({ organizationId, branch }: { organizationId: string; branch: Branch }) {
  const t = useTranslations("organization");
  const tb = useTranslations("organization.branch");
  const ts = useTranslations("shell");
  const address = currentBranchAddress(branch);
  const { data: provinces = [] } = useProvinces("current_v2");
  const { data: wards = [] } = useWards({
    scheme: "current_v2",
    provinceId: address?.province_id || undefined,
  });
  const provinceName = provinces.find((unit) => unit.id === address?.province_id)?.name;
  const wardName = wards.find((unit) => unit.id === address?.ward_id)?.name;
  const empty = tb("emptyValue");
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <EntityIdentityHeader
        backHref={`/organizations/${organizationId}/branches`}
        backLabel={ts("menuBack")}
        avatar={<EntityAvatar name={branch.name} size="lg" />}
        title={branch.name}
        badges={<EntityStatusBadge label={tb(`status.${branch.status}`)} />}
        meta={<p className="truncate text-xs text-muted-foreground">{branch.code}</p>}
        actions={
          branch.status === "archived" ? null : (
            <Button type="button" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              {tb("editProfile")}
            </Button>
          )
        }
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-3.5 overflow-y-auto soft-scrollbar p-5 md:px-6 lg:grid-cols-2">
        <EntityDetailPanel
          title={tb("contact")}
          icon={<Mail className="size-4" aria-hidden />}
          tone="sky"
        >
          <ProfileRow label={t("fieldEmail")} value={branch.email || empty} />
          <ProfileRow label={t("fieldPhone")} value={branch.phone || empty} />
          <ProfileRow label={tb("fieldTimezone")} value={branch.timezone || empty} />
        </EntityDetailPanel>
        <EntityDetailPanel
          title={tb("address")}
          icon={<MapPin className="size-4" aria-hidden />}
          tone="amber"
        >
          <ProfileRow label={t("fieldProvince")} value={provinceName || empty} />
          <ProfileRow label={t("fieldWard")} value={wardName || empty} />
          <ProfileRow label={t("fieldAddress1")} value={address?.address_line_1 || empty} />
          <ProfileRow label={t("fieldAddress2")} value={address?.address_line_2 || empty} />
        </EntityDetailPanel>
      </div>
      {editing ? (
        <BranchFormSheet
          open
          mode="edit"
          organizationId={organizationId}
          branch={branch}
          onOpenChange={(open) => {
            if (!open) setEditing(false);
          }}
        />
      ) : null}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-sm text-foreground">{value}</span>
    </div>
  );
}
