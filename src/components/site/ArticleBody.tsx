import { Link } from "@tanstack/react-router";
import { BRANDS, COLLECTIONS, PRODUCTS } from "@/data/catalog";

export interface ArticleView {
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  gallery: string[];
  content: string;
  author: string | null;
  category: string | null;
  published_at: string | null;
  brand_ids: string[];
  collection_ids: string[];
  product_ids: string[];
}

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

/** Article layout shared by the public page and the admin preview. Content HTML is sanitised when saved. */
export function ArticleBody({ a }: { a: ArticleView }) {
  const brands = BRANDS.filter((b) => a.brand_ids.includes(b.id));
  const cols = COLLECTIONS.filter((c) => a.collection_ids.includes(c.id));
  const prods = PRODUCTS.filter((p) => a.product_ids.includes(p.id));
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:px-0">
      <p className="cap text-mute">
        {[a.category, formatDate(a.published_at), a.author && `Par ${a.author}`].filter(Boolean).join(" · ")}
      </p>
      <h1 className="serif mt-4 text-[clamp(44px,7vw,96px)] leading-[.9]">{a.title}</h1>
      {a.subtitle && <p className="mt-5 text-lg text-mute">{a.subtitle}</p>}
      {a.cover_url && <img src={a.cover_url} alt={a.title} className="mt-8 block w-full border border-dashed border-ink object-cover" />}
      <div className="article-body mt-10" dangerouslySetInnerHTML={{ __html: a.content }} />
      {a.gallery.length > 0 && (
        <div className="mt-10 grid grid-cols-2 gap-3">
          {a.gallery.map((u, i) => (
            <img key={u} src={u} alt={`${a.title} — image ${i + 1}`} loading="lazy" className="block w-full border border-dashed border-ink object-cover" />
          ))}
        </div>
      )}
      {(brands.length > 0 || cols.length > 0 || prods.length > 0) && (
        <div className="mt-12 flex flex-wrap gap-2 border-t border-dashed border-ink pt-6">
          {brands.map((b) => <Link key={b.id} to="/brands/$brandSlug" params={{ brandSlug: b.slug }} className="pill">{b.name}</Link>)}
          {cols.map((c) => <Link key={c.id} to="/collections/$collectionSlug" params={{ collectionSlug: c.slug }} className="pill">{c.name}</Link>)}
          {prods.map((p) => <Link key={p.id} to="/products/$productSlug" params={{ productSlug: p.slug }} className="pill">{p.name}</Link>)}
        </div>
      )}
    </article>
  );
}
