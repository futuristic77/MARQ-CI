import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import type { Database, Tables } from "@/integrations/supabase/types";
import type { PublishedData } from "./published";

/** Publishable-key client for public reads; RLS only returns published rows. */
function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const getPublishedData = createServerFn({ method: "GET" }).handler(async (): Promise<PublishedData> => {
  const sb = publicClient();
  const [brands, collections, products, looks, items, models, articles, home] = await Promise.all([
    sb.from("brands").select("*"),
    sb.from("collections").select("*"),
    sb.from("products").select("*"),
    sb.from("looks").select("*"),
    sb.from("look_items").select("*"),
    sb.from("models").select("*"),
    sb
      .from("articles")
      .select("id,slug,title,subtitle,cover_url,gallery,author,category,published_at,status,brand_ids,collection_ids,product_ids,created_at,updated_at")
      .order("published_at", { ascending: false, nullsFirst: false }),
    sb.from("home_settings").select("*").maybeSingle(),
  ]);
  const err = [brands, collections, products, looks, items, models, articles, home].find((r) => r.error)?.error;
  if (err) {
    console.error("[published] read failed", err.message);
    return { brands: [], collections: [], products: [], looks: [], articles: [], home: null };
  }
  const modelById = new Map((models.data ?? []).map((m) => [m.id, m]));
  return {
    brands: brands.data ?? [],
    collections: collections.data ?? [],
    products: products.data ?? [],
    looks: (looks.data ?? []).map((l) => ({
      ...l,
      model: l.model_id ? (modelById.get(l.model_id) ?? null) : null,
      items: (items.data ?? []).filter((i) => i.look_id === l.id),
    })),
    articles: articles.data ?? [],
    home: home.data ?? null,
  };
});

export const publishedQuery = queryOptions({
  queryKey: ["published"],
  queryFn: () => getPublishedData(),
  staleTime: 30_000,
});

export const getPublishedArticle = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }): Promise<Tables<"articles"> | null> => {
    const { data: row, error } = await publicClient().from("articles").select("*").eq("slug", data.slug).maybeSingle();
    if (error) console.error("[published] article read failed", error.message);
    return row ?? null;
  });
