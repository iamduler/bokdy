"use client";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  toast,
} from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Mail, MapPin, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { EntityCover } from "@/components/entity/cover";
import { EntityFormFrame } from "@/components/entity/form-frame";
import { EntityFormSection } from "@/components/entity/form-section";
import {
  EntityMetadataForm,
  type EntityFormBlock,
} from "@/components/entity/metadata-form";
import { AddressAutocomplete } from "@/components/maps/address-autocomplete";
import { MapPicker } from "@/components/maps/map-picker";
import { ImageCropDialog } from "@/components/media/image-crop-dialog";
import {
  PopoverCommandSelect,
  type PopoverCommandOption,
} from "@/components/popover-command-select";
import {
  useArchiveBranch,
  useCloseBranch,
  useCreateBranch,
  useMaintenanceBranch,
  useOpenBranch,
  useUpdateBranch,
} from "@/hooks/use-branches";
import { useProvinces, useWards } from "@/hooks/use-admin-units";
import { useSports } from "@/hooks/use-sports";
import { useRouter } from "@/i18n/navigation";
import {
  checkBranchSlug,
  currentBranchAddress,
  uploadBranchMedia,
  type Branch,
  type BranchProfileInput,
  type BranchStatus,
} from "@/lib/api/branches";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import {
  reverseGeocode,
  type MapsPlaceDetail,
  type MapsReverseResult,
} from "@/lib/api/maps";
import { DEFAULT_BRANCH_TIMEZONE } from "@/lib/entity-code-prefixes";
import { toVietnameseASCII } from "@/lib/text/vietnamese-ascii";
import {
  branchFormSchema,
  dateInputFromIso,
  todayDateInput,
  type BranchFormValues,
} from "@/lib/validation/branch-form";

const EDITABLE_STATUSES = ["inactive", "active", "maintenance"] as const;

type CropTarget = "logo" | "banner" | null;

const FORM_FIELDS = [
  "name_vi",
  "name_en",
  "slug",
  "sport_ids",
  "phone",
  "email",
  "website",
  "facebook_url",
  "google_maps_url",
  "founded_year",
  "province_id",
  "ward_id",
  "address_line_1",
  "latitude",
  "longitude",
] as const;

type BranchFormProps = {
  organizationId: string;
  layout?: "page" | "sheet";
  onDone?: () => void;
  onRegisterLeave?: (leave: () => void) => void;
} & ({ mode: "create" } | { mode: "edit"; branch: Branch });

const emptyValues: BranchFormValues = {
  name_vi: "",
  name_en: "",
  slug: "",
  sport_ids: [],
  phone: "",
  email: "",
  website: "",
  facebook_url: "",
  google_maps_url: "",
  founded_year: "",
  joined_at: todayDateInput(),
  province_id: "",
  ward_id: "",
  address_line_1: "",
  latitude: "",
  longitude: "",
  status: "inactive",
};

function valuesFromBranch(branch: Branch): BranchFormValues {
  const address = currentBranchAddress(branch);
  return {
    name_vi: branch.name_vi ?? "",
    name_en: branch.name_en ?? "",
    slug: branch.slug ?? "",
    sport_ids: branch.sport_ids ?? [],
    phone: branch.phone ?? "",
    email: branch.email ?? "",
    website: branch.website ?? "",
    facebook_url: branch.facebook_url ?? "",
    google_maps_url: branch.google_maps_url ?? "",
    founded_year:
      branch.founded_year != null ? String(branch.founded_year) : "",
    joined_at: dateInputFromIso(branch.created_at),
    province_id: address?.province_id ?? "",
    ward_id: address?.ward_id ?? "",
    address_line_1: address?.address_line_1 ?? "",
    latitude: address?.latitude != null ? String(address.latitude) : "",
    longitude: address?.longitude != null ? String(address.longitude) : "",
    status: branch.status,
  };
}

function profileBody(
  values: BranchFormValues,
  mode: "create" | "edit",
): BranchProfileInput {
  const nameVi = values.name_vi.trim();
  const yearRaw = values.founded_year.trim();
  const foundedYear = yearRaw ? Number(yearRaw) : null;
  const body: BranchProfileInput = {
    name_vi: nameVi,
    name_en: toVietnameseASCII(nameVi || values.name_en),
    slug: values.slug.trim(),
    phone: values.phone,
    email: values.email,
    website: values.website.trim(),
    facebook_url: values.facebook_url.trim(),
    google_maps_url: values.google_maps_url.trim(),
    founded_year: foundedYear,
    sport_ids: values.sport_ids,
    addresses: [
      {
        division_scheme: "current_v2",
        province_id: values.province_id,
        ward_id: values.ward_id,
        address_line_1: values.address_line_1,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
      },
    ],
  };
  if (mode === "create") {
    body.timezone = DEFAULT_BRANCH_TIMEZONE;
  }
  return body;
}

export function BranchForm(props: BranchFormProps) {
  const t = useTranslations("organization");
  const tb = useTranslations("organization.branch");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const branch = props.mode === "edit" ? props.branch : undefined;
  const { organizationId, onDone, onRegisterLeave } = props;
  const layout = props.layout ?? "page";
  const create = useCreateBranch(organizationId);
  const update = useUpdateBranch(organizationId, branch?.id ?? "");
  const open = useOpenBranch(organizationId, branch?.id ?? "");
  const close = useCloseBranch(organizationId, branch?.id ?? "");
  const maintenance = useMaintenanceBranch(organizationId, branch?.id ?? "");
  const archive = useArchiveBranch(organizationId, branch?.id ?? "");
  const pending =
    create.isPending ||
    update.isPending ||
    open.isPending ||
    close.isPending ||
    maintenance.isPending ||
    archive.isPending;
  const leaveConfirmed = useRef(false);
  const [slugTaken, setSlugTaken] = useState(false);
  const [logo, setLogo] = useState<Blob | null>(null);
  const [banner, setBanner] = useState<Blob | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const mediaDirty = Boolean(logo || banner);

  const schema = useMemo(
    () =>
      branchFormSchema({
        nameRequired: t("nameRequired"),
        emailInvalid: t("emailInvalid"),
        websiteInvalid: t("websiteInvalid"),
        addressRequired: tb("addressRequired"),
        coordsInvalid: tb("coordsInvalid"),
        foundedYearInvalid: tb("foundedYearInvalid"),
      }),
    [t, tb],
  );

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: branch ? valuesFromBranch(branch) : emptyValues,
  });
  const {
    handleSubmit,
    register,
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
  const addressLine1 = watch("address_line_1");
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const latNum = Number(latitude);
  const lngNum = Number(longitude);
  const mapsReady =
    Boolean(latitude) &&
    Boolean(longitude) &&
    !Number.isNaN(latNum) &&
    !Number.isNaN(lngNum);
  const focusLat = mapsReady ? latNum : undefined;
  const focusLng = mapsReady ? lngNum : undefined;

  function applyAdminMatch(place: MapsReverseResult) {
    if (place.province_id) {
      setValue("province_id", place.province_id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    // Set ward after province so useWards can fetch options for the new parent.
    if (place.ward_id) {
      setValue("ward_id", place.ward_id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else if (place.province_id) {
      setValue("ward_id", "", { shouldDirty: true, shouldValidate: true });
    }
  }

  async function applyPlace(place: MapsPlaceDetail) {
    const line = place.address_line || place.display;
    if (line) {
      setValue("address_line_1", line, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    setValue("latitude", String(place.latitude), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("longitude", String(place.longitude), {
      shouldDirty: true,
      shouldValidate: true,
    });
    try {
      const reverse = await reverseGeocode(place.latitude, place.longitude);
      applyAdminMatch(reverse);
    } catch {
      // Keep address/coords even if admin match fails.
    }
  }

  async function onMapPick(lat: number, lng: number) {
    setValue("latitude", String(lat), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("longitude", String(lng), {
      shouldDirty: true,
      shouldValidate: true,
    });
    try {
      const place = await reverseGeocode(lat, lng);
      const line = place.address_line || place.display;
      if (line) {
        setValue("address_line_1", line, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      applyAdminMatch(place);
    } catch {
      // Keep coordinates even if reverse geocode fails.
    }
  }

  const { data: provinces = [] } = useProvinces("current_v2");
  const { data: wards = [] } = useWards({
    scheme: "current_v2",
    provinceId: provinceId || undefined,
  });
  const { data: sports = [] } = useSports();

  const branchId = branch?.id;
  useEffect(() => {
    if (!branch) return;
    reset(valuesFromBranch(branch));
    // Reset only when opening another branch, not on every refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, reset]);

  useEffect(() => {
    if (!isDirty && !mediaDirty) leaveConfirmed.current = false;
  }, [isDirty, mediaDirty]);

  useEffect(() => {
    const trimmed = slug.trim();
    const savedSlug = branch?.slug;
    const unchanged = savedSlug !== undefined && trimmed === savedSlug;
    if (!trimmed || unchanged) {
      setSlugTaken(false);
      clearErrors("slug");
      return;
    }
    const timer = window.setTimeout(() => {
      void checkBranchSlug(organizationId, trimmed, branchId)
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
  }, [
    slug,
    organizationId,
    branchId,
    branch?.slug,
    setError,
    clearErrors,
    t,
    watch,
  ]);

  const listHref = `/organizations/${organizationId}/branches`;
  const backHref = branch ? `${listHref}/${branch.id}` : listHref;

  function requestLeave() {
    if ((isDirty || mediaDirty) && !leaveConfirmed.current) {
      leaveConfirmed.current = true;
      toast.warning(t("unsavedWarning"));
      return;
    }
    if (layout === "sheet") onDone?.();
    else router.push(backHref);
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

  useEffect(() => {
    onRegisterLeave?.(requestLeave);
  });

  function applyApiError(err: unknown) {
    const apiErr = err instanceof ApiError ? err : null;
    if (!apiErr) {
      toast.error(tb("loadError"));
      return;
    }
    if (apiErr.message.toLowerCase().includes("slug")) {
      setError("slug", { message: t("slugTaken") });
      setSlugTaken(true);
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

  async function onSubmit(values: BranchFormValues) {
    if (slugTaken) {
      setError("slug", { message: t("slugTaken") });
      return;
    }
    const nextStatus = values.status as BranchStatus;
    const editable = EDITABLE_STATUSES as readonly string[];
    const canChangeStatus =
      branch &&
      editable.includes(branch.status) &&
      (editable.includes(nextStatus) || nextStatus === "archived");
    if (branch && nextStatus !== branch.status && !canChangeStatus) {
      setError("status", { message: tb("statusUnsupported") });
      return;
    }
    try {
      const body = profileBody(values, props.mode);
      let saved: Branch;
      if (props.mode === "create") {
        saved = await create.mutateAsync(body);
      } else {
        saved = await update.mutateAsync(body);
      }
      if (logo) {
        saved = await uploadBranchMedia(organizationId, saved.id, "logo", logo);
      }
      if (banner) {
        saved = await uploadBranchMedia(
          organizationId,
          saved.id,
          "banner",
          banner,
        );
      }
      setLogo(null);
      setBanner(null);
      setLogoPreview(null);
      setBannerPreview(null);
      if (props.mode === "create") {
        toast.success(tb("createSuccess"));
        if (layout === "sheet") onDone?.();
        else router.push(listHref);
        return;
      }
      // Compare against server status after PATCH/media — props.branch can be stale
      // (sheet keeps the list snapshot), which wrongly re-called /open on an active branch.
      if (nextStatus !== saved.status) {
        if (nextStatus === "active") await open.mutateAsync();
        else if (nextStatus === "inactive") await close.mutateAsync();
        else if (nextStatus === "maintenance") await maintenance.mutateAsync();
        else if (nextStatus === "archived") await archive.mutateAsync();
      }
      reset(valuesFromBranch({ ...saved, status: nextStatus }));
      toast.success(tb("saveSuccess"));
      if (layout === "sheet") onDone?.();
    } catch (err) {
      applyApiError(err);
    }
  }

  const statusOptions: PopoverCommandOption[] = [
    ...EDITABLE_STATUSES.map((value) => ({
      value,
      label: tb(`status.${value}`),
      keywords: value,
    })),
    { value: "archived", label: tb("status.archived"), keywords: "archived" },
  ];
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
  const sportOptions = sports.map((sport) => {
    const label = locale.startsWith("vi")
      ? sport.name_vi || sport.name || sport.name_en
      : sport.name_en || sport.name || sport.name_vi;
    return {
      value: sport.id,
      label,
      keywords: `${sport.code} ${sport.name_en} ${sport.name_vi}`,
    };
  });

  const blocks = useMemo<EntityFormBlock<BranchFormValues>[]>(
    () => [
      {
        id: "identity",
        title: t("sectionIdentity"),
        icon: <Store className="size-4" aria-hidden />,
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
          {
            kind: "text",
            name: "slug",
            label: t("fieldSlug"),
            description: t("fieldSlugHint"),
            error: slugTaken ? t("slugTaken") : undefined,
          },
          {
            kind: "multi-select",
            name: "sport_ids",
            label: tb("fieldSports"),
            placeholder: tb("fieldSportsPlaceholder"),
            options: sportOptions,
            searchable: true,
            span: 2,
          },
          {
            kind: "select",
            name: "status",
            label: tb("fieldStatus"),
            options: statusOptions,
            visible: () =>
              branch?.status === "active" ||
              branch?.status === "inactive" ||
              branch?.status === "maintenance",
            onValueChange: () => clearErrors("status"),
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
        ],
      },
      {
        id: "links",
        title: tb("links"),
        icon: <Link2 className="size-4" aria-hidden />,
        tone: "rose",
        fields: [
          {
            kind: "text",
            name: "website",
            label: tb("fieldWebsite"),
            inputType: "url",
            autoComplete: "url",
          },
          {
            kind: "text",
            name: "facebook_url",
            label: tb("fieldFacebook"),
            inputType: "url",
          },
          {
            kind: "text",
            name: "google_maps_url",
            label: tb("fieldGoogleMaps"),
            inputType: "url",
          },
          {
            kind: "text",
            name: "founded_year",
            label: tb("fieldFoundedYear"),
            inputType: "text",
            placeholder: tb("fieldFoundedYearPlaceholder"),
          },
        ],
      },
    ],
    [
      t,
      tb,
      branch?.status,
      statusOptions,
      sportOptions,
      slugTaken,
      clearErrors,
    ],
  );

  const provinceIdValue = provinceId;
  const wardIdValue = watch("ward_id");
  const provinceError = formState.errors.province_id?.message;
  const wardError = formState.errors.ward_id?.message;
  const addressError = formState.errors.address_line_1?.message;
  const latError = formState.errors.latitude?.message;
  const lngError = formState.errors.longitude?.message;

  const storedLogo = branch?.logo_file_id
    ? `/api/go/files/${branch.logo_file_id}`
    : null;
  const storedBanner = branch?.banner_file_id
    ? `/api/go/files/${branch.banner_file_id}`
    : null;

  return (
    <FormProvider {...form}>
      <div
        className={
          layout === "sheet" ? "flex min-h-0 flex-1 flex-col" : undefined
        }
      >
        <EntityFormFrame
          cancelLabel={t("createCancel")}
          submitLabel={props.mode === "edit" ? t("save") : t("createSubmit")}
          onCancel={requestLeave}
          pending={pending}
          submitDisabled={props.mode === "edit" && !isDirty && !mediaDirty}
          onSubmit={handleSubmit(onSubmit)}
          actionsPlacement={layout === "sheet" ? "inline" : "shell"}
          cover={
            <EntityCover
              bannerLabel={t("fieldBanner")}
              logoLabel={tb("fieldAvatar")}
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
          <EntityFormSection
            title={tb("address")}
            icon={<MapPin className="size-4" aria-hidden />}
            tone="amber"
          >
            <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(provinceError) || undefined}>
                <FieldLabel required>{t("fieldProvince")}</FieldLabel>
                <PopoverCommandSelect
                  value={provinceIdValue}
                  options={provinceOptions}
                  searchable
                  placeholder={t("fieldProvince")}
                  aria-label={t("fieldProvince")}
                  className="w-full justify-between border border-input bg-background"
                  onValueChange={(value) => {
                    setValue("province_id", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    setValue("ward_id", "", { shouldDirty: true });
                  }}
                />
                <FieldError>{provinceError}</FieldError>
              </Field>
              <Field data-invalid={Boolean(wardError) || undefined}>
                <FieldLabel required>{t("fieldWard")}</FieldLabel>
                <PopoverCommandSelect
                  value={wardIdValue}
                  options={wardOptions}
                  searchable
                  placeholder={t("fieldWard")}
                  aria-label={t("fieldWard")}
                  disabled={!provinceIdValue}
                  className="w-full justify-between border border-input bg-background"
                  onValueChange={(value) =>
                    setValue("ward_id", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                <FieldError>{wardError}</FieldError>
              </Field>
              <Field
                data-invalid={Boolean(addressError) || undefined}
                className="sm:col-span-2"
              >
                <FieldLabel htmlFor="field-address_line_1" required>
                  {tb("fieldAddressSearch")}
                </FieldLabel>
                <AddressAutocomplete
                  id="field-address_line_1"
                  value={addressLine1}
                  onValueChange={(value) =>
                    setValue("address_line_1", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  onPlaceSelect={(place) => void applyPlace(place)}
                  focusLat={focusLat}
                  focusLng={focusLng}
                  placeholder={tb("fieldAddressSearchPlaceholder")}
                  minCharsLabel={tb("addressSearchHint")}
                  emptyLabel={tb("addressSearchEmpty")}
                  required
                  aria-invalid={Boolean(addressError) || undefined}
                />
                <FieldError>{addressError}</FieldError>
              </Field>
              <Field className="sm:col-span-2">
                <MapPicker
                  latitude={mapsReady ? latNum : undefined}
                  longitude={mapsReady ? lngNum : undefined}
                  onPick={(lat, lng) => void onMapPick(lat, lng)}
                  unavailableLabel={tb("mapUnavailable")}
                />
                <FieldDescription>{tb("mapPickHint")}</FieldDescription>
              </Field>
              <input type="hidden" {...register("latitude")} />
              <input type="hidden" {...register("longitude")} />
              <input type="hidden" {...register("joined_at")} />
              <Field data-invalid={Boolean(latError) || undefined}>
                <FieldLabel required>{tb("fieldLatitude")}</FieldLabel>
                <p className="text-sm tabular-nums text-foreground">
                  {mapsReady ? latNum.toFixed(6) : tb("coordsEmpty")}
                </p>
                <FieldError>{latError}</FieldError>
              </Field>
              <Field data-invalid={Boolean(lngError) || undefined}>
                <FieldLabel required>{tb("fieldLongitude")}</FieldLabel>
                <p className="text-sm tabular-nums text-foreground">
                  {mapsReady ? lngNum.toFixed(6) : tb("coordsEmpty")}
                </p>
                <FieldError>{lngError}</FieldError>
              </Field>
            </FieldGroup>
          </EntityFormSection>
          <ImageCropDialog
            open={cropTarget !== null}
            title={
              cropTarget === "banner" ? t("fieldBanner") : tb("fieldAvatar")
            }
            imageSrc={cropSrc}
            aspect={cropTarget === "banner" ? 3 : 1}
            outputWidth={cropTarget === "banner" ? 1200 : 512}
            outputHeight={cropTarget === "banner" ? 400 : 512}
            zoomLabel={t("cropZoom")}
            cancelLabel={t("cropCancel")}
            applyLabel={t("cropApply")}
            onOpenChange={(openDialog) => {
              if (!openDialog) {
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
      </div>
    </FormProvider>
  );
}
