"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutGrid } from "lucide-react";
import { toast } from "@bokdy/ui";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { sportLabel } from "@/components/branches/branch-sports-chips";
import { CourtContentFields } from "@/components/courts/court-content-fields";
import { EntityFormFrame } from "@/components/entity/form-frame";
import {
  EntityMetadataForm,
  type EntityFormBlock,
} from "@/components/entity/metadata-form";
import type { PopoverCommandOption } from "@/components/popover-command-select";
import { useAmenityCatalog } from "@/hooks/use-amenities";
import { useBranches } from "@/hooks/use-branches";
import {
  useArchiveCourt,
  useCloseCourt,
  useCompleteCourtMaintenance,
  useCreateCourt,
  useDeleteCourtGalleryItem,
  useOpenCourt,
  useStartCourtMaintenance,
  useUpdateCourt,
  useUploadCourtGalleryImage,
} from "@/hooks/use-courts";
import { useSports } from "@/hooks/use-sports";
import { amenityLabel } from "@/lib/api/amenities";
import { useRouter } from "@/i18n/navigation";
import type { Court, CourtEnvironment, CourtStatus, CourtSurface } from "@/lib/api/courts";
import { ApiError } from "@/lib/api/errors";
import { toVietnameseASCII } from "@/lib/text/vietnamese-ascii";
import {
  COURT_EDITABLE_STATUSES,
  COURT_ENVIRONMENTS,
  COURT_FORM_STATUSES,
  COURT_SURFACES,
  courtFormSchema,
  emptyCourtFormValues,
  type CourtFormStatus,
  type CourtFormValues,
} from "@/lib/validation/court-form";

type CourtFormProps = {
  organizationId: string;
  layout?: "page" | "sheet";
  onDone?: () => void;
  onRegisterLeave?: (leave: () => void) => void;
  /** When set, branch ComboBox is locked. */
  fixedBranchId?: string;
} & (
  | { mode: "create" }
  | { mode: "edit"; court: Court }
  | { mode: "duplicate"; court: Court }
);

export function CourtForm(props: CourtFormProps) {
  const t = useTranslations("organization.court");
  const locale = useLocale();
  const router = useRouter();
  const layout = props.layout ?? "sheet";
  const { organizationId, fixedBranchId } = props;
  const { data: branches = [] } = useBranches(organizationId);
  const { data: sports = [] } = useSports();
  const amenityCatalog = useAmenityCatalog();
  const create = useCreateCourt(organizationId);
  const uploadImage = useUploadCourtGalleryImage(organizationId);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [removedGalleryIds, setRemovedGalleryIds] = useState<string[]>([]);
  const editCourtId = props.mode === "edit" ? props.court.id : "";
  const update = useUpdateCourt(organizationId, editCourtId);
  const deleteGalleryItem = useDeleteCourtGalleryItem(organizationId, editCourtId);
  const open = useOpenCourt(organizationId, editCourtId);
  const close = useCloseCourt(organizationId, editCourtId);
  const archive = useArchiveCourt(organizationId, editCourtId);
  const startMaint = useStartCourtMaintenance(organizationId, editCourtId);
  const completeMaint = useCompleteCourtMaintenance(organizationId, editCourtId);

  const schema = useMemo(
    () =>
      courtFormSchema({
        nameRequired: t("nameRequired"),
        branchRequired: t("branchRequired"),
        sportRequired: t("sportRequired"),
      }),
    [t],
  );

  const defaults = useMemo((): CourtFormValues => {
    if (props.mode === "edit") {
      return emptyCourtFormValues({
        branch_id: props.court.branch_id,
        name_vi: props.court.name_vi ?? "",
        name_en: props.court.name_en ?? "",
        sport_id: props.court.sport_id,
        environment: (props.court.environment ??
          "unspecified") as CourtEnvironment,
        surface: (props.court.surface ?? "unspecified") as CourtSurface,
        dimensions: props.court.dimensions ?? "",
        description_vi: props.court.description_vi ?? "",
        description_en: props.court.description_en ?? "",
        amenity_ids: props.court.amenity_ids ?? [],
        status: props.court.status as CourtFormStatus,
      });
    }
    if (props.mode === "duplicate") {
      const suffix = t("nameCopySuffix");
      const nameVi = `${props.court.name_vi ?? props.court.name}${suffix}`;
      return emptyCourtFormValues({
        branch_id: props.court.branch_id,
        name_vi: nameVi,
        name_en: toVietnameseASCII(nameVi),
        sport_id: props.court.sport_id,
        environment: (props.court.environment ??
          "unspecified") as CourtEnvironment,
        surface: (props.court.surface ?? "unspecified") as CourtSurface,
        dimensions: props.court.dimensions ?? "",
        description_vi: props.court.description_vi ?? "",
        description_en: props.court.description_en ?? "",
        amenity_ids: props.court.amenity_ids ?? [],
      });
    }
    return emptyCourtFormValues({
      branch_id: fixedBranchId ?? "",
    });
  }, [fixedBranchId, props, t]);

  const form = useForm<CourtFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
    setPendingImages([]);
    setRemovedGalleryIds([]);
  }, [defaults, form]);

  useEffect(() => {
    props.onRegisterLeave?.(() => {
      props.onDone?.();
    });
  }, [props]);

  const branchId = useWatch({ control: form.control, name: "branch_id" });
  const sportId = useWatch({ control: form.control, name: "sport_id" });
  const amenityIds = useWatch({ control: form.control, name: "amenity_ids" }) ?? [];

  const branchLocked =
    Boolean(fixedBranchId) ||
    props.mode === "edit" ||
    props.mode === "duplicate";
  const pending =
    create.isPending ||
    update.isPending ||
    uploadImage.isPending ||
    deleteGalleryItem.isPending ||
    open.isPending ||
    close.isPending ||
    archive.isPending ||
    startMaint.isPending ||
    completeMaint.isPending;

  const branchOptions = useMemo<PopoverCommandOption[]>(
    () =>
      branches.map((branch) => ({
        value: branch.id,
        label: branch.name,
        keywords: `${branch.code} ${branch.name} ${branch.name_vi ?? ""} ${branch.name_en ?? ""}`,
      })),
    [branches],
  );

  const sportOptions = useMemo<PopoverCommandOption[]>(() => {
    const branchSportIds =
      branches.find((branch) => branch.id === branchId)?.sport_ids ?? [];
    const scoped = sports.filter(
      (sport) => branchSportIds.includes(sport.id) || sport.id === sportId,
    );
    const source = branchSportIds.length > 0 ? scoped : sports;
    return source.map((sport) => ({
      value: sport.id,
      label: sportLabel(sport, locale),
      keywords: `${sport.code} ${sport.name_en} ${sport.name_vi}`,
    }));
  }, [branches, branchId, sports, sportId, locale]);

  const amenityOptions = useMemo<PopoverCommandOption[]>(
    () =>
      (amenityCatalog.data ?? [])
        .filter(
          (amenity) =>
            amenity.is_active !== false || amenityIds.includes(amenity.id),
        )
        .map((amenity) => ({
          value: amenity.id,
          label: amenityLabel(amenity, locale),
          keywords: `${amenity.code} ${amenity.name_en} ${amenity.name_vi}`,
        })),
    [amenityCatalog.data, amenityIds, locale],
  );

  const envOptions = useMemo<PopoverCommandOption[]>(
    () =>
      COURT_ENVIRONMENTS.map((env) => ({
        value: env,
        label: t(`environment.${env}`),
        keywords: env,
      })),
    [t],
  );

  const surfaceOptions = useMemo<PopoverCommandOption[]>(
    () =>
      COURT_SURFACES.map((surface) => ({
        value: surface,
        label: t(`surface.${surface}`),
        keywords: surface,
      })),
    [t],
  );

  const statusOptions = useMemo<PopoverCommandOption[]>(
    () =>
      COURT_FORM_STATUSES.map((value) => ({
        value,
        label: t(`status.${value}`),
        keywords: value,
      })),
    [t],
  );

  const blocks = useMemo<EntityFormBlock<CourtFormValues>[]>(
    () => [
      {
        id: "identity",
        title: t("sectionIdentity"),
        icon: <LayoutGrid className="size-4" aria-hidden />,
        tone: "sky",
        fields: [
          {
            kind: "select",
            name: "branch_id",
            label: t("fieldBranch"),
            required: true,
            options: branchOptions,
            searchable: true,
            placeholder: t("branchPlaceholder"),
            disabled: branchLocked || pending,
            onValueChange: (_value, formApi) => {
              formApi.setValue("sport_id", "", { shouldValidate: false });
            },
          },
          {
            kind: "select",
            name: "sport_id",
            label: t("fieldSport"),
            required: true,
            options: sportOptions,
            searchable: true,
            placeholder: t("sportPlaceholder"),
            disabled: pending,
          },
          {
            kind: "text",
            name: "name_vi",
            label: t("fieldNameVi"),
            required: true,
            disabled: pending,
            onValueChange: (value, formApi) => {
              formApi.setValue("name_en", toVietnameseASCII(value), {
                shouldDirty: true,
                shouldValidate: false,
              });
            },
          },
          {
            kind: "select",
            name: "environment",
            label: t("fieldEnvironment"),
            options: envOptions,
            placeholder: t("environmentPlaceholder"),
            disabled: pending,
          },
          {
            kind: "select",
            name: "surface",
            label: t("fieldSurface"),
            options: surfaceOptions,
            placeholder: t("surfacePlaceholder"),
            disabled: pending,
          },
          {
            kind: "text",
            name: "dimensions",
            label: t("fieldDimensions"),
            placeholder: t("dimensionsPlaceholder"),
            disabled: pending,
          },
          {
            kind: "multi-select",
            name: "amenity_ids",
            label: t("fieldAmenities"),
            options: amenityOptions,
            searchable: true,
            placeholder: t("amenitiesPlaceholder"),
            disabled: pending,
            span: 2,
          },
          {
            kind: "select",
            name: "status",
            label: t("fieldStatus"),
            options: statusOptions,
            visible: () =>
              props.mode === "edit" &&
              (COURT_EDITABLE_STATUSES as readonly string[]).includes(
                props.court.status,
              ),
            disabled: pending,
            onValueChange: (_value, formApi) => {
              formApi.clearErrors("status");
            },
          },
        ],
      },
    ],
    [
      t,
      branchOptions,
      sportOptions,
      envOptions,
      surfaceOptions,
      amenityOptions,
      statusOptions,
      branchLocked,
      pending,
      props,
    ],
  );

  async function applyStatusTransition(
    from: CourtStatus,
    to: CourtFormStatus,
  ): Promise<boolean> {
    if (from === to) return true;
    if (to === "active") {
      if (from === "inactive") {
        await open.mutateAsync();
        return true;
      }
      if (from === "maintenance") {
        await completeMaint.mutateAsync();
        return true;
      }
    } else if (to === "inactive") {
      if (from === "active") {
        await close.mutateAsync();
        return true;
      }
    } else if (to === "maintenance") {
      if (from === "active" || from === "inactive") {
        await startMaint.mutateAsync({});
        return true;
      }
    } else if (to === "archived") {
      if (from === "inactive") {
        await archive.mutateAsync();
        return true;
      }
    }
    form.setError("status", { message: t("statusUnsupported") });
    return false;
  }

  async function onSubmit(values: CourtFormValues) {
    const nameEn = toVietnameseASCII(values.name_vi);
    try {
      if (props.mode === "create" || props.mode === "duplicate") {
        const created = await create.mutateAsync({
          branch_id: values.branch_id,
          name_vi: values.name_vi,
          name_en: nameEn,
          environment: values.environment,
          sport_id: values.sport_id,
          surface: values.surface,
          dimensions: values.dimensions,
          description_vi: values.description_vi,
          description_en: values.description_en,
          amenity_ids: values.amenity_ids,
        });
        let uploadFailed = false;
        for (const file of pendingImages) {
          try {
            await uploadImage.mutateAsync({ courtId: created.id, file });
          } catch {
            uploadFailed = true;
          }
        }
        if (uploadFailed) toast.error(t("images.uploadSomeFailed"));
        props.onDone?.();
        router.push(`/courts/${created.id}`);
        return;
      }

      const nextStatus = values.status;
      const editable = COURT_EDITABLE_STATUSES as readonly string[];
      const canChangeStatus =
        editable.includes(props.court.status) &&
        (editable.includes(nextStatus) || nextStatus === "archived");
      if (nextStatus !== props.court.status && !canChangeStatus) {
        form.setError("status", { message: t("statusUnsupported") });
        return;
      }

      const saved = await update.mutateAsync({
        name_vi: values.name_vi,
        name_en: nameEn,
        environment: values.environment,
        sport_id: values.sport_id,
        surface: values.surface,
        dimensions: values.dimensions,
        description_vi: values.description_vi,
        description_en: values.description_en,
        amenity_ids: values.amenity_ids,
      });

      if (nextStatus !== saved.status) {
        const ok = await applyStatusTransition(saved.status, nextStatus);
        if (!ok) return;
      }

      let galleryFailed = false;
      for (const mediaId of removedGalleryIds) {
        try {
          await deleteGalleryItem.mutateAsync(mediaId);
        } catch {
          galleryFailed = true;
        }
      }
      for (const file of pendingImages) {
        try {
          await uploadImage.mutateAsync({ courtId: props.court.id, file });
        } catch {
          galleryFailed = true;
        }
      }
      if (galleryFailed) toast.error(t("images.saveSomeFailed"));
      setPendingImages([]);
      setRemovedGalleryIds([]);
      props.onDone?.();
    } catch (err) {
      form.setError("root", {
        message: err instanceof ApiError ? err.message : t("saveError"),
      });
    }
  }

  const submitLabel =
    props.mode === "edit"
      ? t("saveSubmit")
      : props.mode === "duplicate"
        ? t("duplicateSubmit")
        : t("createSubmit");

  return (
    <FormProvider {...form}>
      <div
        className={
          layout === "sheet" ? "flex min-h-0 flex-1 flex-col" : undefined
        }
      >
        <EntityFormFrame
          cancelLabel={t("cancel")}
          submitLabel={submitLabel}
          onCancel={() => props.onDone?.()}
          pending={pending}
          onSubmit={form.handleSubmit(onSubmit)}
          actionsPlacement={layout === "sheet" ? "inline" : "shell"}
        >
          <EntityMetadataForm blocks={blocks} />

          {props.mode === "edit" ? (
            <CourtContentFields
              mode="edit"
              organizationId={organizationId}
              courtId={props.court.id}
              pendingImages={pendingImages}
              onPendingImagesChange={setPendingImages}
              removedGalleryIds={removedGalleryIds}
              onRemovedGalleryIdsChange={setRemovedGalleryIds}
              pending={pending}
            />
          ) : (
            <CourtContentFields
              mode="create"
              organizationId={organizationId}
              pendingImages={pendingImages}
              onPendingImagesChange={setPendingImages}
              pending={pending}
            />
          )}

          {form.formState.errors.root?.message ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          ) : null}
        </EntityFormFrame>
      </div>
    </FormProvider>
  );
}
