import { createFileRoute, Link } from "@tanstack/react-router";
// Hero photo lives in the site's cloud media library, served through /api/public/media.
const heroCircle = "/api/public/media/other/5b11fa0c-8b43-4a06-b832-6f22445350f5.jpg";
import { SiteShell, SectionHead } from "@/components/site/SiteShell";
import { BrandCard, CollectionCard, LookCard, ProductGrid } from "@/components/site/cards";
import { SheetCell } from "@/components/site/media";
import type { ShopSearch } from "@/lib/filters";
import {
  BRANDS,
  CATEGORIES,
  COLLECTIONS,
  LOOKS,
  PRODUCTS,
  collectionsOfBrand,
  productsOfCategory,
} from "@/data/catalog";
import { ARTICLES, HOME } from "@/lib/published";
import { formatDate } from "@/components/site/ArticleBody";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MARQ’CI — Mode ivoirienne et africaine : looks, marques et vêtements" },
      { name: "description", content: "Faites tourner le cercle de neuf looks du Vol. 01, puis découvrez chaque vêtement des marques présentées sur MARQ’CI." },
      { property: "og:title", content: "MARQ’CI — La mode en cercle" },
      { property: "og:description", content: "Neuf looks, quatre marques, huit collections. Chaque vêtement mène à sa propre fiche." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const FEATURED = ["corduroy-blazer", "yellow-anorak-shell", "striped-open-shirt", "desert-boots", "navy-rollneck-knit", "faded-black-hoodie", "linen-camp-shirt", "mesh-trainers"]
  .map((s) => PRODUCTS.find((p) => p.slug === s)!);

const pick = <T,>(all: T[], ids: string[] | undefined, idOf: (x: T) => string | undefined, fallback: T[]) => {
  if (!ids?.length) return fallback;
  const chosen = all.filter((x) => ids.includes(idOf(x) ?? ""));
  return chosen.length ? chosen : fallback;
};

function Home() {
  const home = HOME.current;
  const featuredBrands = pick(BRANDS, home?.featured_brand_ids, (b) => b.id, BRANDS);
  const newCollections = pick(COLLECTIONS, home?.featured_collection_ids, (c) => c.id, COLLECTIONS.filter((c) => c.isNew));
  const featuredLooks = pick(LOOKS, home?.featured_look_ids, (l) => l.dbId, LOOKS);
  const articles = pick(ARTICLES, home?.featured_article_ids, (a) => a.id, ARTICLES.slice(0, 3));
  return (
    <SiteShell>
      {/* Hero */}
      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 pb-16 pt-10 md:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:pt-16">
        <div>
          <p className="cap mb-6 text-mute">Vol. 01 — Neuf looks, un seul cercle</p>
          <h1 className="serif text-[clamp(56px,8vw,128px)]">
            {home?.hero_title ? home.hero_title : <>La mode<br />en cercle</>}
          </h1>
          <p className="mt-6 max-w-md text-base text-mute">
            {home?.hero_subtitle || "Les looks se tiennent en cercle. Faites-le tourner, ouvrez une tenue, touchez un point : chaque vêtement mène à sa marque, à sa collection et à sa propre fiche."}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link to="/lookbook" className="pill is-on">Entrer dans le cercle</Link>
            <Link to="/categories/$categorySlug" params={{ categorySlug: "all" }} className="pill">Voir tous les vêtements</Link>
            <Link to="/brands" className="pill">Marques</Link>
          </div>
        </div>
        <Link to="/lookbook" className="group relative block overflow-hidden border border-dashed border-ink bg-paper" aria-label="Ouvrir le lookbook en cercle du Vol. 01">
          <img
            className="block aspect-video w-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
            src={heroCircle}
            alt="Le cercle MARQ’CI : neuf looks disposés autour du titre « Dans le cercle »"
            width={2400}
            height={1350}
          />
          <span className="pill absolute bottom-4 right-4 group-hover:bg-ink group-hover:text-paper">Faire tourner le cercle →</span>
        </Link>
      </section>

      {/* Featured brands */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Marques à la une" title="Quatre marques, un cercle" action={<Link to="/brands" className="pill">Toutes les marques</Link>} />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {featuredBrands.map((b) => <BrandCard key={b.id} brand={b} />)}
        </div>
      </section>

      {/* Campaigns */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Campagnes des marques" title="Campagnes" />
        <div className="flex flex-col gap-16">
          {featuredBrands.filter((b) => b.campaign.image).map((b, i) => {
            const cols = collectionsOfBrand(b.id);
            return (
              <article key={b.id} className={`grid items-center gap-8 lg:grid-cols-12 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <Link to="/brands/$brandSlug" params={{ brandSlug: b.slug }} className="block overflow-hidden border border-dashed border-ink lg:col-span-8">
                  <img src={b.campaign.image} alt={`Campagne ${b.name} — ${b.campaign.title}`} width={1536} height={1024} loading="lazy" className="block aspect-[3/2] w-full object-cover transition-transform duration-1000 hover:scale-[1.02]" />
                </Link>
                <div className="lg:col-span-4">
                  <p className="cap text-mute">{b.name} · Campagne</p>
                  <h3 className="serif mt-3 text-5xl md:text-6xl">{b.campaign.title}</h3>
                  <p className="mt-4 text-mute">{b.campaign.copy}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link to="/brands/$brandSlug" params={{ brandSlug: b.slug }} className="pill">{b.name}</Link>
                    {cols.map((c) => (
                      <Link key={c.id} to="/collections/$collectionSlug" params={{ collectionSlug: c.slug }} className="pill">{c.name}</Link>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* New collections */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Drop 02 · nov. 2026" title="Nouvelles collections" action={<Link to="/collections" className="pill">Toutes les collections</Link>} />
        <div className="grid gap-8 md:grid-cols-3">
          {newCollections.map((c) => <CollectionCard key={c.id} collection={c} />)}
        </div>
      </section>

      {/* Featured clothing */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Vêtements à la une" title="Pièces du cercle" action={<Link to="/categories/$categorySlug" params={{ categorySlug: "all" }} className="pill">Tout voir</Link>} />
        <ProductGrid products={FEATURED} />
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Catégories" title="Acheter par catégorie" action={<Link to="/categories" className="pill">Toutes les catégories</Link>} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {CATEGORIES.map((c) => {
            const items = productsOfCategory(c.slug);
            return (
              <Link key={c.slug} to="/categories/$categorySlug" params={{ categorySlug: c.slug }} className="group flex flex-col border border-dashed border-ink bg-paper">
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
      </section>

      {/* Editorial looks */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Looks éditoriaux · Vol. 01" title={`${featuredLooks.length} looks`} action={<Link to="/lookbook" className="pill">Ouvrir le cercle</Link>} />
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-9">
          {featuredLooks.map((l) => (
            <div key={l.n} className="w-[44vw] shrink-0 snap-start md:w-auto">
              <LookCard look={l} compact />
            </div>
          ))}
        </div>
      </section>

      {articles.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
          <SectionHead cap="Éditorial" title="Articles" action={<Link to="/articles" className="pill">Tous les articles</Link>} />
          <div className="grid gap-x-6 gap-y-10 md:grid-cols-3">
            {articles.map((ar) => (
              <article key={ar.id} className="group flex flex-col">
                <Link to="/articles/$articleSlug" params={{ articleSlug: ar.slug }} className="block aspect-[4/3] overflow-hidden border border-dashed border-ink bg-paper">
                  {ar.cover_url && <img src={ar.cover_url} alt={ar.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]" />}
                </Link>
                <p className="cap mt-3 text-mute">{[ar.category, formatDate(ar.published_at)].filter(Boolean).join(" · ")}</p>
                <Link to="/articles/$articleSlug" params={{ articleSlug: ar.slug }} className="serif mt-1 text-3xl leading-tight hover:italic">{ar.title}</Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Curated selections */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Sélections" title="Choisis pour vous" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Curated title="Moins de 45 000 FCFA" cap="Petits prix" to="all" search={{ price: "under-45000", sort: "price-asc" }} slugs={["ribbed-tank-top", "braided-belt", "nylon-hike-shorts"]} />
          <Curated title="Nouveautés" cap="Drop 02" to="all" search={{ new: true, sort: "new" }} slugs={["faded-black-hoodie", "linen-camp-shirt", "leather-slides"]} />
          <Curated title="Chaussures en 42" cap="Par taille" to="shoes" search={{ size: "42" }} slugs={["suede-moccasin", "desert-boots", "retro-court-sneaker"]} />
          <Curated title="Dernières tailles" cap="Stock limité" to="all" search={{ availability: "low" }} slugs={["corduroy-blazer", "wool-trousers", "mesh-trainers"]} />
        </div>
      </section>
    </SiteShell>
  );
}

function Curated({ title, cap, to, search, slugs }: { title: string; cap: string; to: string; search: ShopSearch; slugs: string[] }) {
  const items = slugs.map((s) => PRODUCTS.find((p) => p.slug === s)!);
  return (
    <Link to="/categories/$categorySlug" params={{ categorySlug: to }} search={search} className="group flex flex-col border border-dashed border-ink bg-paper p-4 transition-colors hover:bg-ink hover:text-paper">
      <span className="cap opacity-60">{cap}</span>
      <span className="serif mt-2 text-4xl">{title}</span>
      <span className="mt-6 grid grid-cols-3 gap-2">
        {items.map((p) => (
          <span key={p.slug} className="relative block aspect-square overflow-hidden rounded-full bg-studio">
            <SheetCell product={p} w={600} />
          </span>
        ))}
      </span>
      <span className="cap mt-4">Voir la sélection →</span>
    </Link>
  );
}
