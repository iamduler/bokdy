---
name: admin-entity-form
description: >-
  Builds Soft UI admin-web entity create/edit forms and sheets using FormProvider,
  EntityFormFrame, EntityMetadataForm blocks, and EntityFormSection escape hatches.
  Use when adding or refactoring admin forms, form sheets, entity layouts, Branch/Org/Court-style
  Soft panels, or when the user asks to align a form with Branch/Organization patterns.
---

# Soft admin entity form

## When to use

- New create/edit form in `apps/admin-web`
- Refactoring a hand-rolled form to match Branch/Org
- Sheet + form pairs for Soft entities

## Golden references

| Piece | Path |
| --- | --- |
| Form (page/sheet) | `apps/admin-web/components/branches/branch-form.tsx` |
| Org form | `apps/admin-web/components/organizations/organization-form.tsx` |
| Court form | `apps/admin-web/components/courts/court-form.tsx` |
| Frame | `apps/admin-web/components/entity/form-frame.tsx` |
| Metadata blocks | `apps/admin-web/components/entity/metadata-form.tsx` |
| Section card | `apps/admin-web/components/entity/form-section.tsx` |
| Sheet wrapper | `apps/admin-web/components/branches/branch-form-sheet.tsx` |
| Rich content | `apps/admin-web/components/branches/branch-content-fields.tsx`, `courts/court-content-fields.tsx` |

## Workflow

1. **API first** — do not invent routes; follow OpenAPI / `@bokdy/sdk` and frontend playbook.
2. **Validation** — `apps/admin-web/lib/validation/<entity>-form.ts` Zod factory with i18n messages.
3. **Sheet (if needed)** — copy Branch sheet: `SheetContent` + header + `<EntityForm layout="sheet" … />`.
4. **Form composition**
   - `useForm` + `zodResolver` + `FormProvider`
   - `EntityFormFrame` with `actionsPlacement={layout === "sheet" ? "inline" : "shell"}`
   - `EntityMetadataForm` + `EntityFormBlock[]` for text / select / multi-select
   - Custom `*ContentFields` or `EntityFormSection` for WYSIWYG, gallery, maps, crop
5. **Required fields** — `required: true` on blocks (renders `FieldLabel` asterisk). Never put `*` in messages.
6. **Description HTML** — `RichTextEditor` via RHF `Controller`; display with `RichTextView`. No plain Textarea; no `toVietnameseASCII` on HTML.
7. **Detail (if in scope)** — Provider + layout + `EntityDetailPanel`; always show empty profile rows (`frontend-detail-fields-visible`).
8. **i18n** — every user string in `messages/en.json` + `vi.json`.

## Do / Don't

| Do | Don't |
| --- | --- |
| Reuse Frame cancel/submit | Hand-rolled footer with `softDirectoryPrimaryBtn` on entity forms |
| Soft `EntityFormSection` cards | Flat unlabeled `FieldGroup` for multi-field Soft forms |
| Escape hatch sections inside Frame | Parallel form chrome outside Frame |
| Top-level detail URLs | Nest detail under parent org path |

## Related

- Rule: `.cursor/rules/frontend-admin-entity-forms.mdc`
- Rule: `.cursor/rules/frontend-forms-rhf.mdc`
- Playbook: `docs/architecture/frontend-feature-playbook.md`
