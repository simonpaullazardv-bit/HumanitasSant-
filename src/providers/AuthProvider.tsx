/**
 * Fournisseur d'authentification global.
 *
 * Responsabilités :
 *  - suivre la session Lovable Cloud (Supabase Auth) côté navigateur ;
 *  - charger le profil et les rôles de l'utilisateur connecté ;
 *  - exposer des helpers d'autorisation pour l'interface.
 *
 * L'autorisation réelle reste appliquée en base par les policies RLS.
 */
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_ROLES, STAFF_ROLES, homeForRoles, primaryRole } from "@/constants/roles";
import type { Profile, UserRole } from "@/types";

export interface AccountContext {
  role: UserRole;
  contexte:
    | "adherent"
    | "beneficiaire"
    | "hopital"
    | "pharmacie"
    | "laboratoire"
    | "centre_bien_etre"
    | "entreprise"
    | "staff";
  adherent_id: string | null;
  beneficiaire_id: string | null;
  partenaire_id: string | null;
  identifiant: string | null;
}

export interface AuthContextValue {
  /** Session Supabase courante (null si déconnecté). */
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: UserRole[];
  /** Rôle principal selon l'ordre de priorité métier. */
  role: UserRole | null;
  /** Route d'accueil du portail correspondant au rôle principal. */
  home: string;
  isAuthenticated: boolean;
  /** true tant que la session initiale n'a pas été résolue. */
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: readonly UserRole[]) => boolean;
  isStaff: boolean;
  isAdmin: boolean;
  mustChangePassword: boolean;
  accountContext: AccountContext | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accountContext, setAccountContext] = useState<AccountContext | null>(null);

  /** Charge profil + rôles pour un utilisateur donné. */
  const loadIdentity = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setRoles([]);
      setAccountContext(null);
      return;
    }

    const [{ data: profileRow }, { data: roleRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    const nextRoles = (roleRows ?? []).map((row) => row.role as UserRole);
    setProfile((profileRow as Profile | null) ?? null);
    setRoles(nextRoles);

    const { data: contextRows, error: contextError } = await supabase.rpc(
      "mon_contexte_compte" as never,
      {} as never,
    );
    if (!contextError) {
      const rows = (contextRows ?? []) as AccountContext[];
      const primaryRoleValue = primaryRole(nextRoles);
      const primary = primaryRoleValue
        ? rows.find((row) => row.role === primaryRoleValue)
        : undefined;
      setAccountContext(primary ?? rows[0] ?? null);
    } else {
      setAccountContext(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    // Listener enregistré AVANT la lecture initiale pour ne rater aucun événement.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      // Les appels Supabase sont différés pour éviter tout deadlock dans le callback.
      setTimeout(() => {
        void loadIdentity(nextSession?.user.id);
      }, 0);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadIdentity(data.session?.user.id);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadIdentity]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    await loadIdentity(data.session?.user.id);
  }, [loadIdentity]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setRoles([]);
    setAccountContext(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const hasRole = (role: UserRole) => roles.includes(role);
    return {
      session,
      user: session?.user ?? null,
      profile,
      roles,
      role: primaryRole(roles),
      home:
        primaryRole(roles) === "adherent" && accountContext?.contexte === "beneficiaire"
          ? "/portail/beneficiaire"
          : homeForRoles(roles),
      isAuthenticated: Boolean(session),
      isLoading,
      hasRole,
      hasAnyRole: (candidates) => candidates.some((role) => roles.includes(role)),
      isStaff: STAFF_ROLES.some((role) => roles.includes(role)),
      isAdmin: ADMIN_ROLES.some((role) => roles.includes(role)),
      mustChangePassword: Boolean(profile?.force_password_change),
      accountContext,
      refresh,
      signOut,
    };
  }, [session, profile, roles, accountContext, isLoading, refresh, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
