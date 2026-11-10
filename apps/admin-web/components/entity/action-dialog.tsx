"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@bokdy/ui";
import type { ReactNode } from "react";

type EntityActionDialogProps = {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};

export function EntityActionDialog({ open, title, closeLabel, onClose, children }: EntityActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-md" closeLabel={closeLabel} aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
