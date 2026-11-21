import { z } from "zod";
import { PRODUCTS, availabilityOf, productsOfCategory, sizeAvailable, type Product } from "@/data/catalog";

export const PRICE_BUCKETS = [
  { value: "under-45000", label: "Moins de 45 000 FCFA", test: (p: number) => p < 45000 },
  { value: "45000-75000", label: "45 000 – 75 000 FCFA", test: (p: number) => p >= 45000 && p <= 75000 },
  { value: "over-75000", label: "Plus de 75 000 FCFA", test: (p: number) => p > 75000 },
] as const;

export const SORTS = [
  { value: "featured", label: "Sélection" },
  { value: "new", label: "Plus récents" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
] as const;

// URL values like ?size=42 arrive as numbers, so sizes are coerced; invalid values are dropped.
export const shopSearchSchema = z.object({
  brand: z.coerce.string().optional().catch(undefined),
  price: z.enum(["under-45000", "45000-75000", "over-75000"]).optional().catch(undefined),
  size: z.coerce.string().optional().catch(undefined),
  availability: z.enum(["in-stock", "low"]).optional().catch(undefined),
  new: z.boolean().optional().catch(undefined),
  sort: z.enum(["featured", "new", "price-asc", "price-desc"]).optional().catch(undefined),
});
export type ShopSearch = z.infer<typeof shopSearchSchema>;

/** Filter and sort a category's products. brand may be a comma-separated list of brand ids. */
export function filterProducts(categorySlug: string, f: ShopSearch): Product[] {
  const brands = f.brand ? f.brand.split(",").filter(Boolean) : [];
  const bucket = PRICE_BUCKETS.find((b) => b.value === f.price);
  let list = productsOfCategory(categorySlug).filter((p) => {
    if (brands.length && !brands.includes(p.brandId)) return false;
    if (bucket && !bucket.test(p.price)) return false;
    if (f.size && !sizeAvailable(p, f.size)) return false;
    if (f.availability === "in-stock" && availabilityOf(p) === "sold-out") return false;
    if (f.availability === "low" && availabilityOf(p) !== "low") return false;
    if (f.new && !p.isNew) return false;
    return true;
  });
  const order = (p: Product) => PRODUCTS.indexOf(p);
  switch (f.sort) {
    case "new":
      list = [...list].sort((a, b) => b.arrived.localeCompare(a.arrived) || order(a) - order(b));
      break;
    case "price-asc":
      list = [...list].sort((a, b) => a.price - b.price || order(a) - order(b));
      break;
    case "price-desc":
      list = [...list].sort((a, b) => b.price - a.price || order(a) - order(b));
      break;
  }
  return list;
}

/** Sizes that exist for a category's products (in display order). */
export function sizesForCategory(categorySlug: string): string[] {
  const set = new Set(productsOfCategory(categorySlug).flatMap((p) => p.sizes));
  const order = ["S", "M", "L", "XL", "40", "41", "42", "43", "44", "45", "Taille unique"];
  return order.filter((s) => set.has(s));
}
