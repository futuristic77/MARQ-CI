import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { btn, btnInk, Empty, Field, inputCls, PageHead, StatusBadge } from "@/components/admin/kit";
import { ListRow, SaveBar } from "@/components/admin/SaveBar";
import { ModelPreview } from "@/components/admin/ModelPreview";
import { must, useBrands, useLookItems, useLooks, useModels, useProducts, useRefresh } from "@/lib/admin/data";
import { dbError, slugify } from "@/lib/admin/media";
import { money, pad } from "@/data/catalog";

export const Route = createFileRoute("/admin/looks")({ component: LooksAdmin });

type Form = TablesInsert<"looks">;
interface Item { product_id: string; x: number; y: number }

function LooksAdmin() {
  const { data = [], isLoading } = useLooks();
  const { data: models = [] } = useModels();
  const { data: items = [] } = useLookItems();
  const [edit, setEdit] = useState<Form | null>(null);
  if (edit)
    return (
      <LookForm
        initial={edit}
        initialItems={items.filter((i) => i.look_id === edit.id).sort((a, b) => a.position - b.position).map((i) => ({ product_id: i.product_id, x: Number(i.x), y: Number(i.y) }))}
        onClose={() => setEdit(null)}
      />
    );
  return (
    <>
      <PageHead cap="Lookbook" title="Looks" actions={<button type="button" className={btnInk} onClick={() => setEdit({ title: "", slug: "", description: "", model_id: models[0]?.id ?? null, sort_order: data.length, status: "draft" })}>Créer un look</button>} />
      <p className="mb-6 max-w-2xl text-sm text-mute">Chaque look publié apparaît dans le cercle du Lookbook, sur la page Looks et sur les pages des marques et collections de ses vêtements. L’ordre d’affichage définit sa place dans le cercle.</p>
      {isLoading ? <p className="cap text-mute">Chargement…</p> : data.length === 0 ? <Empty>Aucun look pour l’instant. Ajoutez d’abord un mannequin et des vêtements.</Empty> : (
        <ul>
          {data.map((l) => (
            <ListRow key={l.id} thumb={models.find((m) => m.id === l.model_id)?.image_url} title={`${pad(l.sort_order)} · ${l.title}`} meta={`${items.filter((i) => i.look_id === l.id).length} vêtements · ${models.find((m) => m.id === l.model_id)?.name ?? "sans mannequin"}`} right={<StatusBadge status={l.status} />} onClick={() => setEdit(l)} />
          ))}
        </ul>
      )}
    </>
  );
}

function LookForm({ initial, initialItems, onClose }: { initial: Form; initialItems: Item[]; onClose: () => void }) {
  const { data: models = [] } = useModels();
  const { data: products = [] } = useProducts();
  const { data: brands = [] } = useBrands();
  const [f, setF] = useState(initial);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [sel, setSel] = useState(0);
  const [add, setAdd] = useState("");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ idx: number; rect: DOMRect } | null>(null);
  const refresh = useRefresh();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const model = models.find((m) => m.id === f.model_id);
  const prod = (id: string) => products.find((p) => p.id === id);

  const pct = (e: { clientX: number; clientY: number }, r: DOMRect) => ({
    x: Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)) * 10) / 10,
    y: Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) * 10) / 10,
  });
  const moveTo = (idx: number, p: { x: number; y: number }) => setItems((list) => list.map((it, i) => (i === idx ? { ...it, ...p } : it)));

  function onCanvasDown(e: PointerEvent<HTMLDivElement>) {
    if (!items.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dot = (e.target as HTMLElement).closest("[data-idx]");
    const idx = dot ? Number(dot.getAttribute("data-idx")) : sel;
    setSel(idx);
    moveTo(idx, pct(e, rect));
    drag.current = { idx, rect };
    e.currentTarget.setPointerCapture(e.pointerId);
    const el = e.currentTarget;
    const move = (ev: globalThis.PointerEvent) => drag.current && moveTo(drag.current.idx, pct(ev, drag.current.rect));
    const up = () => {
      drag.current = null;
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  }

  function reorder(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setItems(next);
    setSel(j);
  }

  async function save(status: "draft" | "published") {
    const row = { ...f, status, slug: f.slug || slugify(f.title) };
    if (!row.title.trim()) { toast.error("Le titre est obligatoire."); return; }
    if (status === "published") {
      if (!model) { toast.error("Choisissez un mannequin avant de publier."); return; }
      if (!items.length) { toast.error("Ajoutez au moins un vêtement avant de publier."); return; }
    }
    setBusy(true);
    try {
      const saved: { id: string } = row.id
        ? must(await supabase.from("looks").update(row).eq("id", row.id).select().single())
        : must(await supabase.from("looks").insert(row).select().single());
      must(await supabase.from("look_items").delete().eq("look_id", saved.id).select());
      if (items.length) must(await supabase.from("look_items").insert(items.map((it, position) => ({ look_id: saved.id, product_id: it.product_id, x: it.x, y: it.y, position }))).select());
      await refresh();
      const hidden = items.filter((it) => prod(it.product_id)?.status !== "published").length;
      toast.success(status === "published" ? (hidden ? `Look publié — ${hidden} vêtement(s) en brouillon resteront masqués.` : "Look publié.") : "Brouillon enregistré.");
      onClose();
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }
  async function remove() {
    setBusy(true);
    try {
      must(await supabase.from("looks").delete().eq("id", f.id!).select());
      await refresh();
      toast.success("Look supprimé.");
      onClose();
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }

  const available = products.filter((p) => !items.some((i) => i.product_id === p.id));

  return (
    <>
      <PageHead cap="Looks" title={f.id ? f.title || "Look" : "Nouveau look"} actions={f.status && <StatusBadge status={f.status} />} />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Field label="Titre" required><input className={inputCls} value={f.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></Field>
          <Field label="Lien (slug)" hint={`Adresse publique : /looks/${f.slug || "…"}`}><input className={inputCls} value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></Field>
          <Field label="Description"><textarea className={inputCls} rows={3} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mannequin" required>
              <select className={inputCls} value={f.model_id ?? ""} onChange={(e) => set("model_id", e.target.value || null)}>
                <option value="">— Choisir —</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Ordre dans le cercle"><input className={inputCls} type="number" value={f.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} /></Field>
          </div>

          <div className="flex flex-col gap-2">
            <span className="cap">Vêtements du look</span>
            {items.length === 0 && <span className="text-xs text-mute">Ajoutez les vêtements portés, puis placez leur point sur le mannequin.</span>}
            <ol className="flex flex-col">
              {items.map((it, i) => {
                const p = prod(it.product_id);
                return (
                  <li key={it.product_id} className={`flex items-center gap-3 border-b border-dashed border-ink py-2 ${sel === i ? "bg-paper" : ""}`}>
                    <button type="button" onClick={() => setSel(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-pressed={sel === i}>
                      <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs ${sel === i ? "bg-ink text-paper" : "border border-dashed border-ink"}`}>{pad(i + 1)}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm">{p?.name ?? "Vêtement supprimé"}</span>
                        <span className="cap block text-mute">{brands.find((b) => b.id === p?.brand_id)?.name} · {p ? money(p.price) : ""} · {it.x} % / {it.y} %{p?.status === "draft" ? " · brouillon" : ""}</span>
                      </span>
                    </button>
                    <button type="button" onClick={() => reorder(i, -1)} disabled={i === 0} aria-label="Monter" className="px-1 disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => reorder(i, 1)} disabled={i === items.length - 1} aria-label="Descendre" className="px-1 disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => { setItems(items.filter((_, k) => k !== i)); setSel(0); }} className="cap underline">Retirer</button>
                  </li>
                );
              })}
            </ol>
            <div className="flex gap-2">
              <select className={inputCls} value={add} onChange={(e) => setAdd(e.target.value)} aria-label="Vêtement à ajouter">
                <option value="">— Ajouter un vêtement —</option>
                {available.map((p) => <option key={p.id} value={p.id}>{p.name} — {brands.find((b) => b.id === p.brand_id)?.name}{p.status === "draft" ? " (brouillon)" : ""}</option>)}
              </select>
              <button type="button" className={btn} disabled={!add} onClick={() => { setItems([...items, { product_id: add, x: 50, y: 50 }]); setSel(items.length); setAdd(""); }}>Ajouter</button>
            </div>
          </div>
        </div>

        <div>
          <p className="cap mb-2">Placement des points — {items.length ? `cliquez ou glissez pour placer le point ${pad(sel + 1)}` : "ajoutez un vêtement"}</p>
          <ModelPreview src={model?.image_url} foot={Number(model?.foot ?? 0.05)} onPointerDown={onCanvasDown}>
            {items.map((it, i) => (
              <span key={it.product_id} data-idx={i} className={`tag${sel === i ? " is-hot" : ""}`} style={{ left: `${it.x}%`, top: `${it.y}%`, "--pi": i + 1 } as CSSProperties}>
                <span className="dotnum">{pad(i + 1)}</span>
              </span>
            ))}
          </ModelPreview>
          <p className="mt-2 text-xs text-mute">Cet aperçu reproduit exactement l’affichage du look ouvert dans le cercle : les points apparaîtront aux mêmes endroits.</p>
        </div>
      </div>
      <SaveBar busy={busy} onDraft={() => void save("draft")} onPublish={() => void save("published")} onCancel={onClose} onDelete={f.id ? () => void remove() : undefined} />
    </>
  );
}
