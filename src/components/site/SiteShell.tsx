import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { StatusBar } from "./StatusBar";
import { useAdminTap } from "@/lib/admin-tap";
import { BRANDS, CATEGORIES, COLLECTIONS } from "@/data/catalog";

const NAV = [
  { to: "/lookbook", label: "Lookbook" },
  { to: "/looks", label: "Looks" },
  { to: "/brands", label: "Marques" },
  { to: "/collections", label: "Collections" },
  { to: "/categories", label: "Boutique" },
  { to: "/articles", label: "Articles" },
] as const;

export function SiteHeader() {
  return (
    <div className="sticky top-0 z-50 border-b border-dashed border-ink bg-studio/95 backdrop-blur-sm">
      <StatusBar variant="site" />
      <nav aria-label="Navigation principale" className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3 md:justify-center md:px-6">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className="pill shrink-0" activeProps={{ "aria-current": "page" }}>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function SiteFooter() {
  const onBrandTap = useAdminTap();
  return (
    <footer className="mt-24 border-t border-dashed border-ink bg-paper">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        <FooterCol title="Boutique">
          <li><Link to="/categories/$categorySlug" params={{ categorySlug: "all" }} className={footLink}>Tous les vêtements</Link></li>
          {CATEGORIES.map((c) => (
            <li key={c.slug}><Link to="/categories/$categorySlug" params={{ categorySlug: c.slug }} className={footLink}>{c.name}</Link></li>
          ))}
        </FooterCol>
        <FooterCol title="Marques">
          {BRANDS.map((b) => (
            <li key={b.slug}><Link to="/brands/$brandSlug" params={{ brandSlug: b.slug }} className={footLink}>{b.name}</Link></li>
          ))}
        </FooterCol>
        <FooterCol title="Collections">
          {COLLECTIONS.map((c) => (
            <li key={c.slug}><Link to="/collections/$collectionSlug" params={{ collectionSlug: c.slug }} className={footLink}>{c.name}</Link></li>
          ))}
        </FooterCol>
        <FooterCol title="Éditorial">
          <li><Link to="/lookbook" className={footLink}>Le cercle — Vol. 01</Link></li>
          <li><Link to="/looks" className={footLink}>Tous les looks</Link></li>
          <li><Link to="/articles" className={footLink}>Articles</Link></li>
          <li><Link to="/bag" className={footLink}>Panier</Link></li>
        </FooterCol>
      </div>
      <div className="mx-auto max-w-[1440px] px-4 pb-10 md:px-8">
        <p className="cap mb-6 max-w-2xl border border-dashed border-ink px-4 py-3 text-mute">
          Catalogue de démonstration — les marques, vêtements, prix et stocks sont des exemples. Aucune commande ni aucun paiement réel n’est pris en compte.
        </p>
        <Link to="/" className="wordmark display block text-[18vw] leading-[.8] md:text-[14vw]" aria-label="Accueil MARQ’CI" onClick={onBrandTap}>
          MARQ’CI
        </Link>
        <p className="cap mt-6 text-mute">La mode ivoirienne et africaine, réunie en un seul cercle.</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="cap mb-4 text-mute">{title}</p>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

const footLink = "text-sm uppercase tracking-wide hover:underline hover:underline-offset-4";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}

/** Section heading: small caption + big light uppercase title + optional link. */
export function SectionHead({ cap, title, action }: { cap: string; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-dashed border-ink pb-4">
      <div>
        <p className="cap mb-2 text-mute">{cap}</p>
        <h2 className="display text-4xl leading-[.95] md:text-6xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Crumbs({ items }: { items: { label: string; link?: React.ReactNode }[] }) {
  return (
    <nav aria-label="Fil d’Ariane" className="cap flex flex-wrap gap-2 text-mute">
      {items.map((it, i) => (
        <span key={i} className="flex gap-2">
          {i > 0 && <span aria-hidden="true">/</span>}
          {it.link ?? <span className="text-ink">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
