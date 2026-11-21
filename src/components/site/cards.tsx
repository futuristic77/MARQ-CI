import { Link } from "@tanstack/react-router";
import {
  AVAILABILITY_LABEL,
  availabilityOf,
  brandOf,
  brandsOfLook,
  looksOfCollection,
  money,
  pad,
  productsOfBrand,
  productsOfCollection,
  looksOfBrand,
  type Brand,
  type Collection,
  type Look,
  type Product,
} from "@/data/catalog";
import { ModelFigure, SheetCell } from "./media";

export function ProductCard({ product, showBrand = true }: { product: Product; showBrand?: boolean }) {
  const brand = brandOf(product);
  const avail = availabilityOf(product);
  return (
    <article className="group flex flex-col gap-3">
      <Link
        to="/products/$productSlug"
        params={{ productSlug: product.slug }}
        className="relative block aspect-square overflow-hidden border border-dashed border-ink bg-paper"
        aria-label={`${product.name} — ${money(product.price)}`}
      >
        <SheetCell product={product} className="group-hover:scale-[1.3]" />
        <span className="absolute left-3 top-3 flex gap-1">
          {product.isNew && <span className="cap rounded-full bg-ink px-2 py-0.5 text-paper">Nouveau</span>}
          {avail !== "in-stock" && (
            <span className="cap rounded-full border border-dashed border-ink bg-paper px-2 py-0.5">{AVAILABILITY_LABEL[avail]}</span>
          )}
        </span>
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/products/$productSlug" params={{ productSlug: product.slug }} className="cap block truncate hover:underline hover:underline-offset-4">
            {product.name}
          </Link>
          {showBrand && (
            <Link to="/brands/$brandSlug" params={{ brandSlug: brand.slug }} className="cap block text-mute hover:text-ink">
              {brand.name}
            </Link>
          )}
        </div>
        <span className="text-xs italic tabular-nums">{money(product.price)}</span>
      </div>
    </article>
  );
}

export function ProductGrid({ products, showBrand = true }: { products: Product[]; showBrand?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} showBrand={showBrand} />
      ))}
    </div>
  );
}

export function LookCard({ look, compact = false }: { look: Look; compact?: boolean }) {
  const brands = brandsOfLook(look);
  return (
    <article className="group flex flex-col">
      <Link
        to="/looks/$lookSlug"
        params={{ lookSlug: look.slug }}
        className="relative flex aspect-[3/4] items-end justify-center overflow-hidden border border-dashed border-ink bg-studio pb-[8%]"
        aria-label={`Look ${pad(look.n)}: ${look.name}`}
      >
        <span className="cap absolute left-3 top-3">{pad(look.n)}</span>
        <ModelFigure look={look} height="auto" className="w-[46%] transition-transform duration-700 group-hover:-translate-y-2" />
      </Link>
      <div className="mt-3 flex flex-col gap-1">
        <Link to="/looks/$lookSlug" params={{ lookSlug: look.slug }} className="display text-xl leading-none hover:italic">
          {look.name}
        </Link>
        {!compact && (
          <p className="cap text-mute">
            {brands.map((b, i) => (
              <span key={b.id}>
                {i > 0 && " · "}
                <Link to="/brands/$brandSlug" params={{ brandSlug: b.slug }} className="hover:text-ink">
                  {b.name}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}

/** Studio card showing up to three models wearing the given looks. Needs an aspect ratio class. */
export function LookStrip({ looks, className = "" }: { looks: Look[]; className?: string }) {
  const shown = looks.slice(0, 3);
  return (
    <div className={`relative flex items-end justify-center overflow-hidden bg-studio pb-[7%] ${className}`}>
      {shown.map((l, i) => (
        <ModelFigure
          key={l.n}
          look={l}
          height={shown.length === 1 ? "78%" : i === 1 ? "72%" : "60%"}
          className={shown.length > 1 ? "-mx-[5%] shrink-0" : "shrink-0"}
          sizes="240px"
        />
      ))}
    </div>
  );
}

export function CollectionCard({ collection }: { collection: Collection }) {
  const brand = brandOf(collection);
  const looks = looksOfCollection(collection.id);
  const count = productsOfCollection(collection.id).length;
  return (
    <article className="group flex flex-col">
      <Link
        to="/collections/$collectionSlug"
        params={{ collectionSlug: collection.slug }}
        className="relative block overflow-hidden border border-dashed border-ink"
        aria-label={`${collection.name} par ${brand.name}`}
      >
        {looks.length === 0 && collection.cover ? (
          <img src={collection.cover} alt={collection.name} loading="lazy" className="block aspect-[4/3] w-full bg-studio object-cover" />
        ) : (
          <LookStrip looks={looks} className="aspect-[4/3]" />
        )}
        <span className="absolute left-3 top-3 flex gap-1">
          {collection.isNew && <span className="cap rounded-full bg-ink px-2 py-0.5 text-paper">Nouveau</span>}
          <span className="cap rounded-full border border-dashed border-ink bg-paper px-2 py-0.5">{collection.drop}</span>
        </span>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <Link to="/collections/$collectionSlug" params={{ collectionSlug: collection.slug }} className="serif text-3xl hover:italic">
            {collection.name}
          </Link>
          <Link to="/brands/$brandSlug" params={{ brandSlug: brand.slug }} className="cap mt-1 block text-mute hover:text-ink">
            {brand.name}
          </Link>
        </div>
        <span className="cap text-mute">{count} vêtements</span>
      </div>
    </article>
  );
}

export function BrandCard({ brand }: { brand: Brand }) {
  const looks = looksOfBrand(brand.id);
  const count = productsOfBrand(brand.id).length;
  return (
    <article className="group flex flex-col">
      <Link
        to="/brands/$brandSlug"
        params={{ brandSlug: brand.slug }}
        className="relative block overflow-hidden border border-dashed border-ink"
        aria-label={brand.name}
      >
        {looks.length === 0 && brand.campaign.image ? (
          <img src={brand.campaign.image} alt={brand.name} loading="lazy" className="block aspect-[4/5] w-full bg-studio object-cover" />
        ) : (
          <LookStrip looks={looks} className="aspect-[4/5]" />
        )}
        <span className="cap absolute left-3 top-3">{[brand.city, brand.founded ? `Fondée en ${brand.founded}` : ""].filter(Boolean).join(" · ")}</span>
      </Link>
      <div className="mt-3">
        <Link to="/brands/$brandSlug" params={{ brandSlug: brand.slug }} className="display block text-3xl leading-none hover:italic">
          {brand.name}
        </Link>
        <p className="mt-2 text-sm text-mute">{brand.tagline}</p>
        <p className="cap mt-2">{count} vêtements · {looks.length} looks</p>
      </div>
    </article>
  );
}

