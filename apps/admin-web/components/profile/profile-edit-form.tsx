"use client";

import {
  applyBokdyTheme,
  Button,
  cn,
  DATE_PICKER_BIRTH_END_MONTH,
  DATE_PICKER_BIRTH_START_MONTH,
  datePickerToday,
  Dialog,
  DialogContent,
  DialogTitle,
  Spinner,
  THEME_STORAGE_KEY,
  toast,
  type BokdyTheme,
} from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { softContentMaxW } from "@/components/data-list";
import { EntityAvatar } from "@/components/entity/avatar";
import { ImagePickControl } from "@/components/entity/cover";
import { EntityFormFrame } from "@/components/entity/form-frame";
import {
  EntityMetadataForm,
  type EntityFormBlock,
} from "@/components/entity/metadata-form";
import { ImageCropDialog } from "@/components/media/image-crop-dialog";
import type { PopoverCommandOption } from "@/components/popover-command-select";
import { usePageShellTitle } from "@/components/shell/shell-title";
import { useCurrencies } from "@/hooks/use-currencies";
import { meKeys, useMe } from "@/hooks/use-me";
import { useTimezones } from "@/hooks/use-timezones";
import { useUpdateMe } from "@/hooks/use-update-me";
import { useRouter } from "@/i18n/navigation";
import { uploadUserMedia } from "@/lib/api/admin-users";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { ianaTimezoneOptions } from "@/lib/time-zones";
import { profileSchema, type ProfileFormValues } from "@/lib/validation/profile";

const THEMES: BokdyTheme[] = ["light", "dark", "system"];
const DATE_FORMATS = ["dmy", "mdy", "ymd"] as const;

function emptyValues(): ProfileFormValues {
  return {
    first_name: "",
    last_name: "",
    full_name: "",
    gender: "",
    date_of_birth: "",
    theme: "system",
    date_format: "dmy",
    timezone: "",
    preferred_currency_code: "",
  };
}

function valuesFromUser(user: {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  theme?: string | null;
  date_format?: string | null;
  timezone?: string | null;
  preferred_currency_code?: string | null;
}): ProfileFormValues {
  return {
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    full_name: user.full_name ?? "",
    gender: (user.gender as ProfileFormValues["gender"]) ?? "",
    date_of_birth: user.date_of_birth ?? "",
    theme: (user.theme as BokdyTheme) ?? "system",
    date_format: (user.date_format as ProfileFormValues["date_format"]) ?? "dmy",
    timezone: user.timezone ?? "",
    preferred_currency_code: user.preferred_currency_code ?? "",
  };
}

function composedName(lastName: string, firstName: string, fallback: string) {
  const parts = [lastName.trim(), firstName.trim()].filter(Boolean).join(" ");
  return parts || fallback;
}

export function ProfileEditForm() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const ts = useTranslations("shell");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useMe();
  const updateMe = useUpdateMe();
  const currencies = useCurrencies();
  const timezones = useTimezones();
  const user = data?.user;

  const [avatar, setAvatar] = useState<Blob | null>(null);
  const [banner, setBanner] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"avatar" | "banner" | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ src: string; label: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const schema = useMemo(
    () => profileSchema({ currencyInvalid: te("INVALID"), required: te("REQUIRED") }),
    [te],
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues(),
  });

  const watchedLast = useWatch({ control: form.control, name: "last_name" }) ?? "";
  const watchedFirst = useWatch({ control: form.control, name: "first_name" }) ?? "";
  const displayName = composedName(
    watchedLast,
    watchedFirst,
    user?.full_name?.trim() || user?.email?.trim() || ts("pageTitles.profileEdit"),
  );
  usePageShellTitle(displayName);

  useEffect(() => {
    if (!user) return;
    form.reset(valuesFromUser(user));
  }, [user, form]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [avatarPreview, bannerPreview]);

  const genderOptions = useMemo<PopoverCommandOption[]>(
    () =>
      ["", "male", "female", "other", "undisclosed"].map((value) => ({
        value,
        label: t(`genderOptions.${value || "unspecified"}`),
        keywords: value || "unspecified",
      })),
    [t],
  );
  const themeOptions = useMemo<PopoverCommandOption[]>(
    () =>
      THEMES.map((value) => ({
        value,
        label: t(`themeOptions.${value}`),
        keywords: value,
      })),
    [t],
  );
  const dateFormatOptions = useMemo<PopoverCommandOption[]>(
    () =>
      DATE_FORMATS.map((value) => ({
        value,
        label: t(`dateFormatOptions.${value}`),
        keywords: value,
      })),
    [t],
  );
  const timezoneOptions = useMemo<PopoverCommandOption[]>(
    () => timezones.data ?? ianaTimezoneOptions(),
    [timezones.data],
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

  const blocks = useMemo<EntityFormBlock<ProfileFormValues>[]>(
    () => [
      {
        id: "personal",
        title: t("sections.personal"),
        description: t("hints.personal"),
        icon: <UserRound className="size-4" aria-hidden />,
        tone: "emerald",
        fields: [
          { kind: "text", name: "last_name", label: t("lastName") },
          { kind: "text", name: "first_name", label: t("firstName"), required: true },
          {
            kind: "select",
            name: "gender",
            label: t("gender"),
            searchable: false,
            options: genderOptions,
            placeholder: t("pickGender"),
          },
          {
            kind: "date",
            name: "date_of_birth",
            label: t("dateOfBirth"),
            placeholder: tc("pickDate"),
            startMonth: DATE_PICKER_BIRTH_START_MONTH,
            endMonth: DATE_PICKER_BIRTH_END_MONTH,
            maxDate: datePickerToday(),
          },
        ],
      },
      {
        id: "preferences",
        title: t("sections.preferences"),
        description: t("hints.preferences"),
        icon: <SlidersHorizontal className="size-4" aria-hidden />,
        tone: "amber",
        fields: [
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
            name: "preferred_currency_code",
            label: t("preferredCurrencyCode"),
            searchable: true,
            options: currencyOptions,
            placeholder: t("pickCurrency"),
          },
        ],
      },
    ],
    [currencyOptions, dateFormatOptions, genderOptions, t, tc, themeOptions, timezoneOptions],
  );

  function openCrop(kind: "avatar" | "banner", file: File) {
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropTarget(kind);
  }

  function storeCrop(blob: Blob) {
    if (!cropTarget) return;
    const preview = URL.createObjectURL(blob);
    if (cropTarget === "avatar") {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatar(blob);
      setAvatarPreview(preview);
    } else {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      setBanner(blob);
      setBannerPreview(preview);
    }
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropTarget(null);
  }

  async function onSubmit(values: ProfileFormValues) {
    if (!user?.id) return;
    try {
      await updateMe.mutateAsync({
        first_name: values.first_name,
        last_name: values.last_name,
        gender: values.gender,
        date_of_birth: values.date_of_birth,
        theme: values.theme,
        date_format: values.date_format,
        timezone: values.timezone.trim() || undefined,
        preferred_currency_code: values.preferred_currency_code || undefined,
      });
      if (avatar || banner) {
        setUploading(true);
        if (avatar) await uploadUserMedia(user.id, "avatar", avatar);
        if (banner) await uploadUserMedia(user.id, "banner", banner);
      }
      applyBokdyTheme(values.theme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, values.theme);
      } catch {
        /* ignore */
      }
      await queryClient.invalidateQueries({ queryKey: meKeys.all });
      toast.success(t("saved"));
      router.push("/profile");
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      toast.error(te(errorMessageKey(apiErr)));
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground md:px-6">
        <Spinner />
        {tc("loading")}
      </p>
    );
  }

  if (isError || !user) {
    return (
      <div className={cn("mx-auto w-full space-y-3 px-4 py-8", softContentMaxW)}>
        <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{t("loadError")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {tc("retry")}
          </Button>
        </div>
      </div>
    );
  }

  const pending = updateMe.isPending || uploading;
  const mediaDirty = Boolean(avatar || banner);
  const bannerSrc =
    bannerPreview ?? (user.banner_file_id ? `/api/go/files/${user.banner_file_id}` : null);
  const avatarSrc =
    avatarPreview ?? (user.avatar_file_id ? `/api/go/files/${user.avatar_file_id}` : null);
  const email = user.email?.trim() || "—";

  return (
    <FormProvider {...form}>
      <EntityFormFrame
        cancelLabel={t("cancel")}
        submitLabel={t("save")}
        onCancel={() => router.push("/profile")}
        pending={pending}
        submitDisabled={!form.formState.isDirty && !mediaDirty}
        onSubmit={form.handleSubmit(onSubmit)}
        actionsPlacement="shell"
        contentWidth="lg"
        cover={
          <div className="soft-elevated overflow-hidden rounded-3xl border-0">
            <ImagePickControl
              className={cn(
                "relative aspect-3/1 w-full overflow-hidden border-0",
                !bannerSrc &&
                  "bg-linear-to-br from-sky-500/20 via-sky-500/5 to-muted bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.18),transparent_55%)]",
              )}
              label={t("banner")}
              preview={bannerSrc}
              emptyLabel={<span className="sr-only">{t("addBanner")}</span>}
              viewLabel={t("viewImage")}
              changeLabel={t("changeImage")}
              pickLabel={t("addBanner")}
              menuAlign="end"
              onPick={(file) => openCrop("banner", file)}
              onView={() => bannerSrc && setViewing({ src: bannerSrc, label: t("banner") })}
            />
            <div className="relative px-4 pb-4 md:px-5">
              <div className="-mt-10 mb-2 flex items-end gap-3 md:-mt-12 md:gap-4">
                <ImagePickControl
                  className="relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-card bg-card shadow-sm md:size-28"
                  label={t("avatar")}
                  preview={avatarSrc}
                  emptyLabel={
                    <EntityAvatar name={displayName} size="lg" className="size-full rounded-none" />
                  }
                  viewLabel={t("viewAvatar")}
                  changeLabel={t("changeImage")}
                  pickLabel={t("addAvatar")}
                  menuAlign="center"
                  onPick={(file) => openCrop("avatar", file)}
                  onView={() => avatarSrc && setViewing({ src: avatarSrc, label: t("avatar") })}
                  face={
                    <EntityAvatar
                      name={displayName}
                      size="lg"
                      src={avatarSrc ?? undefined}
                      className="size-full rounded-none"
                    />
                  }
                />
                <div className="min-w-0 flex-1 pb-0.5">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                    {displayName}
                  </h1>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{email}</p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <EntityMetadataForm blocks={blocks} />
      </EntityFormFrame>
      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl p-3">
          <DialogTitle className="sr-only">{viewing?.label}</DialogTitle>
          {viewing ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={viewing.src} alt={viewing.label} className="max-h-[70vh] w-full object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
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
          if (!open) {
            if (cropSrc) URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
            setCropTarget(null);
          }
        }}
        onCropped={storeCrop}
      />
    </FormProvider>
  );
}
