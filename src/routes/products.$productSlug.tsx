import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { SiteShell, SectionHead, Crumbs } from "@/components/site/SiteShell";
import { LookCard, ProductGrid } from "@/components/site/cards";
import { ModelFigure, SheetCell } from "@/components/site/media";
import {
  AVAILABILITY_LABEL,
  cutoutOf,
  productImage,
  PRODUCTS,
  availabilityOf,
  brandOf,
  categoryOf,
  collectionOf,
  getProduct,
  lookOf,
  looksOfProduct,
  money,
  pad,
  productCrop,
  productsOfLook,
  px,
  sizeAvailable,
} from "@/data/catalog";
import { useBag } from "@/lib/bag";

export const Route = createFileRoute("/products/$productSlug")({
  loader: ({ params }) => {
    const product = getProduct(params.productSlug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Vêtement indisponible — MARQ’CI" }, { name: "robots", content: "noindex" }] };
    const { product } = loaderData;
    const brand = brandOf(product);
    const title = `${product.name} par ${brand.name} — ${money(product.price)} — MARQ’CI`;
    const look = lookOf(product);
    const shot = productImage(product) ?? (look ? cutoutOf(look, 914) : undefined);
    const img = shot && /^https:\/\//.test(shot) ? shot : undefined;
    return {
      meta: [
        { title },
        { name: "description", content: product.description },
        { property: "og:title", content: `${product.name} — ${brand.name}` },
        { property: "og:description", content: product.description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="serif text-5xl">Ce vêtement est introuvable</h1>
        <Link to="/categories/$categorySlug" params={{ categorySlug: "all" }} className="pill mt-8">Voir tous les vêtements</Link>
      </div>
    </SiteShell>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  // remount state when navigating between products
  return <ProductView key={product.slug} slug={product.slug} />;
}

function ProductView({ slug }: { slug: string }) {
  const product = getProduct(slug)!;
  const bag = useBag();
  const brand = brandOf(product);
  const collection = collectionOf(product);
  const category = categoryOf(product);
  const look = lookOf(product);
  const looks = looksOfProduct(product);
  const avail = availabilityOf(product);
  const [view, setView] = useState(0);
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? (product.sizes[0] ?? null) : null);
  const [warn, setWarn] = useState(false);

  // Demo garments: sheet crop + model + detail crop. Uploaded garments: their photos + the model wearing them.
  const photos = [product.image, ...(product.images ?? [])].filter((u, i, a): u is string => Boolean(u) && a.indexOf(u) === i);
  const zoom = 2.6;
  // detail crop: image zoomed `zoom`× the frame height (frame is 3:4, demo cut-out is 1520×2688)
  const sx = (zoom * (1520 / 2688)) / 0.75;
  const pos = (S: number, f: number) => Math.min(100, Math.max(0, ((S * f - 0.5) / (S - 1)) * 100));
  const tagIdx = look ? Math.max(0, look.productIds.indexOf(product.id)) : 0;
  const tag = look?.tags[tagIdx] ?? [50, 50];
  const detailPos = `${pos(sx, tag[0] / 100)}% ${pos(zoom, tag[1] / 100)}%`;

  type View = { label: string; node: ReactNode; thumb: ReactNode };
  const views: View[] = [];
  if (photos.length) {
    photos.forEach((src, i) =>
      views.push({
        label: photos.length > 1 ? `Photo ${i + 1}` : "Produit",
        node: <img src={src} alt={`${product.name} — photo ${i + 1}`} className="block h-full w-full bg-paper object-contain" />,
        thumb: <img src={src} alt="" className="absolute inset-0 h-full w-full bg-paper object-contain" loading="lazy" />,
      }),
    );
  } else {
    const { sheet, row, col } = productCrop(product);
    views.push({
      label: "Produit",
      node: <span className="relative block h-full w-full overflow-hidden bg-paper"><SheetCell product={product} w={1800} /></span>,
      thumb: <span className="sheet-cell" style={{ backgroundImage: `url('${px(sheet, 600)}')`, backgroundPosition: `${col * 50}% ${row * 50}%` }} />,
    });
  }
  if (look) {
    views.push({
      label: "Sur mannequin",
      node: (
        <span className="flex h-full w-full items-end justify-center bg-studio pb-[6%]">
          <ModelFigure look={look} height="86%" eager sizes="(max-width: 809px) 300px, 460px" />
        </span>
      ),
      thumb: (
        <span className="absolute inset-0 flex items-end justify-center bg-studio pb-1">
          <img src={cutoutOf(look, 571)} alt="" className="h-[92%] w-auto object-contain" loading="lazy" />
        </span>
      ),
    });
    if (!look.image) {
      const detail = (w: number) => ({
        backgroundImage: `url('${cutoutOf(look, w)}')`,
        backgroundSize: `${sx * 100}% auto`,
        backgroundPosition: detailPos,
      });
      views.push({
        label: "Détail",
        node: <span role="img" aria-label={`Détail de ${product.name}, porté dans ${look.name}`} className="block h-full w-full bg-studio bg-no-repeat" style={detail(1400)} />,
        thumb: <span className="absolute inset-0 bg-studio bg-no-repeat" style={detail(571)} />,
      });
    }
  }

  const completeLook = look ? productsOfLook(look).filter((p) => p.id !== product.id) : [];
  const related = [
    ...PRODUCTS.filter((p) => p.collectionId === product.collectionId && p.id !== product.id),
    ...PRODUCTS.filter((p) => p.categorySlug === product.categorySlug && p.collectionId !== product.collectionId && p.id !== product.id),
  ].slice(0, 4);

  const add = () => {
    if (!size) {
      setWarn(true);
      return;
    }
    bag.add([{ productSlug: product.slug, size }], "Vêtement ajouté au panier.");
  };

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1440px] px-4 pt-6 md:px-8">
        <Crumbs items={[
          { label: "Accueil", link: <Link to="/" className="hover:text-ink">Accueil</Link> },
          { label: category.name, link: <Link to="/categories/$categorySlug" params={{ categorySlug: category.slug }} className="hover:text-ink">{category.name}</Link> },
          { label: brand.name, link: <Link to="/brands/$brandSlug" params={{ brandSlug: brand.slug }} className="hover:text-ink">{brand.name}</Link> },
          { label: product.name },
        ]} />
      </div>

      <section className="mx-auto grid max-w-[1440px] gap-10 px-4 py-8 md:px-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* Gallery */}
        <div className="flex flex-col gap-3 md:flex-row-reverse">
          <div className="relative aspect-[3/4] flex-1 overflow-hidden border border-dashed border-ink" aria-live="polite">
            {views[view]!.node}
            <span className="cap absolute left-3 top-3 rounded-full border border-dashed border-ink bg-paper px-2 py-0.5">
              {views[view]!.label}
            </span>
          </div>
          <div className="flex gap-3 md:w-24 md:flex-col" role="group" aria-label="Galerie">
            {views.map((v, i) => (
              <button
                key={v.label}
                type="button"
                onClick={() => setView(i)}
                aria-pressed={view === i}
                aria-label={`Afficher l’image : ${v.label.toLowerCase()}`}
                className={`relative aspect-[3/4] w-20 overflow-hidden border md:w-full ${view === i ? "border-solid border-ink" : "border-dashed border-ink opacity-70 hover:opacity-100"}`}
              >
                {v.thumb}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <Link to="/brands/$brandSlug" params={{ brandSlug: brand.slug }} className="cap underline-offset-4 hover:underline">
            {brand.name}
          </Link>
          <h1 className="display mt-3 text-5xl leading-[.9] md:text-6xl">{product.name}</h1>
          <p className="cap mt-3 text-mute">
            <Link to="/collections/$collectionSlug" params={{ collectionSlug: collection.slug }} className="hover:text-ink">
              {collection.name}
            </Link>{" "}
            · {collection.drop}
            {product.isNew && <span className="ml-2 rounded-full bg-ink px-2 text-paper">Nouveau</span>}
          </p>
          <p className="display mt-6 text-4xl">
            <i>{money(product.price)}</i>
          </p>
          <p className="cap mt-2">
            <span className={avail === "in-stock" ? "" : "underline underline-offset-4"}>{AVAILABILITY_LABEL[avail]}</span>
          </p>
          <p className="mt-6 max-w-md text-mute">{product.description}</p>
          <dl className="mt-6 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
            <dt className="cap text-mute">Couleur</dt>
            <dd>{product.colour}</dd>
            <dt className="cap text-mute">Matière</dt>
            <dd>{product.material}</dd>
            <dt className="cap text-mute">Catégorie</dt>
            <dd>
              <Link to="/categories/$categorySlug" params={{ categorySlug: category.slug }} className="underline-offset-4 hover:underline">
                {category.name}
              </Link>
            </dd>
          </dl>

          <fieldset className="mt-8 border-0 p-0">
            <legend className="cap mb-3">Taille {size && <span className="text-mute">— {size}</span>}</legend>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const left = product.stock[s] ?? 0;
                return (
                  <button
                    key={s}
                    type="button"
                    className="size relative"
                    aria-pressed={size === s}
                    disabled={!sizeAvailable(product, s)}
                    aria-label={left === 0 ? `${s}, épuisé` : left <= 2 ? `${s}, plus que ${left}` : s}
                    onClick={() => {
                      setSize(s);
                      setWarn(false);
                    }}
                  >
                    {s}
                    {left > 0 && left <= 2 && <span className="absolute -right-1 -top-2 rounded-full bg-ink px-1 text-[9px] leading-[14px] text-paper">{left}</span>}
                  </button>
                );
              })}
            </div>
            {warn && <p className="cap mt-3" role="alert">Choisissez d’abord une taille.</p>}
          </fieldset>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button type="button" className="slip__cta sm:flex-1" onClick={add} disabled={avail === "sold-out"}>
              {bag.has(product.slug) ? "Ajouter un autre au panier" : "Ajouter au panier"}
            </button>
            <Link to="/bag" className="pill !min-h-12">Voir le panier ({bag.count})</Link>
          </div>
          {product.demo && <p className="cap mt-4 text-mute">Vêtement de démonstration — données d’exemple, non disponible à la vente.</p>}

          {look && (
          <div className="mt-10 border-t border-dashed border-ink pt-6">
            <p className="cap text-mute">Compléter le look — {look.name}</p>
            <ul className="mt-3 flex flex-col">
              {completeLook.map((p) => (
                <li key={p.slug} className="flex items-center gap-4 border-b border-dashed border-ink py-3">
                  <Link to="/products/$productSlug" params={{ productSlug: p.slug }} className="relative block size-14 shrink-0 overflow-hidden rounded-full bg-paper">
                    <SheetCell product={p} w={600} />
                  </Link>
                  <Link to="/products/$productSlug" params={{ productSlug: p.slug }} className="cap flex-1 hover:underline hover:underline-offset-4">
                    {p.name}
                  </Link>
                  <Link to="/brands/$brandSlug" params={{ brandSlug: brandOf(p).slug }} className="cap text-mute hover:text-ink">
                    {brandOf(p).name}
                  </Link>
                  <span className="text-sm italic tabular-nums">{money(p.price)}</span>
                </li>
              ))}
            </ul>
            <Link to="/lookbook" search={{ look: look.slug }} className="pill mt-4">
              Voir {pad(look.n)}. {look.name} dans le cercle
            </Link>
          </div>
          )}
        </div>
      </section>

      {looks.length > 0 && <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Éditorial" title="Porté dans" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {looks.map((l) => <LookCard key={l.n} look={l} />)}
        </div>
      </section>}

      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Vêtements associés" title="Vous aimerez aussi" />
        <ProductGrid products={related} />
      </section>
    </SiteShell>
  );
}
