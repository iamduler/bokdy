"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
} from "@bokdy/ui";
import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { EntityFormFrame } from "@/components/entity/form-frame";
import {
  EntityMetadataForm,
  type EntityFormBlock,
} from "@/components/entity/metadata-form";
import { useInviteOrgStaff } from "@/hooks/use-org-staff";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import {
  emptyTeamInviteValues,
  teamInviteSchema,
  type TeamInviteFormValues,
} from "@/lib/validation/team-invite";

type TeamInviteSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
};

export function TeamInviteSheet({
  open,
  onOpenChange,
  organizationId,
}: TeamInviteSheetProps) {
  const t = useTranslations("team");
  const te = useTranslations("errors");
  const invite = useInviteOrgStaff(organizationId);

  const schema = useMemo(
    () =>
      teamInviteSchema({
        emailRequired: t("validation.emailRequired"),
        emailInvalid: t("validation.emailInvalid"),
      }),
    [t],
  );

  const form = useForm<TeamInviteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyTeamInviteValues(),
  });

  const blocks = useMemo<EntityFormBlock<TeamInviteFormValues>[]>(
    () => [
      {
        id: "invite",
        title: t("invite.section"),
        icon: <Mail className="size-4" aria-hidden />,
        tone: "sky",
        fields: [
          {
            kind: "text",
            name: "email",
            label: t("fields.email"),
            required: true,
            inputType: "email",
            placeholder: t("invite.emailPlaceholder"),
            span: 2,
          },
          {
            kind: "select",
            name: "role_code",
            label: t("fields.role"),
            required: true,
            options: [
              {
                value: "org_owner",
                label: t("roles.org_owner"),
                keywords: "org_owner owner",
              },
              {
                value: "org_staff",
                label: t("roles.org_staff"),
                keywords: "org_staff staff",
              },
            ],
            span: 2,
          },
        ],
      },
    ],
    [t],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await invite.mutateAsync({
        email: values.email.trim(),
        role_code: values.role_code,
      });
      toast.success(t("invite.success"));
      form.reset(emptyTeamInviteValues());
      onOpenChange(false);
    } catch (err) {
      const key = err instanceof ApiError ? errorMessageKey(err) : "generic";
      toast.error(te(key));
    }
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset(emptyTeamInviteValues());
        }
        onOpenChange(next);
      }}
    >
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="space-y-0 border-b border-border px-4 py-3 pr-12">
          <SheetTitle className="text-base">{t("invite.title")}</SheetTitle>
          <SheetDescription className="sr-only">{t("invite.title")}</SheetDescription>
        </SheetHeader>
        {open ? (
          <FormProvider {...form}>
            <EntityFormFrame
              cancelLabel={t("actions.cancel")}
              submitLabel={t("invite.submit")}
              onCancel={() => onOpenChange(false)}
              pending={invite.isPending || form.formState.isSubmitting}
              onSubmit={onSubmit}
              actionsPlacement="inline"
            >
              <EntityMetadataForm blocks={blocks} />
            </EntityFormFrame>
          </FormProvider>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
