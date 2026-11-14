"use client";

import { Button, FieldError, FieldLabel, Input, Textarea } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Link } from "@/i18n/navigation";
import { apiGo } from "@/lib/api/client";
import { employeeSchema, passwordSchema, type EmployeeValues, type PasswordValues } from "@/lib/validation/profile-security";

type Employee = {
  employee_code: string;
  department: string;
  job_title: string;
  work_email: string;
  work_phone: string;
  employment_status: string;
  is_mfa_required: boolean;
};

export function ProfileSecurity() {
  const t = useTranslations("profile");
  const te = useTranslations("errors");
  const queryClient = useQueryClient();
  const [secret, setSecret] = useState("");
  const [notice, setNotice] = useState("");
  const employee = useQuery({
    queryKey: ["identity", "employee"],
    queryFn: () => apiGo<Employee>("identity/employee"),
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(useMemo(() => passwordSchema({ required: te("REQUIRED") }), [te])),
    defaultValues: { current_password: "", password: "" },
  });
  const employeeForm = useForm<EmployeeValues>({
    resolver: zodResolver(useMemo(() => employeeSchema(), [])),
    values: {
      employee_code: employee.data?.employee_code ?? "",
      department: employee.data?.department ?? "",
      job_title: employee.data?.job_title ?? "",
      work_email: employee.data?.work_email ?? "",
      work_phone: employee.data?.work_phone ?? "",
      employment_status: (employee.data?.employment_status as EmployeeValues["employment_status"]) || "active",
    },
  });

  const savePassword = useMutation({
    mutationFn: (values: PasswordValues) =>
      apiGo<void>("identity/password", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      passwordForm.reset();
      setNotice(t("passwordSaved"));
    },
  });
  const saveEmployee = useMutation({
    mutationFn: (values: EmployeeValues) =>
      apiGo<void>("identity/employee", {
        method: "PUT",
        body: JSON.stringify({ ...values, mfa_required: employee.data?.is_mfa_required ?? false }),
      }),
    onSuccess: () => {
      setNotice(t("employeeSaved"));
      void queryClient.invalidateQueries({ queryKey: ["identity", "employee"] });
    },
  });
  const enroll = useMutation({
    mutationFn: () => apiGo<{ secret: string }>("identity/mfa/enroll", { method: "POST" }),
    onSuccess: (result) => setSecret(result.secret),
  });
  const confirm = useMutation({
    mutationFn: (code: string) => apiGo<void>("identity/mfa/confirm", { method: "POST", body: JSON.stringify({ code }) }),
    onSuccess: () => {
      setSecret("");
      setNotice(t("mfaSaved"));
    },
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{t("security")}</h2>
        <form className="space-y-3" onSubmit={passwordForm.handleSubmit((values) => savePassword.mutate(values))}>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="current-password" required>{t("currentPassword")}</FieldLabel>
            <Input id="current-password" type="password" {...passwordForm.register("current_password")} />
            <FieldError>{passwordForm.formState.errors.current_password?.message}</FieldError>
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="next-password" required>{t("newPassword")}</FieldLabel>
            <Input id="next-password" type="password" {...passwordForm.register("password")} />
            <FieldError>{passwordForm.formState.errors.password?.message}</FieldError>
          </div>
          <Button type="submit" disabled={savePassword.isPending}>{t("changePassword")}</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => enroll.mutate()} disabled={enroll.isPending}>{t("enrollMfa")}</Button>
          <Button variant="outline" asChild><Link href="/sessions">{t("sessions")}</Link></Button>
        </div>
        {secret ? (
          <form className="space-y-2" onSubmit={(event) => {
            event.preventDefault();
            const code = new FormData(event.currentTarget).get("code");
            if (typeof code === "string") confirm.mutate(code);
          }}>
            <p className="text-sm">{t("mfaSecret")}</p>
            <Textarea readOnly value={secret} />
            <FieldLabel htmlFor="mfa-code" required>{t("mfaCode")}</FieldLabel>
            <Input id="mfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" />
            <Button type="submit" disabled={confirm.isPending}>{t("confirmMfa")}</Button>
          </form>
        ) : null}
      </section>
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold">{t("employee")}</h2>
        <form className="space-y-3" onSubmit={employeeForm.handleSubmit((values) => saveEmployee.mutate(values))}>
          <FieldLabel htmlFor="employee-code">{t("employeeCode")}</FieldLabel>
          <Input id="employee-code" {...employeeForm.register("employee_code")} />
          <FieldLabel htmlFor="department">{t("department")}</FieldLabel>
          <Input id="department" {...employeeForm.register("department")} />
          <FieldLabel htmlFor="job-title">{t("jobTitle")}</FieldLabel>
          <Input id="job-title" {...employeeForm.register("job_title")} />
          <FieldLabel htmlFor="work-email">{t("workEmail")}</FieldLabel>
          <Input id="work-email" type="email" {...employeeForm.register("work_email")} />
          <FieldLabel htmlFor="work-phone">{t("workPhone")}</FieldLabel>
          <Input id="work-phone" {...employeeForm.register("work_phone")} />
          <Button type="submit" disabled={saveEmployee.isPending}>{t("saveEmployee")}</Button>
        </form>
      </section>
      {notice ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p> : null}
    </div>
  );
}
