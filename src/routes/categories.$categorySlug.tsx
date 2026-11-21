import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteShell, Crumbs } from "@/components/site/SiteShell";
import { ProductGrid } from "@/components/site/cards";
import { BRANDS, CATEGORIES, getCategory, productsOfCategory } from "@/data/catalog";
import { PRICE_BUCKETS, SORTS, filterProducts, shopSearchSchema, sizesForCategory, type ShopSearch } from "@/lib/filters";

export const Route = createFileRoute("/categories/$categorySlug")({
  validateSearch: shopSearchSchema,
  loader: ({ params }) => {
    if (params.categorySlug === "all") return { slug: "all", name: "Tous les vêtements", blurb: "Tous les vêtements de toutes les marques." };
    const c = getCategory(params.categorySlug);
    if (!c) throw notFound();
    return { slug: c.slug, name: c.name, blurb: c.blurb };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Catégorie indisponible — MARQ’CI" }, { name: "robots", content: "noindex" }] };
    const title = `${loaderData.name} — Boutique MARQ’CI`;
    const desc = `${loaderData.blurb} Filtrez par marque, prix, taille, disponibilité et nouveautés.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="serif text-5xl">Cette catégorie est introuvable</h1>
        <Link to="/categories" className="pill mt-8">Toutes les catégories</Link>
      </div>
    </SiteShell>
  ),
});

function CategoryPage() {
  const cat = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const results = filterProducts(cat.slug, search);
  const total = productsOfCategory(cat.slug).length;
  const sizes = sizesForCategory(cat.slug);
  const brandsHere = BRANDS.filter((b) => productsOfCategory(cat.slug).some((p) => p.brandId === b.id));
  const selectedBrands = search.brand ? search.brand.split(",") : [];
  const activeCount = [search.brand, search.price, search.size, search.availability, search.new].filter(Boolean).length;

  const set = (patch: Partial<ShopSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true, resetScroll: false });

  const toggleBrand = (id: string) => {
    const next = selectedBrands.includes(id) ? selectedBrands.filter((b) => b !== id) : [...selectedBrands, id];
    set({ brand: next.length ? next.join(",") : undefined });
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1440px] px-4 pt-6 md:px-8">
        <Crumbs items={[
          { label: "Accueil", link: <Link to="/" className="hover:text-ink">Accueil</Link> },
          { label: "Boutique", link: <Link to="/categories" className="hover:text-ink">Boutique</Link> },
          { label: cat.name },
        ]} />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-dashed border-ink pb-4">
          <div>
            <h1 className="display text-5xl leading-[.9] md:text-7xl">{cat.name}</h1>
            <p className="mt-2 text-mute">{cat.blurb}</p>
          </div>
          <nav aria-label="Catégories" className="no-scrollbar flex max-w-full gap-2 overflow-x-auto">
            <Link to="/categories/$categorySlug" params={{ categorySlug: "all" }} search={search} className="pill shrink-0" activeProps={{ "aria-current": "page" }}>Tous</Link>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} to="/categories/$categorySlug" params={{ categorySlug: c.slug }} search={{ ...search, size: undefined }} className="pill shrink-0" activeProps={{ "aria-current": "page" }}>
                {c.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-8 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside aria-label="Filtres" className="flex flex-col gap-6 lg:sticky lg:top-32 lg:self-start">
          <FilterGroup label="Marque">
            {brandsHere.map((b) => (
              <Chip key={b.id} on={selectedBrands.includes(b.id)} onClick={() => toggleBrand(b.id)}>{b.name}</Chip>
            ))}
          </FilterGroup>
          <FilterGroup label="Prix">
            {PRICE_BUCKETS.map((p) => (
              <Chip key={p.value} on={search.price === p.value} onClick={() => set({ price: search.price === p.value ? undefined : p.value })}>{p.label}</Chip>
            ))}
          </FilterGroup>
          <FilterGroup label="Taille (en stock)">
            {sizes.map((s) => (
              <Chip key={s} on={search.size === s} onClick={() => set({ size: search.size === s ? undefined : s })}>{s}</Chip>
            ))}
          </FilterGroup>
          <FilterGroup label="Disponibilité">
            <Chip on={search.availability === "in-stock"} onClick={() => set({ availability: search.availability === "in-stock" ? undefined : "in-stock" })}>En stock</Chip>
            <Chip on={search.availability === "low"} onClick={() => set({ availability: search.availability === "low" ? undefined : "low" })}>Stock limité</Chip>
          </FilterGroup>
          <FilterGroup label="Nouveautés">
            <Chip on={!!search.new} onClick={() => set({ new: search.new ? undefined : true })}>Nouveautés</Chip>
          </FilterGroup>
          {activeCount > 0 && (
            <button type="button" className="cap self-start underline underline-offset-4" onClick={() => navigate({ search: { sort: search.sort }, replace: true, resetScroll: false })}>
              Réinitialiser {activeCount} filtre{activeCount > 1 ? "s" : ""}
            </button>
          )}
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="cap" aria-live="polite">
              {results.length} sur {total} vêtements
            </p>
            <label className="cap flex items-center gap-2">
              Trier
              <select
                className="pill cursor-pointer appearance-none pr-8"
                value={search.sort ?? "featured"}
                onChange={(e) => set({ sort: e.target.value === "featured" ? undefined : (e.target.value as ShopSearch["sort"]) })}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>
          {results.length ? (
            <ProductGrid products={results} />
          ) : (
            <div className="border border-dashed border-ink bg-paper px-6 py-16 text-center">
              <p className="serif text-4xl">Rien ici pour le moment.</p>
              <p className="mt-2 text-mute">Aucun vêtement ne correspond à ces filtres.</p>
              <button type="button" className="pill mt-6" onClick={() => navigate({ search: {}, replace: true, resetScroll: false })}>Réinitialiser les filtres</button>
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="cap mb-3 text-mute">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="pill !min-h-8 !px-3" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}
