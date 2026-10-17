"use client";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  toast,
} from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useForm } from "react-hook-form";

import { EntityCover } from "@/components/entity/cover";
import { EntityFormFrame } from "@/components/entity/form-frame";
import { EntityFormSection, entityFormFieldsClass } from "@/components/entity/form-section";
import { ImageCropDialog } from "@/components/media/image-crop-dialog";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { PopoverCommandSelect, type PopoverCommandOption } from "@/components/popover-command-select";
import { useCreateOrganization } from "@/hooks/use-create-organization";
import { useUpdateOrganization } from "@/hooks/use-update-organization";
import { useProvinces, useWards } from "@/hooks/use-admin-units";
import { useRouter } from "@/i18n/navigation";
import {
  checkOrganizationSlug,
  uploadOrganizationMedia,
  type AdminOrganization,
  type OrganizationProfileInput,
} from "@/lib/api/admin";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import {
  ORGANIZATION_TYPES,
  organizationFormSchema,
  type OrganizationFormValues,
  type OrganizationType,
} from "@/lib/validation/organization-create";

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
  "address_line_2",
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
  address_line_2: "",
};

function valuesFromOrganization(organization: AdminOrganization): OrganizationFormValues {
  const type = ORGANIZATION_TYPES.find((item) => item === organization.organization_type) ?? "club";
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
    address_line_2: organization.headquarters?.address_line_2 ?? "",
  };
}

function profileBody(values: OrganizationFormValues, mode: "create" | "edit"): OrganizationProfileInput {
  const headquarters =
    values.province_id || values.ward_id || values.address_line_1 || values.address_line_2
      ? {
          province_id: values.province_id || undefined,
          ward_id: values.ward_id || undefined,
          address_line_1: values.address_line_1,
          address_line_2: values.address_line_2,
        }
      : mode === "edit"
        ? { province_id: "", ward_id: "", address_line_1: "", address_line_2: "" }
        : undefined;
  return {
    name_vi: values.name_vi,
    name_en: values.name_en,
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
  const pending = create.isPending || update.isPending;
  const leaveConfirmed = useRef(false);
  const statusNotified = useRef(false);
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

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: organization ? valuesFromOrganization(organization) : emptyValues,
  });

  const provinceId = watch("province_id");
  const wardId = watch("ward_id");
  const organizationType = watch("organization_type");
  const slug = watch("slug");
  const { data: provinces = [] } = useProvinces("current_v2");
  const { data: wards = [] } = useWards({ scheme: "current_v2", provinceId: provinceId || undefined });

  const organizationId = organization?.id;
  useEffect(() => {
    if (!organization) return;
    reset(valuesFromOrganization(organization));
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
    if (!organization || statusNotified.current) return;
    if (organization.status !== "suspended" && organization.status !== "archived") return;
    statusNotified.current = true;
    toast.info(t("editStatusNotice"));
  }, [organization, t]);

  useEffect(() => {
    const trimmed = slug.trim();
    if (!trimmed) {
      setSlugTaken(false);
      return;
    }
    const timer = window.setTimeout(() => {
      void checkOrganizationSlug(trimmed, organizationId)
        .then((result) => setSlugTaken(!result.available))
        .catch(() => setSlugTaken(false));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [slug, organizationId]);

  const backHref = organization ? `/organizations/${organization.id}` : "/organizations";
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
      if (!FORM_FIELDS.includes(detail.field as (typeof FORM_FIELDS)[number])) continue;
      setError(detail.field as (typeof FORM_FIELDS)[number], {
        message: te(errorMessageKey(new ApiError(detail.code, detail.message, apiErr.status))),
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
    try {
      const body = profileBody(values, props.mode);
      let saved: AdminOrganization;
      if (props.mode === "create") {
        saved = await create.mutateAsync(body);
      } else {
        saved = await update.mutateAsync(body);
      }
      if (logo) saved = await uploadOrganizationMedia(saved.id, "logo", logo);
      if (banner) saved = await uploadOrganizationMedia(saved.id, "banner", banner);
      setLogo(null);
      setBanner(null);
      setLogoPreview(null);
      setBannerPreview(null);
      if (props.mode === "create") {
        toast.success(t("createSuccess"));
        router.push(`/organizations/${saved.id}`);
        return;
      }
      reset(valuesFromOrganization(saved));
      toast.success(t("saveSuccess"));
    } catch (err) {
      applyApiError(err);
    }
  }

  const typeOptions: PopoverCommandOption[] = ORGANIZATION_TYPES.map((value) => ({
    value,
    label: t(`type.${value}`),
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
  const storedLogo = organization?.logo_file_id ? `/api/go/files/${organization.logo_file_id}` : null;
  const storedBanner = organization?.banner_file_id ? `/api/go/files/${organization.banner_file_id}` : null;

  return (
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
          bannerPreview={bannerPreview ?? storedBanner}
          logoPreview={logoPreview ?? storedLogo}
          onBanner={(file) => openCrop("banner", file)}
          onLogo={(file) => openCrop("logo", file)}
        />
      }
    >
      <EntityFormSection title={t("sectionIdentity")}>
        <FieldGroup className={entityFormFieldsClass}>
          <TextField
            id="org-name-vi"
            label={t("fieldNameVi")}
            error={errors.name_vi?.message}
            autoComplete="organization"
            {...register("name_vi")}
          />
          <TextField id="org-name-en" label={t("fieldNameEn")} error={errors.name_en?.message} {...register("name_en")} />
          <TextField id="org-legal-name" label={t("fieldLegalName")} error={errors.legal_name?.message} {...register("legal_name")} />
          <Field data-invalid={Boolean(errors.organization_type) || undefined}>
            <FieldLabel>{t("fieldType")}</FieldLabel>
            <PopoverCommandSelect
              value={organizationType}
              onValueChange={(value) =>
                setValue("organization_type", value as OrganizationType, { shouldDirty: true, shouldValidate: true })
              }
              options={typeOptions}
              aria-label={t("fieldType")}
              className="w-full justify-between border border-input bg-background"
            />
            <FieldError>{errors.organization_type?.message}</FieldError>
          </Field>
          <TextField
            id="org-slug"
            label={t("fieldSlug")}
            description={t("fieldSlugHint")}
            error={errors.slug?.message || (slugTaken ? t("slugTaken") : undefined)}
            {...register("slug")}
          />
        </FieldGroup>
      </EntityFormSection>

      <EntityFormSection title={t("sectionContact")}>
        <FieldGroup className={entityFormFieldsClass}>
          <TextField
            id="org-email"
            label={t("fieldEmail")}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <TextField
            id="org-phone"
            label={t("fieldPhone")}
            type="tel"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <TextField
            id="org-website"
            label={t("fieldWebsite")}
            type="url"
            placeholder="https://"
            error={errors.website?.message}
            {...register("website")}
          />
          <TextField id="org-tax" label={t("fieldTaxCode")} error={errors.tax_code?.message} {...register("tax_code")} />
        </FieldGroup>
      </EntityFormSection>

      {organization ? (
        <EntityFormSection title={t("fieldOrgStatus")}>
          <OrganizationStatusBadge kind="org" status={organization.status} />
          <FieldDescription>{t("statusReadonly")}</FieldDescription>
        </EntityFormSection>
      ) : null}

      <EntityFormSection title={t("sectionAddress")}>
        <p className="text-sm text-muted-foreground">{t("addressHint")}</p>
        <FieldGroup className={entityFormFieldsClass}>
          <Field data-invalid={Boolean(errors.province_id) || undefined}>
            <FieldLabel>{t("fieldProvince")}</FieldLabel>
            <PopoverCommandSelect
              value={provinceId}
              onValueChange={(value) => {
                setValue("province_id", value, { shouldDirty: true, shouldValidate: true });
                setValue("ward_id", "", { shouldDirty: true });
              }}
              options={provinceOptions}
              searchable
              placeholder={t("fieldProvince")}
              aria-label={t("fieldProvince")}
              className="w-full justify-between border border-input bg-background"
            />
            <FieldError>{errors.province_id?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(errors.ward_id) || undefined}>
            <FieldLabel>{t("fieldWard")}</FieldLabel>
            <PopoverCommandSelect
              value={wardId}
              onValueChange={(value) => setValue("ward_id", value, { shouldDirty: true, shouldValidate: true })}
              options={wardOptions}
              searchable
              disabled={!provinceId}
              placeholder={t("fieldWard")}
              aria-label={t("fieldWard")}
              className="w-full justify-between border border-input bg-background"
            />
            <FieldError>{errors.ward_id?.message}</FieldError>
          </Field>
          <TextField
            id="org-address-1"
            label={t("fieldAddress1")}
            error={errors.address_line_1?.message}
            {...register("address_line_1")}
          />
          <TextField
            id="org-address-2"
            label={t("fieldAddress2")}
            error={errors.address_line_2?.message}
            {...register("address_line_2")}
          />
        </FieldGroup>
      </EntityFormSection>

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
  );
}

function TextField({
  id,
  label,
  error,
  description,
  ...props
}: ComponentProps<typeof Input> & { id: string; label: string; error?: string; description?: string }) {
  return (
    <Field data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} aria-invalid={Boolean(error) || undefined} {...props} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}
