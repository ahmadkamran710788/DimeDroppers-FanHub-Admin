"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
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
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { toHtml } from "@/utils/rich-text";

interface RichTextEditorProps {
  label: string;
  name: string;
  // HTML (plain text is turned into paragraphs). Only read when the editor mounts.
  value: string;
  // The new HTML, and its plain text (for validation and the character count).
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  // Shown as a counter; the form validates it.
  maxLength?: number;
  error?: string;
  required?: boolean;
  className?: string;
}

interface Tool {
  label: string;
  icon: LucideIcon;
  run: (editor: Editor) => void;
  active?: (editor: Editor) => boolean;
}

const TOOLS: Tool[][] = [
  [
    { label: "Bold", icon: Bold, run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive("bold") },
    { label: "Italic", icon: Italic, run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive("italic") },
    { label: "Underline", icon: Underline, run: (e) => e.chain().focus().toggleUnderline().run(), active: (e) => e.isActive("underline") },
    { label: "Strikethrough", icon: Strikethrough, run: (e) => e.chain().focus().toggleStrike().run(), active: (e) => e.isActive("strike") },
  ],
  [
    {
      label: "Heading",
      icon: Heading2,
      run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
      active: (e) => e.isActive("heading", { level: 2 }),
    },
    {
      label: "Subheading",
      icon: Heading3,
      run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
      active: (e) => e.isActive("heading", { level: 3 }),
    },
  ],
  [
    { label: "Bulleted list", icon: List, run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive("bulletList") },
    { label: "Numbered list", icon: ListOrdered, run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive("orderedList") },
    { label: "Quote", icon: Quote, run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive("blockquote") },
  ],
  [
    { label: "Undo", icon: Undo2, run: (e) => e.chain().focus().undo().run() },
    { label: "Redo", icon: Redo2, run: (e) => e.chain().focus().redo().run() },
  ],
];

// A rich text field for a white dialog (Tiptap): bold, italic, underline, strikethrough, headings,
// lists and quotes. Gives back HTML; show it with RichText.
export default function RichTextEditor({
  label,
  name,
  value,
  onChange,
  placeholder,
  maxLength,
  error,
  required,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    // Rendered on the client only, so the server HTML and the first client render match.
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Placeholder.configure({ placeholder })],
    content: toHtml(value),
    editorProps: {
      attributes: {
        id: name,
        "aria-labelledby": `${name}-label`,
        class: "rich-text min-h-36 max-h-72 overflow-y-auto px-4 py-3 outline-none text-base text-midnight-navy",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML(), editor.getText()),
  });

  // Re-renders the toolbar as the selection moves (which buttons are on) and the counter as text changes.
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor ? { active: TOOLS.flat().map((t) => t.active?.(editor) ?? false), length: editor.getText().length } : null,
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span id={`${name}-label`} className="text-base font-medium text-midnight-navy">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      <div
        className={cn(
          "rounded-[8px] border-2 bg-white transition-colors focus-within:border-steel-blue",
          error ? "border-error focus-within:border-error" : "border-border-input"
        )}
      >
        <div role="toolbar" aria-label={`${label} formatting`} className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-border-input">
          {TOOLS.map((group, g) => (
            <div key={g} className={cn("flex items-center gap-0.5", g > 0 && "pl-1 ml-1 border-l border-border-input")}>
              {group.map((tool) => {
                const i = TOOLS.flat().indexOf(tool);
                const on = state?.active[i] ?? false;
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.label}
                    type="button"
                    title={tool.label}
                    aria-label={tool.label}
                    aria-pressed={tool.active ? on : undefined}
                    disabled={!editor}
                    // Keep the editor's focus and selection, so a mark turned on applies to what's typed next.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor && tool.run(editor)}
                    className={cn(
                      "size-8 rounded-[6px] flex items-center justify-center text-midnight-navy/70 transition-colors",
                      "hover:bg-midnight-navy/5 hover:text-midnight-navy disabled:opacity-40",
                      on && "bg-midnight-navy/10 text-midnight-navy"
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center justify-between">
        {error ? <p className="text-sm text-error">{error}</p> : <span />}
        {maxLength && (
          <span className="text-sm text-midnight-navy/50">
            {state?.length ?? 0}/{maxLength} Characters
          </span>
        )}
      </div>
    </div>
  );
}
