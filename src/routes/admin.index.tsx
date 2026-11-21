import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHead } from "@/components/admin/kit";
import { useArticles, useBrands, useCollections, useLooks, useModels, useProducts } from "@/lib/admin/data";

export const Route = createFileRoute("/admin/")({ component: Overview });

function Overview() {
  const brands = useBrands().data ?? [];
  const cols = useCollections().data ?? [];
  const products = useProducts().data ?? [];
  const models = useModels().data ?? [];
  const looks = useLooks().data ?? [];
  const articles = useArticles().data ?? [];
  const pub = (l: { status: string }[]) => l.filter((x) => x.status === "published").length;
  const cards = [
    { to: "/admin/articles", label: "Articles", n: articles.length, p: pub(articles) },
    { to: "/admin/marques", label: "Marques", n: brands.length, p: pub(brands) },
    { to: "/admin/collections", label: "Collections", n: cols.length, p: pub(cols) },
    { to: "/admin/vetements", label: "Vêtements", n: products.length, p: pub(products) },
    { to: "/admin/looks", label: "Looks", n: looks.length, p: pub(looks) },
    { to: "/admin/mannequins", label: "Mannequins", n: models.length, p: null },
  ] as const;
  return (
    <>
      <PageHead cap="Tableau de bord" title="Vue d’ensemble" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="flex flex-col gap-2 border border-dashed border-ink bg-paper p-5 hover:border-solid">
            <span className="cap text-mute">{c.label}</span>
            <span className="display text-5xl leading-none">{c.n}</span>
            <span className="cap">{c.p === null ? "Utilisés dans les looks" : `${c.p} publié${c.p > 1 ? "s" : ""} · ${c.n - c.p} brouillon${c.n - c.p > 1 ? "s" : ""}`}</span>
          </Link>
        ))}
      </div>
      <section className="mt-10 border border-dashed border-ink bg-paper p-6">
        <h2 className="display text-2xl">Ordre conseillé</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
          <li><Link to="/admin/marques" className="underline">Créer une marque</Link>, puis ses <Link to="/admin/collections" className="underline">collections</Link>.</li>
          <li><Link to="/admin/vetements" className="underline">Ajouter les vêtements</Link> dans la bonne marque et la bonne collection.</li>
          <li><Link to="/admin/mannequins" className="underline">Importer les mannequins</Link> (photo en pied, idéalement PNG détouré).</li>
          <li><Link to="/admin/looks" className="underline">Composer les looks</Link> et placer les points sur chaque vêtement.</li>
          <li>Publier : seuls les contenus publiés apparaissent sur le site, devant le contenu de démonstration.</li>
        </ol>
      </section>
    </>
  );
}
