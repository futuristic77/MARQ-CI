import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { CollectionCard } from "@/components/site/cards";
import { collectionsOfBrand, getBrand } from "@/data/catalog";

export const Route = createFileRoute("/brands/$brandSlug/collections")({
  head: ({ params }) => {
    const name = getBrand(params.brandSlug)?.name ?? "Marque";
    const desc = `Toutes les collections de ${name}, avec leurs vêtements et leurs looks éditoriaux.`;
    return {
      meta: [
        { title: `Collections — ${name} — MARQ’CI` },
        { name: "description", content: desc },
        { property: "og:title", content: `Collections — ${name} — MARQ’CI` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: BrandCollections,
});

const parent = getRouteApi("/brands/$brandSlug");

function BrandCollections() {
  const { brand } = parent.useLoaderData();
  const cols = collectionsOfBrand(brand.id);
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
      <h2 className="display mb-8 text-4xl md:text-6xl">Collections de {brand.name}</h2>
      <div className="grid gap-8 md:grid-cols-2">
        {cols.map((c) => <CollectionCard key={c.id} collection={c} />)}
      </div>
    </section>
  );
}
