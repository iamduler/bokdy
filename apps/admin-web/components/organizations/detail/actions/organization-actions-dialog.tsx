"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@bokdy/ui";
import { useTranslations } from "next-intl";

import { useOrganizationDetail } from "../organization-detail-context";
import { OrganizationActionsList } from "./organization-actions-list";

type OrganizationActionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrganizationActionsDialog({
  open,
  onOpenChange,
}: OrganizationActionsDialogProps) {
  const t = useTranslations("organization.detailActions");
  const tOrg = useTranslations("organization");
  const { org } = useOrganizationDetail();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(85vh,40rem)] max-w-3xl overflow-y-auto soft-scrollbar"
        closeLabel={tOrg("cancel")}
        aria-describedby={undefined}
      >
        <DialogHeader className="pr-8">
          <DialogTitle>{t("title", { name: org.name })}</DialogTitle>
        </DialogHeader>
        <OrganizationActionsList />
      </DialogContent>
    </Dialog>
  );
}
