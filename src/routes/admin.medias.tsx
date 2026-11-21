import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { btn, Confirm, Empty, inputCls, PageHead, UploadButton, useMediaLibrary } from "@/components/admin/kit";
import { useRefresh } from "@/lib/admin/data";
import { deleteMedia, formatBytes, MEDIA_KIND_LABEL, MEDIA_KINDS, type MediaKind } from "@/lib/admin/media";

export const Route = createFileRoute("/admin/medias")({ component: MediaAdmin });

function MediaAdmin() {
  const { data = [], isLoading } = useMediaLibrary(true);
  const [kind, setKind] = useState<MediaKind>("other");
  const [filter, setFilter] = useState("all");
  const refresh = useRefresh();
  const shown = filter === "all" ? data : data.filter((m) => m.kind === filter);

  return (
    <>
      <PageHead
        cap="Fichiers"
        title="Bibliothèque média"
        actions={
          <div className="flex flex-wrap items-start gap-2">
            <select className={`${inputCls} w-auto`} value={kind} onChange={(e) => setKind(e.target.value as MediaKind)} aria-label="Type des images importées">
              {MEDIA_KINDS.map((k) => <option key={k} value={k}>{MEDIA_KIND_LABEL[k]}</option>)}
            </select>
            <UploadButton kind={kind} multiple label="Importer des images" onUploaded={() => void refresh()} />
          </div>
        }
      />
      <p className="mb-4 text-sm text-mute">JPG, JPEG, PNG ou WebP · 10 Mo maximum par image · fichiers d’origine conservés sans recompression. Une image utilisée par un contenu ne peut pas être supprimée.</p>
      <select className={`${inputCls} mb-6 max-w-xs`} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrer">
        <option value="all">Toutes les images ({data.length})</option>
        {MEDIA_KINDS.map((k) => <option key={k} value={k}>{MEDIA_KIND_LABEL[k]} ({data.filter((m) => m.kind === k).length})</option>)}
      </select>
      {isLoading ? <p className="cap text-mute">Chargement…</p> : shown.length === 0 ? <Empty>Aucune image.</Empty> : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {shown.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 border border-dashed border-ink bg-paper p-2">
              <a href={m.url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden bg-studio">
                <img src={m.url} alt={m.filename} loading="lazy" className="h-full w-full object-contain" />
              </a>
              <span className="truncate text-xs" title={m.filename}>{m.filename}</span>
              <span className="cap text-mute">{MEDIA_KIND_LABEL[m.kind]} · {m.width ? `${m.width}×${m.height}` : "—"} · {formatBytes(m.size_bytes)}</span>
              <div className="flex gap-2">
                <button type="button" className={`${btn} flex-1`} onClick={() => void navigator.clipboard.writeText(new URL(m.url, window.location.origin).href).then(() => toast.success("Lien copié."))}>Copier le lien</button>
                <Confirm
                  trigger={<button type="button" className={btn}>Supprimer</button>}
                  title="Supprimer cette image ?"
                  description="L’image sera supprimée définitivement si aucun contenu ne l’utilise."
                  onConfirm={async () => {
                    try {
                      await deleteMedia(m);
                      await refresh();
                      toast.success("Image supprimée.");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Suppression impossible.");
                    }
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
