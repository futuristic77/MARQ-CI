import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, SectionHead } from "@/components/site/SiteShell";
import { CollectionCard } from "@/components/site/cards";
import { BRANDS, collectionsOfBrand } from "@/data/catalog";

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title: "Collections — MARQ’CI" },
      { name: "description", content: "Huit collections de quatre marques, chacune avec ses vêtements et ses looks éditoriaux." },
      { property: "og:title", content: "Collections — MARQ’CI" },
      { property: "og:description", content: "Huit collections de quatre marques." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollectionsIndex,
});

function CollectionsIndex() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-[1440px] px-4 pt-12 md:px-8">
        <SectionHead cap="Drop 01 et Drop 02" title="Collections" />
        <div className="flex flex-col gap-16">
          {BRANDS.map((b) => (
            <div key={b.id}>
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <Link to="/brands/$brandSlug" params={{ brandSlug: b.slug }} className="display text-3xl hover:italic">{b.name}</Link>
                <Link to="/brands/$brandSlug/collections" params={{ brandSlug: b.slug }} className="cap text-mute hover:text-ink">Collections de la marque →</Link>
              </div>
              <div className="grid gap-8 md:grid-cols-2">
                {collectionsOfBrand(b.id).map((c) => <CollectionCard key={c.id} collection={c} />)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
