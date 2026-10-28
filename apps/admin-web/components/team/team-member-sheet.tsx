"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  toast,
} from "@bokdy/ui";
import { UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { EntityFormFrame } from "@/components/entity/form-frame";
import {
  EntityMetadataForm,
  type EntityFormBlock,
} from "@/components/entity/metadata-form";
import { useBranches } from "@/hooks/use-branches";
import {
  useAssignOrgStaffRole,
  useRemoveOrgStaff,
  useRemoveOrgStaffRole,
  useRestoreOrgStaff,
  useSuspendOrgStaff,
  useUpdateOrgStaff,
} from "@/hooks/use-org-staff";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import type { StaffMember, StaffRoleCode } from "@/lib/api/org-staff";
import {
  teamMemberSchema,
  type TeamMemberFormValues,
} from "@/lib/validation/team-member";

function primaryRole(member: StaffMember): StaffRoleCode {
  if (member.roles.some((r) => r.code === "org_owner")) return "org_owner";
  return "org_staff";
}

function memberDefaults(member: StaffMember): TeamMemberFormValues {
  return {
    title: member.title ?? "",
    branch_id: member.branch_id ?? "",
    role_code: primaryRole(member),
  };
}

type TeamMemberSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  member: StaffMember | null;
};

export function TeamMemberSheet({
  open,
  onOpenChange,
  organizationId,
  member,
}: TeamMemberSheetProps) {
  const t = useTranslations("team");
  const te = useTranslations("errors");
  const { data: branches = [] } = useBranches(organizationId);
  const updateStaff = useUpdateOrgStaff(organizationId);
  const assignRole = useAssignOrgStaffRole(organizationId);
  const removeRole = useRemoveOrgStaffRole(organizationId);
  const suspend = useSuspendOrgStaff(organizationId);
  const restore = useRestoreOrgStaff(organizationId);
  const remove = useRemoveOrgStaff(organizationId);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const schema = useMemo(() => teamMemberSchema(), []);
  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      branch_id: "",
      role_code: "org_staff",
    },
  });

  useEffect(() => {
    if (open && member) {
      form.reset(memberDefaults(member));
    }
  }, [open, member, form]);

  const blocks = useMemo<EntityFormBlock<TeamMemberFormValues>[]>(
    () => [
      {
        id: "member",
        title: t("member.section"),
        icon: <UserRound className="size-4" aria-hidden />,
        tone: "sky",
        fields: [
          {
            kind: "text",
            name: "title",
            label: t("fields.title"),
            placeholder: t("member.titlePlaceholder"),
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
          {
            kind: "select",
            name: "branch_id",
            label: t("fields.branch"),
            options: [
              {
                value: "",
                label: t("member.noBranch"),
                keywords: "all none",
              },
              ...branches.map((b) => ({
                value: b.id,
                label: b.name_vi || b.name_en || b.code || b.id,
                keywords: `${b.name_vi ?? ""} ${b.name_en ?? ""} ${b.code ?? ""}`,
              })),
            ],
            span: 2,
          },
        ],
      },
    ],
    [t, branches],
  );

  const pending =
    updateStaff.isPending ||
    assignRole.isPending ||
    removeRole.isPending ||
    suspend.isPending ||
    restore.isPending ||
    remove.isPending ||
    form.formState.isSubmitting;

  const syncRole = async (staffId: string, next: StaffRoleCode, current: StaffMember) => {
    const has = (code: StaffRoleCode) => current.roles.some((r) => r.code === code);
    if (next === "org_owner") {
      if (!has("org_owner")) {
        await assignRole.mutateAsync({ staffId, roleCode: "org_owner" });
      }
      return;
    }
    if (!has("org_staff")) {
      await assignRole.mutateAsync({ staffId, roleCode: "org_staff" });
    }
    const owner = current.roles.find((r) => r.code === "org_owner");
    if (owner) {
      await removeRole.mutateAsync({ staffId, roleId: owner.id });
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!member) return;
    try {
      const nextBranch = values.branch_id.trim();
      const titleChanged =
        (values.title.trim() || undefined) !== (member.title || undefined);
      const branchChanged = nextBranch !== (member.branch_id ?? "");
      if (titleChanged || (branchChanged && nextBranch)) {
        await updateStaff.mutateAsync({
          staffId: member.id,
          input: {
            ...(titleChanged ? { title: values.title.trim() } : {}),
            ...(branchChanged && nextBranch ? { branch_id: nextBranch } : {}),
          },
        });
      }
      if (values.role_code !== primaryRole(member)) {
        await syncRole(member.id, values.role_code, member);
      }
      toast.success(t("member.saveSuccess"));
      onOpenChange(false);
    } catch (err) {
      const key = err instanceof ApiError ? errorMessageKey(err) : "generic";
      toast.error(te(key));
    }
  });

  const runStatusAction = async (action: "suspend" | "restore") => {
    if (!member) return;
    try {
      if (action === "suspend") {
        await suspend.mutateAsync(member.id);
        toast.success(t("member.suspendSuccess"));
      } else {
        await restore.mutateAsync(member.id);
        toast.success(t("member.restoreSuccess"));
      }
      onOpenChange(false);
    } catch (err) {
      const key = err instanceof ApiError ? errorMessageKey(err) : "generic";
      toast.error(te(key));
    }
  };

  const runRemove = async () => {
    if (!member) return;
    try {
      await remove.mutateAsync(member.id);
      toast.success(t("member.removeSuccess"));
      setConfirmRemove(false);
      onOpenChange(false);
    } catch (err) {
      const key = err instanceof ApiError ? errorMessageKey(err) : "generic";
      toast.error(te(key));
    }
  };

  const display =
    member?.display_name?.trim() ||
    member?.email?.trim() ||
    member?.user_id ||
    "";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="space-y-0 border-b border-border px-4 py-3 pr-12">
            <SheetTitle className="text-base">{t("member.title")}</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {display}
            </SheetDescription>
          </SheetHeader>
          {open && member ? (
            <FormProvider {...form}>
              <EntityFormFrame
                cancelLabel={t("actions.cancel")}
                submitLabel={t("member.save")}
                onCancel={() => onOpenChange(false)}
                pending={pending}
                onSubmit={onSubmit}
                actionsPlacement="inline"
              >
                <EntityMetadataForm blocks={blocks} />
                <div className="flex flex-wrap gap-2">
                  {member.status === "active" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => void runStatusAction("suspend")}
                    >
                      {t("actions.suspend")}
                    </Button>
                  ) : null}
                  {member.status === "suspended" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => void runStatusAction("restore")}
                    >
                      {t("actions.restore")}
                    </Button>
                  ) : null}
                  {member.status !== "resigned" ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={pending}
                      onClick={() => setConfirmRemove(true)}
                    >
                      {t("actions.remove")}
                    </Button>
                  ) : null}
                </div>
              </EntityFormFrame>
            </FormProvider>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("member.removeConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("member.removeConfirmBody", { name: display })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmRemove(false)}
              disabled={pending}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void runRemove()}
              disabled={pending}
            >
              {t("actions.remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
