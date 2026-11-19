"use client";

import { Field, FieldGroup, FieldLabel } from "@bokdy/ui";
import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { EntityFormSection, useEntityFormFieldsClass } from "@/components/entity/form-section";
import { PopoverCommandMultiSelect } from "@/components/popover-command-multi-select";
import { useAmenityCatalog } from "@/hooks/use-amenities";
import { amenityLabel } from "@/lib/api/amenities";
import type { BranchFormValues } from "@/lib/validation/branch-form";

export function BranchAmenitiesFields() {
  const t = useTranslations("organization.branchDetail.amenities");
  const locale = useLocale();
  const fieldsClass = useEntityFormFieldsClass();
  const { control } = useFormContext<BranchFormValues>();
  const catalog = useAmenityCatalog();
  const selected = useWatch({ control, name: "amenity_ids" });

  const options = useMemo(
    () =>
      (catalog.data ?? [])
        .filter(
          (amenity) =>
            amenity.scope === "branch" &&
            (amenity.is_active !== false || (selected ?? []).includes(amenity.id)),
        )
        .map((amenity) => ({
          value: amenity.id,
          label: amenityLabel(amenity, locale),
          keywords: `${amenity.code} ${amenity.name_en} ${amenity.name_vi}`,
        })),
    [catalog.data, locale, selected],
  );

  return (
    <EntityFormSection
      title={t("title")}
      hint={t("hint")}
      icon={<Sparkles className="size-4" aria-hidden />}
      tone="rose"
    >
      <FieldGroup className={fieldsClass}>
        <Field>
          <FieldLabel>{t("label")}</FieldLabel>
          <Controller
            control={control}
            name="amenity_ids"
            render={({ field }) => (
              <PopoverCommandMultiSelect
                value={field.value}
                options={options}
                searchable
                placeholder={t("placeholder")}
                emptyText={t("emptyCatalog")}
                aria-label={t("label")}
                className="w-full bg-background"
                onValueChange={(next) => field.onChange(next)}
              />
            )}
          />
        </Field>
      </FieldGroup>
    </EntityFormSection>
  );
}
