import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { SiteShell, SectionHead, Crumbs } from "@/components/site/SiteShell";
import { LookCard } from "@/components/site/cards";
import { ModelFigure, SheetCell } from "@/components/site/media";
import {
  LOOKS,
  MINUS,
  brandOf,
  brandsOfLook,
  collectionOf,
  cutoutOf,
  getLook,
  lookSubtotal,
  money,
  pad,
  productsOfLook,
  kindLabel,
} from "@/data/catalog";

export const Route = createFileRoute("/looks/$lookSlug")({
  loader: ({ params }) => {
    const look = getLook(params.lookSlug);
    if (!look) throw notFound();
    return { look };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Look indisponible — MARQ’CI" }, { name: "robots", content: "noindex" }] };
    const { look } = loaderData;
    const items = productsOfLook(look).map((p) => p.name).join(", ");
    const title = `Look ${pad(look.n)} : ${look.name} — MARQ’CI`;
    const desc = `${look.note} Avec ${items}.`;
    const img = cutoutOf(look, 914);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:image", content: img },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: img },
      ],
    };
  },
  component: LookPage,
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="serif text-5xl">Ce look est introuvable</h1>
        <Link to="/looks" className="pill mt-8">Tous les looks</Link>
      </div>
    </SiteShell>
  ),
});

function LookPage() {
  const { look } = Route.useLoaderData();
  const products = productsOfLook(look);
  const brands = brandsOfLook(look);
  const sub = lookSubtotal(look);
  const prev = LOOKS[(look.n - 2 + LOOKS.length) % LOOKS.length]!;
  const next = LOOKS[look.n % LOOKS.length]!;
  const related = LOOKS.filter((l) => l.n !== look.n && brandsOfLook(l).some((b) => brands.includes(b))).slice(0, 4);

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1440px] px-4 pt-6 md:px-8">
        <Crumbs items={[
          { label: "Accueil", link: <Link to="/" className="hover:text-ink">Accueil</Link> },
          { label: "Looks", link: <Link to="/looks" className="hover:text-ink">Looks</Link> },
          { label: look.name },
        ]} />
      </div>
      <section className="mx-auto grid max-w-[1440px] gap-10 px-4 py-8 md:px-8 lg:grid-cols-2">
        <div className="relative flex min-h-[560px] items-end justify-center border border-dashed border-ink bg-studio pb-10 pt-16">
          <span className="cap absolute left-4 top-4">Look {pad(look.n)} / {pad(LOOKS.length)}</span>
          <ModelFigure look={look} height="min(70vh, 640px)" eager sizes="(max-width: 809px) 300px, 420px">
            <div className="tags">
              {look.tags.map(([x, y], k) => {
                const p = products[k]!;
                return (
                  <Link
                    key={p.slug}
                    to="/products/$productSlug"
                    params={{ productSlug: p.slug }}
                    className="tag"
                    style={{ left: `${x}%`, top: `${y}%`, "--pi": k + 1 } as CSSProperties}
                    aria-label={`${pad(k + 1)}: ${p.name}, ${money(p.price)}`}
                  >
                    <span className="dotnum">{pad(k + 1)}</span>
                    <span className="tag__tip">
                      <b>{p.name}</b>
                      <span>{money(p.price)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </ModelFigure>
        </div>

        <div className="flex flex-col">
          <p className="cap text-mute">Look éditorial · Vol. 01</p>
          <h1 className="display mt-3 text-6xl leading-[.9] md:text-8xl">
            {pad(look.n)}. <i>{look.name}</i>
          </h1>
          <p className="mt-6 max-w-md text-lg text-mute">{look.note}</p>
          <p className="cap mt-6 flex flex-wrap gap-2">
            <span className="text-mute">Marques :</span>
            {brands.map((b) => (
              <Link key={b.id} to="/brands/$brandSlug" params={{ brandSlug: b.slug }} className="underline-offset-4 hover:underline">
                {b.name}
              </Link>
            ))}
          </p>

          <ul className="mt-8 border-t border-dashed border-ink">
            {products.map((p, k) => {
              const brand = brandOf(p);
              const col = collectionOf(p);
              return (
                <li key={p.slug} className="grid grid-cols-[24px_72px_minmax(0,1fr)_auto] items-center gap-4 border-b border-dashed border-ink py-4">
                  <span className="cap self-start">{pad(k + 1)}</span>
                  <Link to="/products/$productSlug" params={{ productSlug: p.slug }} className="relative block aspect-square overflow-hidden rounded-full bg-paper">
                    <SheetCell product={p} w={600} />
                  </Link>
                  <div className="min-w-0">
                    <Link to="/products/$productSlug" params={{ productSlug: p.slug }} className="cap block hover:underline hover:underline-offset-4">
                      {p.name}
                    </Link>
                    <p className="cap mt-1 text-mute">
                      {kindLabel(p.kind)} ·{" "}
                      <Link to="/brands/$brandSlug" params={{ brandSlug: brand.slug }} className="hover:text-ink">{brand.name}</Link>{" "}
                      ·{" "}
                      <Link to="/collections/$collectionSlug" params={{ collectionSlug: col.slug }} className="hover:text-ink">{col.name}</Link>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm italic tabular-nums">{money(p.price)}</span>
                    <Link to="/products/$productSlug" params={{ productSlug: p.slug }} className="pill !min-h-7 !px-3">Voir</Link>
                  </div>
                </li>
              );
            })}
          </ul>

          <dl className="mt-6 flex flex-col gap-1">
            <div className="flex justify-between"><dt className="cap">Sous-total</dt><dd className="text-sm tabular-nums">{money(sub)}</dd></div>
            <div className="flex justify-between"><dt className="cap">Look complet {MINUS}10 %</dt><dd className="text-sm tabular-nums">{MINUS}{money(sub * 0.1)}</dd></div>
            <div className="display mt-2 flex justify-between border-t border-dashed border-ink pt-3 text-4xl"><dt>Total</dt><dd>{money(sub * 0.9)}</dd></div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/lookbook" search={{ look: look.slug }} className="pill is-on">Acheter ce look dans le cercle</Link>
            <Link to="/looks/$lookSlug" params={{ lookSlug: prev.slug }} className="pill">← {prev.name}</Link>
            <Link to="/looks/$lookSlug" params={{ lookSlug: next.slug }} className="pill">{next.name} →</Link>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
          <SectionHead cap="Mêmes marques" title="Looks associés" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((l) => <LookCard key={l.n} look={l} />)}
          </div>
        </section>
      )}
    </SiteShell>
  );
}
