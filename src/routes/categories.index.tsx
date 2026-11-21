import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, SectionHead } from "@/components/site/SiteShell";
import { SheetCell } from "@/components/site/media";
import { CATEGORIES, PRODUCTS, productsOfCategory } from "@/data/catalog";

export const Route = createFileRoute("/categories/")({
  head: () => ({
    meta: [
      { title: "Boutique par catégorie — MARQ’CI" },
      { name: "description", content: "Hauts, vestes et manteaux, bas, chaussures et accessoires de toutes les marques MARQ’CI, avec des filtres par marque, prix, taille et disponibilité." },
      { property: "og:title", content: "Boutique par catégorie — MARQ’CI" },
      { property: "og:description", content: "Hauts, vestes et manteaux, bas, chaussures et accessoires de toutes les marques." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoriesIndex,
});

function CategoriesIndex() {
  const tiles = [
    { slug: "all", name: "Tous les vêtements", blurb: "Tous les vêtements de toutes les marques.", items: PRODUCTS },
    ...CATEGORIES.map((c) => ({ slug: c.slug, name: c.name, blurb: c.blurb, items: productsOfCategory(c.slug) })),
  ];
  return (
    <SiteShell>
      <section className="mx-auto max-w-[1440px] px-4 pt-12 md:px-8">
        <SectionHead cap="Boutique" title="Catégories" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t) => (
            <Link key={t.slug} to="/categories/$categorySlug" params={{ categorySlug: t.slug }} className="group flex flex-col border border-dashed border-ink bg-paper">
              <span className="grid grid-cols-3 gap-px border-b border-dashed border-ink bg-studio">
                {t.items.slice(0, 3).map((p) => (
                  <span key={p.slug} className="relative block aspect-square overflow-hidden bg-paper">
                    <SheetCell product={p} w={600} className="group-hover:scale-[1.3]" />
                  </span>
                ))}
              </span>
              <span className="flex items-end justify-between gap-4 p-4">
                <span>
                  <span className="display block text-3xl leading-none">{t.name}</span>
                  <span className="mt-2 block text-sm text-mute">{t.blurb}</span>
                </span>
                <span className="cap">{t.items.length}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
