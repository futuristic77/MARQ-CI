import { describe, expect, it } from "vitest";
import {
  LOOKS,
  MINUS,
  PRODUCTS,
  brandOf,
  collectionOf,
  defaultSize,
  getProduct,
  lookSubtotal,
  looksOfBrand,
  money,
  productCrop,
  productsOfLook,
  sizeAvailable,
} from "@/data/catalog";
import { addEntries } from "@/lib/bag";
import { filterProducts, shopSearchSchema } from "@/lib/filters";
import { shortest } from "@/lib/ring";

// Prices are in Franc CFA: French thousands spacing (narrow no-break space), no decimals.
const F = (s: string) => s.replace(/ /g, "\u202f") + "\u00a0FCFA";

describe("money format (FCFA)", () => {
  it("groups thousands with a narrow space and appends FCFA", () => {
    expect(money(85000)).toBe(F("85 000"));
    expect(money(8500)).toBe(F("8 500"));
    expect(money(950)).toBe(F("950"));
  });
  it("never shows decimals", () => {
    expect(money(76499.6)).toBe(F("76 500"));
  });
});

describe("whole-fit receipt totals (subtotal × 0.9)", () => {
  const expected: [number, string, string, string][] = [
    [1, F("85 000"), F("8 500"), F("76 500")],
    [2, F("194 500"), F("19 450"), F("175 050")],
    [3, F("164 500"), F("16 450"), F("148 050")],
    [4, F("170 500"), F("17 050"), F("153 450")],
    [5, F("215 000"), F("21 500"), F("193 500")],
    [6, F("240 000"), F("24 000"), F("216 000")],
    [7, F("177 500"), F("17 750"), F("159 750")],
    [8, F("123 500"), F("12 350"), F("111 150")],
    [9, F("176 500"), F("17 650"), F("158 850")],
  ];
  for (const [n, sub, off, total] of expected) {
    it(`look ${n}`, () => {
      const look = LOOKS[n - 1]!;
      const s = lookSubtotal(look);
      expect(money(s)).toBe(sub);
      expect(MINUS + money(s * 0.1)).toBe(MINUS + off);
      expect(money(s * 0.9)).toBe(total);
    });
  }
});

describe("default sizes", () => {
  it("clothes default to M, shoes to 41, accessories to Taille unique", () => {
    expect(defaultSize(getProduct("ribbed-tank-top")!.sizes)).toBe("M");
    expect(defaultSize(getProduct("suede-moccasin")!.sizes)).toBe("41");
    expect(defaultSize(getProduct("braided-belt")!.sizes)).toBe("Taille unique");
  });
  it("every default size is in stock", () => {
    for (const p of PRODUCTS) expect(sizeAvailable(p, defaultSize(p.sizes))).toBe(true);
  });
});

describe("one connected catalogue", () => {
  it("has nine looks with three products each, 27 products total", () => {
    expect(LOOKS).toHaveLength(9);
    expect(PRODUCTS).toHaveLength(27);
    for (const l of LOOKS) expect(productsOfLook(l)).toHaveLength(3);
  });
  it("every product resolves to a brand and a collection of the same brand", () => {
    for (const p of PRODUCTS) expect(collectionOf(p).brandId).toBe(brandOf(p).id);
  });
  it("crops the right contact-sheet cell", () => {
    expect(productCrop({ lookN: 1, item: 0 })).toMatchObject({ row: 0, col: 0 });
    expect(productCrop({ lookN: 5, item: 2 })).toMatchObject({ row: 1, col: 2 });
    expect(productCrop({ lookN: 9, item: 1 })).toMatchObject({ row: 2, col: 1 });
  });
  it("brand lookbook only contains looks wearing that brand", () => {
    const looks = looksOfBrand("postcard-club");
    expect(looks.map((l) => l.n)).toEqual([1, 2, 8]);
  });
});

describe("shop filters", () => {
  it("filters by price bucket", () => {
    const r = filterProducts("all", { price: "under-45000" });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => p.price < 45000)).toBe(true);
  });
  it("filters by brand and in-stock size", () => {
    const r = filterProducts("shoes", { brand: "analog-foot", size: "42" });
    expect(r.every((p) => p.brandId === "analog-foot" && (p.stock["42"] ?? 0) > 0)).toBe(true);
  });
  it("new arrivals only include Drop 02 pieces", () => {
    expect(filterProducts("all", { new: true }).every((p) => p.isNew)).toBe(true);
  });
  it("sorts by price", () => {
    const r = filterProducts("all", { sort: "price-asc" });
    expect(r[0]!.price).toBe(19000);
    expect(r[r.length - 1]!.price).toBe(93500);
  });
  it("accepts a numeric size from the address bar", () => {
    expect(shopSearchSchema.parse({ size: 42 }).size).toBe("42");
  });
});

describe("ring and bag rules", () => {
  it("rotates the shortest way round", () => {
    expect(shortest(8, 0, 9)).toBe(-1);
    expect(shortest(3, 0, 9)).toBe(3);
  });
  it("adding the same product and size twice increases quantity", () => {
    const once = addEntries([], [{ productSlug: "rugby-top", size: "M" }]);
    const twice = addEntries(once, [{ productSlug: "rugby-top", size: "M" }]);
    expect(twice).toEqual([{ productSlug: "rugby-top", size: "M", qty: 2 }]);
  });
});
