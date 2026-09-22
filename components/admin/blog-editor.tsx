"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import {
  Bold, Code2, CodeSquare, Heading2, Heading3, Heading4, Image as ImageIcon,
  Italic, Link2, List, ListOrdered, Quote, Redo2, RemoveFormatting, Strikethrough,
  Underline as UnderlineIcon, Undo2, X, type LucideIcon,
} from "lucide-react";
import MediaPicker from "./media-picker";
import { useToast } from "@/components/ui/toast";
import { cn, stripHtml } from "@/lib/utils";

const lowlight = createLowlight(common);

// ---------------------------------------------------------------------------
// Figure extension (official Tiptap figure pattern): image + optional caption.
// ---------------------------------------------------------------------------

const Figcaption = Node.create({
  name: "figcaption",
  content: "inline*",
  marks: "bold italic link",
  parseHTML: () => [{ tag: "figcaption" }],
  renderHTML: ({ HTMLAttributes }) => ["figcaption", mergeAttributes(HTMLAttributes), 0],
});

const Figure = Node.create({
  name: "figure",
  group: "block",
  content: "image figcaption?",
  isolating: true,
  parseHTML: () => [{ tag: "figure" }],
  renderHTML: ({ HTMLAttributes }) => [
    "figure",
    mergeAttributes(HTMLAttributes, { class: "image-with-caption" }),
    0,
  ],
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    figure: {
      setFigure: (options: { src: string; alt?: string; caption?: string }) => ReturnType;
    };
  }
}

const FigureWithCommand = Figure.extend({
  addCommands() {
    return {
      setFigure:
        (options) =>
        ({ commands }) => {
          const children: object[] = [
            { type: "image", attrs: { src: options.src, alt: options.alt ?? "" } },
            { type: "figcaption", content: options.caption ? [{ type: "text", text: options.caption }] : [] },
          ];
          return commands.insertContent({ type: this.name, content: children });
        },
    };
  },
});

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

const CODE_LANGUAGES = [
  "plaintext", "typescript", "javascript", "tsx", "css", "html", "json", "bash",
  "python", "php", "sql", "yaml", "markdown",
];

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  label,
  icon: Icon,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "rounded-lg p-2 transition-colors",
        active
          ? "bg-adm-accent-soft text-accent"
          : "text-adm-muted hover:bg-adm-surface-2 hover:text-adm-text",
        "disabled:opacity-40 disabled:hover:bg-transparent",
      )}
    >
      <Icon size={15} />
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-adm-border" aria-hidden />;
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

export default function BlogEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const toast = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [altDialog, setAltDialog] = useState<{ src: string } | null>(null);
  const [altText, setAltText] = useState("");
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      Underline,
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Placeholder.configure({ placeholder: "Write something great… Use / toolbar for formatting." }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "typescript" }),
      Figcaption,
      FigureWithCommand,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "tiptap-shell", "aria-label": "Post content" },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Initial content arrives via props on first mount; afterwards the editor
  // is the source of truth (onUpdate → onChange), so no re-sync needed.

  const state = useEditorState({
    editor,
    selector: (ctx) =>
      ctx.editor
        ? {
            h2: ctx.editor.isActive("heading", { level: 2 }),
            h3: ctx.editor.isActive("heading", { level: 3 }),
            h4: ctx.editor.isActive("heading", { level: 4 }),
            bold: ctx.editor.isActive("bold"),
            italic: ctx.editor.isActive("italic"),
            underline: ctx.editor.isActive("underline"),
            strike: ctx.editor.isActive("strike"),
            bullet: ctx.editor.isActive("bulletList"),
            ordered: ctx.editor.isActive("orderedList"),
            quote: ctx.editor.isActive("blockquote"),
            codeBlock: ctx.editor.isActive("codeBlock"),
            inlineCode: ctx.editor.isActive("code"),
            link: ctx.editor.isActive("link"),
            codeLang: (ctx.editor.getAttributes("codeBlock").language as string) ?? "typescript",
            words: stripHtml(ctx.editor.getHTML()).split(/\s+/).filter(Boolean).length,
          }
        : null,
  });

  if (!editor || !state) {
    return (
      <div className="animate-skeleton h-[480px] rounded-control border border-adm-border bg-adm-surface-2" />
    );
  }

  const openLinkDialog = () => {
    const prev = (editor.getAttributes("link").href as string) ?? "";
    setLinkUrl(prev);
    setLinkDialog(true);
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    setLinkDialog(false);
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: /^https?:\/\//i.test(url) ? url : `https://${url}` })
      .run();
  };

  const insertImage = (src: string) => {
    setAltDialog({ src });
    setAltText(src.split("/").pop()?.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]/g, " ") ?? "");
  };

  const confirmInsertImage = () => {
    if (!altDialog) return;
    editor
      .chain()
      .focus()
      .setFigure({ src: altDialog.src, alt: altText.trim(), caption: altText.trim() })
      .run();
    setAltDialog(null);
    setAltText("");
    toast.success("Image inserted — edit its caption by clicking below it.");
  };

  return (
    <div className="overflow-hidden rounded-control border border-adm-border bg-adm-surface focus-within:border-accent">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-adm-border bg-adm-surface-2/60 px-2 py-1.5">
        <ToolbarButton label="Undo" icon={Undo2} disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
        <ToolbarButton label="Redo" icon={Redo2} disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
        <Divider />
        <ToolbarButton label="Heading 2" icon={Heading2} active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolbarButton label="Heading 3" icon={Heading3} active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <ToolbarButton label="Heading 4" icon={Heading4} active={state.h4} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} />
        <Divider />
        <ToolbarButton label="Bold" icon={Bold} active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolbarButton label="Italic" icon={Italic} active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolbarButton label="Underline" icon={UnderlineIcon} active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <ToolbarButton label="Strikethrough" icon={Strikethrough} active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <ToolbarButton label="Inline code" icon={Code2} active={state.inlineCode} onClick={() => editor.chain().focus().toggleCode().run()} />
        <Divider />
        <ToolbarButton label="Bullet list" icon={List} active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarButton label="Ordered list" icon={ListOrdered} active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolbarButton label="Blockquote" icon={Quote} active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <Divider />
        <ToolbarButton label="Code block" icon={CodeSquare} active={state.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
        {state.codeBlock && (
          <select
            aria-label="Code block language"
            value={state.codeLang}
            onChange={(e) =>
              editor.chain().focus().updateAttributes("codeBlock", { language: e.target.value }).run()
            }
            className="select-chevron h-8 appearance-none rounded-lg border border-adm-border bg-adm-surface-2 pl-2.5 pr-7 text-xs font-medium text-adm-text outline-none"
          >
            {CODE_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        )}
        <ToolbarButton label="Insert image" icon={ImageIcon} onClick={() => setPickerOpen(true)} />
        <ToolbarButton label={state.link ? "Edit link" : "Add link"} icon={Link2} active={state.link} onClick={openLinkDialog} />
        <ToolbarButton label="Clear formatting" icon={RemoveFormatting} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} />

        <span className="ml-auto hidden items-center gap-2 pl-2 text-[0.7rem] font-medium text-adm-faint sm:flex">
          {state.words.toLocaleString()} words · ~{Math.max(1, Math.round(state.words / 200))} min read
        </span>
      </div>

      <EditorContent editor={editor} />

      {/* Image picker → alt/caption dialog */}
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={insertImage} />
      {altDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-label="Image description">
          <div className="w-full max-w-sm animate-modal-in rounded-card border border-adm-border bg-adm-surface p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-adm-text">Describe this image</p>
              <button aria-label="Close" onClick={() => setAltDialog(null)} className="rounded-lg p-1 text-adm-faint hover:bg-adm-surface-2">
                <X size={15} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- preview */}
            <img src={altDialog.src} alt="" className="mt-3 max-h-40 w-full rounded-lg border border-adm-border object-cover" />
            <label className="mt-3 block text-xs font-semibold text-adm-muted">
              Alt text & caption
              <input
                autoFocus
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmInsertImage()}
                placeholder="What does the image show?"
                className="mt-1.5 h-10 w-full rounded-control border border-adm-border bg-adm-surface-2 px-3 text-sm text-adm-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/35"
              />
            </label>
            <button
              onClick={confirmInsertImage}
              className="mt-4 h-10 w-full rounded-control bg-accent text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
            >
              Insert image
            </button>
          </div>
        </div>
      )}

      {/* Link dialog */}
      {linkDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-label="Insert link">
          <div className="w-full max-w-sm animate-modal-in rounded-card border border-adm-border bg-adm-surface p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-adm-text">Link URL</p>
              <button aria-label="Close" onClick={() => setLinkDialog(false)} className="rounded-lg p-1 text-adm-faint hover:bg-adm-surface-2">
                <X size={15} />
              </button>
            </div>
            <input
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyLink();
                if (e.key === "Escape") setLinkDialog(false);
              }}
              placeholder="https://example.com — empty removes the link"
              className="mt-3 h-10 w-full rounded-control border border-adm-border bg-adm-surface-2 px-3 text-sm text-adm-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/35"
            />
            <button
              onClick={applyLink}
              className="mt-4 h-10 w-full rounded-control bg-accent text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
