/**
 * Service d'authentification : encapsule les appels Lovable Cloud (Supabase Auth)
 * afin que les composants ne manipulent jamais le client directement.
 */
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export interface SignUpPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithPassword({ email, password, fullName, phone }: SignUpPayload) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth`,
      data: { full_name: fullName, phone: phone ?? null },
    },
  });
  if (error) throw error;
  return data;
}

/** Connexion Google via le courtier OAuth managé de Lovable Cloud. */
export async function signInWithGoogle(redirectPath?: string) {
  if (redirectPath) {
    sessionStorage.setItem("humanitas:redirect", redirectPath);
  }
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  return result;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reinitialisation`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
