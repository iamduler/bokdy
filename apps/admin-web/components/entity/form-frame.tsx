"use client";

import { Button, cn } from "@bokdy/ui";
import type { FormEventHandler, ReactNode } from "react";

import { softContentMaxW } from "@/components/data-list";
import { usePageShellActions } from "@/components/shell/shell-title";

const ENTITY_FORM_ID = "entity-form";

type EntityFormFrameProps = {
  cancelLabel: string;
  submitLabel: string;
  onCancel: () => void;
  pending?: boolean;
  submitDisabled?: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  cover?: ReactNode;
  children: ReactNode;
  /** Shell portals actions into the page header. Inline keeps them under the fields. */
  actionsPlacement?: "shell" | "inline";
  /** `lg` matches Soft detail pages (`softContentMaxW`). Default `md` is max-w-3xl. */
  contentWidth?: "md" | "lg";
};

export function EntityFormFrame({
  cancelLabel,
  submitLabel,
  onCancel,
  pending,
  submitDisabled,
  onSubmit,
  cover,
  children,
  actionsPlacement = "shell",
  contentWidth = "md",
}: EntityFormFrameProps) {
  const inline = actionsPlacement === "inline";
  const buttons = (
    <>
      <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
        {cancelLabel}
      </Button>
      <Button type="submit" form={ENTITY_FORM_ID} size="sm" disabled={pending || submitDisabled}>
        {submitLabel}
      </Button>
    </>
  );
  const portaled = usePageShellActions(inline ? null : buttons);
  const widthClass = contentWidth === "lg" ? softContentMaxW : "max-w-3xl";

  return (
    <div className={inline ? "flex min-h-0 flex-1 flex-col" : undefined}>
      {portaled}
      <form
        id={ENTITY_FORM_ID}
        className={inline ? "min-h-0 flex-1 overflow-y-auto" : "w-full"}
        onSubmit={onSubmit}
        noValidate
      >
        <div
          className={
            inline
              ? "space-y-6 px-4 py-4"
              : cn("mx-auto w-full space-y-6 py-4", widthClass)
          }
        >
          {cover}
          <div className={contentWidth === "lg" ? "space-y-4" : "space-y-10"}>{children}</div>
        </div>
      </form>
      {inline ? <div className="flex justify-end gap-2 border-t border-border p-4">{buttons}</div> : null}
    </div>
  );
}
