"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  RichTextEditor,
  type RichTextEditorLabels,
} from "@bokdy/ui";
import { FileText, Images } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import {
  CourtGalleryManager,
  CourtPendingImages,
} from "@/components/courts/court-gallery-field";
import {
  EntityFormSection,
  useEntityFormFieldsClass,
  useEntityFormFieldSpanClass,
} from "@/components/entity/form-section";
import type { CourtFormValues } from "@/lib/validation/court-form";

type CourtContentFieldsProps = {
  organizationId: string;
  pending?: boolean;
} & (
  | { mode: "create"; pendingImages: File[]; onPendingImagesChange: (files: File[]) => void }
  | {
      mode: "edit";
      courtId: string;
      pendingImages: File[];
      onPendingImagesChange: (files: File[]) => void;
      removedGalleryIds: string[];
      onRemovedGalleryIdsChange: (ids: string[]) => void;
    }
);

/** Rich description + gallery under EntityFormFrame (BranchContentFields pattern). */
export function CourtContentFields(props: CourtContentFieldsProps) {
  const t = useTranslations("organization.court");
  const tr = useTranslations("organization.branch.richText");
  const { control, formState } = useFormContext<CourtFormValues>();
  const descriptionError = formState.errors.description_vi?.message;
  const fieldsClass = useEntityFormFieldsClass();
  const fullRowClass = useEntityFormFieldSpanClass(2);

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

  return (
    <>
      <EntityFormSection
        title={t("sectionDescription")}
        icon={<FileText className="size-4" aria-hidden />}
        tone="amber"
      >
        <FieldGroup className={fieldsClass}>
          <Field
            data-invalid={Boolean(descriptionError) || undefined}
            className={fullRowClass}
          >
            <FieldLabel htmlFor="field-description_vi">
              {t("fieldDescription")}
            </FieldLabel>
            <Controller
              control={control}
              name="description_vi"
              render={({ field }) => (
                <RichTextEditor
                  id="field-description_vi"
                  aria-label={t("fieldDescription")}
                  aria-invalid={Boolean(descriptionError) || undefined}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  labels={editorLabels}
                  placeholder={t("descriptionPlaceholder")}
                  disabled={props.pending}
                />
              )}
            />
            <FieldError>{descriptionError}</FieldError>
          </Field>
        </FieldGroup>
      </EntityFormSection>

      <EntityFormSection
        title={t("sectionImages")}
        icon={<Images className="size-4" aria-hidden />}
        tone="rose"
      >
        <FieldGroup className={fieldsClass}>
          <Field className={fullRowClass}>
            <FieldLabel>{t("fieldImages")}</FieldLabel>
            {props.mode === "edit" ? (
              <CourtGalleryManager
                organizationId={props.organizationId}
                courtId={props.courtId}
                pendingFiles={props.pendingImages}
                onPendingFilesChange={props.onPendingImagesChange}
                removedIds={props.removedGalleryIds}
                onRemovedIdsChange={props.onRemovedGalleryIdsChange}
                disabled={props.pending}
              />
            ) : (
              <CourtPendingImages
                files={props.pendingImages}
                onChange={props.onPendingImagesChange}
                disabled={props.pending}
              />
            )}
          </Field>
        </FieldGroup>
      </EntityFormSection>
    </>
  );
}
