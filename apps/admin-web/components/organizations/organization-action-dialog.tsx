"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@bokdy/ui";
import { useEffect, type ReactNode } from "react";

type OrganizationActionDialogProps = {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};

export function OrganizationActionDialog({
  open,
  title,
  closeLabel,
  onClose,
  children,
}: OrganizationActionDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="org-action-dialog-title"
        className="relative z-10 w-full max-w-md"
      >
        <CardHeader>
          <CardTitle id="org-action-dialog-title">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
