import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteShell, Crumbs } from "@/components/site/SiteShell";
import { ArticleBody } from "@/components/site/ArticleBody";
import { getPublishedArticle } from "@/lib/published.functions";

export const Route = createFileRoute("/articles/$articleSlug")({
  loader: async ({ params }) => {
    const article = await getPublishedArticle({ data: { slug: params.articleSlug } });
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Article indisponible — MARQ’CI" }, { name: "robots", content: "noindex" }] };
    const a = loaderData.article;
    const desc = a.subtitle ?? a.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
    return {
      meta: [
        { title: `${a.title} — MARQ’CI` },
        { name: "description", content: desc },
        { property: "og:title", content: a.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ArticlePage,
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="serif text-5xl">Cet article est introuvable</h1>
        <Link to="/articles" className="pill mt-8">Tous les articles</Link>
      </div>
    </SiteShell>
  ),
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 pt-6 md:px-0">
        <Crumbs items={[
          { label: "Accueil", link: <Link to="/" className="hover:text-ink">Accueil</Link> },
          { label: "Articles", link: <Link to="/articles" className="hover:text-ink">Articles</Link> },
          { label: article.title },
        ]} />
      </div>
      <ArticleBody a={article} />
    </SiteShell>
  );
}
