import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { btnInk, Empty, Field, ImageField, inputCls, PageHead } from "@/components/admin/kit";
import { ListRow, SaveBar } from "@/components/admin/SaveBar";
import { ModelPreview } from "@/components/admin/ModelPreview";
import { must, useLooks, useModels, useRefresh } from "@/lib/admin/data";
import { dbError } from "@/lib/admin/media";

export const Route = createFileRoute("/admin/mannequins")({ component: ModelsAdmin });

type Form = TablesInsert<"models">;

function ModelsAdmin() {
  const { data = [], isLoading } = useModels();
  const { data: looks = [] } = useLooks();
  const [edit, setEdit] = useState<Form | null>(null);
  if (edit) return <ModelForm initial={edit} usedBy={looks.filter((l) => l.model_id === edit.id).map((l) => l.title)} onClose={() => setEdit(null)} />;
  return (
    <>
      <PageHead cap="Contenus" title="Mannequins" actions={<button type="button" className={btnInk} onClick={() => setEdit({ name: "", reference: "", description: "", image_url: "", image_width: null, image_height: null, foot: 0.05 })}>Ajouter un mannequin</button>} />
      <p className="mb-6 max-w-2xl text-sm text-mute">Importez une photo en pied (JPG, PNG ou WebP). Un PNG détouré sur fond transparent donne le meilleur rendu dans le cercle. L’image n’est jamais recadrée ni déformée.</p>
      {isLoading ? <p className="cap text-mute">Chargement…</p> : data.length === 0 ? <Empty>Aucun mannequin pour l’instant.</Empty> : (
        <ul>{data.map((m) => <ListRow key={m.id} thumb={m.image_url} title={m.name} meta={[m.reference, m.image_width && `${m.image_width}×${m.image_height}px`, `${looks.filter((l) => l.model_id === m.id).length} looks`].filter(Boolean).join(" · ")} onClick={() => setEdit(m)} />)}</ul>
      )}
    </>
  );
}

function ModelForm({ initial, usedBy, onClose }: { initial: Form; usedBy: string[]; onClose: () => void }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const refresh = useRefresh();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    if (!f.name.trim()) { toast.error("Le nom est obligatoire."); return; }
    if (!f.image_url) { toast.error("Importez la photo du mannequin."); return; }
    setBusy(true);
    try {
      must(f.id ? await supabase.from("models").update(f).eq("id", f.id).select().single() : await supabase.from("models").insert(f).select().single());
      await refresh();
      toast.success("Mannequin enregistré.");
      onClose();
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }
  async function remove() {
    setBusy(true);
    try {
      must(await supabase.from("models").delete().eq("id", f.id!).select());
      await refresh();
      toast.success("Mannequin supprimé.");
      onClose();
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }

  return (
    <>
      <PageHead cap="Mannequins" title={f.id ? f.name || "Mannequin" : "Nouveau mannequin"} />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Field label="Nom" required><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Référence"><input className={inputCls} value={f.reference ?? ""} onChange={(e) => set("reference", e.target.value)} /></Field>
          <Field label="Description"><textarea className={inputCls} rows={3} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <ImageField
            label="Photo en pied"
            kind="model"
            required
            tall
            value={f.image_url || null}
            onChange={(u) => set("image_url", u ?? "")}
            onMedia={(m) => setF((p) => ({ ...p, image_url: m.url, image_width: m.width, image_height: m.height }))}
          />
          <Field label={`Ancrage au sol : ${Math.round(Number(f.foot ?? 0) * 1000) / 10} %`} hint="Descend l’image pour que les pieds touchent l’ombre au sol.">
            <input type="range" min={0} max={0.3} step={0.005} value={Number(f.foot ?? 0.05)} onChange={(e) => set("foot", Number(e.target.value))} />
          </Field>
          {usedBy.length > 0 && <p className="cap text-mute">Utilisé dans : {usedBy.join(", ")}</p>}
        </div>
        <div>
          <p className="cap mb-2">Aperçu dans le Lookbook</p>
          <ModelPreview src={f.image_url} foot={Number(f.foot ?? 0.05)} />
        </div>
      </div>
      <SaveBar busy={busy} onSave={() => void save()} onCancel={onClose} onDelete={f.id ? () => void remove() : undefined} deleteText={usedBy.length ? `Les looks ${usedBy.join(", ")} n’auront plus de mannequin et disparaîtront du Lookbook.` : undefined} />
    </>
  );
}
