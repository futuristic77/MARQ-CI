import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, SectionHead } from "@/components/site/SiteShell";
import { LookCard } from "@/components/site/cards";
import { LOOKS } from "@/data/catalog";

export const Route = createFileRoute("/looks/")({
  head: () => ({
    meta: [
      { title: "Tous les looks · Vol. 01 — MARQ’CI" },
      { name: "description", content: "Neuf looks éditoriaux du Vol. 01. Ouvrez un look pour découvrir chaque vêtement, sa marque et sa fiche produit." },
      { property: "og:title", content: "Tous les looks · Vol. 01 — MARQ’CI" },
      { property: "og:description", content: "Neuf looks éditoriaux. Chaque vêtement renvoie à sa marque et à sa fiche produit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LooksIndex,
});

function LooksIndex() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-[1440px] px-4 pt-12 md:px-8">
        <SectionHead
          cap="Éditorial · Vol. 01"
          title="Tous les looks"
          action={<Link to="/lookbook" className="pill is-on">Faire tourner le cercle</Link>}
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {LOOKS.map((l) => <LookCard key={l.n} look={l} />)}
        </div>
      </section>
    </SiteShell>
  );
}
