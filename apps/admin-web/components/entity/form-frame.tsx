"use client";

import { Button, cn } from "@bokdy/ui";
import type { FormEventHandler, ReactNode } from "react";

import { softContentMaxW } from "@/components/data-list";
import { EntityFormLayoutProvider } from "@/components/entity/form-layout-context";
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
  /**
   * `lg` = Soft detail column (`softContentMaxW` / max-w-5xl).
   * `md` = max-w-3xl.
   * Default: `lg` for shell (full page), `md` for inline (sheet).
   */
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
  contentWidth,
}: EntityFormFrameProps) {
  const inline = actionsPlacement === "inline";
  const resolvedWidth = contentWidth ?? (actionsPlacement === "shell" ? "lg" : "md");
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
  const widthClass = resolvedWidth === "lg" ? softContentMaxW : "max-w-3xl";

  return (
    <EntityFormLayoutProvider layout={inline ? "sheet" : "page"}>
      <div className={inline ? "flex min-h-0 flex-1 flex-col" : undefined}>
        {portaled}
        <form
          id={ENTITY_FORM_ID}
          className={inline ? "min-h-0 flex-1 overflow-y-auto" : "w-full pb-28 md:pb-0"}
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
            <div className={resolvedWidth === "lg" ? "space-y-4" : "space-y-10"}>{children}</div>
          </div>
        </form>
        {inline ? <div className="flex justify-end gap-2 border-t border-border p-4">{buttons}</div> : null}
      </div>
    </EntityFormLayoutProvider>
  );
}
