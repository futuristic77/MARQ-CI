import type { ReactNode } from "react";
import { btn, btnInk, Confirm } from "./kit";

/** Bottom action bar of every admin editor. */
export function SaveBar({
  busy,
  onDraft,
  onPublish,
  onSave,
  onCancel,
  onDelete,
  deleteText,
  extra,
}: {
  busy: boolean;
  onDraft?: () => void;
  onPublish?: () => void;
  onSave?: () => void;
  onCancel: () => void;
  onDelete?: (() => void) | undefined;
  deleteText?: string | undefined;
  extra?: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center gap-2 border-t border-dashed border-ink bg-studio/95 px-4 py-4 backdrop-blur-sm md:-mx-10 md:px-10">
      {onSave && <button type="button" className={btnInk} disabled={busy} onClick={onSave}>Enregistrer</button>}
      {onDraft && <button type="button" className={btn} disabled={busy} onClick={onDraft}>Enregistrer le brouillon</button>}
      {onPublish && <button type="button" className={btnInk} disabled={busy} onClick={onPublish}>Publier</button>}
      {extra}
      <button type="button" className={btn} disabled={busy} onClick={onCancel}>Annuler</button>
      {onDelete && (
        <span className="ml-auto">
          <Confirm
            trigger={<button type="button" className={btn} disabled={busy}>Supprimer</button>}
            title="Supprimer définitivement ?"
            description={deleteText ?? "Cette action est irréversible."}
            onConfirm={onDelete}
          />
        </span>
      )}
    </div>
  );
}

/** Row in an admin list. */
export function ListRow({ thumb, title, meta, right, onClick }: { thumb?: string | null | undefined; title: string; meta?: ReactNode; right?: ReactNode; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-4 border-b border-dashed border-ink px-2 py-3 text-left hover:bg-paper">
        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden border border-dashed border-ink bg-studio">
          {thumb ? <img src={thumb} alt="" className="h-full w-full object-contain" loading="lazy" /> : <span className="cap text-mute">—</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{title}</span>
          {meta && <span className="cap block truncate text-mute">{meta}</span>}
        </span>
        {right}
      </button>
    </li>
  );
}
