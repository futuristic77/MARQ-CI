import { createFileRoute } from "@tanstack/react-router";
import { SiteShell, SectionHead } from "@/components/site/SiteShell";
import { BrandCard } from "@/components/site/cards";
import { BRANDS } from "@/data/catalog";

export const Route = createFileRoute("/brands/")({
  head: () => ({
    meta: [
      { title: "Marques — MARQ’CI" },
      { name: "description", content: "Postcard Club, Low Signal Works, Quiet Hours et Analog Foot — chaque marque possède son lookbook, ses collections et ses vêtements." },
      { property: "og:title", content: "Marques — MARQ’CI" },
      { property: "og:description", content: "Quatre marques, chacune avec son lookbook, ses collections et ses vêtements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrandsIndex,
});

function BrandsIndex() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-[1440px] px-4 pt-12 md:px-8">
        <SectionHead cap={`${BRANDS.length} marques`} title="Marques" />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {BRANDS.map((b) => <BrandCard key={b.id} brand={b} />)}
        </div>
      </section>
    </SiteShell>
  );
}
