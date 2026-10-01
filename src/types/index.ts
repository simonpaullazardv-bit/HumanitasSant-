export type UserRole =
  | "super_admin"
  | "administrateur"
  | "directeur_general"
  | "coordonnateur"
  | "medecin_conseil"
  | "financier"
  | "agent_humanitas"
  | "entreprise"
  | "hopital"
  | "pharmacie"
  | "laboratoire"
  | "centre_bien_etre"
  | "adherent";

/** Profil applicatif (table public.profiles) — les rôles vivent dans user_roles. */
export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  username?: string | null;
  phone: string | null;
  avatar_url: string | null;
  fonction: string | null;
  is_active: boolean;
  force_password_change?: boolean;
  password_initialized_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type MembershipTier = "bronze" | "argent" | "or" | "platine";

export interface MembershipPlan {
  tier: MembershipTier;
  name: string;
  price: string;
  period: string;
  tagline: string;
  highlighted?: boolean;
  benefits: string[];
}

export interface ServiceItem {
  slug: string;
  title: string;
  description: string;
  icon: string;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  excerpt: string;
  image: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  metric: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ContactMessage {
  full_name: string;
  email: string;
  phone?: string | undefined;
  subject: string;
  message: string;
}

export interface CallbackRequest {
  id?: string;
  nom: string;
  telephone: string;
  sujet: string;
  heure_souhaitee: string;
  commentaire?: string;
  user_id?: string;
  created_at?: string;
}

export interface AppointmentRequest {
  id?: string;
  type_intervenant: "Humanitas" | "Conseiller" | "Médecin conseil" | "Partenaire";
  nom: string;
  telephone: string;
  email: string;
  date: string;
  creneau_horaire: string;
  motif: string;
  user_id?: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "agent" | "bot";
  sender_name?: string;
  content: string;
  timestamp: string;
  user_id?: string;
}

export interface MembershipRequest {
  full_name: string;
  email?: string | undefined;
  phone?: string | undefined;
  tier: MembershipTier;
}
