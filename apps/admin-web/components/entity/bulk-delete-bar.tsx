"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@bokdy/ui";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmActionDialog } from "@/components/entity/confirm-action-dialog";

type BulkDeleteBarProps = {
  count: number;
  selectedLabel: string;
  deleteLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => Promise<void>;
  onClear: () => void;
  placement?: "bar" | "footer";
};

export function BulkDeleteBar({
  count,
  selectedLabel,
  deleteLabel,
  title,
  description,
  cancelLabel,
  pending,
  error,
  onConfirm,
  onClear,
  placement = "bar",
}: BulkDeleteBarProps) {
  const t = useTranslations("dataList");
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  const clearLabel = t("clearSelection");
  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-sm tabular-nums text-foreground">{selectedLabel}</p>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="outline" size="sm" aria-label={clearLabel} onClick={onClear}>
            <X className="size-4" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{clearLabel}</TooltipContent>
      </Tooltip>
      <Button type="button" variant="destructive" size="sm" onClick={() => setOpen(true)}>
        {deleteLabel}
      </Button>
    </div>
  );
  const trigger =
    placement === "footer" ? (
      actions
    ) : (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-card px-3 py-2">
        {actions}
      </div>
    );
  return (
    <>
      {trigger}
      <ConfirmActionDialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={description}
        confirmLabel={deleteLabel}
        cancelLabel={cancelLabel}
        pending={pending}
        error={error}
        destructive
        onConfirm={() => {
          void onConfirm().then(
            () => setOpen(false),
            () => undefined,
          );
        }}
      />
    </>
  );
}
