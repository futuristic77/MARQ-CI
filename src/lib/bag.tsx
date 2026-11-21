import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getProduct } from "@/data/catalog";

export interface BagItem {
  productSlug: string;
  size: string;
  qty: number;
  lookSlug?: string;
}
export type BagEntry = Omit<BagItem, "qty">;

interface BagCtx {
  items: BagItem[];
  count: number;
  ready: boolean;
  subtotal: number;
  add: (entries: BagEntry[], toastMessage?: string) => void;
  setQty: (productSlug: string, size: string, qty: number) => void;
  remove: (productSlug: string, size: string) => void;
  clear: () => void;
  has: (productSlug: string) => boolean;
  toast: (message: string) => void;
}

const Ctx = createContext<BagCtx | null>(null);
const KEY = "nowhere.bag.v1";

/** Pure reducer so the bag rules can be tested. */
export function addEntries(items: BagItem[], entries: BagEntry[]): BagItem[] {
  const next = items.map((i) => ({ ...i }));
  for (const e of entries) {
    const hit = next.find((i) => i.productSlug === e.productSlug && i.size === e.size);
    if (hit) hit.qty += 1;
    else next.push({ ...e, qty: 1 });
  }
  return next;
}

export function bagSubtotal(items: BagItem[]) {
  return items.reduce((s, i) => s + (getProduct(i.productSlug)?.price ?? 0) * i.qty, 0);
}

export function BagProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BagItem[];
        setItems(parsed.filter((i) => getProduct(i.productSlug)));
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const toast = useCallback((message: string) => {
    setToastMsg(message);
    setToastOn(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2500);
  }, []);

  const add = useCallback(
    (entries: BagEntry[], toastMessage?: string) => {
      if (!entries.length) return;
      setItems((cur) => addEntries(cur, entries));
      toast(toastMessage ?? (entries.length > 1 ? "Look ajouté au panier." : "Article ajouté au panier."));
    },
    [toast],
  );

  const value = useMemo<BagCtx>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      ready: hydrated,
      subtotal: bagSubtotal(items),
      add,
      setQty: (slug, size, qty) =>
        setItems((cur) =>
          qty <= 0
            ? cur.filter((i) => !(i.productSlug === slug && i.size === size))
            : cur.map((i) => (i.productSlug === slug && i.size === size ? { ...i, qty } : i)),
        ),
      remove: (slug, size) => setItems((cur) => cur.filter((i) => !(i.productSlug === slug && i.size === size))),
      clear: () => setItems([]),
      has: (slug) => items.some((i) => i.productSlug === slug),
      toast,
    }),
    [items, add, toast, hydrated],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className={`toast${toastOn ? " is-on" : ""}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </Ctx.Provider>
  );
}

export function useBag() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBag must be used inside BagProvider");
  return v;
}
