import { supabase as client } from "@/integrations/supabase/client";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabasePublishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as
  string | undefined;

/**
 * Compatibilité avec les anciens services publics : un seul client Supabase
 * navigateur est utilisé dans toute l'application.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
export const supabase = client;
