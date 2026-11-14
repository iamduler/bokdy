"use client";

import {
  Button,
  DatePicker,
  DATE_PICKER_BIRTH_END_MONTH,
  DATE_PICKER_BIRTH_START_MONTH,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { apiGo } from "@/lib/api/client";
import {
  passwordSchema,
  personalSchema,
  privacySchema,
  type PasswordValues,
  type PersonalValues,
  type PrivacyValues,
} from "@/lib/validation/profile";

type Me = { user?: { first_name?: string; last_name?: string; gender?: string; date_of_birth?: string } };
type SkillRow = {
  sport_id: string;
  sport_name_vi: string;
  sport_name_en: string;
  skill_level_id?: string | null;
  skill_name_vi?: string | null;
  skill_name_en?: string | null;
};
type Activity = { total_bookings: number; completed_bookings: number; canceled_bookings: number; playing_hours: number; total_spending: number };
type Favorite = { id: string; target_type: string; target_id: string };
type Account = { id: string; tier_name: string; points_balance: number; status: string; organization_id: string };

export function PlayerProfile() {
  const t = useTranslations("profile");
  const te = useTranslations("errors");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [sportId, setSportId] = useState("");
  const [skillId, setSkillId] = useState("");
  const me = useQuery({ queryKey: ["me"], queryFn: () => apiGo<Me>("identity/me") });
  const privacy = useQuery({ queryKey: ["player"], queryFn: () => apiGo<PrivacyValues>("identity/player") });
  const catalog = useQuery({ queryKey: ["skills"], queryFn: () => apiGo<SkillRow[]>("identity/skill-catalog") });
  const activity = useQuery({ queryKey: ["activity"], queryFn: () => apiGo<Activity>("identity/activity") });
  const favorites = useQuery({ queryKey: ["favorites"], queryFn: () => apiGo<Favorite[]>("identity/favorites") });
  const accounts = useQuery({ queryKey: ["membership"], queryFn: () => apiGo<Account[]>("membership/accounts") });
  const user = me.data?.user;
  const personalForm = useForm<PersonalValues>({
    resolver: zodResolver(useMemo(() => personalSchema({ required: te("REQUIRED") }), [te])),
    values: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      gender: (user?.gender as PersonalValues["gender"]) || "",
      date_of_birth: user?.date_of_birth ?? "",
    },
  });
  const privacyForm = useForm<PrivacyValues>({
    resolver: zodResolver(privacySchema()),
    values: privacy.data ?? {
      bio: "",
      preferred_playing_times: "",
      preferred_locations: "",
      visibility: "members",
      is_open_to_invitations: true,
      is_discoverable: true,
      is_activity_visible: true,
    },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(useMemo(() => passwordSchema({ required: te("REQUIRED") }), [te])),
    defaultValues: { current_password: "", password: "" },
  });
  const savePersonal = useMutation({
    mutationFn: (values: PersonalValues) => apiGo("identity/me", { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: () => {
      setNotice(t("saved"));
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
  const savePrivacy = useMutation({
    mutationFn: (values: PrivacyValues) => apiGo("identity/player", { method: "PUT", body: JSON.stringify(values) }),
    onSuccess: () => setNotice(t("saved")),
  });
  const savePassword = useMutation({
    mutationFn: (values: PasswordValues) => apiGo("identity/password", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      passwordForm.reset();
      setNotice(t("passwordSaved"));
    },
  });
  const saveSport = useMutation({
    mutationFn: () => apiGo("identity/sports", {
      method: "PUT",
      body: JSON.stringify({ sport_id: sportId, skill_level_id: skillId }),
    }),
    onSuccess: () => setNotice(t("saved")),
  });
  const sports = new Map<string, { name: string; skills: { id: string; name: string }[] }>();
  for (const row of catalog.data ?? []) {
    const current = sports.get(row.sport_id) ?? {
      name: locale === "vi" ? row.sport_name_vi : row.sport_name_en,
      skills: [],
    };
    if (row.skill_level_id) {
      current.skills.push({
        id: row.skill_level_id,
        name: (locale === "vi" ? row.skill_name_vi : row.skill_name_en) || row.skill_level_id,
      });
    }
    sports.set(row.sport_id, current);
  }
  const selected = sports.get(sportId);

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{t("personal")}</h2>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={personalForm.handleSubmit((values) => savePersonal.mutate(values))}>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="first-name" required>{t("firstName")}</FieldLabel>
            <Input id="first-name" {...personalForm.register("first_name")} />
            <FieldError>{personalForm.formState.errors.first_name?.message}</FieldError>
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="last-name">{t("lastName")}</FieldLabel>
            <Input id="last-name" {...personalForm.register("last_name")} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>{t("gender")}</FieldLabel>
            <Controller control={personalForm.control} name="gender" render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder={t("gender")} /></SelectTrigger>
                <SelectContent>
                  {["male", "female", "other", "undisclosed"].map((value) => (
                    <SelectItem key={value} value={value}>{t(`genderOptions.${value}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>{t("dateOfBirth")}</FieldLabel>
            <Controller control={personalForm.control} name="date_of_birth" render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                locale={locale}
                placeholder={t("dateOfBirth")}
                startMonth={DATE_PICKER_BIRTH_START_MONTH}
                endMonth={DATE_PICKER_BIRTH_END_MONTH}
              />
            )} />
          </div>
          <Button className="sm:col-span-2" type="submit" disabled={savePersonal.isPending}>{t("save")}</Button>
        </form>
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{t("sports")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={sportId || undefined} onValueChange={(value) => { setSportId(value); setSkillId(""); }}>
            <SelectTrigger><SelectValue placeholder={t("sport")} /></SelectTrigger>
            <SelectContent>
              {[...sports.entries()].map(([id, sport]) => <SelectItem key={id} value={id}>{sport.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={skillId || undefined} onValueChange={setSkillId}>
            <SelectTrigger><SelectValue placeholder={t("skill")} /></SelectTrigger>
            <SelectContent>
              {(selected?.skills ?? []).map((skill) => <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" disabled={!sportId || !skillId || saveSport.isPending} onClick={() => saveSport.mutate()}>{t("saveSport")}</Button>
      </section>

      <section className="space-y-2 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{t("activity")}</h2>
        <p>{t("bookings", { count: activity.data?.total_bookings ?? 0 })}</p>
        <p>{t("completed", { count: activity.data?.completed_bookings ?? 0 })}</p>
        <p>{t("hours", { count: activity.data?.playing_hours ?? 0 })}</p>
        <p>{t("spending", { amount: activity.data?.total_spending ?? 0 })}</p>
      </section>

      <section className="space-y-2 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{t("membership")}</h2>
        {(accounts.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">{t("noMembership")}</p> : null}
        {(accounts.data ?? []).map((account) => (
          <p key={account.id}>{account.tier_name} · {account.points_balance}</p>
        ))}
      </section>

      <section className="space-y-2 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{t("favorites")}</h2>
        {(favorites.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">{t("noFavorites")}</p> : null}
        {(favorites.data ?? []).map((item) => <p key={item.id}>{item.target_type}</p>)}
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{t("privacy")}</h2>
        <form className="space-y-3" onSubmit={privacyForm.handleSubmit((values) => savePrivacy.mutate(values))}>
          <FieldLabel htmlFor="bio">{t("bio")}</FieldLabel>
          <Textarea id="bio" {...privacyForm.register("bio")} />
          <FieldLabel>{t("visibility")}</FieldLabel>
          <Controller control={privacyForm.control} name="visibility" render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["public", "members", "private"].map((value) => (
                  <SelectItem key={value} value={value}>{t(`visibilityOptions.${value}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
          <Controller control={privacyForm.control} name="is_discoverable" render={({ field }) => (
            <label className="flex items-center justify-between gap-3 text-sm"><span>{t("discoverable")}</span><Switch checked={field.value} onCheckedChange={field.onChange} /></label>
          )} />
          <Controller control={privacyForm.control} name="is_open_to_invitations" render={({ field }) => (
            <label className="flex items-center justify-between gap-3 text-sm"><span>{t("invitations")}</span><Switch checked={field.value} onCheckedChange={field.onChange} /></label>
          )} />
          <Controller control={privacyForm.control} name="is_activity_visible" render={({ field }) => (
            <label className="flex items-center justify-between gap-3 text-sm"><span>{t("activityVisible")}</span><Switch checked={field.value} onCheckedChange={field.onChange} /></label>
          )} />
          <Button type="submit" disabled={savePrivacy.isPending}>{t("save")}</Button>
        </form>
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{t("security")}</h2>
        <form className="space-y-3" onSubmit={passwordForm.handleSubmit((values) => savePassword.mutate(values))}>
          <FieldLabel htmlFor="current-password" required>{t("currentPassword")}</FieldLabel>
          <Input id="current-password" type="password" {...passwordForm.register("current_password")} />
          <FieldError>{passwordForm.formState.errors.current_password?.message}</FieldError>
          <FieldLabel htmlFor="next-password" required>{t("newPassword")}</FieldLabel>
          <Input id="next-password" type="password" {...passwordForm.register("password")} />
          <FieldError>{passwordForm.formState.errors.password?.message}</FieldError>
          <Button type="submit" disabled={savePassword.isPending}>{t("changePassword")}</Button>
        </form>
      </section>
      {notice ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p> : null}
    </div>
  );
}
