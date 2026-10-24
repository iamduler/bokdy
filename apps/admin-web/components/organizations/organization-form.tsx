"use client";

import { toast } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Mail, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { EntityCover } from "@/components/entity/cover";
import { EntityFormFrame } from "@/components/entity/form-frame";
import {
  EntityMetadataForm,
  type EntityFormBlock,
} from "@/components/entity/metadata-form";
import { ImageCropDialog } from "@/components/media/image-crop-dialog";
import type { PopoverCommandOption } from "@/components/popover-command-select";
import { useActivateOrganization } from "@/hooks/use-activate-organization";
import { useCreateOrganization } from "@/hooks/use-create-organization";
import { useRestoreOrganization } from "@/hooks/use-restore-organization";
import { useSuspendOrganization } from "@/hooks/use-suspend-organization";
import { useUpdateOrganization } from "@/hooks/use-update-organization";
import { useProvinces, useWards } from "@/hooks/use-admin-units";
import { useRouter } from "@/i18n/navigation";
import {
  checkOrganizationSlug,
  uploadOrganizationMedia,
  type AdminOrganization,
  type OrganizationProfileInput,
  type OrgStatus,
} from "@/lib/api/admin";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { toVietnameseASCII } from "@/lib/text/vietnamese-ascii";
import {
  ORGANIZATION_TYPES,
  organizationFormSchema,
  type OrganizationFormValues,
} from "@/lib/validation/organization-create";

const ORG_STATUSES: OrgStatus[] = [
  "active",
  "inactive",
  "suspended",
  "archived",
];

const FORM_FIELDS = [
  "name_vi",
  "name_en",
  "legal_name",
  "organization_type",
  "slug",
  "tax_code",
  "email",
  "phone",
  "website",
  "province_id",
  "ward_id",
  "address_line_1",
] as const;

type OrganizationFormProps =
  | { mode: "create" }
  | { mode: "edit"; organization: AdminOrganization };

type CropTarget = "logo" | "banner" | null;

const emptyValues: OrganizationFormValues = {
  name_vi: "",
  name_en: "",
  legal_name: "",
  organization_type: "club",
  slug: "",
  tax_code: "",
  email: "",
  phone: "",
  website: "",
  province_id: "",
  ward_id: "",
  address_line_1: "",
  status: "inactive",
  suspend_reason: "",
};

function valuesFromOrganization(
  organization: AdminOrganization,
): OrganizationFormValues {
  const type =
    ORGANIZATION_TYPES.find(
      (item) => item === organization.organization_type,
    ) ?? "club";
  return {
    name_vi: organization.name_vi ?? "",
    name_en: organization.name_en ?? "",
    legal_name: organization.legal_name ?? "",
    organization_type: type,
    slug: organization.slug ?? "",
    tax_code: organization.tax_code ?? "",
    email: organization.email ?? "",
    phone: organization.phone ?? "",
    website: organization.website ?? "",
    province_id: organization.headquarters?.province_id ?? "",
    ward_id: organization.headquarters?.ward_id ?? "",
    address_line_1: organization.headquarters?.address_line_1 ?? "",
    status: organization.status,
    suspend_reason: "",
  };
}

function profileBody(
  values: OrganizationFormValues,
  mode: "create" | "edit",
): OrganizationProfileInput {
  const headquarters =
    values.province_id || values.ward_id || values.address_line_1
      ? {
          province_id: values.province_id || undefined,
          ward_id: values.ward_id || undefined,
          address_line_1: values.address_line_1,
        }
      : mode === "edit"
        ? {
            province_id: "",
            ward_id: "",
            address_line_1: "",
          }
        : undefined;
  const nameVi = values.name_vi.trim();
  return {
    name_vi: nameVi,
    name_en: toVietnameseASCII(nameVi || values.name_en),
    legal_name: values.legal_name,
    organization_type: values.organization_type,
    slug: values.slug,
    tax_code: values.tax_code,
    email: values.email,
    phone: values.phone,
    website: values.website,
    headquarters,
  };
}

export function OrganizationForm(props: OrganizationFormProps) {
  const t = useTranslations("organization");
  const te = useTranslations("errors");
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const organization = isEdit ? props.organization : null;
  const create = useCreateOrganization();
  const update = useUpdateOrganization(organization?.id ?? "");
  const activate = useActivateOrganization();
  const suspend = useSuspendOrganization();
  const restore = useRestoreOrganization();
  const pending =
    create.isPending ||
    update.isPending ||
    activate.isPending ||
    suspend.isPending ||
    restore.isPending;
  const leaveConfirmed = useRef(false);
  const [logo, setLogo] = useState<Blob | null>(null);
  const [banner, setBanner] = useState<Blob | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [slugTaken, setSlugTaken] = useState(false);

  const schema = useMemo(
    () =>
      organizationFormSchema({
        nameRequired: t("nameRequired"),
        emailInvalid: t("emailInvalid"),
        websiteInvalid: t("websiteInvalid"),
        addressIncomplete: t("addressIncomplete"),
      }),
    [t],
  );

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: organization
      ? valuesFromOrganization(organization)
      : emptyValues,
  });
  const {
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    clearErrors,
    formState,
  } = form;
  const { isDirty } = formState;

  const provinceId = watch("province_id");
  const slug = watch("slug");
  const { data: provinces = [] } = useProvinces("current_v2");
  const { data: wards = [] } = useWards({
    scheme: "current_v2",
    provinceId: provinceId || undefined,
  });

  const organizationId = organization?.id;
  useEffect(() => {
    if (!organization) return;
    reset(valuesFromOrganization(organization));
    // Reset only when opening another organization, not on every refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, reset]);

  useEffect(() => {
    if (!isDirty && !logo && !banner) leaveConfirmed.current = false;
  }, [isDirty, logo, banner]);

  useEffect(() => {
    if (!isDirty && !logo && !banner) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, logo, banner]);

  useEffect(() => {
    const trimmed = slug.trim();
    const savedSlug = organization?.slug;
    const unchanged = savedSlug !== undefined && trimmed === savedSlug;
    if (!trimmed || unchanged) {
      setSlugTaken(false);
      clearErrors("slug");
      return;
    }
    const timer = window.setTimeout(() => {
      void checkOrganizationSlug(trimmed, organizationId)
        .then((result) => {
          if (watch("slug").trim() !== trimmed) return;
          const taken = !result.available;
          setSlugTaken(taken);
          if (taken) {
            setError("slug", { type: "validate", message: t("slugTaken") });
            return;
          }
          clearErrors("slug");
        })
        .catch(() => setSlugTaken(false));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [slug, organizationId, organization?.slug, setError, clearErrors, t, watch]);

  const backHref = organization
    ? `/organizations/${organization.id}`
    : "/organizations";
  const dirty = isDirty || Boolean(logo || banner);

  function requestLeave() {
    if (dirty && !leaveConfirmed.current) {
      leaveConfirmed.current = true;
      toast.warning(t("unsavedWarning"));
      return;
    }
    router.push(backHref);
  }

  function applyApiError(err: unknown) {
    const apiErr = err instanceof ApiError ? err : null;
    if (!apiErr) {
      toast.error(t("loadError"));
      return;
    }
    if (apiErr.message.toLowerCase().includes("slug")) {
      setError("slug", { message: t("slugTaken") });
      return;
    }
    let mapped = false;
    for (const detail of apiErr.details) {
      if (!FORM_FIELDS.includes(detail.field as (typeof FORM_FIELDS)[number]))
        continue;
      setError(detail.field as (typeof FORM_FIELDS)[number], {
        message: te(
          errorMessageKey(
            new ApiError(detail.code, detail.message, apiErr.status),
          ),
        ),
      });
      mapped = true;
    }
    if (!mapped) toast.error(te(errorMessageKey(apiErr)));
  }

  function openCrop(target: "logo" | "banner", file: File) {
    const url = URL.createObjectURL(file);
    setCropSrc((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });
    setCropTarget(target);
  }

  function storeCrop(blob: Blob) {
    const url = URL.createObjectURL(blob);
    if (cropTarget === "logo") {
      setLogo(blob);
      setLogoPreview((current) => {
        if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
        return url;
      });
    }
    if (cropTarget === "banner") {
      setBanner(blob);
      setBannerPreview((current) => {
        if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
        return url;
      });
    }
  }

  async function onSubmit(values: OrganizationFormValues) {
    if (slugTaken) {
      setError("slug", { message: t("slugTaken") });
      return;
    }
    const nextStatus = values.status as OrgStatus;
    if (organization && nextStatus !== organization.status) {
      const changingToSuspended =
        organization.status === "active" && nextStatus === "suspended";
      const allowed =
        (organization.status === "inactive" && nextStatus === "active") ||
        (organization.status === "suspended" && nextStatus === "active") ||
        changingToSuspended;
      if (!allowed) {
        setError("status", { message: t("statusUnsupported") });
        return;
      }
      if (changingToSuspended && !values.suspend_reason.trim()) {
        setError("suspend_reason", { message: t("statusReasonRequired") });
        return;
      }
    }
    try {
      const body = profileBody(values, props.mode);
      let saved: AdminOrganization;
      if (props.mode === "create") {
        saved = await create.mutateAsync(body);
      } else {
        saved = await update.mutateAsync(body);
      }
      if (logo) saved = await uploadOrganizationMedia(saved.id, "logo", logo);
      if (banner)
        saved = await uploadOrganizationMedia(saved.id, "banner", banner);
      setLogo(null);
      setBanner(null);
      setLogoPreview(null);
      setBannerPreview(null);
      if (props.mode === "create") {
        toast.success(t("createSuccess"));
        router.push(`/organizations/${saved.id}`);
        return;
      }
      if (organization && nextStatus !== organization.status) {
        if (organization.status === "inactive" && nextStatus === "active") {
          saved = await activate.mutateAsync(saved.id);
        } else if (
          organization.status === "suspended" &&
          nextStatus === "active"
        ) {
          saved = await restore.mutateAsync(saved.id);
        } else if (
          organization.status === "active" &&
          nextStatus === "suspended"
        ) {
          saved = await suspend.mutateAsync({
            id: saved.id,
            reason: values.suspend_reason.trim(),
          });
        }
      }
      reset(valuesFromOrganization(saved));
      toast.success(t("saveSuccess"));
    } catch (err) {
      applyApiError(err);
    }
  }

  const typeOptions: PopoverCommandOption[] = ORGANIZATION_TYPES.map(
    (value) => ({
      value,
      label: t(`type.${value}`),
      keywords: value,
    }),
  );
  const statusOptions: PopoverCommandOption[] = ORG_STATUSES.map((value) => ({
    value,
    label: t(`status.${value}`),
    keywords: value,
  }));
  const provinceOptions = provinces.map((unit) => ({
    value: unit.id,
    label: unit.name,
    keywords: `${unit.name_vi} ${unit.name_en} ${unit.code}`,
  }));
  const wardOptions = wards.map((unit) => ({
    value: unit.id,
    label: unit.name,
    keywords: `${unit.name_vi} ${unit.name_en} ${unit.code}`,
  }));

  const blocks = useMemo<EntityFormBlock<OrganizationFormValues>[]>(
    () => [
      {
        id: "identity",
        title: t("sectionIdentity"),
        icon: <Building2 className="size-4" aria-hidden />,
        tone: "sky",
        fields: [
          {
            kind: "text",
            name: "name_vi",
            label: t("fieldNameVi"),
            required: true,
            autoComplete: "organization",
            onValueChange: (value) => {
              setValue("name_en", toVietnameseASCII(value), {
                shouldDirty: true,
                shouldValidate: true,
              });
            },
          },
          { kind: "text", name: "legal_name", label: t("fieldLegalName") },
          {
            kind: "select",
            name: "organization_type",
            label: t("fieldType"),
            required: true,
            options: typeOptions,
          },
          {
            kind: "text",
            name: "slug",
            label: t("fieldSlug"),
            description: t("fieldSlugHint"),
            error: slugTaken ? t("slugTaken") : undefined,
          },
          {
            kind: "select",
            name: "status",
            label: t("fieldOrgStatus"),
            options: statusOptions,
            visible: () => Boolean(organization),
            onValueChange: () => {
              clearErrors(["status", "suspend_reason"]);
            },
          },
          {
            kind: "text",
            name: "suspend_reason",
            label: t("suspendReason"),
            required: true,
            visible: (values) =>
              Boolean(
                organization &&
                values.status === "suspended" &&
                organization.status !== "suspended",
              ),
          },
        ],
      },
      {
        id: "contact",
        title: t("sectionContact"),
        icon: <Mail className="size-4" aria-hidden />,
        tone: "emerald",
        fields: [
          {
            kind: "text",
            name: "email",
            label: t("fieldEmail"),
            inputType: "email",
            autoComplete: "email",
          },
          {
            kind: "text",
            name: "phone",
            label: t("fieldPhone"),
            inputType: "tel",
            autoComplete: "tel",
          },
          {
            kind: "text",
            name: "website",
            label: t("fieldWebsite"),
            inputType: "url",
            placeholder: "https://",
          },
          { kind: "text", name: "tax_code", label: t("fieldTaxCode") },
        ],
      },
      {
        id: "address",
        title: t("sectionAddress"),
        description: t("addressHint"),
        icon: <MapPin className="size-4" aria-hidden />,
        tone: "amber",
        fields: [
          {
            kind: "select",
            name: "province_id",
            label: t("fieldProvince"),
            required: true,
            options: provinceOptions,
            searchable: true,
            placeholder: t("fieldProvince"),
            onValueChange: () => {
              setValue("ward_id", "", { shouldDirty: true });
            },
          },
          {
            kind: "select",
            name: "ward_id",
            label: t("fieldWard"),
            required: true,
            options: wardOptions,
            searchable: true,
            placeholder: t("fieldWard"),
            disabled: (values) => !values.province_id,
          },
          {
            kind: "text",
            name: "address_line_1",
            label: t("fieldAddress1"),
            span: 2,
          },
        ],
      },
    ],
    [
      t,
      typeOptions,
      statusOptions,
      provinceOptions,
      wardOptions,
      slugTaken,
      organization,
      clearErrors,
      setValue,
    ],
  );

  const storedLogo = organization?.logo_file_id
    ? `/api/go/files/${organization.logo_file_id}`
    : null;
  const storedBanner = organization?.banner_file_id
    ? `/api/go/files/${organization.banner_file_id}`
    : null;

  return (
    <FormProvider {...form}>
      <EntityFormFrame
        cancelLabel={t("createCancel")}
        submitLabel={isEdit ? t("save") : t("createSubmit")}
        onCancel={requestLeave}
        pending={pending}
        submitDisabled={isEdit && !dirty}
        onSubmit={handleSubmit(onSubmit)}
        cover={
          <EntityCover
            bannerLabel={t("fieldBanner")}
            logoLabel={t("fieldLogo")}
            viewLabel={t("viewImage")}
            pickLabel={t("pickImage")}
            viewAvatarLabel={t("viewAvatar")}
            changeImageLabel={t("changeImage")}
            bannerPreview={bannerPreview ?? storedBanner}
            logoPreview={logoPreview ?? storedLogo}
            onBanner={(file) => openCrop("banner", file)}
            onLogo={(file) => openCrop("logo", file)}
          />
        }
      >
        <EntityMetadataForm blocks={blocks} />
        <ImageCropDialog
          open={cropTarget !== null}
          title={cropTarget === "banner" ? t("fieldBanner") : t("fieldLogo")}
          imageSrc={cropSrc}
          aspect={cropTarget === "banner" ? 3 : 1}
          outputWidth={cropTarget === "banner" ? 1200 : 512}
          outputHeight={cropTarget === "banner" ? 400 : 512}
          zoomLabel={t("cropZoom")}
          cancelLabel={t("cropCancel")}
          applyLabel={t("cropApply")}
          onOpenChange={(open) => {
            if (!open) {
              setCropTarget(null);
              setCropSrc((current) => {
                if (current) URL.revokeObjectURL(current);
                return null;
              });
            }
          }}
          onCropped={storeCrop}
        />
      </EntityFormFrame>
    </FormProvider>
  );
}
