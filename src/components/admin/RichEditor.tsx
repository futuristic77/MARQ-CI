import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { UploadButton } from "./kit";

/** Rich text editor for articles (headings, emphasis, lists, quotes, links, images). Emits HTML. */
export function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), Image],
    content: value,
    immediatelyRender: false,
    editorProps: { attributes: { class: "article-body min-h-[320px] px-4 py-3 outline-none", "aria-label": "Contenu de l’article" } },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });
  if (!editor) return <div className="min-h-[360px] border border-dashed border-ink bg-paper" />;

  const b = (label: string, on: boolean, run: () => void) => (
    <button type="button" onClick={run} aria-pressed={on} className={`cap border border-dashed border-ink px-2 py-1 ${on ? "bg-ink text-paper" : "bg-paper"}`}>
      {label}
    </button>
  );
  const c = () => editor.chain().focus();
  return (
    <div className="border border-dashed border-ink bg-paper">
      <div className="flex flex-wrap items-center gap-1 border-b border-dashed border-ink p-2">
        {b("Paragraphe", editor.isActive("paragraph"), () => c().setParagraph().run())}
        {b("Titre", editor.isActive("heading", { level: 2 }), () => c().toggleHeading({ level: 2 }).run())}
        {b("Sous-titre", editor.isActive("heading", { level: 3 }), () => c().toggleHeading({ level: 3 }).run())}
        {b("Gras", editor.isActive("bold"), () => c().toggleBold().run())}
        {b("Italique", editor.isActive("italic"), () => c().toggleItalic().run())}
        {b("Liste", editor.isActive("bulletList"), () => c().toggleBulletList().run())}
        {b("Liste numérotée", editor.isActive("orderedList"), () => c().toggleOrderedList().run())}
        {b("Citation", editor.isActive("blockquote"), () => c().toggleBlockquote().run())}
        {b("Lien", editor.isActive("link"), () => {
          if (editor.isActive("link")) return void c().unsetLink().run();
          const url = window.prompt("Adresse du lien (https://…)");
          if (url && /^(https?:\/\/|\/)/.test(url)) c().setLink({ href: url }).run();
        })}
        <span className="ml-auto">
          <UploadButton kind="article" label="Insérer une image" onUploaded={(m) => c().setImage({ src: m.url, alt: m.filename }).run()} />
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
