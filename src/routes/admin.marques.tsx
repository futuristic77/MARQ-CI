import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { btnInk, Empty, Field, ImageField, inputCls, PageHead, StatusBadge } from "@/components/admin/kit";
import { ListRow, SaveBar } from "@/components/admin/SaveBar";
import { useBrands, useCollections, useRefresh, must } from "@/lib/admin/data";
import { dbError, slugify } from "@/lib/admin/media";

export const Route = createFileRoute("/admin/marques")({ component: BrandsAdmin });

type Row = Tables<"brands">;
const blank = (): TablesInsert<"brands"> => ({ name: "", slug: "", logo_url: null, cover_url: null, city: "", founded: null, tagline: "", description: "", editorial: "", extra_info: "", sort_order: 0, status: "draft" });

function BrandsAdmin() {
  const { data = [], isLoading } = useBrands();
  const { data: cols = [] } = useCollections();
  const [edit, setEdit] = useState<TablesInsert<"brands"> | null>(null);
  if (edit) return <BrandForm initial={edit} collectionCount={cols.filter((c) => c.brand_id === edit.id).length} onClose={() => setEdit(null)} />;
  return (
    <>
      <PageHead cap="Contenus" title="Marques" actions={<button type="button" className={btnInk} onClick={() => setEdit(blank())}>Ajouter une marque</button>} />
      {isLoading ? <p className="cap text-mute">Chargement…</p> : data.length === 0 ? <Empty>Aucune marque pour l’instant.</Empty> : (
        <ul>{data.map((b: Row) => <ListRow key={b.id} thumb={b.logo_url ?? b.cover_url} title={b.name} meta={[b.city, `${cols.filter((c) => c.brand_id === b.id).length} collections`].filter(Boolean).join(" · ")} right={<StatusBadge status={b.status} />} onClick={() => setEdit(b)} />)}</ul>
      )}
    </>
  );
}

function BrandForm({ initial, collectionCount, onClose }: { initial: TablesInsert<"brands">; collectionCount: number; onClose: () => void }) {
  const [f, setF] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [busy, setBusy] = useState(false);
  const refresh = useRefresh();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function save(status?: "draft" | "published") {
    const row = { ...f, status: status ?? f.status ?? "draft", slug: f.slug || slugify(f.name) };
    if (!row.name.trim()) { toast.error("Le nom est obligatoire."); return; }
    if (row.status === "published" && !row.cover_url && !row.logo_url) { toast.error("Ajoutez un logo ou une image de couverture avant de publier."); return; }
    setBusy(true);
    try {
      must(row.id ? await supabase.from("brands").update(row).eq("id", row.id).select().single() : await supabase.from("brands").insert(row).select().single());
      await refresh();
      toast.success(row.status === "published" ? "Marque publiée." : "Brouillon enregistré.");
      onClose();
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }
  async function remove() {
    if (collectionCount) { toast.error("Cette marque a encore des collections : supprimez-les d’abord."); return; }
    setBusy(true);
    try {
      must(await supabase.from("brands").delete().eq("id", f.id!).select());
      await refresh();
      toast.success("Marque supprimée.");
      onClose();
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }

  return (
    <>
      <PageHead cap="Marques" title={f.id ? f.name || "Marque" : "Nouvelle marque"} actions={f.status && <StatusBadge status={f.status} />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Field label="Nom" required><input className={inputCls} value={f.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></Field>
          <Field label="Lien (slug)" hint={`Adresse publique : /brands/${f.slug || "…"}`}><input className={inputCls} value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ville"><input className={inputCls} value={f.city ?? ""} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="Année de création"><input className={inputCls} type="number" min={1900} max={2100} value={f.founded ?? ""} onChange={(e) => set("founded", e.target.value ? Number(e.target.value) : null)} /></Field>
          </div>
          <Field label="Accroche"><input className={inputCls} value={f.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} /></Field>
          <Field label="Description"><textarea className={inputCls} rows={4} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Texte éditorial (campagne)"><textarea className={inputCls} rows={4} value={f.editorial ?? ""} onChange={(e) => set("editorial", e.target.value)} /></Field>
          <Field label="Informations complémentaires"><textarea className={inputCls} rows={3} value={f.extra_info ?? ""} onChange={(e) => set("extra_info", e.target.value)} /></Field>
          <Field label="Ordre d’affichage" hint="Plus petit = affiché en premier."><input className={inputCls} type="number" value={f.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} /></Field>
        </div>
        <div className="flex flex-col gap-6">
          <ImageField label="Logo" kind="brand" value={f.logo_url ?? null} onChange={(u) => set("logo_url", u)} />
          <ImageField label="Image de couverture" kind="brand" value={f.cover_url ?? null} onChange={(u) => set("cover_url", u)} hint="Utilisée comme visuel de campagne." />
        </div>
      </div>
      <SaveBar busy={busy} onDraft={() => void save("draft")} onPublish={() => void save("published")} onCancel={onClose} onDelete={f.id ? () => void remove() : undefined} deleteText="La marque sera supprimée du site." />
    </>
  );
}
