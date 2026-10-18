"use client";

import { cn, Field, FieldDescription, FieldError, FieldGroup, FieldLabel, Input } from "@bokdy/ui";
import type { ReactNode } from "react";
import {
  useFormContext,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
  type PathValue,
  type UseFormReturn,
} from "react-hook-form";

import { EntityFormSection, entityFormFieldsClass } from "@/components/entity/form-section";
import {
  PopoverCommandSelect,
  type PopoverCommandOption,
} from "@/components/popover-command-select";

const selectClass = "w-full justify-between border border-input bg-background";

type FieldBase<T extends FieldValues> = {
  name: FieldPath<T>;
  label: string;
  /** Cells occupied in the two-column row. Defaults to 1. */
  span?: 1 | 2;
  required?: boolean;
  description?: string;
  visible?: (values: T) => boolean;
  disabled?: boolean | ((values: T) => boolean);
  /** Shown instead of the resolver message, for checks that live outside Zod. */
  error?: string;
};

export type EntityTextField<T extends FieldValues> = FieldBase<T> & {
  kind: "text";
  inputType?: "text" | "email" | "tel" | "url";
  placeholder?: string;
  autoComplete?: string;
};

export type EntitySelectField<T extends FieldValues> = FieldBase<T> & {
  kind: "select";
  options: PopoverCommandOption[];
  searchable?: boolean;
  placeholder?: string;
  onValueChange?: (value: string, form: UseFormReturn<T>) => void;
};

export type EntityFormField<T extends FieldValues> = EntityTextField<T> | EntitySelectField<T>;

export type EntityFormBlock<T extends FieldValues> = {
  id: string;
  title?: string;
  description?: string;
  fields: EntityFormField<T>[];
};

function messageOf(errors: FieldErrors, name: string, override?: string): string | undefined {
  if (override) return override;
  const node = errors[name] as { message?: string } | undefined;
  return typeof node?.message === "string" ? node.message : undefined;
}

function isDisabled<T extends FieldValues>(
  disabled: EntityFormField<T>["disabled"],
  values: T,
): boolean {
  if (typeof disabled === "function") return disabled(values);
  return Boolean(disabled);
}

export function EntityMetadataForm<T extends FieldValues>({
  blocks,
}: {
  blocks: EntityFormBlock<T>[];
}) {
  const form = useFormContext<T>();
  const values = form.watch();

  return (
    <>
      {blocks.map((block) => {
        const fields = block.fields.filter((field) => field.visible?.(values) !== false);
        if (fields.length === 0 && !block.description) return null;
        return (
          <EntityFormSection key={block.id} title={block.title}>
            {block.description ? (
              <p className="text-sm text-muted-foreground">{block.description}</p>
            ) : null}
            <FieldGroup className={entityFormFieldsClass}>
              {fields.map((field) => (
                <MetadataField key={String(field.name)} field={field} values={values} form={form} />
              ))}
            </FieldGroup>
          </EntityFormSection>
        );
      })}
    </>
  );
}

function MetadataField<T extends FieldValues>({
  field,
  values,
  form,
}: {
  field: EntityFormField<T>;
  values: T;
  form: UseFormReturn<T>;
}) {
  const error = messageOf(form.formState.errors, field.name, field.error);
  const disabled = isDisabled(field.disabled, values);
  const id = `field-${field.name}`;

  let control: ReactNode;
  if (field.kind === "select") {
    control = (
      <PopoverCommandSelect
        value={String(values[field.name] ?? "")}
        disabled={disabled}
        searchable={field.searchable}
        placeholder={field.placeholder}
        aria-label={field.label}
        options={field.options}
        className={selectClass}
        onValueChange={(value) => {
          form.setValue(field.name, value as PathValue<T, FieldPath<T>>, {
            shouldDirty: true,
            shouldValidate: true,
          });
          field.onValueChange?.(value, form);
        }}
      />
    );
  } else {
    control = (
      <Input
        id={id}
        type={field.inputType ?? "text"}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        aria-required={field.required}
        {...form.register(field.name)}
      />
    );
  }

  return (
    <Field
      data-invalid={Boolean(error) || undefined}
      className={cn(field.span === 2 && "sm:col-span-2")}
    >
      <FieldLabel htmlFor={field.kind === "text" ? id : undefined} required={field.required}>
        {field.label}
      </FieldLabel>
      {control}
      {field.description ? <FieldDescription>{field.description}</FieldDescription> : null}
      <FieldError>{error}</FieldError>
    </Field>
  );
}
