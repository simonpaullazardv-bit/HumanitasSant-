/**
 * Helpers serveur du CMS public.
 * Ce module ne doit jamais être importé depuis le navigateur (extension .server.ts).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Client publishable côté serveur : RLS appliquée comme visiteur anonyme. */
export function publicClient() {
  const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error("[Supabase] Client public serveur non configuré.");
  }

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Le bucket « medias » est privé : on signe les URLs côté serveur.
 * Seules les entrées actives de la médiathèque sont signables.
 */
export async function signMediaPath(
  bucket: string,
  path: string,
  expiresIn = 60 * 60,
): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}
