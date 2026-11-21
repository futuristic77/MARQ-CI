import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { SheetCell } from "@/components/site/media";
import { brandOf, getLook, getProduct, money } from "@/data/catalog";
import { useBag } from "@/lib/bag";

export const Route = createFileRoute("/bag")({
  head: () => ({
    meta: [
      { title: "Panier — MARQ’CI" },
      { name: "description", content: "Retrouvez les vêtements de votre panier MARQ’CI." },
      { property: "og:title", content: "Panier — MARQ’CI" },
      { property: "og:description", content: "Retrouvez les vêtements de votre panier." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BagPage,
});

function BagPage() {
  const bag = useBag();
  const [order, setOrder] = useState<null | { id: string; total: number; count: number }>(null);

  if (order) {
    return (
      <SiteShell>
        <section className="mx-auto max-w-xl px-4 py-20 text-center">
          <p className="cap text-mute">Commande de démonstration {order.id}</p>
          <h1 className="serif mt-4 text-6xl">Merci pour votre visite.</h1>
          <p className="mt-6 text-mute">
            {order.count} vêtement{order.count === 1 ? "" : "s"} · {money(order.total)}. Commande de démonstration — aucun paiement n’a été pris et rien ne sera expédié.
          </p>
          <div className="mt-8 flex justify-center gap-2">
            <Link to="/lookbook" className="pill is-on">Retour au cercle</Link>
            <Link to="/categories/$categorySlug" params={{ categorySlug: "all" }} className="pill">Continuer mes achats</Link>
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-[1100px] px-4 py-12 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-dashed border-ink pb-4">
          <h1 className="display text-5xl md:text-7xl">Panier ({bag.count})</h1>
          {bag.items.length > 0 && (
            <button type="button" className="cap underline underline-offset-4" onClick={bag.clear}>Vider le panier</button>
          )}
        </div>

        {!bag.ready ? (
          <p className="cap text-mute">Chargement de votre panier…</p>
        ) : bag.items.length === 0 ? (
          <div className="border border-dashed border-ink bg-paper px-6 py-16 text-center">
            <p className="serif text-5xl">Votre panier est vide.</p>
            <p className="mt-3 text-mute">Ouvrez un look dans le cercle et touchez un point, ou parcourez la boutique.</p>
            <div className="mt-6 flex justify-center gap-2">
              <Link to="/lookbook" className="pill is-on">Faire tourner le cercle</Link>
              <Link to="/categories/$categorySlug" params={{ categorySlug: "all" }} className="pill">Voir tous les vêtements</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            <ul className="border-t border-dashed border-ink">
              {bag.items.map((it) => {
                const p = getProduct(it.productSlug)!;
                const brand = brandOf(p);
                const look = it.lookSlug ? getLook(it.lookSlug) : undefined;
                return (
                  <li key={`${it.productSlug}-${it.size}`} className="grid grid-cols-[80px_minmax(0,1fr)_auto] gap-4 border-b border-dashed border-ink py-4">
                    <Link to="/products/$productSlug" params={{ productSlug: p.slug }} className="relative block aspect-square overflow-hidden bg-paper">
                      <SheetCell product={p} w={600} />
                    </Link>
                    <div className="min-w-0">
                      <Link to="/products/$productSlug" params={{ productSlug: p.slug }} className="cap block hover:underline hover:underline-offset-4">{p.name}</Link>
                      <Link to="/brands/$brandSlug" params={{ brandSlug: brand.slug }} className="cap block text-mute hover:text-ink">{brand.name}</Link>
                      <p className="cap mt-2">Taille {it.size}</p>
                      {look && (
                        <Link to="/looks/$lookSlug" params={{ lookSlug: look.slug }} className="cap mt-1 block text-mute hover:text-ink">Issu du look : {look.name}</Link>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <button type="button" className="size" aria-label={`Retirer un ${p.name}`} onClick={() => bag.setQty(it.productSlug, it.size, it.qty - 1)}>−</button>
                        <span className="cap w-6 text-center tabular-nums" aria-label="Quantité">{it.qty}</span>
                        <button type="button" className="size" aria-label={`Ajouter un ${p.name}`} onClick={() => bag.setQty(it.productSlug, it.size, it.qty + 1)}>+</button>
                        <button type="button" className="cap ml-3 underline underline-offset-4" onClick={() => bag.remove(it.productSlug, it.size)}>Retirer</button>
                      </div>
                    </div>
                    <span className="text-sm italic tabular-nums">{money(p.price * it.qty)}</span>
                  </li>
                );
              })}
            </ul>
            <aside className="flex h-fit flex-col gap-3 bg-paper p-6">
              <p className="cap text-mute">Récapitulatif</p>
              <div className="flex justify-between"><span className="cap">Sous-total</span><span className="text-sm tabular-nums">{money(bag.subtotal)}</span></div>
              <div className="flex justify-between"><span className="cap">Livraison</span><span className="cap">Offerte</span></div>
              <div className="display flex justify-between border-t border-dashed border-ink pt-3 text-4xl"><span>Total</span><span>{money(bag.subtotal)}</span></div>
              <button
                type="button"
                className="slip__cta mt-2"
                onClick={() => {
                  setOrder({ id: `NW-${String(Date.now()).slice(-6)}`, total: bag.subtotal, count: bag.count });
                  bag.clear();
                }}
              >
                Passer la commande de démonstration
              </button>
              <p className="cap text-mute">Boutique de démonstration — aucun paiement n’est pris.</p>
            </aside>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
