"use client";

import { AuthAlert, Button, Input, Label } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { useForm } from "react-hook-form";

import { OrganizationActionDialog } from "@/components/organizations/organization-action-dialog";
import { useCreateOrganization } from "@/hooks/use-create-organization";
import { useRouter } from "@/i18n/navigation";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import {
  createOrganizationSchema,
  type CreateOrganizationFormValues,
} from "@/lib/validation/organization-create";

type OrganizationCreateDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function OrganizationCreateDialog({ open, onClose }: OrganizationCreateDialogProps) {
  const t = useTranslations("organization");
  const te = useTranslations("errors");
  const router = useRouter();
  const create = useCreateOrganization();
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(
    () => createOrganizationSchema({ nameRequired: t("nameRequired") }),
    [t],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      name_vi: "",
      name_en: "",
      code: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset();
    setError(null);
  }, [open, reset]);

  async function onSubmit(values: CreateOrganizationFormValues) {
    setError(null);
    try {
      const org = await create.mutateAsync({
        name: values.name || undefined,
        name_vi: values.name_vi || undefined,
        name_en: values.name_en || undefined,
        code: values.code || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
      });
      onClose();
      router.push(`/organizations/${org.id}`);
      router.refresh();
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setError(apiErr ? te(errorMessageKey(apiErr)) : t("loadError"));
    }
  }

  return (
    <OrganizationActionDialog
      open={open}
      title={t("createTitle")}
      closeLabel={t("createCancel")}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="text-sm text-muted-foreground">{t("createHint")}</p>
        {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}

        <Field
          id="org-create-name"
          label={t("fieldName")}
          error={errors.name?.message}
          autoComplete="organization"
          {...register("name")}
        />
        <Field id="org-create-name-vi" label={t("fieldNameVi")} error={errors.name_vi?.message} {...register("name_vi")} />
        <Field id="org-create-name-en" label={t("fieldNameEn")} error={errors.name_en?.message} {...register("name_en")} />
        <Field id="org-create-code" label={t("fieldCode")} error={errors.code?.message} {...register("code")} />
        <Field
          id="org-create-email"
          label={t("fieldEmail")}
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          id="org-create-phone"
          label={t("fieldPhone")}
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={create.isPending}>
            {t("createCancel")}
          </Button>
          <Button type="submit" size="sm" disabled={create.isPending}>
            {t("createSubmit")}
          </Button>
        </div>
      </form>
    </OrganizationActionDialog>
  );
}

function Field({
  id,
  label,
  error,
  ...props
}: ComponentProps<typeof Input> & { id: string; label: string; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={Boolean(error)} {...props} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
