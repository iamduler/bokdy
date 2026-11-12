"use client";

import { Field, FieldError, FieldLabel, Input, toast } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";

import { EntityFormFrame } from "@/components/entity/form-frame";
import { EntityFormSection } from "@/components/entity/form-section";
import { EntityRelationLink } from "@/components/entity/relation-link";
import {
  EntityMetadataForm,
  type EntityFormBlock,
} from "@/components/entity/metadata-form";
import {
  PopoverCommandSelect,
  type PopoverCommandOption,
} from "@/components/popover-command-select";
import { useUserDetail, type UserDetailRecord } from "@/components/users/detail/user-detail-context";
import { useAdminOrganizations } from "@/hooks/use-admin-organizations";
import {
  useCreateAdminUser,
  useCreateOwnerUser,
  useCreatePlayerUser,
  useOwnerOrganizations,
  useReplaceOwnerStaffRole,
  useUpdateUserProfile,
} from "@/hooks/use-admin-users";
import type { AdminUserOrganization, UserAudience } from "@/lib/api/admin-users";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import {
  emptyUserAccount,
  userAccountSchema,
  type UserAccountFormValues,
  type UserAccountMode,
} from "@/lib/validation/user-account";

const ROLE_OPTIONS = ["org_owner", "org_staff"] as const;

function organizationLabel(org: {
  id: string;
  name?: string;
  name_vi?: string;
  name_en?: string;
  code?: string;
}) {
  return org.name || org.name_vi || org.name_en || org.code || org.id;
}

function givenName(user: UserDetailRecord) {
  const first = user.first_name?.trim() ?? "";
  const last = user.last_name?.trim() ?? "";
  if (first || last) return first;
  return user.full_name?.trim() ?? "";
}

type UserAccountFormProps = {
  audience: UserAudience;
  layout: "sheet";
  onDone: () => void;
  onRegisterLeave?: (leave: () => void) => void;
} & ({ mode: "create" } | { mode: "edit" });

export function UserAccountForm(props: UserAccountFormProps) {
  if (props.mode === "edit") {
    return <EditUserAccountForm {...props} mode="edit" />;
  }
  return (
    <UserAccountFields
      {...props}
      mode="create"
      user={null}
      userId=""
      memberships={[]}
    />
  );
}

function EditUserAccountForm({
  audience,
  layout,
  onDone,
  onRegisterLeave,
}: Extract<UserAccountFormProps, { mode: "edit" }>) {
  const { user, userId } = useUserDetail();
  const memberships = useOwnerOrganizations(audience === "owners" ? userId : "");
  return (
    <UserAccountFields
      audience={audience}
      mode="edit"
      layout={layout}
      onDone={onDone}
      onRegisterLeave={onRegisterLeave}
      user={user}
      userId={userId}
      memberships={memberships.data ?? []}
      membershipsLoading={memberships.isLoading}
    />
  );
}

function UserAccountFields({
  audience,
  mode,
  layout,
  onDone,
  onRegisterLeave,
  user,
  userId,
  memberships,
  membershipsLoading = false,
}: {
  audience: UserAudience;
  mode: UserAccountMode;
  layout: "sheet";
  onDone: () => void;
  onRegisterLeave?: (leave: () => void) => void;
  user: UserDetailRecord | null;
  userId: string;
  memberships: AdminUserOrganization[];
  membershipsLoading?: boolean;
}) {
  const t = useTranslations("users.accountForm");
  const tu = useTranslations("users");
  const te = useTranslations("errors");
  const createPlayer = useCreatePlayerUser();
  const createAdmin = useCreateAdminUser();
  const createOwner = useCreateOwnerUser();
  const updateProfile = useUpdateUserProfile();
  const replaceRole = useReplaceOwnerStaffRole(userId);
  const organizations = useAdminOrganizations(
    { limit: 100 },
    mode === "create" && audience === "owners",
  );
  const schema = useMemo(
    () =>
      userAccountSchema(
        {
          required: te("REQUIRED"),
          emailInvalid: te("EMAIL_INVALID"),
          passwordPolicy: te("PASSWORD_POLICY"),
          passwordMismatch: t("passwordMismatch"),
        },
        { mode, audience },
      ),
    [audience, mode, t, te],
  );
  const form = useForm<UserAccountFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyUserAccount(),
  });
  const { isDirty } = form.formState;
  const leaveConfirmed = useRef(false);

  const membershipKey = memberships.map((row) => row.staff_id).join(",");
  useEffect(() => {
    if (mode !== "edit" || !user) return;
    form.reset({
      ...emptyUserAccount(),
      email: user.email ?? "",
      first_name: givenName(user),
      last_name: user.last_name ?? "",
      phone: user.phone ?? "",
      memberships: memberships.map((row) => ({
        staff_id: row.staff_id,
        organization_id: row.organization_id,
        organization_name: row.name || row.code,
        staff_role: row.staff_role,
        title: row.staff_title ?? "",
      })),
    });
  }, [form, membershipKey, mode, user]);

  useEffect(() => {
    if (!isDirty) leaveConfirmed.current = false;
  }, [isDirty]);

  const roleOptions = useMemo<PopoverCommandOption[]>(
    () =>
      ROLE_OPTIONS.map((role) => ({
        value: role,
        label: tu(`permissions.roleLabel.${role}`),
        keywords: role,
      })),
    [tu],
  );
  const organizationOptions = useMemo<PopoverCommandOption[]>(
    () =>
      (organizations.data?.items ?? []).map((org) => ({
        value: org.id,
        label: organizationLabel(org),
        keywords: `${org.name} ${org.code}`,
      })),
    [organizations.data?.items],
  );

  const blocks = useMemo<EntityFormBlock<UserAccountFormValues>[]>(() => {
    const next: EntityFormBlock<UserAccountFormValues>[] = [
      {
        id: "identity",
        title: t("identity"),
        icon: <UserRound className="size-4" aria-hidden />,
        tone: "sky",
        fields: [
          { kind: "text", name: "email", label: t("email"), required: true, inputType: "email", span: 2 },
          { kind: "text", name: "first_name", label: t("firstName"), required: true },
          { kind: "text", name: "last_name", label: t("lastName") },
          { kind: "text", name: "phone", label: t("phone"), inputType: "tel", span: 2 },
        ],
      },
    ];
    if (mode === "create") {
      next.push({
        id: "password",
        title: t("password"),
        description: t("pendingHint"),
        icon: <KeyRound className="size-4" aria-hidden />,
        tone: "amber",
        fields: [
          {
            kind: "text",
            name: "password",
            label: t("password"),
            required: true,
            inputType: "password",
            autoComplete: "new-password",
          },
          {
            kind: "text",
            name: "confirm_password",
            label: t("confirmPassword"),
            required: true,
            inputType: "password",
            autoComplete: "new-password",
          },
        ],
      });
    }
    if (mode === "create" && audience === "owners") {
      next.push({
        id: "membership",
        title: t("membership"),
        icon: <Users className="size-4" aria-hidden />,
        tone: "emerald",
        fields: [
          {
            kind: "select",
            name: "organization_id",
            label: t("organization"),
            required: true,
            searchable: true,
            options: organizationOptions,
            placeholder: t("organizationPlaceholder"),
          },
          {
            kind: "select",
            name: "staff_role",
            label: t("role"),
            required: true,
            searchable: false,
            options: roleOptions,
            placeholder: t("rolePlaceholder"),
          },
          { kind: "text", name: "title", label: t("title") },
        ],
      });
    }
    return next;
  }, [audience, mode, organizationOptions, roleOptions, t]);

  const pending =
    createPlayer.isPending ||
    createAdmin.isPending ||
    createOwner.isPending ||
    updateProfile.isPending ||
    replaceRole.isPending;

  function requestLeave() {
    if (isDirty && !leaveConfirmed.current) {
      leaveConfirmed.current = true;
      toast.warning(t("unsavedWarning"));
      return;
    }
    if (layout === "sheet") onDone();
  }

  useEffect(() => {
    onRegisterLeave?.(requestLeave);
  });

  async function onSubmit(values: UserAccountFormValues) {
    const profile = {
      email: values.email.trim(),
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      phone: values.phone.trim(),
    };
    try {
      if (mode === "create") {
        if (audience === "admins") {
          await createAdmin.mutateAsync({ ...profile, password: values.password });
        } else if (audience === "owners") {
          await createOwner.mutateAsync({
            ...profile,
            password: values.password,
            organization_id: values.organization_id,
            staff_role: values.staff_role as "org_owner" | "org_staff",
            title: values.title.trim(),
          });
        } else {
          await createPlayer.mutateAsync({ ...profile, password: values.password });
        }
      } else {
        await updateProfile.mutateAsync({ id: userId, ...profile });
        if (audience === "owners") {
          const previous = new Map(memberships.map((row) => [row.staff_id, row]));
          for (const row of values.memberships) {
            const current = previous.get(row.staff_id);
            if (
              current &&
              current.staff_role === row.staff_role &&
              (current.staff_title ?? "") === row.title
            ) {
              continue;
            }
            await replaceRole.mutateAsync({
              staffId: row.staff_id,
              role_code: row.staff_role as "org_owner" | "org_staff",
              title: row.title.trim(),
            });
          }
        }
      }
      leaveConfirmed.current = true;
      onDone();
    } catch (err) {
      toast.error(err instanceof ApiError ? te(errorMessageKey(err)) : te("INTERNAL"));
    }
  }

  const watchedMemberships = form.watch("memberships");

  return (
    <FormProvider {...form}>
      <div className="flex min-h-0 flex-1 flex-col">
        <EntityFormFrame
          cancelLabel={t("cancel")}
          submitLabel={mode === "create" ? t("createSubmit") : t("save")}
          onCancel={requestLeave}
          pending={pending}
          submitDisabled={mode === "edit" && !isDirty}
          actionsPlacement="inline"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <EntityMetadataForm blocks={blocks} />
          {mode === "edit" && audience === "owners" ? (
            <EntityFormSection
              title={t("memberships")}
              icon={<Users className="size-4" aria-hidden />}
              tone="emerald"
              hint={t("membershipHint")}
            >
              {membershipsLoading ? (
                <p className="text-sm text-muted-foreground">{t("loadingMemberships")}</p>
              ) : watchedMemberships.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noMemberships")}</p>
              ) : (
                <div>
                  {watchedMemberships.map((row, index) => (
                    <div
                      key={row.staff_id}
                      className="grid gap-3 border-b border-border/40 py-3 last:border-b-0 sm:grid-cols-2"
                    >
                      <EntityRelationLink href={`/organizations/${row.organization_id}`}>
                        {row.organization_name || row.organization_id}
                      </EntityRelationLink>
                      <Controller
                        control={form.control}
                        name={`memberships.${index}.staff_role`}
                        render={({ field }) => (
                          <PopoverCommandSelect
                            value={field.value}
                            onValueChange={field.onChange}
                            options={roleOptions}
                            searchable={false}
                            aria-label={t("role")}
                          />
                        )}
                      />
                      <Field className="sm:col-span-2">
                        <FieldLabel htmlFor={`membership-title-${row.staff_id}`}>{t("title")}</FieldLabel>
                        <Input id={`membership-title-${row.staff_id}`} {...form.register(`memberships.${index}.title`)} />
                        <FieldError>
                          {form.formState.errors.memberships?.[index]?.staff_role?.message}
                        </FieldError>
                      </Field>
                    </div>
                  ))}
                </div>
              )}
            </EntityFormSection>
          ) : null}
        </EntityFormFrame>
      </div>
    </FormProvider>
  );
}
