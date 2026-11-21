import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type MediaRow = Tables<"media">;
export type MediaKind = MediaRow["kind"];
export const MEDIA_KINDS = ["model", "product", "brand", "collection", "look", "article", "other"] as const;
export const MEDIA_KIND_LABEL: Record<string, string> = {
  model: "Mannequins",
  product: "Vêtements",
  brand: "Marques",
  collection: "Collections",
  look: "Looks",
  article: "Articles",
  other: "Autres",
};

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_BYTES = 10 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Public URL of a stored image, served by the site's own media route. */
export const mediaUrl = (path: string) => `/api/public/media/${path}`;

export function validateImage(file: File): string | null {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) return "Format refusé : utilisez JPG, JPEG, PNG ou WebP.";
  if (file.size > MAX_BYTES) return "Image trop lourde : 10 Mo maximum.";
  return null;
}

function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/** Uploads one image to the private media bucket (original file, no recompression) and records it in the library. */
export async function uploadImage(file: File, kind: MediaKind, onProgress?: (pct: number) => void): Promise<MediaRow> {
  const invalid = validateImage(file);
  if (invalid) throw new Error(invalid);
  const { data: s } = await supabase.auth.getSession();
  const token = s.session?.access_token;
  if (!token) throw new Error("Session expirée : reconnectez-vous.");
  const dims = await readDimensions(file);
  const path = `${kind}/${crypto.randomUUID()}.${EXT[file.type]}`;
  const base = import.meta.env['VITE_SUPABASE_URL'] as string;
  const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/storage/v1/object/media/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", key);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "31536000");
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Import refusé (${xhr.status}).`)));
    xhr.onerror = () => reject(new Error("Connexion interrompue pendant l’import."));
    xhr.send(file);
  });

  const { data, error } = await supabase
    .from("media")
    .insert({
      path,
      url: mediaUrl(path),
      filename: file.name.slice(0, 200),
      mime_type: file.type,
      size_bytes: file.size,
      width: dims.width || null,
      height: dims.height || null,
      kind,
      created_by: s.session?.user.id ?? null,
    })
    .select()
    .single();
  if (error) {
    await supabase.storage.from("media").remove([path]);
    throw new Error(error.message);
  }
  onProgress?.(100);
  return data;
}

/** Where an image URL is still used (labels in French). */
export async function mediaUsage(url: string): Promise<string[]> {
  const out: string[] = [];
  const [b1, b2, c1, c2, p1, p2, m, l, a1, a2] = await Promise.all([
    supabase.from("brands").select("name").eq("logo_url", url),
    supabase.from("brands").select("name").eq("cover_url", url),
    supabase.from("collections").select("name").eq("cover_url", url),
    supabase.from("collections").select("name").contains("gallery", [url]),
    supabase.from("products").select("name").eq("main_image", url),
    supabase.from("products").select("name").contains("images", [url]),
    supabase.from("models").select("name").eq("image_url", url),
    supabase.from("looks").select("title").eq("cover_url", url),
    supabase.from("articles").select("title").eq("cover_url", url),
    supabase.from("articles").select("title").contains("gallery", [url]),
  ]);
  for (const r of [b1, b2]) r.data?.forEach((x) => out.push(`Marque : ${x.name}`));
  for (const r of [c1, c2]) r.data?.forEach((x) => out.push(`Collection : ${x.name}`));
  for (const r of [p1, p2]) r.data?.forEach((x) => out.push(`Vêtement : ${x.name}`));
  m.data?.forEach((x) => out.push(`Mannequin : ${x.name}`));
  l.data?.forEach((x) => out.push(`Look : ${x.title}`));
  for (const r of [a1, a2]) r.data?.forEach((x) => out.push(`Article : ${x.title}`));
  return [...new Set(out)];
}

export async function deleteMedia(row: MediaRow) {
  const used = await mediaUsage(row.url);
  if (used.length) throw new Error(`Image encore utilisée — ${used.join(", ")}.`);
  const { error } = await supabase.storage.from("media").remove([row.path]);
  if (error) throw new Error(error.message);
  const { error: e2 } = await supabase.from("media").delete().eq("id", row.id);
  if (e2) throw new Error(e2.message);
}

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’'"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const formatBytes = (n: number) => (n < 1024 * 1024 ? `${Math.round(n / 1024)} Ko` : `${(n / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`);

/** French message for a failed database write. */
export function dbError(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
  if (/duplicate key.*slug/i.test(msg)) return "Ce lien (slug) est déjà utilisé : choisissez-en un autre.";
  if (/violates row-level security|permission denied/i.test(msg)) return "Action refusée : accès administrateur requis.";
  if (/slug_check|_slug_check/i.test(msg)) return "Lien (slug) invalide : lettres minuscules, chiffres et tirets uniquement.";
  if (/foreign key/i.test(msg)) return "Cet élément est encore lié à d’autres contenus.";
  return msg;
}
