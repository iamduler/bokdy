"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Label, Textarea } from "@bokdy/ui";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EntityActionDialog } from "@/components/entity/action-dialog";

export function ReasonActionDialog({
  open,
  onClose,
  title,
  hint,
  reasonLabel,
  reasonId,
  cancelLabel,
  submitLabel,
  closeLabel,
  pending,
  error,
  requiredMessage,
  destructive,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  hint?: string;
  reasonLabel: string;
  reasonId: string;
  cancelLabel: string;
  submitLabel: string;
  closeLabel: string;
  pending: boolean;
  error?: string | null;
  requiredMessage: string;
  destructive?: boolean;
  onSubmit: (reason: string) => Promise<void> | void;
}) {
  const schema = useMemo(
    () => z.object({ reason: z.string().trim().min(1, requiredMessage) }),
    [requiredMessage],
  );
  const form = useForm<{ reason: string }>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });

  function close() {
    form.reset({ reason: "" });
    onClose();
  }

  return (
    <EntityActionDialog open={open} title={title} closeLabel={closeLabel} onClose={close}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values.reason);
        })}
      >
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
        <div className="space-y-1.5">
          <Label htmlFor={reasonId}>{reasonLabel}</Label>
          <Textarea id={reasonId} rows={4} {...form.register("reason")} />
          {form.formState.errors.reason?.message ? (
            <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
          ) : null}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={close} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            disabled={pending}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </EntityActionDialog>
  );
}
