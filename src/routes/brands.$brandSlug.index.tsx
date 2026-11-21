import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { SectionHead } from "@/components/site/SiteShell";
import { CollectionCard, LookCard, ProductGrid } from "@/components/site/cards";
import { categoriesOfBrand, collectionsOfBrand, looksOfBrand, productsOfBrand, PRODUCTS } from "@/data/catalog";

export const Route = createFileRoute("/brands/$brandSlug/")({
  component: BrandOverview,
});

const parent = getRouteApi("/brands/$brandSlug");

function BrandOverview() {
  const { brand } = parent.useLoaderData();
  const looks = looksOfBrand(brand.id);
  const collections = collectionsOfBrand(brand.id);
  const products = productsOfBrand(brand.id);
  const featured = [...products].sort((a, b) => b.price - a.price).slice(0, 4);
  const cats = categoriesOfBrand(brand.id);

  return (
    <>
      <section className="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 md:px-8 lg:grid-cols-12">
        <figure className="lg:col-span-8">
          {brand.campaign.image && <img src={brand.campaign.image} alt={`Campagne de ${brand.name} — ${brand.campaign.title}`} width={1536} height={1024} className="block aspect-[3/2] w-full border border-dashed border-ink object-cover" />}
          <figcaption className="cap mt-2 text-mute">Campagne · {brand.campaign.title}</figcaption>
        </figure>
        <div className="flex flex-col justify-end lg:col-span-4">
          <p className="cap text-mute">À propos</p>
          <p className="mt-3 text-lg">{brand.description}</p>
          <h2 className="serif mt-8 text-5xl">{brand.campaign.title}</h2>
          <p className="mt-3 text-mute">{brand.campaign.copy}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/brands/$brandSlug/lookbook" params={{ brandSlug: brand.slug }} className="pill is-on">Ouvrir le lookbook</Link>
            <Link to="/brands/$brandSlug/clothing" params={{ brandSlug: brand.slug }} className="pill">Voir les {products.length} vêtements</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead
          cap={`Mannequins portant ${brand.name}`}
          title="Dans les looks"
          action={<Link to="/brands/$brandSlug/lookbook" params={{ brandSlug: brand.slug }} className="pill">Lookbook</Link>}
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {looks.slice(0, 8).map((l) => {
            const worn = PRODUCTS.filter((p) => l.productIds.includes(p.id) && p.brandId === brand.id);
            return (
              <div key={l.n}>
                <LookCard look={l} compact />
                <p className="cap mt-1 text-mute">Avec {worn.map((p) => p.name).join(", ")}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Collections" title={`${collections.length} collections`} action={<Link to="/brands/$brandSlug/collections" params={{ brandSlug: brand.slug }} className="pill">Toutes les collections</Link>} />
        <div className="grid gap-8 md:grid-cols-2">
          {collections.map((c) => <CollectionCard key={c.id} collection={c} />)}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Vêtements" title="Sélection de vêtements" action={<Link to="/brands/$brandSlug/clothing" params={{ brandSlug: brand.slug }} className="pill">Voir les {products.length} vêtements</Link>} />
        <ProductGrid products={featured} showBrand={false} />
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Catégories" title="Acheter par catégorie" />
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <Link key={c.slug} to="/categories/$categorySlug" params={{ categorySlug: c.slug }} search={{ brand: brand.id }} className="pill">
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
