import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { CheckList, Field, inputCls, PageHead } from "@/components/admin/kit";
import { SaveBar } from "@/components/admin/SaveBar";
import { must, useArticles, useBrands, useCollections, useLooks, useRefresh } from "@/lib/admin/data";
import { dbError } from "@/lib/admin/media";

export const Route = createFileRoute("/admin/accueil")({ component: HomeAdmin });

function HomeAdmin() {
  const { data: home } = useQuery({ queryKey: ["admin", "home"], queryFn: async () => must(await supabase.from("home_settings").select("*").eq("id", 1).single()) });
  const { data: brands = [] } = useBrands();
  const { data: cols = [] } = useCollections();
  const { data: articles = [] } = useArticles();
  const { data: looks = [] } = useLooks();
  const [f, setF] = useState<Tables<"home_settings"> | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useRefresh();
  useEffect(() => { if (home) setF(home); }, [home]);
  if (!f) return <p className="cap text-mute">Chargement…</p>;
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF({ ...f, [k]: v });
  const pub = <T extends { status: string }>(l: T[]) => l.filter((x) => x.status === "published");

  async function save() {
    if (!f) return;
    setBusy(true);
    try {
      const { id: _id, updated_at: _u, ...rest } = f;
      must(await supabase.from("home_settings").update(rest).eq("id", 1).select().single());
      await refresh();
      toast.success("Page d’accueil enregistrée.");
    } catch (e) {
      toast.error(dbError(e));
    }
    setBusy(false);
  }

  return (
    <>
      <PageHead cap="Éditorial" title="Page d’accueil" />
      <p className="mb-6 max-w-2xl text-sm text-mute">Choisissez les contenus publiés mis en avant. Une liste laissée vide garde l’affichage automatique (tous les éléments, les plus récents en premier).</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Field label="Titre principal" hint="Vide = « La mode en cercle »."><input className={inputCls} value={f.hero_title ?? ""} onChange={(e) => set("hero_title", e.target.value)} /></Field>
        <Field label="Texte d’introduction"><textarea className={inputCls} rows={3} value={f.hero_subtitle ?? ""} onChange={(e) => set("hero_subtitle", e.target.value)} /></Field>
        <CheckList label="Marques à la une" options={pub(brands).map((b) => ({ id: b.id, label: b.name }))} value={f.featured_brand_ids} onChange={(v) => set("featured_brand_ids", v)} />
        <CheckList label="Collections à la une" options={pub(cols).map((c) => ({ id: c.id, label: c.name }))} value={f.featured_collection_ids} onChange={(v) => set("featured_collection_ids", v)} />
        <CheckList label="Looks à la une" options={pub(looks).map((l) => ({ id: l.id, label: l.title }))} value={f.featured_look_ids} onChange={(v) => set("featured_look_ids", v)} />
        <CheckList label="Articles à la une" options={pub(articles).map((a) => ({ id: a.id, label: a.title }))} value={f.featured_article_ids} onChange={(v) => set("featured_article_ids", v)} />
      </div>
      <SaveBar busy={busy} onSave={() => void save()} onCancel={() => home && setF(home)} />
    </>
  );
}
