"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";
import { Button } from "./button";
import { richTextProseClass } from "./rich-text-view";

export type RichTextEditorLabels = {
  bold: string;
  italic: string;
  strike: string;
  heading2: string;
  heading3: string;
  bulletList: string;
  orderedList: string;
  blockquote: string;
  undo: string;
  redo: string;
};

const defaultLabels: RichTextEditorLabels = {
  bold: "Bold",
  italic: "Italic",
  strike: "Strikethrough",
  heading2: "Heading 2",
  heading3: "Heading 3",
  bulletList: "Bullet list",
  orderedList: "Numbered list",
  blockquote: "Quote",
  undo: "Undo",
  redo: "Redo",
};

export type RichTextEditorProps = {
  /** HTML string. Empty string means an empty document. */
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Localized toolbar `aria-label`s / tooltips (defaults to English). */
  labels?: Partial<RichTextEditorLabels>;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
};

function serialize(editor: Editor): string {
  return editor.isEmpty ? "" : editor.getHTML();
}

type ToolbarAction = {
  key: string;
  label: string;
  icon: React.ReactNode;
  run: (editor: Editor) => void;
  active?: (editor: Editor) => boolean;
  disabled?: (editor: Editor) => boolean;
};

function buildActions(labels: RichTextEditorLabels): ToolbarAction[] {
  return [
    {
      key: "bold",
      label: labels.bold,
      icon: <Bold />,
      run: (e) => e.chain().focus().toggleBold().run(),
      active: (e) => e.isActive("bold"),
    },
    {
      key: "italic",
      label: labels.italic,
      icon: <Italic />,
      run: (e) => e.chain().focus().toggleItalic().run(),
      active: (e) => e.isActive("italic"),
    },
    {
      key: "strike",
      label: labels.strike,
      icon: <Strikethrough />,
      run: (e) => e.chain().focus().toggleStrike().run(),
      active: (e) => e.isActive("strike"),
    },
    {
      key: "h2",
      label: labels.heading2,
      icon: <Heading2 />,
      run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
      active: (e) => e.isActive("heading", { level: 2 }),
    },
    {
      key: "h3",
      label: labels.heading3,
      icon: <Heading3 />,
      run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
      active: (e) => e.isActive("heading", { level: 3 }),
    },
    {
      key: "bullet",
      label: labels.bulletList,
      icon: <List />,
      run: (e) => e.chain().focus().toggleBulletList().run(),
      active: (e) => e.isActive("bulletList"),
    },
    {
      key: "ordered",
      label: labels.orderedList,
      icon: <ListOrdered />,
      run: (e) => e.chain().focus().toggleOrderedList().run(),
      active: (e) => e.isActive("orderedList"),
    },
    {
      key: "quote",
      label: labels.blockquote,
      icon: <Quote />,
      run: (e) => e.chain().focus().toggleBlockquote().run(),
      active: (e) => e.isActive("blockquote"),
    },
    {
      key: "undo",
      label: labels.undo,
      icon: <Undo2 />,
      run: (e) => e.chain().focus().undo().run(),
      disabled: (e) => !e.can().undo(),
    },
    {
      key: "redo",
      label: labels.redo,
      icon: <Redo2 />,
      run: (e) => e.chain().focus().redo().run(),
      disabled: (e) => !e.can().redo(),
    },
  ];
}

function Toolbar({
  editor,
  disabled,
  labels,
}: {
  editor: Editor;
  disabled?: boolean;
  labels: RichTextEditorLabels;
}) {
  const actions = React.useMemo(() => buildActions(labels), [labels]);

  // The editor does not re-render React on every transaction; subscribe to the
  // flags the toolbar needs (active marks / undo availability).
  const flags = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      actions.map((action) => ({
        active: current ? (action.active?.(current) ?? false) : false,
        disabled: current ? (action.disabled?.(current) ?? false) : false,
      })),
  });

  return (
    <div
      role="toolbar"
      className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 p-1"
    >
      {actions.map((action, index) => {
        const active = flags[index]?.active ?? false;
        return (
          <Button
            key={action.key}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={action.label}
            title={action.label}
            aria-pressed={action.active ? active : undefined}
            disabled={disabled || flags[index]?.disabled}
            className={cn(active && "bg-sky-500/15 text-sky-700 dark:text-sky-300")}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => action.run(editor)}
          >
            {action.icon}
          </Button>
        );
      })}
    </div>
  );
}

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  id,
  placeholder,
  disabled,
  className,
  labels,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: RichTextEditorProps) {
  const mergedLabels = React.useMemo(
    () => ({ ...defaultLabels, ...labels }),
    [labels],
  );
  const onChangeRef = React.useRef(onChange);
  const onBlurRef = React.useRef(onBlur);
  React.useEffect(() => {
    onChangeRef.current = onChange;
    onBlurRef.current = onBlur;
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Server allowlist is limited to basic formatting; keep the UI aligned.
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: false,
        underline: false,
      }),
    ],
    content: value,
    editable: !disabled,
    // Avoid SSR hydration mismatch in Next.js.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        role: "textbox",
        "aria-multiline": "true",
        class: cn(
          "min-h-32 px-3 py-2 outline-none",
          richTextProseClass,
        ),
      },
    },
    onUpdate: ({ editor: current }) => {
      onChangeRef.current(serialize(current));
    },
    onBlur: () => onBlurRef.current?.(),
  });

  // Sync external value changes (form reset / locale switch) without clobbering typing.
  React.useEffect(() => {
    if (!editor) return;
    if (serialize(editor) === value) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  React.useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const isEmpty = useEditorState({
    editor,
    selector: ({ editor: current }) => current?.isEmpty ?? true,
  });

  return (
    <div
      data-slot="rich-text-editor"
      aria-invalid={ariaInvalid || undefined}
      className={cn(
        "relative w-full min-w-0 overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-shell-accent focus-within:ring-[3px] focus-within:ring-shell-accent/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {editor ? (
        <Toolbar editor={editor} disabled={disabled} labels={mergedLabels} />
      ) : (
        <div className="h-[41px] border-b border-input bg-muted/30" />
      )}
      <div className="relative">
        {editor && isEmpty && placeholder ? (
          <p className="pointer-events-none absolute top-2 left-3 text-sm text-muted-foreground">
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
