"use client";

import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogTitle,
  formatUserDate,
  formatUserDateTime,
  Spinner,
  toast,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useUserDateTimePrefs,
} from "@bokdy/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  KeyRound,
  Mail,
  MailCheck,
  Pencil,
  Phone,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import {
  softContentMaxW,
  softDirectoryPrimaryBtn,
  softDirectorySecondaryBtn,
  softFieldIconBtn,
  softFieldSecondaryBtn,
} from "@/components/data-list";
import { EntityAvatar } from "@/components/entity/avatar";
import { ImagePickControl } from "@/components/entity/cover";
import { EntityDetailPanel } from "@/components/entity/detail-panel";
import { SoftStatusChip } from "@/components/entity/soft-status-chip";
import { ImageCropDialog } from "@/components/media/image-crop-dialog";
import { ProfileEmailDialog } from "@/components/profile/profile-email-dialog";
import { ProfileMfaPanel } from "@/components/profile/profile-mfa-panel";
import { ProfilePasswordDialog } from "@/components/profile/profile-password-dialog";
import { ProfilePhoneDialog } from "@/components/profile/profile-phone-dialog";
import { SessionsList } from "@/components/sessions/sessions-list";
import { usePageShellLeading, usePageShellTitle } from "@/components/shell/shell-title";
import { meKeys, useMe } from "@/hooks/use-me";
import { Link } from "@/i18n/navigation";
import { uploadUserMedia } from "@/lib/api/admin-users";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { resendEmailVerification } from "@/lib/api/identity";
import { timezoneLabel } from "@/lib/time-zones";

const genders = ["male", "female", "other", "undisclosed"] as const;
const themes = ["light", "dark", "system"] as const;
const dateFormats = ["dmy", "mdy", "ymd"] as const;

function shown(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed || "—";
}

function profileName(user: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}) {
  const full = user.full_name?.trim();
  if (full) return full;
  const parts = [user.last_name?.trim(), user.first_name?.trim()].filter(Boolean).join(" ");
  if (parts) return parts;
  return user.email?.trim() || "—";
}

function ProfileRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}

export function ProfileOverview() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const ts = useTranslations("shell");
  const prefs = useUserDateTimePrefs();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useMe();
  const user = data?.user;

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [viewing, setViewing] = useState<{ src: string; label: string } | null>(null);
  const [cropTarget, setCropTarget] = useState<"avatar" | "banner" | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const name = user ? profileName(user) : ts("pageTitles.profile");
  usePageShellTitle(name);
  const back = usePageShellLeading(
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="size-9 rounded-full text-muted-foreground hover:bg-muted/70"
    >
      <Link href="/" aria-label={ts("menuBack")}>
        <ArrowLeft className="size-4" />
      </Link>
    </Button>,
  );

  const upload = useMutation({
    mutationFn: async ({ kind, blob }: { kind: "avatar" | "banner"; blob: Blob }) => {
      if (!user?.id) throw new Error("missing user");
      await uploadUserMedia(user.id, kind, blob);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meKeys.all });
      toast.success(t("mediaSaved"));
    },
    onError: (err) => {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      toast.error(te(errorMessageKey(apiErr)));
    },
  });

  const resendVerify = useMutation({
    mutationFn: () => resendEmailVerification(),
    onSuccess: () => toast.success(t("verificationSent")),
    onError: (err) => {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      toast.error(te(errorMessageKey(apiErr)));
    },
  });

  function openCrop(kind: "avatar" | "banner", file: File) {
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropTarget(kind);
  }

  function storeCrop(blob: Blob) {
    if (!cropTarget) return;
    upload.mutate({ kind: cropTarget, blob });
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropTarget(null);
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
      <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-8">
        <div className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{t("loadError")}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {tc("retry")}
          </Button>
        </div>
      </div>
    );
  }

  const email = user.email?.trim() ?? "";
  const phone = user.phone?.trim() ?? "";
  const emailVerified = Boolean(user.email_verified_at);
  const phoneVerified = Boolean(user.phone_verified_at);
  const gender =
    user.gender && (genders as readonly string[]).includes(user.gender)
      ? t(`genderOptions.${user.gender}`)
      : "—";
  const theme =
    user.theme && (themes as readonly string[]).includes(user.theme)
      ? t(`themeOptions.${user.theme}`)
      : "—";
  const dateFormat =
    user.date_format && (dateFormats as readonly string[]).includes(user.date_format)
      ? t(`dateFormatOptions.${user.date_format}`)
      : "—";
  const bannerSrc = user.banner_file_id ? `/api/go/files/${user.banner_file_id}` : null;
  const avatarSrc = user.avatar_file_id ? `/api/go/files/${user.avatar_file_id}` : null;

  return (
    <>
      {back}
      <div className="px-4 pt-3 md:px-6 md:pt-4">
        <div className={cn("soft-elevated mx-auto overflow-hidden rounded-3xl border-0", softContentMaxW)}>
          <ImagePickControl
            className={cn(
              "relative aspect-3/1 w-full overflow-hidden border-0",
              !bannerSrc &&
                "bg-linear-to-br from-sky-500/20 via-sky-500/5 to-muted bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.18),transparent_55%)]",
              bannerSrc ? "cursor-pointer" : "cursor-pointer",
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
                  <EntityAvatar name={name} size="lg" className="size-full rounded-none" />
                }
                viewLabel={t("viewAvatar")}
                changeLabel={t("changeImage")}
                pickLabel={t("addAvatar")}
                menuAlign="center"
                onPick={(file) => openCrop("avatar", file)}
                onView={() => avatarSrc && setViewing({ src: avatarSrc, label: t("avatar") })}
                face={
                  <EntityAvatar
                    name={name}
                    size="lg"
                    src={avatarSrc ?? undefined}
                    className="size-full rounded-none"
                  />
                }
              />

              <div className="flex min-w-0 flex-1 flex-wrap items-end justify-between gap-2 pb-0.5">
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                    {name}
                  </h1>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{email || "—"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild className={softDirectoryPrimaryBtn}>
                    <Link href="/profile/edit">{t("edit")}</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={softDirectorySecondaryBtn}
                    onClick={() => setPasswordOpen(true)}
                  >
                    <KeyRound className="size-4" aria-hidden />
                    {t("changePassword")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={cn("mx-auto grid w-full gap-4 py-4 pb-8 md:grid-cols-2", softContentMaxW)}>
        <EntityDetailPanel
          title={t("sections.account")}
          hint={t("hints.account")}
          icon={<Mail className="size-4" aria-hidden />}
          tone="sky"
        >
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ProfileRow
              label={t("email")}
              value={
                email ? (
                  <div className="space-y-1.5">
                    <p className="min-w-0 break-all">{email}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {emailVerified ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <SoftStatusChip label={t("verified")} tone="emerald" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {user.email_verified_at
                              ? formatUserDateTime(user.email_verified_at, prefs)
                              : t("verified")}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <SoftStatusChip label={t("notVerified")} tone="muted" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className={softFieldIconBtn}
                        aria-label={t("changeEmail")}
                        onClick={() => setEmailOpen(true)}
                      >
                        <Pencil />
                      </Button>
                      {!emailVerified ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className={softFieldIconBtn}
                          aria-label={t("resendVerification")}
                          disabled={resendVerify.isPending}
                          onClick={() => resendVerify.mutate()}
                        >
                          <MailCheck />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className={softFieldSecondaryBtn}
                    onClick={() => setEmailOpen(true)}
                  >
                    {t("addEmail")}
                  </Button>
                )
              }
            />
            <ProfileRow
              label={t("phone")}
              value={
                phone ? (
                  <div className="space-y-1.5">
                    <p className="inline-flex min-w-0 items-center gap-1.5 break-all">
                      <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      {phone}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {phoneVerified ? (
                        <SoftStatusChip label={t("verified")} tone="emerald" />
                      ) : (
                        <SoftStatusChip label={t("notVerified")} tone="muted" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className={softFieldIconBtn}
                        aria-label={t("changePhone")}
                        onClick={() => setPhoneOpen(true)}
                      >
                        <Pencil />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className={softFieldSecondaryBtn}
                    onClick={() => setPhoneOpen(true)}
                  >
                    {t("addPhone")}
                  </Button>
                )
              }
            />
          </div>
        </EntityDetailPanel>

        <EntityDetailPanel
          title={t("sections.personal")}
          hint={t("hints.personal")}
          icon={<UserRound className="size-4" aria-hidden />}
          tone="emerald"
        >
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ProfileRow label={t("lastName")} value={shown(user.last_name)} />
            <ProfileRow label={t("firstName")} value={shown(user.first_name)} />
            <ProfileRow label={t("gender")} value={gender} />
            <ProfileRow
              label={t("dateOfBirth")}
              value={user.date_of_birth ? formatUserDate(user.date_of_birth, prefs) : "—"}
            />
          </div>
        </EntityDetailPanel>

        <EntityDetailPanel
          title={t("sections.preferences")}
          hint={t("hints.preferences")}
          icon={<SlidersHorizontal className="size-4" aria-hidden />}
          tone="amber"
          className="md:col-span-2"
        >
          <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <ProfileRow label={t("theme")} value={theme} />
            <ProfileRow label={t("dateFormat")} value={dateFormat} />
            <ProfileRow
              label={t("timezone")}
              value={user.timezone?.trim() ? timezoneLabel(user.timezone) : "—"}
            />
            <ProfileRow
              label={t("preferredCurrencyCode")}
              value={shown(user.preferred_currency_code)}
            />
          </div>
        </EntityDetailPanel>

        <div className="md:col-span-2">
          <ProfileMfaPanel />
        </div>

        <div className="md:col-span-2">
          <SessionsList embedded />
        </div>
      </div>

      <ProfilePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <ProfileEmailDialog
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        currentEmail={user.email}
      />
      <ProfilePhoneDialog
        open={phoneOpen}
        onClose={() => setPhoneOpen(false)}
        currentPhone={user.phone}
      />
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
    </>
  );
}
