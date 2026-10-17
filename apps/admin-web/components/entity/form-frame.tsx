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
}: EntityFormFrameProps) {
  const actions = usePageShellActions(
    <>
      <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
        {cancelLabel}
      </Button>
      <Button type="submit" form={ENTITY_FORM_ID} size="sm" disabled={pending || submitDisabled}>
        {submitLabel}
      </Button>
    </>,
  );

  return (
    <>
      {actions}
      <form id={ENTITY_FORM_ID} className="w-full" onSubmit={onSubmit} noValidate>
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
          {cover}
          <div className="space-y-10">{children}</div>
        </div>
      </form>
    </>
  );
}
