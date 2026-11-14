"use client";

import { Button, FieldError, FieldLabel, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { apiGo } from "@/lib/api/client";
import { passwordSchema, personalSchema, transferSchema, type PasswordValues, type PersonalValues, type TransferValues } from "@/lib/validation/profile";

type Me = { user?: { first_name?: string; last_name?: string } };
type Org = { id: string; name: string };
type Staff = { id: string; user_id: string; title?: string; status: string };
type Invitation = { id: string; email: string; status: string };

export function OwnerProfile() {
  const t = useTranslations("profile");
  const te = useTranslations("errors");
  const [notice, setNotice] = useState("");
  const [orgId, setOrgId] = useState("");
  const me = useQuery({ queryKey: ["me"], queryFn: () => apiGo<Me>("identity/me") });
  const orgs = useQuery({ queryKey: ["orgs"], queryFn: () => apiGo<Org[]>("organizations") });
  const staff = useQuery({
    queryKey: ["staff", orgId],
    enabled: Boolean(orgId),
    queryFn: () => apiGo<Staff[]>(`organizations/${orgId}/staff`),
  });
  const invitations = useQuery({
    queryKey: ["invitations", orgId],
    enabled: Boolean(orgId),
    queryFn: () => apiGo<Invitation[]>(`organizations/${orgId}/invitations`),
  });
  const user = me.data?.user;
  const personal = useForm<PersonalValues>({
    resolver: zodResolver(useMemo(() => personalSchema({ required: te("REQUIRED") }), [te])),
    values: { first_name: user?.first_name ?? "", last_name: user?.last_name ?? "" },
  });
  const password = useForm<PasswordValues>({
    resolver: zodResolver(useMemo(() => passwordSchema({ required: te("REQUIRED") }), [te])),
    defaultValues: { current_password: "", password: "" },
  });
  const transfer = useForm<TransferValues>({
    resolver: zodResolver(useMemo(() => transferSchema({ required: te("REQUIRED") }), [te])),
    values: { organization_id: orgId, successor_user_id: "" },
  });
  const savePersonal = useMutation({
    mutationFn: (values: PersonalValues) => apiGo("identity/me", { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: () => setNotice(t("saved")),
  });
  const savePassword = useMutation({
    mutationFn: (values: PasswordValues) => apiGo("identity/password", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      password.reset();
      setNotice(t("passwordSaved"));
    },
  });
  const saveTransfer = useMutation({
    mutationFn: (values: TransferValues) => apiGo(`organizations/${values.organization_id}/ownership/transfer`, {
      method: "POST",
      body: JSON.stringify({ successor_user_id: values.successor_user_id }),
    }),
    onSuccess: () => setNotice(t("transferred")),
  });
  const submitKyc = useMutation({
    mutationFn: (fileId: string) => apiGo(`organizations/${orgId}/kyc`, {
      method: "POST",
      body: JSON.stringify({ documents: [{ file_id: fileId, document_type: "business_license" }] }),
    }),
    onSuccess: () => setNotice(t("kycSubmitted")),
  });

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{t("personal")}</h2>
        <form className="grid gap-3" onSubmit={personal.handleSubmit((values) => savePersonal.mutate(values))}>
          <FieldLabel htmlFor="first-name" required>{t("firstName")}</FieldLabel>
          <Input id="first-name" {...personal.register("first_name")} />
          <FieldError>{personal.formState.errors.first_name?.message}</FieldError>
          <FieldLabel htmlFor="last-name">{t("lastName")}</FieldLabel>
          <Input id="last-name" {...personal.register("last_name")} />
          <Button type="submit" disabled={savePersonal.isPending}>{t("save")}</Button>
        </form>
      </section>
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{t("organizations")}</h2>
        <Select value={orgId || undefined} onValueChange={setOrgId}>
          <SelectTrigger><SelectValue placeholder={t("chooseOrganization")} /></SelectTrigger>
          <SelectContent>
            {(orgs.data ?? []).map((org) => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="space-y-1 text-sm">
          {(staff.data ?? []).map((member) => <p key={member.id}>{member.user_id} · {member.status}</p>)}
          {(invitations.data ?? []).map((invite) => <p key={invite.id}>{invite.email} · {invite.status}</p>)}
        </div>
        <form className="space-y-3" onSubmit={transfer.handleSubmit((values) => saveTransfer.mutate(values))}>
          <FieldLabel htmlFor="successor" required>{t("successor")}</FieldLabel>
          <Input id="successor" {...transfer.register("successor_user_id")} />
          <FieldError>{transfer.formState.errors.successor_user_id?.message}</FieldError>
          <Button type="submit" variant="outline" disabled={!orgId || saveTransfer.isPending}>{t("transfer")}</Button>
        </form>
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          const fileId = new FormData(event.currentTarget).get("file_id");
          if (typeof fileId === "string" && orgId) submitKyc.mutate(fileId);
        }}>
          <FieldLabel htmlFor="kyc-file" required>{t("kycFile")}</FieldLabel>
          <Input id="kyc-file" name="file_id" />
          <Button type="submit" variant="outline" disabled={!orgId || submitKyc.isPending}>{t("submitKyc")}</Button>
        </form>
      </section>
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{t("security")}</h2>
        <form className="space-y-3" onSubmit={password.handleSubmit((values) => savePassword.mutate(values))}>
          <FieldLabel htmlFor="current-password" required>{t("currentPassword")}</FieldLabel>
          <Input id="current-password" type="password" {...password.register("current_password")} />
          <FieldLabel htmlFor="next-password" required>{t("newPassword")}</FieldLabel>
          <Input id="next-password" type="password" {...password.register("password")} />
          <Button type="submit" disabled={savePassword.isPending}>{t("changePassword")}</Button>
        </form>
      </section>
      {notice ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p> : null}
    </div>
  );
}
