"use client";

import { Input, Label, Combobox, type ComboboxOption } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { useRouter } from "@/i18n/navigation";
import type { UserAudience, UserStatus } from "@/lib/api/admin-users";

type UserDirectoryFiltersProps = {
  audience: UserAudience;
  q: string;
  status: UserStatus | "";
  emailVerified?: "" | "true" | "false";
  staffRole?: "" | "org_owner" | "org_staff";
  resultCount: number;
};

const STATUS_OPTIONS: UserStatus[] = ["active", "suspended", "pending", "locked"];

export function UserDirectoryFilters({
  audience,
  q,
  status,
  emailVerified = "",
  staffRole = "",
  resultCount,
}: UserDirectoryFiltersProps) {
  const t = useTranslations("users.filters");
  const router = useRouter();

  const patch = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const nextQ = updates.q !== undefined ? updates.q ?? "" : q;
    const nextStatus = updates.status !== undefined ? updates.status ?? "" : status;
    const nextEmail =
      updates.email_verified !== undefined ? updates.email_verified ?? "" : emailVerified;
    const nextRole = updates.staff_role !== undefined ? updates.staff_role ?? "" : staffRole;
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextStatus) params.set("status", nextStatus);
    if (nextEmail) params.set("email_verified", nextEmail);
    if (nextRole) params.set("staff_role", nextRole);
    const qs = params.toString();
    router.replace(`/users/${audience}${qs ? `?${qs}` : ""}`);
  };

  const statusOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: "", label: t("all"), keywords: t("all") },
      ...STATUS_OPTIONS.map((s) => ({
        value: s,
        label: t(`statusOption.${s}`),
        keywords: t(`statusOption.${s}`),
      })),
    ],
    [t],
  );

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-end md:px-6">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label htmlFor="user-search">{t("search")}</Label>
        <Input
          id="user-search"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          onChange={(e) => {
            const v = e.target.value;
            window.clearTimeout((window as unknown as { _usrS?: number })._usrS);
            (window as unknown as { _usrS?: number })._usrS = window.setTimeout(
              () => patch({ q: v || null }),
              300,
            );
          }}
        />
      </div>
      <div className="w-full md:w-44">
        <Label>{t("status")}</Label>
        <Combobox
          value={status}
          options={statusOptions}
          onValueChange={(v) => patch({ status: v || null })}
          placeholder={t("all")}
          searchPlaceholder={t("filterSearch")}
          emptyText={t("filterEmpty")}
        />
      </div>
      {audience === "players" ? (
        <div className="w-full md:w-44">
          <Label>{t("emailVerified")}</Label>
          <Combobox
            value={emailVerified}
            options={[
              { value: "", label: t("all"), keywords: t("all") },
              { value: "true", label: t("verified"), keywords: t("verified") },
              { value: "false", label: t("unverified"), keywords: t("unverified") },
            ]}
            onValueChange={(v) => patch({ email_verified: v || null })}
            placeholder={t("all")}
            searchPlaceholder={t("filterSearch")}
            emptyText={t("filterEmpty")}
          />
        </div>
      ) : null}
      {audience === "owners" ? (
        <div className="w-full md:w-44">
          <Label>{t("staffRole")}</Label>
          <Combobox
            value={staffRole}
            options={[
              { value: "", label: t("all"), keywords: t("all") },
              { value: "org_owner", label: t("roleOwner"), keywords: t("roleOwner") },
              { value: "org_staff", label: t("roleStaff"), keywords: t("roleStaff") },
            ]}
            onValueChange={(v) => patch({ staff_role: v || null })}
            placeholder={t("all")}
            searchPlaceholder={t("filterSearch")}
            emptyText={t("filterEmpty")}
          />
        </div>
      ) : null}
      <p className="pb-2 text-xs text-muted-foreground md:ml-auto">
        {t("resultCount", { count: resultCount })}
      </p>
    </div>
  );
}
