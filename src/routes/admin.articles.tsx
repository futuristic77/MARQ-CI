import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { btn, btnInk, CheckList, Empty, Field, GalleryField, ImageField, inputCls, PageHead, StatusBadge } from "@/components/admin/kit";
import { ListRow, SaveBar } from "@/components/admin/SaveBar";
import { RichEditor } from "@/components/admin/RichEditor";
import { ArticleBody, formatDate } from "@/components/site/ArticleBody";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { must, useArticles, useBrands, useCollections, useProducts, useRefresh } from "@/lib/admin/data";
import { dbError, slugify } from "@/lib/admin/media";

export const Route = createFileRoute("/admin/articles")({ component: ArticlesAdmin });

type Form = TablesInsert<"articles">;

function ArticlesAdmin() {
  const { data = [], isLoading } = useArticles();
  const [edit, setEdit] = useState<Form | null>(null);
  if (edit) return <ArticleForm initial={edit} onClose={() => setEdit(null)} />;
  return (
    <>
      <PageHead cap="Éditorial" title="Articles" actions={<button type="button" className={btnInk} onClick={() => setEdit({ title: "", slug: "", subtitle: "", cover_url: null, gallery: [], content: "", author: "", category: "", published_at: null, status: "draft", brand_ids: [], collection_ids: [], product_ids: [] })}>Écrire un article</button>} />
      {isLoading ? <p className="cap text-mute">Chargement…</p> : data.length === 0 ? <Empty>Aucun article pour l’instant.</Empty> : (
        <ul>{data.map((a) => <ListRow key={a.id} thumb={a.cover_url} title={a.title} meta={[a.category, a.author, a.published_at ? formatDate(a.published_at) : "Non publié"].filter(Boolean).join(" · ")} right={<StatusBadge status={a.status} />} onClick={() => setEdit(a)} />)}</ul>
      )}
    </>
  );
}

function ArticleForm({ initial, onClose }: { initial: Form; onClose: () => void }) {
  const { data: brands = [] } = useBrands();
  const { data: cols = [] } = useCollections();
  const { data: products = [] } = useProducts();
  const [f, setF] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const refresh = useRefresh();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const clean = (html: string) => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

  async function save(status: "draft" | "published") {
    const row: Form = {
      ...f,
      status,
      slug: f.slug || slugify(f.title),
      content: clean(f.content ?? ""),
      published_at: status === "published" ? (f.published_at ?? new Date().toISOString()) : f.published_at ?? null,
    };
    if (!row.title.trim()) { toast.error("Le titre est obligatoire."); return; }
    if (status === "published" && !row.cover_url) { toast.error("Ajoutez une image de couverture avant de publier."); return; }
    if (status === "published" && !(row.content ?? "").replace(/<[^>]+>/g, "").trim()) { toast.error("L’article est vide."); return; }
    setBusy(true);
    try {
      must(row.id ? await supabase.from("articles").update(row).eq("id", row.id).select().single() : await supabase.from("articles").insert(row).select().single());
      await refresh();
      toast.success(status === "published" ? "Article publié." : "Brouillon enregistré.");
      onClose();
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }
  async function remove() {
    setBusy(true);
    try {
      must(await supabase.from("articles").delete().eq("id", f.id!).select());
      await refresh();
      toast.success("Article supprimé.");
      onClose();
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }

  return (
    <>
      <PageHead cap="Articles" title={f.id ? f.title || "Article" : "Nouvel article"} actions={f.status && <StatusBadge status={f.status} />} />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Field label="Titre" required><input className={inputCls} value={f.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></Field>
          <Field label="Sous-titre"><input className={inputCls} value={f.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} /></Field>
          <Field label="Lien (slug)" hint={`Adresse publique : /articles/${f.slug || "…"}`}><input className={inputCls} value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></Field>
          <div className="flex flex-col gap-1.5">
            <span className="cap">Contenu</span>
            <RichEditor value={f.content ?? ""} onChange={(html) => set("content", html)} />
          </div>
          <GalleryField label="Galerie" kind="article" value={f.gallery ?? []} onChange={(v) => set("gallery", v)} />
        </div>
        <div className="flex flex-col gap-5">
          <ImageField label="Image de couverture" kind="article" value={f.cover_url ?? null} onChange={(u) => set("cover_url", u)} required />
          <Field label="Auteur"><input className={inputCls} value={f.author ?? ""} onChange={(e) => set("author", e.target.value)} /></Field>
          <Field label="Catégorie"><input className={inputCls} placeholder="Ex. Portrait, Coulisses" value={f.category ?? ""} onChange={(e) => set("category", e.target.value)} /></Field>
          <Field label="Date de publication" hint="Remplie automatiquement à la première publication.">
            <input className={inputCls} type="date" value={f.published_at ? f.published_at.slice(0, 10) : ""} onChange={(e) => set("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)} />
          </Field>
          <CheckList label="Marques liées" options={brands.map((b) => ({ id: b.id, label: b.name }))} value={f.brand_ids ?? []} onChange={(v) => set("brand_ids", v)} />
          <CheckList label="Collections liées" options={cols.map((c) => ({ id: c.id, label: c.name }))} value={f.collection_ids ?? []} onChange={(v) => set("collection_ids", v)} />
          <CheckList label="Vêtements liés" options={products.map((p) => ({ id: p.id, label: p.name }))} value={f.product_ids ?? []} onChange={(v) => set("product_ids", v)} />
        </div>
      </div>
      <SaveBar
        busy={busy}
        onDraft={() => void save("draft")}
        onPublish={() => void save("published")}
        onCancel={onClose}
        onDelete={f.id ? () => void remove() : undefined}
        extra={<button type="button" className={btn} onClick={() => setPreview(true)}>Aperçu</button>}
      />
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-studio">
          <DialogHeader><DialogTitle>Aperçu de l’article</DialogTitle></DialogHeader>
          <ArticleBody a={{ title: f.title, subtitle: f.subtitle ?? null, cover_url: f.cover_url ?? null, gallery: f.gallery ?? [], content: clean(f.content ?? ""), author: f.author ?? null, category: f.category ?? null, published_at: f.published_at ?? new Date().toISOString(), brand_ids: f.brand_ids ?? [], collection_ids: f.collection_ids ?? [], product_ids: f.product_ids ?? [] }} />
        </DialogContent>
      </Dialog>
    </>
  );
}
