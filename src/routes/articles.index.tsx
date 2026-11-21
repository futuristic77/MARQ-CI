import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell, SectionHead } from "@/components/site/SiteShell";
import { formatDate } from "@/components/site/ArticleBody";
import { ARTICLES } from "@/lib/published";

export const Route = createFileRoute("/articles/")({
  head: () => ({
    meta: [
      { title: "Articles — MARQ’CI" },
      { name: "description", content: "Portraits de créateurs, coulisses et récits de la mode ivoirienne et africaine sur MARQ’CI." },
      { property: "og:title", content: "Articles — MARQ’CI" },
      { property: "og:description", content: "Le journal éditorial de MARQ’CI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArticlesPage,
});

function ArticlesPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
        <SectionHead cap="Éditorial" title="Articles" />
        {ARTICLES.length === 0 ? (
          <p className="border border-dashed border-ink px-6 py-16 text-center text-mute">Aucun article publié pour le moment.</p>
        ) : (
          <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((a) => (
              <article key={a.id} className="group flex flex-col">
                <Link to="/articles/$articleSlug" params={{ articleSlug: a.slug }} className="block aspect-[4/3] overflow-hidden border border-dashed border-ink bg-paper">
                  {a.cover_url && <img src={a.cover_url} alt={a.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]" />}
                </Link>
                <p className="cap mt-3 text-mute">{[a.category, formatDate(a.published_at)].filter(Boolean).join(" · ")}</p>
                <Link to="/articles/$articleSlug" params={{ articleSlug: a.slug }} className="serif mt-1 text-3xl leading-tight hover:italic">{a.title}</Link>
                {a.subtitle && <p className="mt-2 text-sm text-mute">{a.subtitle}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
