"use client";

import { toast } from "@bokdy/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MapPin, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { EntityFormFrame } from "@/components/entity/form-frame";
import { EntityMetadataForm, type EntityFormBlock } from "@/components/entity/metadata-form";
import type { PopoverCommandOption } from "@/components/popover-command-select";
import {
  useCloseBranch,
  useCreateBranch,
  useOpenBranch,
  useUpdateBranch,
} from "@/hooks/use-branches";
import { useProvinces, useWards } from "@/hooks/use-admin-units";
import { useRouter } from "@/i18n/navigation";
import { currentBranchAddress, type Branch, type BranchProfileInput, type BranchStatus } from "@/lib/api/branches";
import { ApiError, errorMessageKey } from "@/lib/api/errors";
import { branchFormSchema, type BranchFormValues } from "@/lib/validation/branch-form";

const EDITABLE_STATUSES = ["inactive", "active"] as const;

const FORM_FIELDS = [
  "name_vi",
  "name_en",
  "code",
  "phone",
  "email",
  "timezone",
  "province_id",
  "ward_id",
  "address_line_1",
  "address_line_2",
] as const;

type BranchFormProps = {
  organizationId: string;
  layout?: "page" | "sheet";
  onDone?: () => void;
  onRegisterLeave?: (leave: () => void) => void;
} & ({ mode: "create" } | { mode: "edit"; branch: Branch });

const emptyValues: BranchFormValues = {
  name_vi: "",
  name_en: "",
  code: "",
  phone: "",
  email: "",
  timezone: "",
  province_id: "",
  ward_id: "",
  address_line_1: "",
  address_line_2: "",
  status: "inactive",
};

function valuesFromBranch(branch: Branch): BranchFormValues {
  const address = currentBranchAddress(branch);
  return {
    name_vi: branch.name_vi ?? "",
    name_en: branch.name_en ?? "",
    code: branch.code ?? "",
    phone: branch.phone ?? "",
    email: branch.email ?? "",
    timezone: branch.timezone ?? "",
    province_id: address?.province_id ?? "",
    ward_id: address?.ward_id ?? "",
    address_line_1: address?.address_line_1 ?? "",
    address_line_2: address?.address_line_2 ?? "",
    status: branch.status,
  };
}

function profileBody(values: BranchFormValues, mode: "create" | "edit"): BranchProfileInput {
  const body: BranchProfileInput = {
    name_en: values.name_en,
    name_vi: values.name_vi,
    code: values.code,
    phone: values.phone,
    email: values.email,
    timezone: values.timezone,
  };
  if (values.province_id && values.ward_id) {
    body.addresses = [
      {
        division_scheme: "current_v2",
        province_id: values.province_id,
        ward_id: values.ward_id,
        address_line_1: values.address_line_1,
        address_line_2: values.address_line_2,
      },
    ];
  } else if (mode === "edit") {
    body.addresses = [];
  }
  return body;
}

export function BranchForm(props: BranchFormProps) {
  const t = useTranslations("organization");
  const tb = useTranslations("organization.branch");
  const te = useTranslations("errors");
  const router = useRouter();
  const branch = props.mode === "edit" ? props.branch : undefined;
  const { organizationId, onDone, onRegisterLeave } = props;
  const layout = props.layout ?? "page";
  const create = useCreateBranch(organizationId);
  const update = useUpdateBranch(organizationId, branch?.id ?? "");
  const open = useOpenBranch(organizationId, branch?.id ?? "");
  const close = useCloseBranch(organizationId, branch?.id ?? "");
  const pending = create.isPending || update.isPending || open.isPending || close.isPending;
  const leaveConfirmed = useRef(false);

  const schema = useMemo(
    () =>
      branchFormSchema({
        nameRequired: t("nameRequired"),
        emailInvalid: t("emailInvalid"),
        addressIncomplete: tb("addressIncomplete"),
      }),
    [t, tb],
  );

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: branch ? valuesFromBranch(branch) : emptyValues,
  });
  const { handleSubmit, reset, setError, setValue, watch, clearErrors, formState } = form;
  const { isDirty } = formState;
  const provinceId = watch("province_id");
  const { data: provinces = [] } = useProvinces("current_v2");
  const { data: wards = [] } = useWards({
    scheme: "current_v2",
    provinceId: provinceId || undefined,
  });

  const branchId = branch?.id;
  useEffect(() => {
    if (!branch) return;
    reset(valuesFromBranch(branch));
    // Reset only when opening another branch, not on every refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, reset]);

  const listHref = `/organizations/${organizationId}/branches`;
  const backHref = branch ? `${listHref}/${branch.id}` : listHref;

  function requestLeave() {
    if (isDirty && !leaveConfirmed.current) {
      leaveConfirmed.current = true;
      toast.warning(t("unsavedWarning"));
      return;
    }
    if (layout === "sheet") onDone?.();
    else router.push(backHref);
  }

  useEffect(() => {
    onRegisterLeave?.(requestLeave);
  });

  function applyApiError(err: unknown) {
    const apiErr = err instanceof ApiError ? err : null;
    if (!apiErr) {
      toast.error(tb("loadError"));
      return;
    }
    let mapped = false;
    for (const detail of apiErr.details) {
      if (!FORM_FIELDS.includes(detail.field as (typeof FORM_FIELDS)[number])) continue;
      setError(detail.field as (typeof FORM_FIELDS)[number], {
        message: te(errorMessageKey(new ApiError(detail.code, detail.message, apiErr.status))),
      });
      mapped = true;
    }
    if (!mapped) toast.error(te(errorMessageKey(apiErr)));
  }

  async function onSubmit(values: BranchFormValues) {
    const nextStatus = values.status as BranchStatus;
    const canChangeStatus =
      branch &&
      (branch.status === "active" || branch.status === "inactive") &&
      (nextStatus === "active" || nextStatus === "inactive");
    if (branch && nextStatus !== branch.status && !canChangeStatus) {
      setError("status", { message: tb("statusUnsupported") });
      return;
    }
    try {
      const body = profileBody(values, props.mode);
      if (props.mode === "create") {
        const saved = await create.mutateAsync(body);
        toast.success(tb("createSuccess"));
        if (layout === "sheet") onDone?.();
        else router.push(`${listHref}/${saved.id}`);
        return;
      }
      const saved = await update.mutateAsync(body);
      if (branch && nextStatus !== branch.status) {
        if (nextStatus === "active") await open.mutateAsync();
        if (nextStatus === "inactive") await close.mutateAsync();
      }
      reset(valuesFromBranch({ ...saved, status: nextStatus }));
      toast.success(tb("saveSuccess"));
      if (layout === "sheet") onDone?.();
    } catch (err) {
      applyApiError(err);
    }
  }

  const statusOptions: PopoverCommandOption[] = EDITABLE_STATUSES.map((value) => ({
    value,
    label: tb(`status.${value}`),
    keywords: value,
  }));
  const provinceOptions = provinces.map((unit) => ({
    value: unit.id,
    label: unit.name,
    keywords: `${unit.name_vi} ${unit.name_en} ${unit.code}`,
  }));
  const wardOptions = wards.map((unit) => ({
    value: unit.id,
    label: unit.name,
    keywords: `${unit.name_vi} ${unit.name_en} ${unit.code}`,
  }));

  const blocks = useMemo<EntityFormBlock<BranchFormValues>[]>(
    () => [
      {
        id: "identity",
        title: t("sectionIdentity"),
        icon: <Store className="size-4" aria-hidden />,
        tone: "sky",
        fields: [
          { kind: "text", name: "name_vi", label: t("fieldNameVi"), required: true },
          { kind: "text", name: "name_en", label: t("fieldNameEn"), required: true },
          { kind: "text", name: "code", label: t("fieldCode") },
          {
            kind: "select",
            name: "status",
            label: tb("fieldStatus"),
            options: statusOptions,
            visible: () => branch?.status === "active" || branch?.status === "inactive",
            onValueChange: () => clearErrors("status"),
          },
        ],
      },
      {
        id: "contact",
        title: t("sectionContact"),
        icon: <Mail className="size-4" aria-hidden />,
        tone: "emerald",
        fields: [
          { kind: "text", name: "email", label: t("fieldEmail"), inputType: "email", autoComplete: "email" },
          { kind: "text", name: "phone", label: t("fieldPhone"), inputType: "tel", autoComplete: "tel" },
          {
            kind: "text",
            name: "timezone",
            label: tb("fieldTimezone"),
            placeholder: "Asia/Ho_Chi_Minh",
          },
        ],
      },
      {
        id: "address",
        title: tb("address"),
        icon: <MapPin className="size-4" aria-hidden />,
        tone: "amber",
        fields: [
          {
            kind: "select",
            name: "province_id",
            label: t("fieldProvince"),
            options: provinceOptions,
            searchable: true,
            placeholder: t("fieldProvince"),
            onValueChange: () => setValue("ward_id", "", { shouldDirty: true }),
          },
          {
            kind: "select",
            name: "ward_id",
            label: t("fieldWard"),
            options: wardOptions,
            searchable: true,
            placeholder: t("fieldWard"),
            disabled: (values) => !values.province_id,
          },
          { kind: "text", name: "address_line_1", label: t("fieldAddress1"), span: 2 },
          { kind: "text", name: "address_line_2", label: t("fieldAddress2"), span: 2 },
        ],
      },
    ],
    [t, tb, branch?.status, statusOptions, provinceOptions, wardOptions, clearErrors, setValue],
  );

  return (
    <FormProvider {...form}>
      <div className={layout === "sheet" ? "flex min-h-0 flex-1 flex-col" : undefined}>
      <EntityFormFrame
        cancelLabel={t("createCancel")}
        submitLabel={props.mode === "edit" ? t("save") : t("createSubmit")}
        onCancel={requestLeave}
        pending={pending}
        submitDisabled={props.mode === "edit" && !isDirty}
        onSubmit={handleSubmit(onSubmit)}
        actionsPlacement={layout === "sheet" ? "inline" : "shell"}
      >
        <EntityMetadataForm blocks={blocks} />
      </EntityFormFrame>
      </div>
    </FormProvider>
  );
}
