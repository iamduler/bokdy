"use client";

import { Button } from "@bokdy/ui";
import type { FormEventHandler, ReactNode } from "react";

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

  return (
    <div className={inline ? "flex min-h-0 flex-1 flex-col" : undefined}>
      {portaled}
      <form
        id={ENTITY_FORM_ID}
        className={inline ? "min-h-0 flex-1 overflow-y-auto" : "w-full"}
        onSubmit={onSubmit}
        noValidate
      >
        <div className={inline ? "space-y-6 px-4 py-4" : "mx-auto w-full max-w-3xl space-y-6 px-4 py-8"}>
          {cover}
          <div className="space-y-10">{children}</div>
        </div>
      </form>
      {inline ? <div className="flex justify-end gap-2 border-t border-border p-4">{buttons}</div> : null}
    </div>
  );
}
