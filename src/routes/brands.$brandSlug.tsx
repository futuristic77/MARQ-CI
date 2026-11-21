import { createFileRoute, Link, notFound, Outlet } from "@tanstack/react-router";
import { SiteShell, Crumbs } from "@/components/site/SiteShell";
import { getBrand, looksOfBrand, productsOfBrand, collectionsOfBrand } from "@/data/catalog";

export const Route = createFileRoute("/brands/$brandSlug")({
  loader: ({ params }) => {
    const brand = getBrand(params.brandSlug);
    if (!brand) throw notFound();
    return { brand };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Marque indisponible — MARQ’CI" }, { name: "robots", content: "noindex" }] };
    const { brand } = loaderData;
    return {
      meta: [
        { title: `${brand.name} — MARQ’CI` },
        { name: "description", content: `${brand.tagline} ${brand.description}` },
        { property: "og:title", content: `${brand.name} — MARQ’CI` },
        { property: "og:description", content: brand.tagline },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: BrandLayout,
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="serif text-5xl">Aucune marque ne porte ce nom</h1>
        <Link to="/brands" className="pill mt-8">Toutes les marques</Link>
      </div>
    </SiteShell>
  ),
});

const TABS = [
  { to: "/brands/$brandSlug", label: "Présentation", exact: true },
  { to: "/brands/$brandSlug/lookbook", label: "Lookbook", exact: false },
  { to: "/brands/$brandSlug/collections", label: "Collections", exact: false },
  { to: "/brands/$brandSlug/clothing", label: "Vêtements", exact: false },
  { to: "/brands/$brandSlug/categories", label: "Catégories", exact: false },
] as const;

function BrandLayout() {
  const { brand } = Route.useLoaderData();
  return (
    <SiteShell>
      <header className="mx-auto max-w-[1440px] px-4 pt-6 md:px-8">
        <Crumbs items={[
          { label: "Accueil", link: <Link to="/" className="hover:text-ink">Accueil</Link> },
          { label: "Marques", link: <Link to="/brands" className="hover:text-ink">Marques</Link> },
          { label: brand.name },
        ]} />
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="cap text-mute">{[brand.city, brand.founded ? `Fondée en ${brand.founded}` : ""].filter(Boolean).join(" · ")}</p>
            <h1 className="display mt-2 text-[clamp(48px,9vw,148px)] leading-[.85]">{brand.name}</h1>
            <p className="serif mt-4 text-3xl italic md:text-4xl">{brand.tagline}</p>
          </div>
          <p className="cap text-mute">
            {productsOfBrand(brand.id).length} vêtements · {collectionsOfBrand(brand.id).length} collections · {looksOfBrand(brand.id).length} looks
          </p>
        </div>
      </header>
      <nav
        aria-label={`Sections de ${brand.name}`}
        className="no-scrollbar sticky top-[112px] z-40 mt-8 flex gap-2 overflow-x-auto border-y border-dashed border-ink bg-studio/95 px-4 py-3 backdrop-blur-sm md:top-[96px] md:px-8"
      >
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            params={{ brandSlug: brand.slug }}
            className="pill shrink-0"
            activeOptions={{ exact: t.exact }}
            activeProps={{ "aria-current": "page" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </SiteShell>
  );
}
