import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { RingLookbook } from "@/components/lookbook/RingLookbook";
import { LookCard } from "@/components/site/cards";
import { looksOfBrand, numberWord, getBrand } from "@/data/catalog";
import { splitTitle } from "@/lib/text";

export const Route = createFileRoute("/brands/$brandSlug/lookbook")({
  head: ({ params }) => {
    const name = getBrand(params.brandSlug)?.name ?? "Marque";
    const desc = `Tous les looks éditoriaux avec ${name}, dans le cercle. Touchez un point pour découvrir le vêtement.`;
    return {
      meta: [
        { title: `Lookbook — ${name} — MARQ’CI` },
        { name: "description", content: desc },
        { property: "og:title", content: `Lookbook — ${name} — MARQ’CI` },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: BrandLookbook,
});

const parent = getRouteApi("/brands/$brandSlug");

function BrandLookbook() {
  const { brand } = parent.useLoaderData();
  const looks = looksOfBrand(brand.id);
  return (
    <>
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-6 md:px-8">
        <p className="text-mute">
          {numberWord(looks.length)} looks mettent en scène {brand.name}. Faites tourner le cercle, ouvrez un look et touchez un point pour acheter.
        </p>
        <Link to="/lookbook" search={{ brand: brand.slug }} className="pill">Plein écran</Link>
      </div>
      <RingLookbook
        key={brand.id}
        embedded
        looks={looks}
        title={splitTitle(brand.name)}
        srTitle={`Lookbook ${brand.name}`}
        subtitle={`${brand.name} — ${numberWord(looks.length)} looks`}
        drawerCap={`Looks · ${brand.name}`}
      />
      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <p className="cap mb-6 text-mute">Tous les looks</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {looks.map((l) => <LookCard key={l.n} look={l} />)}
        </div>
      </section>
    </>
  );
}
