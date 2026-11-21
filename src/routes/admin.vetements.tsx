import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { btnInk, Empty, Field, GalleryField, ImageField, inputCls, PageHead, StatusBadge, TagInput } from "@/components/admin/kit";
import { ListRow, SaveBar } from "@/components/admin/SaveBar";
import { CATEGORY_OPTIONS, must, useBrands, useCollections, useProducts, useRefresh } from "@/lib/admin/data";
import { dbError, slugify } from "@/lib/admin/media";
import { money } from "@/data/catalog";

export const Route = createFileRoute("/admin/vetements")({ component: ProductsAdmin });

type Form = TablesInsert<"products">;

function ProductsAdmin() {
  const { data = [], isLoading } = useProducts();
  const { data: brands = [] } = useBrands();
  const { data: cols = [] } = useCollections();
  const [edit, setEdit] = useState<Form | null>(null);
  const [filter, setFilter] = useState("all");
  if (edit) return <ProductForm initial={edit} onClose={() => setEdit(null)} />;
  const firstCol = cols[0];
  const shown = filter === "all" ? data : data.filter((p) => p.brand_id === filter);
  return (
    <>
      <PageHead
        cap="Contenus"
        title="Vêtements"
        actions={
          <button type="button" className={btnInk} disabled={!firstCol} onClick={() => firstCol && setEdit({ name: "", slug: "", brand_id: firstCol.brand_id, collection_id: firstCol.id, category: "tops", price: 0, sizes: [], colors: [], material: "", reference: "", main_image: null, images: [], description: "", sort_order: 0, status: "draft" })}>
            Ajouter un vêtement
          </button>
        }
      />
      {!firstCol && <Empty>Créez d’abord une marque puis une collection : chaque vêtement appartient à sa marque et à sa collection.</Empty>}
      {data.length > 0 && (
        <select className={`${inputCls} mb-4 max-w-xs`} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filtrer par marque">
          <option value="all">Toutes les marques</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      {isLoading ? <p className="cap text-mute">Chargement…</p> : shown.length === 0 ? firstCol && <Empty>Aucun vêtement pour l’instant.</Empty> : (
        <ul>
          {shown.map((p) => (
            <ListRow key={p.id} thumb={p.main_image ?? p.images[0]} title={p.name} meta={`${brands.find((b) => b.id === p.brand_id)?.name ?? "—"} · ${cols.find((c) => c.id === p.collection_id)?.name ?? "—"} · ${money(p.price)}`} right={<StatusBadge status={p.status} />} onClick={() => setEdit(p)} />
          ))}
        </ul>
      )}
    </>
  );
}

function ProductForm({ initial, onClose }: { initial: Form; onClose: () => void }) {
  const { data: brands = [] } = useBrands();
  const { data: cols = [] } = useCollections();
  const [f, setF] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [busy, setBusy] = useState(false);
  const refresh = useRefresh();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const brandCols = cols.filter((c) => c.brand_id === f.brand_id);

  async function save(status: "draft" | "published") {
    const row = { ...f, status, slug: f.slug || slugify(f.name) };
    if (!row.name.trim()) { toast.error("Le nom est obligatoire."); return; }
    if (!brandCols.some((c) => c.id === row.collection_id)) { toast.error("Choisissez une collection de cette marque."); return; }
    if (status === "published" && !row.main_image) { toast.error("Ajoutez une image principale avant de publier."); return; }
    if (status === "published" && !(row.price && row.price > 0)) { toast.error("Indiquez un prix avant de publier."); return; }
    setBusy(true);
    try {
      must(row.id ? await supabase.from("products").update(row).eq("id", row.id).select().single() : await supabase.from("products").insert(row).select().single());
      await refresh();
      toast.success(status === "published" ? "Vêtement publié." : "Brouillon enregistré.");
      onClose();
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }
  async function remove() {
    setBusy(true);
    try {
      must(await supabase.from("products").delete().eq("id", f.id!).select());
      await refresh();
      toast.success("Vêtement supprimé.");
      onClose();
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }

  return (
    <>
      <PageHead cap="Vêtements" title={f.id ? f.name || "Vêtement" : "Nouveau vêtement"} actions={f.status && <StatusBadge status={f.status} />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Field label="Nom" required><input className={inputCls} value={f.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></Field>
          <Field label="Lien (slug)" hint={`Adresse publique : /products/${f.slug || "…"}`}><input className={inputCls} value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Marque" required>
              <select className={inputCls} value={f.brand_id} onChange={(e) => { const b = e.target.value; setF((p) => ({ ...p, brand_id: b, collection_id: cols.find((c) => c.brand_id === b)?.id ?? "" })); }}>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Collection" required hint={brandCols.length ? undefined : "Cette marque n’a encore aucune collection."}>
              <select className={inputCls} value={f.collection_id} onChange={(e) => set("collection_id", e.target.value)}>
                {brandCols.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Catégorie" required>
              <select className={inputCls} value={f.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Prix (FCFA)" required><input className={inputCls} type="number" min={0} step={500} value={f.price ?? 0} onChange={(e) => set("price", Math.max(0, Math.round(Number(e.target.value))))} /></Field>
          </div>
          <TagInput label="Tailles" value={f.sizes ?? []} onChange={(v) => set("sizes", v)} placeholder="S, M, L, XL" hint="Séparées par des virgules. Vide = taille unique." />
          <TagInput label="Couleurs" value={f.colors ?? []} onChange={(v) => set("colors", v)} placeholder="Noir, Indigo" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Matière"><input className={inputCls} value={f.material ?? ""} onChange={(e) => set("material", e.target.value)} /></Field>
            <Field label="Référence"><input className={inputCls} value={f.reference ?? ""} onChange={(e) => set("reference", e.target.value)} /></Field>
          </div>
          <Field label="Description"><textarea className={inputCls} rows={5} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="Ordre d’affichage"><input className={inputCls} type="number" value={f.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} /></Field>
        </div>
        <div className="flex flex-col gap-6">
          <ImageField label="Image principale" kind="product" value={f.main_image ?? null} onChange={(u) => set("main_image", u)} required />
          <GalleryField label="Images supplémentaires" kind="product" value={f.images ?? []} onChange={(v) => set("images", v)} />
        </div>
      </div>
      <SaveBar busy={busy} onDraft={() => void save("draft")} onPublish={() => void save("published")} onCancel={onClose} onDelete={f.id ? () => void remove() : undefined} deleteText="Le vêtement sera aussi retiré des looks qui l’utilisent." />
    </>
  );
}
