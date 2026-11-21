import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ProductGrid } from "@/components/site/cards";
import { categoriesOfBrand, productsOfBrand, getBrand } from "@/data/catalog";

export const Route = createFileRoute("/brands/$brandSlug/clothing")({
  head: ({ params }) => {
    const name = getBrand(params.brandSlug)?.name ?? "Marque";
    const desc = `Tous les vêtements et accessoires de ${name}.`;
    return {
      meta: [
        { title: `Vêtements — ${name} — MARQ’CI` },
        { name: "description", content: desc },
        { property: "og:title", content: `Vêtements — ${name} — MARQ’CI` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: BrandClothing,
});

const parent = getRouteApi("/brands/$brandSlug");

function BrandClothing() {
  const { brand } = parent.useLoaderData();
  const products = productsOfBrand(brand.id);
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="display text-4xl md:text-6xl">Tous les vêtements de {brand.name}</h2>
        <div className="flex flex-wrap gap-2">
          {categoriesOfBrand(brand.id).map((c) => (
            <Link key={c.slug} to="/categories/$categorySlug" params={{ categorySlug: c.slug }} search={{ brand: brand.id }} className="pill">
              {c.name} uniquement
            </Link>
          ))}
        </div>
      </div>
      <p className="cap mb-6 text-mute">{products.length} vêtements</p>
      <ProductGrid products={products} showBrand={false} />
    </section>
  );
}
