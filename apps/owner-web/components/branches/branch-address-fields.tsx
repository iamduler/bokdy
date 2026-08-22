"use client";

import { Input, Label, cn } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { useDistricts, useProvinces, useWards } from "@/hooks/use-admin-units";
import type { AdminDivisionScheme } from "@/lib/api/reference";

export type BranchAddressValue = {
  division_scheme: AdminDivisionScheme;
  country_id?: string;
  province_former_id?: string;
  district_former_id?: string;
  ward_former_id?: string;
  province_id?: string;
  ward_id?: string;
  address_line_1?: string;
  address_line_2?: string;
};

type BranchAddressFieldsProps = {
  value?: BranchAddressValue;
  onChange: (value: BranchAddressValue) => void;
  className?: string;
};

const VN_COUNTRY_ID = "01900000-0000-7000-8000-000000000001";

type FormState = {
  scheme: AdminDivisionScheme;
  provinceFormerId: string;
  districtFormerId: string;
  wardFormerId: string;
  provinceId: string;
  wardId: string;
  line1: string;
  line2: string;
};

function toValue(s: FormState): BranchAddressValue {
  const base = {
    division_scheme: s.scheme,
    country_id: VN_COUNTRY_ID,
    address_line_1: s.line1 || undefined,
    address_line_2: s.line2 || undefined,
  };
  if (s.scheme === "former_v3") {
    return {
      ...base,
      province_former_id: s.provinceFormerId || undefined,
      district_former_id: s.districtFormerId || undefined,
      ward_former_id: s.wardFormerId || undefined,
    };
  }
  return {
    ...base,
    province_id: s.provinceId || undefined,
    ward_id: s.wardId || undefined,
  };
}

function initialState(value?: BranchAddressValue): FormState {
  return {
    scheme: value?.division_scheme ?? "current_v2",
    provinceFormerId: value?.province_former_id ?? "",
    districtFormerId: value?.district_former_id ?? "",
    wardFormerId: value?.ward_former_id ?? "",
    provinceId: value?.province_id ?? "",
    wardId: value?.ward_id ?? "",
    line1: value?.address_line_1 ?? "",
    line2: value?.address_line_2 ?? "",
  };
}

export function BranchAddressFields({ value, onChange, className }: BranchAddressFieldsProps) {
  const t = useTranslations("branch.address");
  const schemeId = useId();
  const [form, setForm] = useState<FormState>(() => initialState(value));

  const { data: provincesFormer = [] } = useProvinces("former_v3");
  const { data: provincesCurrent = [] } = useProvinces("current_v2");
  const { data: districts = [] } = useDistricts(form.scheme === "former_v3" ? form.provinceFormerId || undefined : undefined);
  const { data: wardsFormer = [] } = useWards({
    scheme: "former_v3",
    districtId: form.districtFormerId || undefined,
    enabled: form.scheme === "former_v3",
  });
  const { data: wardsCurrent = [] } = useWards({
    scheme: "current_v2",
    provinceId: form.provinceId || undefined,
    enabled: form.scheme === "current_v2",
  });

  function update(next: FormState) {
    setForm(next);
    onChange(toValue(next));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1.5">
        <Label htmlFor={schemeId}>{t("scheme")}</Label>
        <select
          id={schemeId}
          value={form.scheme}
          onChange={(e) => {
            const scheme = e.target.value as AdminDivisionScheme;
            update({
              scheme,
              provinceFormerId: "",
              districtFormerId: "",
              wardFormerId: "",
              provinceId: "",
              wardId: "",
              line1: form.line1,
              line2: form.line2,
            });
          }}
          className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm"
        >
          <option value="current_v2">{t("schemeCurrent")}</option>
          <option value="former_v3">{t("schemeFormer")}</option>
        </select>
      </div>

      {form.scheme === "former_v3" ? (
        <>
          <UnitSelect
            label={t("province")}
            value={form.provinceFormerId}
            onChange={(id) =>
              update({ ...form, provinceFormerId: id, districtFormerId: "", wardFormerId: "" })
            }
            options={provincesFormer}
            placeholder={t("provincePlaceholder")}
          />
          <UnitSelect
            label={t("district")}
            value={form.districtFormerId}
            onChange={(id) => update({ ...form, districtFormerId: id, wardFormerId: "" })}
            options={districts}
            placeholder={t("districtPlaceholder")}
            disabled={!form.provinceFormerId}
          />
          <UnitSelect
            label={t("ward")}
            value={form.wardFormerId}
            onChange={(id) => update({ ...form, wardFormerId: id })}
            options={wardsFormer}
            placeholder={t("wardPlaceholder")}
            disabled={!form.districtFormerId}
          />
        </>
      ) : (
        <>
          <UnitSelect
            label={t("province")}
            value={form.provinceId}
            onChange={(id) => update({ ...form, provinceId: id, wardId: "" })}
            options={provincesCurrent}
            placeholder={t("provincePlaceholder")}
          />
          <UnitSelect
            label={t("ward")}
            value={form.wardId}
            onChange={(id) => update({ ...form, wardId: id })}
            options={wardsCurrent}
            placeholder={t("wardPlaceholder")}
            disabled={!form.provinceId}
          />
        </>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`${schemeId}-line1`}>{t("line1")}</Label>
        <Input
          id={`${schemeId}-line1`}
          value={form.line1}
          onChange={(e) => update({ ...form, line1: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${schemeId}-line2`}>{t("line2")}</Label>
        <Input
          id={`${schemeId}-line2`}
          value={form.line2}
          onChange={(e) => update({ ...form, line2: e.target.value })}
        />
      </div>
    </div>
  );
}

function UnitSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id?: string; name?: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}
