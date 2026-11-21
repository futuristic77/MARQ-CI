import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { btnInk, Empty, Field, GalleryField, ImageField, inputCls, PageHead, StatusBadge } from "@/components/admin/kit";
import { ListRow, SaveBar } from "@/components/admin/SaveBar";
import { must, useBrands, useCollections, useProducts, useRefresh } from "@/lib/admin/data";
import { dbError, slugify } from "@/lib/admin/media";

export const Route = createFileRoute("/admin/collections")({ component: CollectionsAdmin });

type Form = TablesInsert<"collections">;

function CollectionsAdmin() {
  const { data = [], isLoading } = useCollections();
  const { data: brands = [] } = useBrands();
  const { data: products = [] } = useProducts();
  const [edit, setEdit] = useState<Form | null>(null);
  const brandName = (id: string) => brands.find((b) => b.id === id)?.name ?? "—";
  if (edit) return <CollectionForm initial={edit} productCount={products.filter((p) => p.collection_id === edit.id).length} onClose={() => setEdit(null)} />;
  return (
    <>
      <PageHead
        cap="Contenus"
        title="Collections"
        actions={
          <button type="button" className={btnInk} disabled={!brands.length} onClick={() => setEdit({ name: "", slug: "", brand_id: brands[0]!.id, description: "", cover_url: null, gallery: [], season: "", is_new: false, sort_order: 0, status: "draft" })}>
            Ajouter une collection
          </button>
        }
      />
      {!brands.length && <Empty>Créez d’abord une marque : chaque collection appartient à une marque.</Empty>}
      {isLoading ? <p className="cap text-mute">Chargement…</p> : data.length === 0 ? brands.length > 0 && <Empty>Aucune collection pour l’instant.</Empty> : (
        <ul>{data.map((c) => <ListRow key={c.id} thumb={c.cover_url} title={c.name} meta={`${brandName(c.brand_id)} · ${c.season || "Sans saison"} · ${products.filter((p) => p.collection_id === c.id).length} vêtements`} right={<StatusBadge status={c.status} />} onClick={() => setEdit(c)} />)}</ul>
      )}
    </>
  );
}

function CollectionForm({ initial, productCount, onClose }: { initial: Form; productCount: number; onClose: () => void }) {
  const { data: brands = [] } = useBrands();
  const [f, setF] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [busy, setBusy] = useState(false);
  const refresh = useRefresh();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  async function save(status: "draft" | "published") {
    const row = { ...f, status, slug: f.slug || slugify(f.name) };
    if (!row.name.trim()) { toast.error("Le nom est obligatoire."); return; }
    if (status === "published" && !row.cover_url) { toast.error("Ajoutez une image de couverture avant de publier."); return; }
    setBusy(true);
    try {
      must(row.id ? await supabase.from("collections").update(row).eq("id", row.id).select().single() : await supabase.from("collections").insert(row).select().single());
      await refresh();
      toast.success(status === "published" ? "Collection publiée." : "Brouillon enregistré.");
      onClose();
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }
  async function remove() {
    if (productCount) { toast.error("Cette collection contient des vêtements : supprimez-les ou déplacez-les d’abord."); return; }
    setBusy(true);
    try {
      must(await supabase.from("collections").delete().eq("id", f.id!).select());
      await refresh();
      toast.success("Collection supprimée.");
      onClose();
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }

  return (
    <>
      <PageHead cap="Collections" title={f.id ? f.name || "Collection" : "Nouvelle collection"} actions={f.status && <StatusBadge status={f.status} />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Field label="Nom" required><input className={inputCls} value={f.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></Field>
          <Field label="Lien (slug)" hint={`Adresse publique : /collections/${f.slug || "…"}`}><input className={inputCls} value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></Field>
          <Field label="Marque" required hint={productCount ? "La marque ne peut pas changer tant que la collection contient des vêtements." : undefined}>
            <select className={inputCls} value={f.brand_id} disabled={productCount > 0} onChange={(e) => set("brand_id", e.target.value)}>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}{b.status === "draft" ? " (brouillon)" : ""}</option>)}
            </select>
          </Field>
          <Field label="Saison / année"><input className={inputCls} placeholder="Ex. Printemps-été 2027" value={f.season ?? ""} onChange={(e) => set("season", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_new ?? false} onChange={(e) => set("is_new", e.target.checked)} /> Marquer comme nouvelle collection</label>
          <Field label="Description"><textarea className={inputCls} rows={5} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Ordre d’affichage"><input className={inputCls} type="number" value={f.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} /></Field>
        </div>
        <div className="flex flex-col gap-6">
          <ImageField label="Image de couverture" kind="collection" value={f.cover_url ?? null} onChange={(u) => set("cover_url", u)} />
          <GalleryField label="Galerie" kind="collection" value={f.gallery ?? []} onChange={(v) => set("gallery", v)} />
        </div>
      </div>
      <SaveBar busy={busy} onDraft={() => void save("draft")} onPublish={() => void save("published")} onCancel={onClose} onDelete={f.id ? () => void remove() : undefined} />
    </>
  );
}
