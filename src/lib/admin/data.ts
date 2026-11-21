import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export function must<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

/** Refreshes admin lists and the public catalogue after any change. */
export function useRefresh() {
  const qc = useQueryClient();
  const router = useRouter();
  return async () => {
    await qc.invalidateQueries({ queryKey: ["admin"] });
    await qc.invalidateQueries({ queryKey: ["published"] });
    await router.invalidate();
  };
}

export const useBrands = () =>
  useQuery({ queryKey: ["admin", "brands"], queryFn: async () => must(await supabase.from("brands").select("*").order("sort_order").order("created_at")) });
export const useCollections = () =>
  useQuery({ queryKey: ["admin", "collections"], queryFn: async () => must(await supabase.from("collections").select("*").order("sort_order").order("created_at")) });
export const useProducts = () =>
  useQuery({ queryKey: ["admin", "products"], queryFn: async () => must(await supabase.from("products").select("*").order("sort_order").order("created_at")) });
export const useModels = () =>
  useQuery({ queryKey: ["admin", "models"], queryFn: async () => must(await supabase.from("models").select("*").order("created_at", { ascending: false })) });
export const useLooks = () =>
  useQuery({ queryKey: ["admin", "looks"], queryFn: async () => must(await supabase.from("looks").select("*").order("sort_order").order("created_at")) });
export const useLookItems = () =>
  useQuery({ queryKey: ["admin", "look_items"], queryFn: async () => must(await supabase.from("look_items").select("*").order("position")) });
export const useArticles = () =>
  useQuery({ queryKey: ["admin", "articles"], queryFn: async () => must(await supabase.from("articles").select("*").order("created_at", { ascending: false })) });

export const CATEGORY_OPTIONS = [
  { value: "tops", label: "Hauts" },
  { value: "outerwear", label: "Vestes & manteaux" },
  { value: "bottoms", label: "Bas" },
  { value: "shoes", label: "Chaussures" },
  { value: "accessories", label: "Accessoires" },
] as const;
