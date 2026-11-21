/**
 * Published admin content → catalogue.
 *
 * The public site reads the shared catalogue arrays in `src/data/catalog.ts`.
 * Content published from /admin is mapped to the same shapes and placed in front
 * of the built-in demonstration content (demo items whose slug is taken are dropped).
 */
import type { Tables } from "@/integrations/supabase/types";
import {
  BRANDS,
  CATEGORIES,
  COLLECTIONS,
  DEMO,
  LOOKS,
  ONE,
  PRODUCTS,
  type Brand,
  type Collection,
  type Look,
  type Product,
} from "@/data/catalog";

type BrandRow = Tables<"brands">;
type CollectionRow = Tables<"collections">;
type ProductRow = Tables<"products">;
type ModelRow = Tables<"models">;
type LookRow = Tables<"looks">;
type LookItemRow = Tables<"look_items">;
type ArticleRow = Tables<"articles">;
type HomeRow = Tables<"home_settings">;

export type ArticleSummary = Omit<ArticleRow, "content">;

export interface PublishedData {
  brands: BrandRow[];
  collections: CollectionRow[];
  products: ProductRow[];
  looks: (LookRow & { model: ModelRow | null; items: LookItemRow[] })[];
  articles: ArticleSummary[];
  home: HomeRow | null;
}

export const EMPTY_PUBLISHED: PublishedData = { brands: [], collections: [], products: [], looks: [], articles: [], home: null };

/** Stock is not tracked for admin garments: every listed size is available. */
const UNTRACKED_STOCK = 10;

export function mapBrand(r: BrandRow): Brand {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    city: r.city ?? "",
    founded: r.founded ?? 0,
    tagline: r.tagline ?? "",
    description: r.description ?? "",
    campaign: { title: r.name, copy: r.editorial ?? r.tagline ?? "", image: r.cover_url ?? r.logo_url ?? "" },
    logo: r.logo_url ?? undefined,
    editorial: r.editorial ?? undefined,
    extraInfo: r.extra_info ?? undefined,
  };
}

export function mapCollection(r: CollectionRow): Collection {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    brandId: r.brand_id,
    drop: r.season ?? "",
    isNew: r.is_new,
    description: r.description ?? "",
    cover: r.cover_url ?? undefined,
    gallery: r.gallery,
  };
}

export function mapProduct(r: ProductRow, collection: Collection): Product {
  const kind = CATEGORIES.find((c) => c.slug === r.category)?.kind ?? "Top";
  const sizes = r.sizes.length ? r.sizes : ONE;
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    kind,
    categorySlug: r.category,
    brandId: r.brand_id,
    collectionId: r.collection_id,
    price: r.price,
    sizes,
    stock: Object.fromEntries(sizes.map((s) => [s, UNTRACKED_STOCK])),
    isNew: collection.isNew,
    arrived: r.created_at.slice(0, 10),
    colour: r.colors.join(" / "),
    material: r.material ?? "",
    description: r.description ?? "",
    lookN: 0,
    item: 0,
    image: r.main_image ?? r.images[0] ?? undefined,
    images: r.images,
    reference: r.reference ?? undefined,
  };
}

export function mapLook(r: PublishedData["looks"][number], productIds: Set<string>): Look | null {
  if (!r.model?.image_url) return null;
  const items = [...r.items].filter((i) => productIds.has(i.product_id)).sort((a, b) => a.position - b.position);
  if (!items.length) return null;
  return {
    n: 0,
    slug: r.slug,
    name: r.title,
    foot: Number(r.model.foot),
    tags: items.map((i) => [Number(i.x), Number(i.y)] as [number, number]),
    productIds: items.map((i) => i.product_id),
    note: r.description ?? "",
    image: r.model.image_url,
    dbId: r.id,
  };
}

const bySort = <T extends { sort_order: number; created_at: string }>(a: T, b: T) =>
  a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);

const mergeBySlug = <T extends { slug: string }>(first: T[], rest: T[]) => {
  const taken = new Set(first.map((x) => x.slug));
  return [...first, ...rest.filter((x) => !taken.has(x.slug))];
};

/** Pure: published rows + demo content → the merged catalogue. Only items whose whole chain is published are kept. */
export function mergeCatalog(data: PublishedData) {
  const brands = [...data.brands].sort(bySort).map(mapBrand);
  const brandIds = new Set(brands.map((b) => b.id));
  const collections = [...data.collections].sort(bySort).filter((c) => brandIds.has(c.brand_id)).map(mapCollection);
  const colById = new Map(collections.map((c) => [c.id, c]));
  const products = [...data.products]
    .sort(bySort)
    .filter((p) => brandIds.has(p.brand_id) && colById.get(p.collection_id)?.brandId === p.brand_id)
    .map((p) => mapProduct(p, colById.get(p.collection_id)!));
  const productIds = new Set(products.map((p) => p.id));
  const looks = [...data.looks].sort(bySort).map((l) => mapLook(l, productIds)).filter((l): l is Look => Boolean(l));

  const allLooks = mergeBySlug(looks, DEMO.looks).map((l, i) => ({ ...l, n: i + 1 }));
  return {
    brands: mergeBySlug(brands, DEMO.brands),
    collections: mergeBySlug(collections, DEMO.collections),
    products: mergeBySlug(products, DEMO.products),
    looks: allLooks,
  };
}

/** Published articles and home-page slots (not part of the shop catalogue). */
export const ARTICLES: ArticleSummary[] = [];
export const HOME: { current: HomeRow | null } = { current: null };

let appliedKey = "";

/** Replaces the shared catalogue arrays in place with demo + published content. Idempotent per payload. */
export function applyPublished(data: PublishedData) {
  const key = JSON.stringify([
    data.brands.map((b) => b.id + b.updated_at),
    data.collections.map((c) => c.id + c.updated_at),
    data.products.map((p) => p.id + p.updated_at),
    data.looks.map((l) => l.id + l.updated_at + l.items.length + (l.model?.updated_at ?? "")),
    data.articles.map((a) => a.id + a.updated_at),
    data.home?.updated_at ?? "",
  ]);
  if (key === appliedKey) return;
  appliedKey = key;
  const m = mergeCatalog(data);
  BRANDS.splice(0, BRANDS.length, ...m.brands);
  COLLECTIONS.splice(0, COLLECTIONS.length, ...m.collections);
  PRODUCTS.splice(0, PRODUCTS.length, ...m.products);
  LOOKS.splice(0, LOOKS.length, ...m.looks);
  ARTICLES.splice(0, ARTICLES.length, ...data.articles);
  HOME.current = data.home;
}
