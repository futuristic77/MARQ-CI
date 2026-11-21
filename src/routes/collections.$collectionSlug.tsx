import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell, SectionHead, Crumbs } from "@/components/site/SiteShell";
import { CollectionCard, LookCard, LookStrip, ProductGrid } from "@/components/site/cards";
import { brandOf, collectionsOfBrand, getCollection, looksOfCollection, numberWord, productsOfCollection } from "@/data/catalog";

export const Route = createFileRoute("/collections/$collectionSlug")({
  loader: ({ params }) => {
    const collection = getCollection(params.collectionSlug);
    if (!collection) throw notFound();
    return { collection };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Collection indisponible — MARQ’CI" }, { name: "robots", content: "noindex" }] };
    const { collection } = loaderData;
    const brand = brandOf(collection);
    const title = `${collection.name} par ${brand.name} — MARQ’CI`;
    return {
      meta: [
        { title },
        { name: "description", content: collection.description },
        { property: "og:title", content: title },
        { property: "og:description", content: collection.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CollectionPage,
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="serif text-5xl">Aucune collection ne porte ce nom</h1>
        <Link to="/collections" className="pill mt-8">Toutes les collections</Link>
      </div>
    </SiteShell>
  ),
});

function CollectionPage() {
  const { collection } = Route.useLoaderData();
  const brand = brandOf(collection);
  const products = productsOfCollection(collection.id);
  const looks = looksOfCollection(collection.id);
  const siblings = collectionsOfBrand(brand.id).filter((c) => c.id !== collection.id);

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1440px] px-4 pt-6 md:px-8">
        <Crumbs items={[
          { label: "Accueil", link: <Link to="/" className="hover:text-ink">Accueil</Link> },
          { label: "Collections", link: <Link to="/collections" className="hover:text-ink">Collections</Link> },
          { label: brand.name, link: <Link to="/brands/$brandSlug" params={{ brandSlug: brand.slug }} className="hover:text-ink">{brand.name}</Link> },
          { label: collection.name },
        ]} />
      </div>
      <section className="mx-auto grid max-w-[1440px] gap-10 px-4 py-8 md:px-8 lg:grid-cols-2">
        <div className="flex flex-col justify-end">
          <p className="cap flex flex-wrap gap-2 text-mute">
            {collection.isNew && <span className="rounded-full bg-ink px-2 text-paper">Nouveau</span>}
            {collection.drop}
          </p>
          <h1 className="serif mt-4 text-[clamp(56px,8vw,120px)]">{collection.name}</h1>
          <p className="cap mt-4">
            par{" "}
            <Link to="/brands/$brandSlug" params={{ brandSlug: brand.slug }} className="underline underline-offset-4">
              {brand.name}
            </Link>
          </p>
          <p className="mt-6 max-w-lg text-lg text-mute">{collection.description}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link to="/lookbook" search={{ collection: collection.slug }} className="pill is-on">
              Lookbook de la collection · {numberWord(looks.length)} look{looks.length === 1 ? "" : "s"}
            </Link>
            <a href="#clothing" className="pill">Voir les {products.length} vêtements</a>
          </div>
        </div>
        <LookStrip looks={looks} className="aspect-[4/3] border border-dashed border-ink" />
      </section>

      <section id="clothing" className="mx-auto max-w-[1440px] scroll-mt-32 px-4 py-12 md:px-8">
        <SectionHead cap="Vêtements disponibles" title={`${products.length} vêtements`} />
        <ProductGrid products={products} showBrand={false} />
      </section>

      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead
          cap="Looks éditoriaux associés"
          title="Porté dans les looks"
          action={<Link to="/lookbook" search={{ collection: collection.slug }} className="pill">Ouvrir dans le cercle</Link>}
        />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {looks.map((l) => <LookCard key={l.n} look={l} />)}
        </div>
      </section>

      {siblings.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
          <SectionHead cap={`À découvrir chez ${brand.name}`} title="Autres collections" />
          <div className="grid gap-8 md:grid-cols-2">
            {siblings.map((c) => <CollectionCard key={c.id} collection={c} />)}
          </div>
        </section>
      )}
    </SiteShell>
  );
}
