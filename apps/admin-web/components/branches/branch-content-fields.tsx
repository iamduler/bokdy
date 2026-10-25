"use client";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  RichTextEditor,
  Textarea,
  type RichTextEditorLabels,
} from "@bokdy/ui";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import {
  EntityFormSection,
  entityFormFieldsClass,
} from "@/components/entity/form-section";
import {
  SHORT_INTRO_MAX_LENGTH,
  type BranchFormValues,
} from "@/lib/validation/branch-form";

/** Bilingual short intro (≤200) + rich description editors for branch forms. */
export function BranchContentFields() {
  const t = useTranslations("organization.branch");
  const tr = useTranslations("organization.branch.richText");
  const { register, control, formState } = useFormContext<BranchFormValues>();
  const { errors } = formState;
  const shortIntroVi = useWatch({ control, name: "short_intro_vi" }) ?? "";
  const shortIntroEn = useWatch({ control, name: "short_intro_en" }) ?? "";
  const introLengths = {
    short_intro_vi: shortIntroVi.length,
    short_intro_en: shortIntroEn.length,
  } as const;

  const editorLabels = useMemo<RichTextEditorLabels>(
    () => ({
      bold: tr("bold"),
      italic: tr("italic"),
      strike: tr("strike"),
      heading2: tr("heading2"),
      heading3: tr("heading3"),
      bulletList: tr("bulletList"),
      orderedList: tr("orderedList"),
      blockquote: tr("blockquote"),
      undo: tr("undo"),
      redo: tr("redo"),
    }),
    [tr],
  );

  const intros = [
    { name: "short_intro_vi", label: t("fieldShortIntroVi") },
    { name: "short_intro_en", label: t("fieldShortIntroEn") },
  ] as const;
  const descriptions = [
    { name: "description_vi", label: t("fieldDescriptionVi") },
    { name: "description_en", label: t("fieldDescriptionEn") },
  ] as const;

  return (
    <EntityFormSection
      title={t("sectionIntro")}
      icon={<FileText className="size-4" aria-hidden />}
      tone="amber"
    >
      <FieldGroup className={entityFormFieldsClass}>
        {intros.map(({ name, label }) => {
          const message = errors[name]?.message;
          return (
            <Field
              key={name}
              data-invalid={Boolean(message) || undefined}
              className="sm:col-span-2"
            >
              <FieldLabel htmlFor={`field-${name}`}>{label}</FieldLabel>
              <Textarea
                id={`field-${name}`}
                rows={3}
                maxLength={SHORT_INTRO_MAX_LENGTH}
                aria-invalid={Boolean(message) || undefined}
                {...register(name)}
              />
              <FieldDescription className="text-end tabular-nums">
                {t("fieldShortIntroCount", {
                  count: introLengths[name],
                  max: SHORT_INTRO_MAX_LENGTH,
                })}
              </FieldDescription>
              <FieldError>{message}</FieldError>
            </Field>
          );
        })}
        {descriptions.map(({ name, label }) => {
          const message = errors[name]?.message;
          return (
            <Field
              key={name}
              data-invalid={Boolean(message) || undefined}
              className="sm:col-span-2"
            >
              <FieldLabel htmlFor={`field-${name}`}>{label}</FieldLabel>
              <Controller
                control={control}
                name={name}
                render={({ field }) => (
                  <RichTextEditor
                    id={`field-${name}`}
                    aria-label={label}
                    aria-invalid={Boolean(message) || undefined}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    labels={editorLabels}
                    placeholder={t("fieldDescriptionPlaceholder")}
                  />
                )}
              />
              <FieldError>{message}</FieldError>
            </Field>
          );
        })}
      </FieldGroup>
    </EntityFormSection>
  );
}
