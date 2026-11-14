"use client";

import { Field, FieldError, FieldLabel, Input, toast } from "@bokdy/ui";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { IdCard, KeyRound, MapPin, SlidersHorizontal, UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";

import { EntityCover } from "@/components/entity/cover";
import { EntityFormFrame } from "@/components/entity/form-frame";
import { EntityFormSection } from "@/components/entity/form-section";
import { EntityRelationLink } from "@/components/entity/relation-link";
import {
  EntityMetadataForm,
  type EntityFormBlock,
} from "@/components/entity/metadata-form";
import {
  PopoverCommandSelect,
  type PopoverCommandOption,
} from "@/components/popover-command-select";
import { useUserDetail, type UserDetailRecord } from "@/components/users/detail/user-detail-context";
import { ImageCropDialog } from "@/components/media/image-crop-dialog";
import { useAdminOrganizations } from "@/hooks/use-admin-organizations";
import { useProvinces, useWards } from "@/hooks/use-admin-units";
import { useCountries } from "@/hooks/use-countries";
import { useCurrencies } from "@/hooks/use-currencies";
import { useLocales } from "@/hooks/use-locales";
import {
  useCreateAdminUser,
  useCreateOwnerUser,
  useCreatePlayerUser,
  useOwnerOrganizations,
  useReplaceOwnerStaffRole,
  useUpdateUserProfile,
  adminUserKeys,
} from "@/hooks/use-admin-users";
import type { AdminUserOrganization, UserAudience } from "@/lib/api/admin-users";
import { uploadUserMedia } from "@/lib/api/admin-users";
import { ianaTimeZones } from "@/lib/time-zones";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import {
  emptyUserAccount,
  userAccountSchema,
  type UserAccountFormValues,
  type UserAccountMode,
} from "@/lib/validation/user-account";

const ROLE_OPTIONS = ["org_owner", "org_staff"] as const;

function organizationLabel(org: {
  id: string;
  name?: string;
  name_vi?: string;
  name_en?: string;
  code?: string;
}) {
  return org.name || org.name_vi || org.name_en || org.code || org.id;
}

function givenName(user: UserDetailRecord) {
  const first = user.first_name?.trim() ?? "";
  const last = user.last_name?.trim() ?? "";
  if (first || last) return first;
  return user.full_name?.trim() ?? "";
}

type UserAccountFormProps = {
  audience: UserAudience;
  layout: "sheet";
  onDone: () => void;
  onRegisterLeave?: (leave: () => void) => void;
} & ({ mode: "create" } | { mode: "edit" });

export function UserAccountForm(props: UserAccountFormProps) {
  if (props.mode === "edit") {
    return <EditUserAccountForm {...props} mode="edit" />;
  }
  return (
    <UserAccountFields
      {...props}
      mode="create"
      user={null}
      userId=""
      memberships={[]}
    />
  );
}

function EditUserAccountForm({
  audience,
  layout,
  onDone,
  onRegisterLeave,
}: Extract<UserAccountFormProps, { mode: "edit" }>) {
  const { user, userId } = useUserDetail();
  const memberships = useOwnerOrganizations(audience === "owners" ? userId : "");
  return (
    <UserAccountFields
      audience={audience}
      mode="edit"
      layout={layout}
      onDone={onDone}
      onRegisterLeave={onRegisterLeave}
      user={user}
      userId={userId}
      memberships={memberships.data ?? []}
      membershipsLoading={memberships.isLoading}
    />
  );
}

function UserAccountFields({
  audience,
  mode,
  layout,
  onDone,
  onRegisterLeave,
  user,
  userId,
  memberships,
  membershipsLoading = false,
}: {
  audience: UserAudience;
  mode: UserAccountMode;
  layout: "sheet";
  onDone: () => void;
  onRegisterLeave?: (leave: () => void) => void;
  user: UserDetailRecord | null;
  userId: string;
  memberships: AdminUserOrganization[];
  membershipsLoading?: boolean;
}) {
  const t = useTranslations("users.accountForm");
  const tu = useTranslations("users");
  const te = useTranslations("errors");
  const queryClient = useQueryClient();
  const createPlayer = useCreatePlayerUser();
  const createAdmin = useCreateAdminUser();
  const createOwner = useCreateOwnerUser();
  const updateProfile = useUpdateUserProfile();
  const replaceRole = useReplaceOwnerStaffRole(userId);
  const locales = useLocales();
  const countries = useCountries();
  const currencies = useCurrencies();
  const [avatar, setAvatar] = useState<Blob | null>(null);
  const [banner, setBanner] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"avatar" | "banner" | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const mediaDirty = Boolean(avatar || banner);
  const organizations = useAdminOrganizations(
    { limit: 100 },
    mode === "create" && audience === "owners",
  );
  const schema = useMemo(
    () =>
      userAccountSchema(
        {
          required: te("REQUIRED"),
          emailInvalid: te("EMAIL_INVALID"),
          passwordPolicy: te("PASSWORD_POLICY"),
          passwordMismatch: t("passwordMismatch"),
          dateInvalid: t("invalidDate"),
          genderInvalid: t("invalidGender"),
          currencyInvalid: t("invalidCurrency"),
          wardRequiresProvince: t("wardRequiresProvince"),
        },
        { mode, audience },
      ),
    [audience, mode, t, te],
  );
  const form = useForm<UserAccountFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyUserAccount(),
  });
  const { isDirty } = form.formState;
  const provinceId = form.watch("province_id");
  const provinces = useProvinces("current_v2");
  const wards = useWards({ scheme: "current_v2", provinceId: provinceId || undefined });
  const leaveConfirmed = useRef(false);

  const membershipKey = memberships.map((row) => row.staff_id).join(",");
  useEffect(() => {
    if (mode !== "edit" || !user) return;
    form.reset({
      ...emptyUserAccount(),
      email: user.email ?? "",
      first_name: givenName(user),
      last_name: user.last_name ?? "",
      phone: user.phone ?? "",
      gender: user.gender ?? "",
      date_of_birth: user.date_of_birth ?? "",
      locale_id: user.locale_id ?? "",
      timezone: user.timezone || "Asia/Ho_Chi_Minh",
      country_id: user.country_id ?? "",
      preferred_currency_code: user.preferred_currency_code || "VND",
      theme: user.theme || "system",
      date_format: user.date_format || "dmy",
      province_id: user.province_id ?? "",
      ward_id: user.ward_id ?? "",
      address_line: user.address_line ?? "",
      memberships: memberships.map((row) => ({
        staff_id: row.staff_id,
        organization_id: row.organization_id,
        organization_name: row.name || row.code,
        staff_role: row.staff_role,
        title: row.staff_title ?? "",
      })),
    });
  }, [form, membershipKey, mode, user]);

  useEffect(() => {
    if (!isDirty) leaveConfirmed.current = false;
  }, [isDirty]);

  useEffect(() => {
    if (mode !== "create" || form.getValues("locale_id")) return;
    const fallback = locales.data?.find((item) => item.is_default) ?? locales.data?.[0];
    if (fallback) form.setValue("locale_id", fallback.id, { shouldDirty: false });
  }, [form, locales.data, mode]);

  useEffect(() => {
    if (mode !== "create" || form.getValues("country_id")) return;
    const fallback = countries.data?.find((item) => item.iso2 === "VN") ?? countries.data?.[0];
    if (fallback) form.setValue("country_id", fallback.id, { shouldDirty: false });
  }, [form, countries.data, mode]);

  const roleOptions = useMemo<PopoverCommandOption[]>(
    () =>
      ROLE_OPTIONS.map((role) => ({
        value: role,
        label: tu(`permissions.roleLabel.${role}`),
        keywords: role,
      })),
    [tu],
  );
  const organizationOptions = useMemo<PopoverCommandOption[]>(
    () =>
      (organizations.data?.items ?? []).map((org) => ({
        value: org.id,
        label: organizationLabel(org),
        keywords: `${org.name} ${org.code}`,
      })),
    [organizations.data?.items],
  );

  const genderOptions = useMemo<PopoverCommandOption[]>(
    () =>
      ["", "male", "female", "other", "undisclosed"].map((value) => ({
        value,
        label: t(`genderOptions.${value || "unspecified"}`),
        keywords: value || "unspecified",
      })),
    [t],
  );
  const localeOptions = useMemo<PopoverCommandOption[]>(
    () =>
      (locales.data ?? []).map((item) => ({
        value: item.id,
        label: item.native_name || item.name,
        keywords: `${item.code} ${item.name} ${item.native_name}`,
      })),
    [locales.data],
  );
  const countryOptions = useMemo<PopoverCommandOption[]>(
    () =>
      (countries.data ?? []).map((item) => ({
        value: item.id,
        label: item.name,
        keywords: `${item.iso2} ${item.name}`,
      })),
    [countries.data],
  );
  const themeOptions = useMemo<PopoverCommandOption[]>(
    () =>
      (["light", "dark", "system"] as const).map((value) => ({
        value,
        label: t(`themeOptions.${value}`),
        keywords: value,
      })),
    [t],
  );
  const dateFormatOptions = useMemo<PopoverCommandOption[]>(
    () =>
      (["dmy", "mdy", "ymd"] as const).map((value) => ({
        value,
        label: t(`dateFormatOptions.${value}`),
        keywords: value,
      })),
    [t],
  );
  const timezoneOptions = useMemo<PopoverCommandOption[]>(
    () => ianaTimeZones().map((zone) => ({ value: zone, label: zone, keywords: zone })),
    [],
  );
  const currencyOptions = useMemo<PopoverCommandOption[]>(
    () =>
      (currencies.data ?? []).map((item) => ({
        value: item.code,
        label: `${item.code} · ${item.name}`,
        keywords: `${item.code} ${item.name} ${item.symbol}`,
      })),
    [currencies.data],
  );
  const provinceOptions = useMemo<PopoverCommandOption[]>(
    () =>
      (provinces.data ?? []).map((item) => ({
        value: item.id,
        label: item.name,
        keywords: `${item.code} ${item.name} ${item.name_en ?? ""} ${item.name_vi ?? ""}`,
      })),
    [provinces.data],
  );
  const wardOptions = useMemo<PopoverCommandOption[]>(
    () =>
      (wards.data ?? []).map((item) => ({
        value: item.id,
        label: item.name,
        keywords: `${item.code} ${item.name} ${item.name_en ?? ""} ${item.name_vi ?? ""}`,
      })),
    [wards.data],
  );

  const blocks = useMemo<EntityFormBlock<UserAccountFormValues>[]>(() => {
    const next: EntityFormBlock<UserAccountFormValues>[] = [
      {
        id: "contact",
        title: t("contact"),
        icon: <UserRound className="size-4" aria-hidden />,
        tone: "sky",
        fields: [
          { kind: "text", name: "email", label: t("email"), required: true, inputType: "email" },
          { kind: "text", name: "phone", label: t("phone"), inputType: "tel" },
          { kind: "text", name: "last_name", label: t("lastName") },
          { kind: "text", name: "first_name", label: t("firstName"), required: true },
          {
            kind: "readonly",
            name: "full_name",
            label: t("fullName"),
            span: 2,
            text: (values) =>
              [values.last_name.trim(), values.first_name.trim()].filter(Boolean).join(" ") || "—",
          },
        ],
      },
      {
        id: "personal",
        title: t("personal"),
        icon: <IdCard className="size-4" aria-hidden />,
        tone: "emerald",
        fields: [
          {
            kind: "select",
            name: "gender",
            label: t("gender"),
            searchable: false,
            options: genderOptions,
            placeholder: t("pickGender"),
          },
          { kind: "date", name: "date_of_birth", label: t("dateOfBirth"), placeholder: t("pickDate") },
        ],
      },
      {
        id: "preferences",
        title: t("preferences"),
        icon: <SlidersHorizontal className="size-4" aria-hidden />,
        tone: "amber",
        fields: [
          {
            kind: "select",
            name: "locale_id",
            label: t("locale"),
            searchable: true,
            options: localeOptions,
            placeholder: t("pickLocale"),
          },
          {
            kind: "select",
            name: "timezone",
            label: t("timezone"),
            searchable: true,
            options: timezoneOptions,
            placeholder: t("pickTimezone"),
          },
          {
            kind: "select",
            name: "country_id",
            label: t("country"),
            searchable: true,
            options: countryOptions,
            placeholder: t("pickCountry"),
          },
          {
            kind: "select",
            name: "preferred_currency_code",
            label: t("currency"),
            searchable: true,
            options: currencyOptions,
            placeholder: t("pickCurrency"),
          },
          {
            kind: "select",
            name: "theme",
            label: t("theme"),
            searchable: false,
            options: themeOptions,
            placeholder: t("pickTheme"),
          },
          {
            kind: "select",
            name: "date_format",
            label: t("dateFormat"),
            searchable: false,
            options: dateFormatOptions,
            placeholder: t("pickDateFormat"),
          },
        ],
      },
      {
        id: "address",
        title: t("address"),
        icon: <MapPin className="size-4" aria-hidden />,
        tone: "sky",
        fields: [
          {
            kind: "select",
            name: "province_id",
            label: t("province"),
            searchable: true,
            options: provinceOptions,
            placeholder: t("pickProvince"),
            onValueChange: (_value, current) => {
              current.setValue("ward_id", "", { shouldDirty: true, shouldValidate: true });
            },
          },
          {
            kind: "select",
            name: "ward_id",
            label: t("ward"),
            searchable: true,
            options: wardOptions,
            placeholder: t("pickWard"),
            disabled: (values) => !values.province_id,
          },
          { kind: "text", name: "address_line", label: t("addressLine"), span: 2 },
        ],
      },
    ];
    if (mode === "create") {
      next.push({
        id: "password",
        title: t("password"),
        description: t("pendingHint"),
        icon: <KeyRound className="size-4" aria-hidden />,
        tone: "amber",
        fields: [
          {
            kind: "text",
            name: "password",
            label: t("password"),
            required: true,
            inputType: "password",
            autoComplete: "new-password",
          },
          {
            kind: "text",
            name: "confirm_password",
            label: t("confirmPassword"),
            required: true,
            inputType: "password",
            autoComplete: "new-password",
          },
        ],
      });
    }
    if (mode === "create" && audience === "owners") {
      next.push({
        id: "membership",
        title: t("membership"),
        icon: <Users className="size-4" aria-hidden />,
        tone: "emerald",
        fields: [
          {
            kind: "select",
            name: "organization_id",
            label: t("organization"),
            required: true,
            searchable: true,
            options: organizationOptions,
            placeholder: t("organizationPlaceholder"),
          },
          {
            kind: "select",
            name: "staff_role",
            label: t("role"),
            required: true,
            searchable: false,
            options: roleOptions,
            placeholder: t("rolePlaceholder"),
          },
          { kind: "text", name: "title", label: t("title") },
        ],
      });
    }
    return next;
  }, [
    audience,
    countryOptions,
    currencyOptions,
    dateFormatOptions,
    genderOptions,
    localeOptions,
    mode,
    organizationOptions,
    provinceOptions,
    roleOptions,
    t,
    themeOptions,
    timezoneOptions,
    wardOptions,
  ]);

  const pending =
    createPlayer.isPending ||
    createAdmin.isPending ||
    createOwner.isPending ||
    updateProfile.isPending ||
    replaceRole.isPending ||
    uploading;

  function openCrop(target: "avatar" | "banner", file: File) {
    const url = URL.createObjectURL(file);
    setCropSrc((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });
    setCropTarget(target);
  }

  function storeCrop(blob: Blob) {
    const url = URL.createObjectURL(blob);
    if (cropTarget === "avatar") {
      setAvatar(blob);
      setAvatarPreview((current) => {
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

  function requestLeave() {
    if ((isDirty || mediaDirty) && !leaveConfirmed.current) {
      leaveConfirmed.current = true;
      toast.warning(t("unsavedWarning"));
      return;
    }
    if (layout === "sheet") onDone();
  }

  useEffect(() => {
    onRegisterLeave?.(requestLeave);
  });

  async function onSubmit(values: UserAccountFormValues) {
    const profile = {
      email: values.email.trim(),
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      phone: values.phone.trim(),
      gender: values.gender,
      date_of_birth: values.date_of_birth,
      locale_id: values.locale_id,
      timezone: values.timezone.trim(),
      country_id: values.country_id,
      preferred_currency_code: values.preferred_currency_code.trim().toUpperCase(),
      theme: values.theme,
      date_format: values.date_format,
      province_id: values.province_id,
      ward_id: values.ward_id,
      address_line: values.address_line.trim(),
    };
    try {
      let savedId = userId;
      if (mode === "create") {
        if (audience === "admins") {
          savedId = (await createAdmin.mutateAsync({ ...profile, password: values.password })).id;
        } else if (audience === "owners") {
          savedId = (
            await createOwner.mutateAsync({
              ...profile,
              password: values.password,
              organization_id: values.organization_id,
              staff_role: values.staff_role as "org_owner" | "org_staff",
              title: values.title.trim(),
            })
          ).id;
        } else {
          savedId = (await createPlayer.mutateAsync({ ...profile, password: values.password })).id;
        }
      } else {
        savedId = (await updateProfile.mutateAsync({ id: userId, ...profile })).id;
        if (audience === "owners") {
          const previous = new Map(memberships.map((row) => [row.staff_id, row]));
          for (const row of values.memberships) {
            const current = previous.get(row.staff_id);
            if (
              current &&
              current.staff_role === row.staff_role &&
              (current.staff_title ?? "") === row.title
            ) {
              continue;
            }
            await replaceRole.mutateAsync({
              staffId: row.staff_id,
              role_code: row.staff_role as "org_owner" | "org_staff",
              title: row.title.trim(),
            });
          }
        }
      }
      if (avatar || banner) {
        setUploading(true);
        if (avatar) await uploadUserMedia(savedId, "avatar", avatar);
        if (banner) await uploadUserMedia(savedId, "banner", banner);
        await queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
      }
      leaveConfirmed.current = true;
      onDone();
    } catch (err) {
      toast.error(err instanceof ApiError ? te(errorMessageKey(err)) : te("INTERNAL"));
    } finally {
      setUploading(false);
    }
  }

  const watchedMemberships = form.watch("memberships");

  return (
    <FormProvider {...form}>
      <div className="flex min-h-0 flex-1 flex-col">
        <EntityFormFrame
          cancelLabel={t("cancel")}
          submitLabel={mode === "create" ? t("createSubmit") : t("save")}
          onCancel={requestLeave}
          pending={pending}
          submitDisabled={mode === "edit" && !isDirty && !mediaDirty}
          actionsPlacement="inline"
          onSubmit={form.handleSubmit(onSubmit)}
          cover={
            <EntityCover
              bannerLabel={t("banner")}
              logoLabel={t("avatar")}
              viewLabel={t("viewImage")}
              pickLabel={t("pickImage")}
              viewAvatarLabel={t("viewAvatar")}
              changeImageLabel={t("changeImage")}
              bannerPreview={bannerPreview ?? (user?.banner_file_id ? `/api/go/files/${user.banner_file_id}` : null)}
              logoPreview={avatarPreview ?? (user?.avatar_file_id ? `/api/go/files/${user.avatar_file_id}` : null)}
              onBanner={(file) => openCrop("banner", file)}
              onLogo={(file) => openCrop("avatar", file)}
            />
          }
        >
          <EntityMetadataForm blocks={blocks} />
          {mode === "edit" && audience === "owners" ? (
            <EntityFormSection
              title={t("memberships")}
              icon={<Users className="size-4" aria-hidden />}
              tone="emerald"
              hint={t("membershipHint")}
            >
              {membershipsLoading ? (
                <p className="text-sm text-muted-foreground">{t("loadingMemberships")}</p>
              ) : watchedMemberships.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noMemberships")}</p>
              ) : (
                <div>
                  {watchedMemberships.map((row, index) => (
                    <div
                      key={row.staff_id}
                      className="grid gap-3 border-b border-border/40 py-3 last:border-b-0 sm:grid-cols-2"
                    >
                      <EntityRelationLink href={`/organizations/${row.organization_id}`}>
                        {row.organization_name || row.organization_id}
                      </EntityRelationLink>
                      <Controller
                        control={form.control}
                        name={`memberships.${index}.staff_role`}
                        render={({ field }) => (
                          <PopoverCommandSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            options={roleOptions}
                            searchable={false}
                            aria-label={t("role")}
                          />
                        )}
                      />
                      <Field className="sm:col-span-2">
                        <FieldLabel htmlFor={`membership-title-${row.staff_id}`}>{t("title")}</FieldLabel>
                        <Input id={`membership-title-${row.staff_id}`} {...form.register(`memberships.${index}.title`)} />
                        <FieldError>
                          {form.formState.errors.memberships?.[index]?.staff_role?.message}
                        </FieldError>
                      </Field>
                    </div>
                  ))}
                </div>
              )}
            </EntityFormSection>
          ) : null}
        </EntityFormFrame>
        <ImageCropDialog
          open={cropTarget !== null}
          title={cropTarget === "banner" ? t("banner") : t("avatar")}
          imageSrc={cropSrc}
          aspect={cropTarget === "banner" ? 3 : 1}
          outputWidth={cropTarget === "banner" ? 1200 : 512}
          outputHeight={cropTarget === "banner" ? 400 : 512}
          zoomLabel={t("cropZoom")}
          cancelLabel={t("cropCancel")}
          applyLabel={t("cropApply")}
          onOpenChange={(open) => {
            if (!open) setCropTarget(null);
          }}
          onCropped={storeCrop}
        />
      </div>
    </FormProvider>
  );
}
