import { createFileRoute } from "@tanstack/react-router";

// Serves images from the private "media" storage bucket. Paths are random UUIDs, so only
// files referenced by the site can be requested; listing is impossible.
const SAFE_PATH = /^(model|product|brand|collection|look|article|other)\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/;
const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!SAFE_PATH.test(path)) return new Response("Introuvable", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("media").download(path);
        if (error || !data) return new Response("Introuvable", { status: 404 });
        const ext = path.split(".").pop()!;
        return new Response(data.stream(), {
          headers: {
            "Content-Type": TYPES[ext] ?? "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
