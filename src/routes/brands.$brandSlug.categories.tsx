import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { SheetCell } from "@/components/site/media";
import { categoriesOfBrand, productsOfBrand, getBrand } from "@/data/catalog";

export const Route = createFileRoute("/brands/$brandSlug/categories")({
  head: ({ params }) => {
    const name = getBrand(params.brandSlug)?.name ?? "Marque";
    const desc = `Découvrez ${name} par catégorie.`;
    return {
      meta: [
        { title: `Catégories — ${name} — MARQ’CI` },
        { name: "description", content: desc },
        { property: "og:title", content: `Catégories — ${name} — MARQ’CI` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: BrandCategories,
});

const parent = getRouteApi("/brands/$brandSlug");

function BrandCategories() {
  const { brand } = parent.useLoaderData();
  const products = productsOfBrand(brand.id);
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
      <h2 className="display mb-8 text-4xl md:text-6xl">{brand.name} par catégorie</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {categoriesOfBrand(brand.id).map((c) => {
          const items = products.filter((p) => p.categorySlug === c.slug);
          return (
            <Link
              key={c.slug}
              to="/categories/$categorySlug"
              params={{ categorySlug: c.slug }}
              search={{ brand: brand.id }}
              className="group flex flex-col border border-dashed border-ink bg-paper"
            >
              <span className="relative block aspect-square overflow-hidden">
                <SheetCell product={items[0]!} className="group-hover:scale-[1.3]" />
              </span>
              <span className="flex items-center justify-between border-t border-dashed border-ink px-3 py-3">
                <span className="display text-xl leading-none">{c.name}</span>
                <span className="cap text-mute">{items.length}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <p className="cap mt-8 text-mute">Catégories associées, toutes marques confondues</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {categoriesOfBrand(brand.id).map((c) => (
          <Link key={c.slug} to="/categories/$categorySlug" params={{ categorySlug: c.slug }} className="pill">
            Tout voir : {c.name.toLowerCase()}
          </Link>
        ))}
      </div>
    </section>
  );
}
