"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Label } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useSuspendOrganization } from "@/hooks/use-suspend-organization";
import type { OrgStatus } from "@/lib/api/admin";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import {
  suspendOrganizationSchema,
  type SuspendOrganizationFormValues,
} from "@/lib/validation/suspend-organization";

import { OrganizationActionDialog } from "./organization-action-dialog";

type OrganizationSuspendDialogProps = {
  orgId: string;
  status: OrgStatus;
};

export function OrganizationSuspendDialog({ orgId, status }: OrganizationSuspendDialogProps) {
  const t = useTranslations("organization");
  const te = useTranslations("errors");
  const suspend = useSuspendOrganization();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const schema = useMemo(
    () => suspendOrganizationSchema({ required: te("REQUIRED") }),
    [te],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuspendOrganizationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });

  if (status !== "active") {
    return success ? (
      <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("suspendSuccess")}</p>
    ) : null;
  }

  function close() {
    setOpen(false);
    setError(null);
    reset({ reason: "" });
  }

  async function onSubmit(values: SuspendOrganizationFormValues) {
    setError(null);
    try {
      await suspend.mutateAsync({ id: orgId, reason: values.reason });
      setSuccess(true);
      close();
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError("INTERNAL", "", 500);
      if (apiErr.status === 409) {
        setError(t("suspendConflict"));
      } else {
        setError(te(errorMessageKey(apiErr)));
      }
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClick={() => {
          setSuccess(false);
          setOpen(true);
        }}
      >
        {t("suspend")}
      </Button>
      {success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{t("suspendSuccess")}</p>
      ) : null}

      <OrganizationActionDialog open={open} title={t("suspendTitle")} closeLabel={t("cancel")} onClose={close}>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <p className="text-sm text-muted-foreground">{t("suspendHint")}</p>
          <div className="space-y-1.5">
            <Label htmlFor="suspend-reason">{t("suspendReason")}</Label>
            <textarea
              id="suspend-reason"
              rows={4}
              className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register("reason")}
            />
            {errors.reason?.message ? (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={close} disabled={suspend.isPending}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={suspend.isPending}
            >
              {t("submitSuspend")}
            </Button>
          </div>
        </form>
      </OrganizationActionDialog>
    </div>
  );
}
