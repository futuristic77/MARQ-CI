import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { RingLookbook } from "@/components/lookbook/RingLookbook";
import { SiteFooter } from "@/components/site/SiteShell";
import { splitTitle } from "@/lib/text";
import { LOOKS, getBrand, getCollection, looksOfBrand, looksOfCollection, numberWord, type Look } from "@/data/catalog";

const searchSchema = z.object({
  brand: z.string().optional(),
  collection: z.string().optional(),
  look: z.string().optional(),
});

export const Route = createFileRoute("/lookbook")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Lookbook — Le cercle des looks — MARQ’CI" },
      { name: "description", content: "Vol. 01. Neuf looks disposés en cercle. Faites tourner le cercle, choisissez une tenue et touchez un point pour découvrir le vêtement." },
      { property: "og:title", content: "Le cercle des looks — MARQ’CI Vol. 01" },
      { property: "og:description", content: "Neuf looks en cercle. Faites-le tourner, ouvrez une tenue et achetez chaque vêtement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LookbookPage,
});

function LookbookPage() {
  const { brand, collection, look } = Route.useSearch();
  const b = brand ? getBrand(brand) : undefined;
  const c = collection ? getCollection(collection) : undefined;

  let looks: Look[] = LOOKS;
  let title = ["Dans le", "cercle"];
  let subtitle = "Vol. 01 — Neuf looks";
  let cap = "Looks · Vol. 01";
  let chip: React.ReactNode = null;
  let srTitle: React.ReactNode = (
    <>
      <span>Dans le</span> <span>cercle, <i>Vol. 01.</i></span>
    </>
  );

  if (c) {
    looks = looksOfCollection(c.id);
    title = splitTitle(c.name);
    subtitle = `${c.name} — ${numberWord(looks.length)} look${looks.length === 1 ? "" : "s"}`;
    cap = `Looks · ${c.name}`;
    srTitle = `Lookbook ${c.name}`;
    chip = (
      <span className="flex gap-2">
        <Link to="/collections/$collectionSlug" params={{ collectionSlug: c.slug }} className="pill">{c.name}</Link>
        <Link to="/lookbook" className="pill" aria-label="Afficher tous les looks">Tous les looks ×</Link>
      </span>
    );
  } else if (b) {
    looks = looksOfBrand(b.id);
    title = splitTitle(b.name);
    subtitle = `${b.name} — ${numberWord(looks.length)} looks`;
    cap = `Looks · ${b.name}`;
    srTitle = `Lookbook ${b.name}`;
    chip = (
      <span className="flex gap-2">
        <Link to="/brands/$brandSlug" params={{ brandSlug: b.slug }} className="pill">{b.name}</Link>
        <Link to="/lookbook" className="pill" aria-label="Afficher tous les looks">Tous les looks ×</Link>
      </span>
    );
  }

  const initialIndex = Math.max(0, looks.findIndex((l) => l.slug === look));

  return (
    <>
      <main>
        <RingLookbook
          key={`${c?.id ?? ""}|${b?.id ?? ""}|${look ?? ""}`}
          looks={looks}
          title={title}
          srTitle={srTitle}
          subtitle={subtitle}
          drawerCap={cap}
          initialIndex={initialIndex}
          filterChip={chip}
        />
      </main>
      <SiteFooter />
    </>
  );
}
