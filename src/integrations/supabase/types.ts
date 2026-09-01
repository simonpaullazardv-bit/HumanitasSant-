export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      adherent_documents: {
        Row: {
          adherent_id: string;
          beneficiaire_id: string | null;
          bucket: string;
          created_at: string;
          id: string;
          mime_type: string | null;
          nom: string;
          notes: string | null;
          storage_path: string;
          taille_octets: number | null;
          type: Database["public"]["Enums"]["type_document"];
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          adherent_id: string;
          beneficiaire_id?: string | null;
          bucket?: string;
          created_at?: string;
          id?: string;
          mime_type?: string | null;
          nom: string;
          notes?: string | null;
          storage_path: string;
          taille_octets?: number | null;
          type?: Database["public"]["Enums"]["type_document"];
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          adherent_id?: string;
          beneficiaire_id?: string | null;
          bucket?: string;
          created_at?: string;
          id?: string;
          mime_type?: string | null;
          nom?: string;
          notes?: string | null;
          storage_path?: string;
          taille_octets?: number | null;
          type?: Database["public"]["Enums"]["type_document"];
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "adherent_documents_adherent_id_fkey";
            columns: ["adherent_id"];
            isOneToOne: false;
            referencedRelation: "adherents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "adherent_documents_beneficiaire_id_fkey";
            columns: ["beneficiaire_id"];
            isOneToOne: false;
            referencedRelation: "beneficiaires";
            referencedColumns: ["id"];
          },
        ];
      };
      adherent_historique: {
        Row: {
          adherent_id: string;
          ancien_statut: string | null;
          beneficiaire_id: string | null;
          created_at: string;
          created_by: string | null;
          details: Json;
          evenement: string;
          id: string;
          nouveau_statut: string | null;
        };
        Insert: {
          adherent_id: string;
          ancien_statut?: string | null;
          beneficiaire_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          details?: Json;
          evenement: string;
          id?: string;
          nouveau_statut?: string | null;
        };
        Update: {
          adherent_id?: string;
          ancien_statut?: string | null;
          beneficiaire_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          details?: Json;
          evenement?: string;
          id?: string;
          nouveau_statut?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "adherent_historique_adherent_id_fkey";
            columns: ["adherent_id"];
            isOneToOne: false;
            referencedRelation: "adherents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "adherent_historique_beneficiaire_id_fkey";
            columns: ["beneficiaire_id"];
            isOneToOne: false;
            referencedRelation: "beneficiaires";
            referencedColumns: ["id"];
          },
        ];
      };
      adherents: {
        Row: {
          adresse: string | null;
          categorie_id: string | null;
          commune: string | null;
          contact_urgence_nom: string | null;
          contact_urgence_telephone: string | null;
          created_at: string;
          created_by: string | null;
          date_adhesion: string;
          date_expiration: string | null;
          date_naissance: string | null;
          email: string | null;
          entreprise_id: string | null;
          etat_civil: string | null;
          id: string;
          matricule: string;
          nationalite: string | null;
          nom: string;
          notes: string | null;
          photo_url: string | null;
          piece_numero: string | null;
          piece_type: string | null;
          postnom: string | null;
          prenom: string | null;
          profession: string | null;
          sexe: string | null;
          statut: Database["public"]["Enums"]["statut_adherent"];
          telephone: string | null;
          type_adhesion: Database["public"]["Enums"]["type_adhesion"];
          updated_at: string;
          user_id: string | null;
          ville: string;
        };
        Insert: {
          adresse?: string | null;
          categorie_id?: string | null;
          commune?: string | null;
          contact_urgence_nom?: string | null;
          contact_urgence_telephone?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_adhesion?: string;
          date_expiration?: string | null;
          date_naissance?: string | null;
          email?: string | null;
          entreprise_id?: string | null;
          etat_civil?: string | null;
          id?: string;
          matricule: string;
          nationalite?: string | null;
          nom: string;
          notes?: string | null;
          photo_url?: string | null;
          piece_numero?: string | null;
          piece_type?: string | null;
          postnom?: string | null;
          prenom?: string | null;
          profession?: string | null;
          sexe?: string | null;
          statut?: Database["public"]["Enums"]["statut_adherent"];
          telephone?: string | null;
          type_adhesion?: Database["public"]["Enums"]["type_adhesion"];
          updated_at?: string;
          user_id?: string | null;
          ville?: string;
        };
        Update: {
          adresse?: string | null;
          categorie_id?: string | null;
          commune?: string | null;
          contact_urgence_nom?: string | null;
          contact_urgence_telephone?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_adhesion?: string;
          date_expiration?: string | null;
          date_naissance?: string | null;
          email?: string | null;
          entreprise_id?: string | null;
          etat_civil?: string | null;
          id?: string;
          matricule?: string;
          nationalite?: string | null;
          nom?: string;
          notes?: string | null;
          photo_url?: string | null;
          piece_numero?: string | null;
          piece_type?: string | null;
          postnom?: string | null;
          prenom?: string | null;
          profession?: string | null;
          sexe?: string | null;
          statut?: Database["public"]["Enums"]["statut_adherent"];
          telephone?: string | null;
          type_adhesion?: Database["public"]["Enums"]["type_adhesion"];
          updated_at?: string;
          user_id?: string | null;
          ville?: string;
        };
        Relationships: [
          {
            foreignKeyName: "adherents_categorie_id_fkey";
            columns: ["categorie_id"];
            isOneToOne: false;
            referencedRelation: "categories_adhesion";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "adherents_entreprise_id_fkey";
            columns: ["entreprise_id"];
            isOneToOne: false;
            referencedRelation: "partenaires";
            referencedColumns: ["id"];
          },
        ];
      };
      adhesions: {
        Row: {
          adherent_id: string;
          categorie_id: string;
          created_at: string;
          date_debut: string;
          date_fin: string | null;
          id: string;
          montant_usd: number;
          statut: Database["public"]["Enums"]["statut_adherent"];
          updated_at: string;
        };
        Insert: {
          adherent_id: string;
          categorie_id: string;
          created_at?: string;
          date_debut?: string;
          date_fin?: string | null;
          id?: string;
          montant_usd?: number;
          statut?: Database["public"]["Enums"]["statut_adherent"];
          updated_at?: string;
        };
        Update: {
          adherent_id?: string;
          categorie_id?: string;
          created_at?: string;
          date_debut?: string;
          date_fin?: string | null;
          id?: string;
          montant_usd?: number;
          statut?: Database["public"]["Enums"]["statut_adherent"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "adhesions_adherent_id_fkey";
            columns: ["adherent_id"];
            isOneToOne: false;
            referencedRelation: "adherents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "adhesions_categorie_id_fkey";
            columns: ["categorie_id"];
            isOneToOne: false;
            referencedRelation: "categories_adhesion";
            referencedColumns: ["id"];
          },
        ];
      };
      alertes_financieres: {
        Row: {
          adherent_id: string;
          cotisation_id: string | null;
          created_at: string;
          id: string;
          is_traite: boolean;
          message: string;
          niveau: string;
          type: string;
        };
        Insert: {
          adherent_id: string;
          cotisation_id?: string | null;
          created_at?: string;
          id?: string;
          is_traite?: boolean;
          message: string;
          niveau?: string;
          type: string;
        };
        Update: {
          adherent_id?: string;
          cotisation_id?: string | null;
          created_at?: string;
          id?: string;
          is_traite?: boolean;
          message?: string;
          niveau?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alertes_financieres_adherent_id_fkey";
            columns: ["adherent_id"];
            isOneToOne: false;
            referencedRelation: "adherents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alertes_financieres_cotisation_id_fkey";
            columns: ["cotisation_id"];
            isOneToOne: false;
            referencedRelation: "cotisations";
            referencedColumns: ["id"];
          },
        ];
      };
      app_parametres: {
        Row: {
          categorie: string;
          cle: string;
          created_at: string;
          description: string | null;
          id: string;
          is_public: boolean;
          libelle: string | null;
          updated_at: string;
          updated_by: string | null;
          valeur: Json;
        };
        Insert: {
          categorie?: string;
          cle: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean;
          libelle?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          valeur: Json;
        };
        Update: {
          categorie?: string;
          cle?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean;
          libelle?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          valeur?: Json;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          details: Json;
          entite: string;
          entite_id: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          details?: Json;
          entite: string;
          entite_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          details?: Json;
          entite?: string;
          entite_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      beneficiaires: {
        Row: {
          adherent_id: string;
          code: string | null;
          created_at: string;
          date_naissance: string | null;
          email: string | null;
          id: string;
          is_active: boolean;
          lien: Database["public"]["Enums"]["lien_parente"];
          nom: string;
          notes: string | null;
          photo_url: string | null;
          piece_numero: string | null;
          piece_type: string | null;
          prenom: string | null;
          sexe: string | null;
          statut: Database["public"]["Enums"]["statut_adherent"];
          telephone: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          adherent_id: string;
          code?: string | null;
          created_at?: string;
          date_naissance?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          lien?: Database["public"]["Enums"]["lien_parente"];
          nom: string;
          notes?: string | null;
          photo_url?: string | null;
          piece_numero?: string | null;
          piece_type?: string | null;
          prenom?: string | null;
          sexe?: string | null;
          statut?: Database["public"]["Enums"]["statut_adherent"];
          telephone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          adherent_id?: string;
          code?: string | null;
          created_at?: string;
          date_naissance?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          lien?: Database["public"]["Enums"]["lien_parente"];
          nom?: string;
          notes?: string | null;
          photo_url?: string | null;
          piece_numero?: string | null;
          piece_type?: string | null;
          prenom?: string | null;
          sexe?: string | null;
          statut?: Database["public"]["Enums"]["statut_adherent"];
          telephone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "beneficiaires_adherent_id_fkey";
            columns: ["adherent_id"];
            isOneToOne: false;
            referencedRelation: "adherents";
            referencedColumns: ["id"];
          },
        ];
      };
      cartes_impressions: {
        Row: {
          carte_id: string;
          created_at: string;
          format: string;
          id: string;
          imprime_par: string | null;
          lot_id: string | null;
          mode: string;
          motif: string | null;
        };
        Insert: {
          carte_id: string;
          created_at?: string;
          format?: string;
          id?: string;
          imprime_par?: string | null;
          lot_id?: string | null;
          mode?: string;
          motif?: string | null;
        };
        Update: {
          carte_id?: string;
          created_at?: string;
          format?: string;
          id?: string;
          imprime_par?: string | null;
          lot_id?: string | null;
          mode?: string;
          motif?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cartes_impressions_carte_id_fkey";
            columns: ["carte_id"];
            isOneToOne: false;
            referencedRelation: "cartes_membre";
            referencedColumns: ["id"];
          },
        ];
      };
      cartes_membre: {
        Row: {
          adherent_id: string | null;
          beneficiaire_id: string | null;
          carte_precedente_id: string | null;
          categorie_id: string | null;
          created_at: string;
          created_by: string | null;
          date_emission: string;
          date_expiration: string | null;
          derniere_impression: string | null;
          id: string;
          is_active: boolean;
          motif: string | null;
          nb_impressions: number;
          numero: string;
          paiement_id: string | null;
          personnel_id: string | null;
          qr_token: string;
          statut: string;
          type_carte: string;
          updated_at: string;
        };
        Insert: {
          adherent_id?: string | null;
          beneficiaire_id?: string | null;
          carte_precedente_id?: string | null;
          categorie_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_emission?: string;
          date_expiration?: string | null;
          derniere_impression?: string | null;
          id?: string;
          is_active?: boolean;
          motif?: string | null;
          nb_impressions?: number;
          numero: string;
          paiement_id?: string | null;
          personnel_id?: string | null;
          qr_token?: string;
          statut?: string;
          type_carte?: string;
          updated_at?: string;
        };
        Update: {
          adherent_id?: string | null;
          beneficiaire_id?: string | null;
          carte_precedente_id?: string | null;
          categorie_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_emission?: string;
          date_expiration?: string | null;
          derniere_impression?: string | null;
          id?: string;
          is_active?: boolean;
          motif?: string | null;
          nb_impressions?: number;
          numero?: string;
          paiement_id?: string | null;
          personnel_id?: string | null;
          qr_token?: string;
          statut?: string;
          type_carte?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cartes_membre_adherent_id_fkey";
            columns: ["adherent_id"];
            isOneToOne: false;
            referencedRelation: "adherents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cartes_membre_beneficiaire_id_fkey";
            columns: ["beneficiaire_id"];
            isOneToOne: false;
            referencedRelation: "beneficiaires";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cartes_membre_carte_precedente_id_fkey";
            columns: ["carte_precedente_id"];
            isOneToOne: false;
            referencedRelation: "cartes_membre";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cartes_membre_categorie_id_fkey";
            columns: ["categorie_id"];
            isOneToOne: false;
            referencedRelation: "categories_adhesion";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cartes_membre_paiement_id_fkey";
            columns: ["paiement_id"];
            isOneToOne: false;
            referencedRelation: "paiements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cartes_membre_personnel_id_fkey";
            columns: ["personnel_id"];
            isOneToOne: false;
            referencedRelation: "personnel";
            referencedColumns: ["id"];
          },
        ];
      };
      cartes_reimpressions: {
        Row: {
          ancienne_carte_id: string;
          created_at: string;
          demande_par: string | null;
          frais_usd: number;
          id: string;
          motif: string;
          nouvelle_carte_id: string;
          paiement_id: string | null;
        };
        Insert: {
          ancienne_carte_id: string;
          created_at?: string;
          demande_par?: string | null;
          frais_usd?: number;
          id?: string;
          motif: string;
          nouvelle_carte_id: string;
          paiement_id?: string | null;
        };
        Update: {
          ancienne_carte_id?: string;
          created_at?: string;
          demande_par?: string | null;
          frais_usd?: number;
          id?: string;
          motif?: string;
          nouvelle_carte_id?: string;
          paiement_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cartes_reimpressions_ancienne_carte_id_fkey";
            columns: ["ancienne_carte_id"];
            isOneToOne: false;
            referencedRelation: "cartes_membre";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cartes_reimpressions_nouvelle_carte_id_fkey";
            columns: ["nouvelle_carte_id"];
            isOneToOne: false;
            referencedRelation: "cartes_membre";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cartes_reimpressions_paiement_id_fkey";
            columns: ["paiement_id"];
            isOneToOne: false;
            referencedRelation: "paiements";
            referencedColumns: ["id"];
          },
        ];
      };
      cartes_scans: {
        Row: {
          carte_id: string | null;
          created_at: string;
          id: string;
          resultat: string;
          token: string | null;
        };
        Insert: {
          carte_id?: string | null;
          created_at?: string;
          id?: string;
          resultat: string;
          token?: string | null;
        };
        Update: {
          carte_id?: string | null;
          created_at?: string;
          id?: string;
          resultat?: string;
          token?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cartes_scans_carte_id_fkey";
            columns: ["carte_id"];
            isOneToOne: false;
            referencedRelation: "cartes_membre";
            referencedColumns: ["id"];
          },
        ];
      };
      categories_adhesion: {
        Row: {
          avantages: Json;
          code: string;
          conditions: Json;
          created_at: string;
          description: string | null;
          devise: string;
          id: string;
          is_active: boolean;
          mise_en_avant: boolean;
          nom: string;
          ordre: number;
          periode: string;
          plafond_usd: number | null;
          prestations_autorisees: Json;
          prix_usd: number;
          tagline: string | null;
          taux_couverture: number;
          updated_at: string;
        };
        Insert: {
          avantages?: Json;
          code: string;
          conditions?: Json;
          created_at?: string;
          description?: string | null;
          devise?: string;
          id?: string;
          is_active?: boolean;
          mise_en_avant?: boolean;
          nom: string;
          ordre?: number;
          periode?: string;
          plafond_usd?: number | null;
          prestations_autorisees?: Json;
          prix_usd: number;
          tagline?: string | null;
          taux_couverture?: number;
          updated_at?: string;
        };
        Update: {
          avantages?: Json;
          code?: string;
          conditions?: Json;
          created_at?: string;
          description?: string | null;
          devise?: string;
          id?: string;
          is_active?: boolean;
          mise_en_avant?: boolean;
          nom?: string;
          ordre?: number;
          periode?: string;
          plafond_usd?: number | null;
          prestations_autorisees?: Json;
          prix_usd?: number;
          tagline?: string | null;
          taux_couverture?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_actualites: {
        Row: {
          auteur: string | null;
          categorie: string | null;
          contenu: string | null;
          created_at: string;
          created_by: string | null;
          date_publication: string;
          extrait: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          slug: string;
          statut: Database["public"]["Enums"]["cms_statut"];
          titre: string;
          updated_at: string;
        };
        Insert: {
          auteur?: string | null;
          categorie?: string | null;
          contenu?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_publication?: string;
          extrait?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          slug: string;
          statut?: Database["public"]["Enums"]["cms_statut"];
          titre: string;
          updated_at?: string;
        };
        Update: {
          auteur?: string | null;
          categorie?: string | null;
          contenu?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_publication?: string;
          extrait?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          slug?: string;
          statut?: Database["public"]["Enums"]["cms_statut"];
          titre?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_bannieres: {
        Row: {
          bouton_libelle: string | null;
          bouton_lien: string | null;
          created_at: string;
          date_debut: string | null;
          date_fin: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          ordre: number;
          sous_titre: string | null;
          statut: Database["public"]["Enums"]["cms_statut"];
          titre: string;
          updated_at: string;
        };
        Insert: {
          bouton_libelle?: string | null;
          bouton_lien?: string | null;
          created_at?: string;
          date_debut?: string | null;
          date_fin?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          ordre?: number;
          sous_titre?: string | null;
          statut?: Database["public"]["Enums"]["cms_statut"];
          titre: string;
          updated_at?: string;
        };
        Update: {
          bouton_libelle?: string | null;
          bouton_lien?: string | null;
          created_at?: string;
          date_debut?: string | null;
          date_fin?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          ordre?: number;
          sous_titre?: string | null;
          statut?: Database["public"]["Enums"]["cms_statut"];
          titre?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_equipe: {
        Row: {
          bio: string | null;
          created_at: string;
          email: string | null;
          fonction: string | null;
          id: string;
          is_active: boolean;
          linkedin_url: string | null;
          nom: string;
          ordre: number;
          photo_url: string | null;
          statut: Database["public"]["Enums"]["cms_statut"];
          updated_at: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          fonction?: string | null;
          id?: string;
          is_active?: boolean;
          linkedin_url?: string | null;
          nom: string;
          ordre?: number;
          photo_url?: string | null;
          statut?: Database["public"]["Enums"]["cms_statut"];
          updated_at?: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          fonction?: string | null;
          id?: string;
          is_active?: boolean;
          linkedin_url?: string | null;
          nom?: string;
          ordre?: number;
          photo_url?: string | null;
          statut?: Database["public"]["Enums"]["cms_statut"];
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_evenements: {
        Row: {
          contenu: string | null;
          created_at: string;
          date_debut: string;
          date_fin: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          lieu: string | null;
          slug: string;
          statut: Database["public"]["Enums"]["cms_statut"];
          titre: string;
          updated_at: string;
        };
        Insert: {
          contenu?: string | null;
          created_at?: string;
          date_debut: string;
          date_fin?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          lieu?: string | null;
          slug: string;
          statut?: Database["public"]["Enums"]["cms_statut"];
          titre: string;
          updated_at?: string;
        };
        Update: {
          contenu?: string | null;
          created_at?: string;
          date_debut?: string;
          date_fin?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          lieu?: string | null;
          slug?: string;
          statut?: Database["public"]["Enums"]["cms_statut"];
          titre?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_faq: {
        Row: {
          categorie: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          ordre: number;
          question: string;
          reponse: string;
          statut: Database["public"]["Enums"]["cms_statut"];
          updated_at: string;
        };
        Insert: {
          categorie?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          ordre?: number;
          question: string;
          reponse: string;
          statut?: Database["public"]["Enums"]["cms_statut"];
          updated_at?: string;
        };
        Update: {
          categorie?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          ordre?: number;
          question?: string;
          reponse?: string;
          statut?: Database["public"]["Enums"]["cms_statut"];
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_medias: {
        Row: {
          bucket: string;
          categorie: string | null;
          created_at: string;
          hauteur: number | null;
          id: string;
          is_active: boolean;
          is_protege: boolean;
          largeur: number | null;
          legende: string | null;
          metadonnees: Json;
          mime_type: string | null;
          nom: string;
          storage_path: string;
          taille_octets: number | null;
          texte_alternatif: string | null;
          type: Database["public"]["Enums"]["media_type"];
          updated_at: string;
          uploaded_by: string | null;
          url_publique: string | null;
        };
        Insert: {
          bucket?: string;
          categorie?: string | null;
          created_at?: string;
          hauteur?: number | null;
          id?: string;
          is_active?: boolean;
          is_protege?: boolean;
          largeur?: number | null;
          legende?: string | null;
          metadonnees?: Json;
          mime_type?: string | null;
          nom: string;
          storage_path: string;
          taille_octets?: number | null;
          texte_alternatif?: string | null;
          type?: Database["public"]["Enums"]["media_type"];
          updated_at?: string;
          uploaded_by?: string | null;
          url_publique?: string | null;
        };
        Update: {
          bucket?: string;
          categorie?: string | null;
          created_at?: string;
          hauteur?: number | null;
          id?: string;
          is_active?: boolean;
          is_protege?: boolean;
          largeur?: number | null;
          legende?: string | null;
          metadonnees?: Json;
          mime_type?: string | null;
          nom?: string;
          storage_path?: string;
          taille_octets?: number | null;
          texte_alternatif?: string | null;
          type?: Database["public"]["Enums"]["media_type"];
          updated_at?: string;
          uploaded_by?: string | null;
          url_publique?: string | null;
        };
        Relationships: [];
      };
      cms_pages: {
        Row: {
          contenu: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          og_image_url: string | null;
          ordre: number;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          sous_titre: string | null;
          statut: Database["public"]["Enums"]["cms_statut"];
          titre: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          contenu?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          og_image_url?: string | null;
          ordre?: number;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          sous_titre?: string | null;
          statut?: Database["public"]["Enums"]["cms_statut"];
          titre: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          contenu?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          og_image_url?: string | null;
          ordre?: number;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          sous_titre?: string | null;
          statut?: Database["public"]["Enums"]["cms_statut"];
          titre?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cms_reseaux_sociaux: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          libelle: string | null;
          ordre: number;
          plateforme: Database["public"]["Enums"]["reseau_social"];
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          libelle?: string | null;
          ordre?: number;
          plateforme: Database["public"]["Enums"]["reseau_social"];
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          libelle?: string | null;
          ordre?: number;
          plateforme?: Database["public"]["Enums"]["reseau_social"];
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      cms_sections: {
        Row: {
          cle: string;
          contenu: string | null;
          created_at: string;
          donnees: Json;
          id: string;
          image_url: string | null;
          is_active: boolean;
          ordre: number;
          page_id: string;
          sous_titre: string | null;
          statut: Database["public"]["Enums"]["cms_statut"];
          titre: string | null;
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          cle: string;
          contenu?: string | null;
          created_at?: string;
          donnees?: Json;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          ordre?: number;
          page_id: string;
          sous_titre?: string | null;
          statut?: Database["public"]["Enums"]["cms_statut"];
          titre?: string | null;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          cle?: string;
          contenu?: string | null;
          created_at?: string;
          donnees?: Json;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          ordre?: number;
          page_id?: string;
          sous_titre?: string | null;
          statut?: Database["public"]["Enums"]["cms_statut"];
          titre?: string | null;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cms_sections_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "cms_pages";
            referencedColumns: ["id"];
          },
        ];
      };
      cms_services: {
        Row: {
          contenu: string | null;
          created_at: string;
          description: string | null;
          icone: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          ordre: number;
          slug: string;
          statut: Database["public"]["Enums"]["cms_statut"];
          titre: string;
          updated_at: string;
        };
        Insert: {
          contenu?: string | null;
          created_at?: string;
          description?: string | null;
          icone?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          ordre?: number;
          slug: string;
          statut?: Database["public"]["Enums"]["cms_statut"];
          titre: string;
          updated_at?: string;
        };
        Update: {
          contenu?: string | null;
          created_at?: string;
          description?: string | null;
          icone?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          ordre?: number;
          slug?: string;
          statut?: Database["public"]["Enums"]["cms_statut"];
          titre?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_telechargements: {
        Row: {
          categorie: string | null;
          created_at: string;
          description: string | null;
          fichier_url: string;
          id: string;
          is_active: boolean;
          ordre: number;
          statut: Database["public"]["Enums"]["cms_statut"];
          taille_octets: number | null;
          titre: string;
          updated_at: string;
        };
        Insert: {
          categorie?: string | null;
          created_at?: string;
          description?: string | null;
          fichier_url: string;
          id?: string;
          is_active?: boolean;
          ordre?: number;
          statut?: Database["public"]["Enums"]["cms_statut"];
          taille_octets?: number | null;
          titre: string;
          updated_at?: string;
        };
        Update: {
          categorie?: string | null;
          created_at?: string;
          description?: string | null;
          fichier_url?: string;
          id?: string;
          is_active?: boolean;
          ordre?: number;
          statut?: Database["public"]["Enums"]["cms_statut"];
          taille_octets?: number | null;
          titre?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_temoignages: {
        Row: {
          auteur: string;
          created_at: string;
          fonction: string | null;
          id: string;
          is_active: boolean;
          message: string;
          note: number | null;
          ordre: number;
          photo_url: string | null;
          statut: Database["public"]["Enums"]["cms_statut"];
          updated_at: string;
        };
        Insert: {
          auteur: string;
          created_at?: string;
          fonction?: string | null;
          id?: string;
          is_active?: boolean;
          message: string;
          note?: number | null;
          ordre?: number;
          photo_url?: string | null;
          statut?: Database["public"]["Enums"]["cms_statut"];
          updated_at?: string;
        };
        Update: {
          auteur?: string;
          created_at?: string;
          fonction?: string | null;
          id?: string;
          is_active?: boolean;
          message?: string;
          note?: number | null;
          ordre?: number;
          photo_url?: string | null;
          statut?: Database["public"]["Enums"]["cms_statut"];
          updated_at?: string;
        };
        Relationships: [];
      };
      contrats_partenaires: {
        Row: {
          conditions: Json;
          created_at: string;
          created_by: string | null;
          date_debut: string;
          date_fin: string | null;
          id: string;
          notes: string | null;
          numero: string;
          objet: string | null;
          partenaire_id: string;
          plafond_acte_usd: number | null;
          plafond_annuel_usd: number | null;
          plafond_mensuel_usd: number | null;
          prestations_autorisees: Json;
          signe_humanitas_le: string | null;
          signe_humanitas_par: string | null;
          signe_partenaire_le: string | null;
          signe_partenaire_par: string | null;
          statut: Database["public"]["Enums"]["statut_contrat"];
          taux_couverture: number;
          updated_at: string;
        };
        Insert: {
          conditions?: Json;
          created_at?: string;
          created_by?: string | null;
          date_debut?: string;
          date_fin?: string | null;
          id?: string;
          notes?: string | null;
          numero: string;
          objet?: string | null;
          partenaire_id: string;
          plafond_acte_usd?: number | null;
          plafond_annuel_usd?: number | null;
          plafond_mensuel_usd?: number | null;
          prestations_autorisees?: Json;
          signe_humanitas_le?: string | null;
          signe_humanitas_par?: string | null;
          signe_partenaire_le?: string | null;
          signe_partenaire_par?: string | null;
          statut?: Database["public"]["Enums"]["statut_contrat"];
          taux_couverture?: number;
          updated_at?: string;
        };
        Update: {
          conditions?: Json;
          created_at?: string;
          created_by?: string | null;
          date_debut?: string;
          date_fin?: string | null;
          id?: string;
          notes?: string | null;
          numero?: string;
          objet?: string | null;
          partenaire_id?: string;
          plafond_acte_usd?: number | null;
          plafond_annuel_usd?: number | null;
          plafond_mensuel_usd?: number | null;
          prestations_autorisees?: Json;
          signe_humanitas_le?: string | null;
          signe_humanitas_par?: string | null;
          signe_partenaire_le?: string | null;
          signe_partenaire_par?: string | null;
          statut?: Database["public"]["Enums"]["statut_contrat"];
          taux_couverture?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contrats_partenaires_partenaire_id_fkey";
            columns: ["partenaire_id"];
            isOneToOne: false;
            referencedRelation: "partenaires";
            referencedColumns: ["id"];
          },
        ];
      };
      cotisations: {
        Row: {
          adherent_id: string;
          adhesion_id: string | null;
          categorie_id: string | null;
          created_at: string;
          devise: string;
          echeance: string;
          id: string;
          montant_paye: number;
          montant_usd: number;
          periode: string;
          statut: Database["public"]["Enums"]["statut_cotisation"];
          updated_at: string;
        };
        Insert: {
          adherent_id: string;
          adhesion_id?: string | null;
          categorie_id?: string | null;
          created_at?: string;
          devise?: string;
          echeance: string;
          id?: string;
          montant_paye?: number;
          montant_usd: number;
          periode: string;
          statut?: Database["public"]["Enums"]["statut_cotisation"];
          updated_at?: string;
        };
        Update: {
          adherent_id?: string;
          adhesion_id?: string | null;
          categorie_id?: string | null;
          created_at?: string;
          devise?: string;
          echeance?: string;
          id?: string;
          montant_paye?: number;
          montant_usd?: number;
          periode?: string;
          statut?: Database["public"]["Enums"]["statut_cotisation"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cotisations_adherent_id_fkey";
            columns: ["adherent_id"];
            isOneToOne: false;
            referencedRelation: "adherents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cotisations_adhesion_id_fkey";
            columns: ["adhesion_id"];
            isOneToOne: false;
            referencedRelation: "adhesions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cotisations_categorie_id_fkey";
            columns: ["categorie_id"];
            isOneToOne: false;
            referencedRelation: "categories_adhesion";
            referencedColumns: ["id"];
          },
        ];
      };
      factures_partenaires: {
        Row: {
          contrat_id: string | null;
          created_at: string;
          document_path: string | null;
          id: string;
          montant_paye_usd: number;
          montant_usd: number;
          montant_valide_usd: number | null;
          motif_rejet: string | null;
          numero: string;
          partenaire_id: string;
          payee_le: string | null;
          periode: string | null;
          prise_en_charge_id: string | null;
          reference_partenaire: string | null;
          soumise_par: string | null;
          statut: Database["public"]["Enums"]["statut_facture"];
          updated_at: string;
          validee_le: string | null;
          validee_par: string | null;
        };
        Insert: {
          contrat_id?: string | null;
          created_at?: string;
          document_path?: string | null;
          id?: string;
          montant_paye_usd?: number;
          montant_usd?: number;
          montant_valide_usd?: number | null;
          motif_rejet?: string | null;
          numero: string;
          partenaire_id: string;
          payee_le?: string | null;
          periode?: string | null;
          prise_en_charge_id?: string | null;
          reference_partenaire?: string | null;
          soumise_par?: string | null;
          statut?: Database["public"]["Enums"]["statut_facture"];
          updated_at?: string;
          validee_le?: string | null;
          validee_par?: string | null;
        };
        Update: {
          contrat_id?: string | null;
          created_at?: string;
          document_path?: string | null;
          id?: string;
          montant_paye_usd?: number;
          montant_usd?: number;
          montant_valide_usd?: number | null;
          motif_rejet?: string | null;
          numero?: string;
          partenaire_id?: string;
          payee_le?: string | null;
          periode?: string | null;
          prise_en_charge_id?: string | null;
          reference_partenaire?: string | null;
          soumise_par?: string | null;
          statut?: Database["public"]["Enums"]["statut_facture"];
          updated_at?: string;
          validee_le?: string | null;
          validee_par?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "factures_partenaires_contrat_id_fkey";
            columns: ["contrat_id"];
            isOneToOne: false;
            referencedRelation: "contrats_partenaires";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "factures_partenaires_partenaire_id_fkey";
            columns: ["partenaire_id"];
            isOneToOne: false;
            referencedRelation: "partenaires";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "factures_partenaires_prise_en_charge_id_fkey";
            columns: ["prise_en_charge_id"];
            isOneToOne: false;
            referencedRelation: "prises_en_charge";
            referencedColumns: ["id"];
          },
        ];
      };
      matricules_emis: {
        Row: {
          adherent_id: string | null;
          created_at: string;
          matricule: string;
        };
        Insert: {
          adherent_id?: string | null;
          created_at?: string;
          matricule: string;
        };
        Update: {
          adherent_id?: string | null;
          created_at?: string;
          matricule?: string;
        };
        Relationships: [];
      };
      modes_paiement: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          exige_reference: boolean;
          is_active: boolean;
          libelle: string;
          ordre: number;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          exige_reference?: boolean;
          is_active?: boolean;
          libelle: string;
          ordre?: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          exige_reference?: boolean;
          is_active?: boolean;
          libelle?: string;
          ordre?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications_internes: {
        Row: {
          created_at: string;
          created_by: string | null;
          destinataire_role: Database["public"]["Enums"]["app_role"];
          entite: string | null;
          entite_id: string | null;
          id: string;
          is_lue: boolean;
          lien: string | null;
          message: string;
          niveau: string;
          titre: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          destinataire_role: Database["public"]["Enums"]["app_role"];
          entite?: string | null;
          entite_id?: string | null;
          id?: string;
          is_lue?: boolean;
          lien?: string | null;
          message: string;
          niveau?: string;
          titre: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          destinataire_role?: Database["public"]["Enums"]["app_role"];
          entite?: string | null;
          entite_id?: string | null;
          id?: string;
          is_lue?: boolean;
          lien?: string | null;
          message?: string;
          niveau?: string;
          titre?: string;
        };
        Relationships: [];
      };
      operations_financieres: {
        Row: {
          adherent_id: string | null;
          affectation: string;
          cotisation_id: string | null;
          created_at: string;
          created_by: string | null;
          devise: string;
          id: string;
          libelle: string | null;
          montant_usd: number;
          paiement_id: string | null;
          periode: string | null;
          sens: string;
          type_operation: string;
        };
        Insert: {
          adherent_id?: string | null;
          affectation: string;
          cotisation_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          devise?: string;
          id?: string;
          libelle?: string | null;
          montant_usd: number;
          paiement_id?: string | null;
          periode?: string | null;
          sens?: string;
          type_operation: string;
        };
        Update: {
          adherent_id?: string | null;
          affectation?: string;
          cotisation_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          devise?: string;
          id?: string;
          libelle?: string | null;
          montant_usd?: number;
          paiement_id?: string | null;
          periode?: string | null;
          sens?: string;
          type_operation?: string;
        };
        Relationships: [
          {
            foreignKeyName: "operations_financieres_adherent_id_fkey";
            columns: ["adherent_id"];
            isOneToOne: false;
            referencedRelation: "adherents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operations_financieres_cotisation_id_fkey";
            columns: ["cotisation_id"];
            isOneToOne: false;
            referencedRelation: "cotisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "operations_financieres_paiement_id_fkey";
            columns: ["paiement_id"];
            isOneToOne: false;
            referencedRelation: "paiements";
            referencedColumns: ["id"];
          },
        ];
      };
      ordres_remboursement: {
        Row: {
          adherent_id: string | null;
          avis_medical: string | null;
          controle_le: string | null;
          controle_par: string | null;
          created_at: string;
          facture_id: string;
          id: string;
          mode_paiement: string | null;
          montant_usd: number;
          motif_rejet: string | null;
          numero: string;
          partenaire_id: string;
          paye_le: string | null;
          paye_par: string | null;
          prise_en_charge_id: string | null;
          reference_paiement: string | null;
          statut: string;
          updated_at: string;
          valide_le: string | null;
          valide_par: string | null;
        };
        Insert: {
          adherent_id?: string | null;
          avis_medical?: string | null;
          controle_le?: string | null;
          controle_par?: string | null;
          created_at?: string;
          facture_id: string;
          id?: string;
          mode_paiement?: string | null;
          montant_usd: number;
          motif_rejet?: string | null;
          numero: string;
          partenaire_id: string;
          paye_le?: string | null;
          paye_par?: string | null;
          prise_en_charge_id?: string | null;
          reference_paiement?: string | null;
          statut?: string;
          updated_at?: string;
          valide_le?: string | null;
          valide_par?: string | null;
        };
        Update: {
          adherent_id?: string | null;
          avis_medical?: string | null;
          controle_le?: string | null;
          controle_par?: string | null;
          created_at?: string;
          facture_id?: string;
          id?: string;
          mode_paiement?: string | null;
          montant_usd?: number;
          motif_rejet?: string | null;
          numero?: string;
          partenaire_id?: string;
          paye_le?: string | null;
          paye_par?: string | null;
          prise_en_charge_id?: string | null;
          reference_paiement?: string | null;
          statut?: string;
          updated_at?: string;
          valide_le?: string | null;
          valide_par?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ordres_remboursement_adherent_id_fkey";
            columns: ["adherent_id"];
            isOneToOne: false;
            referencedRelation: "adherents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ordres_remboursement_facture_id_fkey";
            columns: ["facture_id"];
            isOneToOne: true;
            referencedRelation: "factures_partenaires";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ordres_remboursement_partenaire_id_fkey";
            columns: ["partenaire_id"];
            isOneToOne: false;
            referencedRelation: "partenaires";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ordres_remboursement_prise_en_charge_id_fkey";
            columns: ["prise_en_charge_id"];
            isOneToOne: false;
            referencedRelation: "prises_en_charge";
            referencedColumns: ["id"];
          },
        ];
      };
      paiements: {
        Row: {
          adherent_id: string;
          cotisation_id: string | null;
          created_at: string;
          date_paiement: string;
          devise: string;
          encaisse_par: string | null;
          id: string;
          mode: string;
          montant_usd: number;
          notes: string | null;
          payeur: string | null;
          periode: string | null;
          preuve_bucket: string | null;
          preuve_path: string | null;
          reference: string | null;
          statut: string;
          type_operation: string;
          updated_at: string;
        };
        Insert: {
          adherent_id: string;
          cotisation_id?: string | null;
          created_at?: string;
          date_paiement?: string;
          devise?: string;
          encaisse_par?: string | null;
          id?: string;
          mode?: string;
          montant_usd: number;
          notes?: string | null;
          payeur?: string | null;
          periode?: string | null;
          preuve_bucket?: string | null;
          preuve_path?: string | null;
          reference?: string | null;
          statut?: string;
          type_operation?: string;
          updated_at?: string;
        };
        Update: {
          adherent_id?: string;
          cotisation_id?: string | null;
          created_at?: string;
          date_paiement?: string;
          devise?: string;
          encaisse_par?: string | null;
          id?: string;
          mode?: string;
          montant_usd?: number;
          notes?: string | null;
          payeur?: string | null;
          periode?: string | null;
          preuve_bucket?: string | null;
          preuve_path?: string | null;
          reference?: string | null;
          statut?: string;
          type_operation?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "paiements_adherent_id_fkey";
            columns: ["adherent_id"];
            isOneToOne: false;
            referencedRelation: "adherents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "paiements_cotisation_id_fkey";
            columns: ["cotisation_id"];
            isOneToOne: false;
            referencedRelation: "cotisations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "paiements_mode_fkey";
            columns: ["mode"];
            isOneToOne: false;
            referencedRelation: "modes_paiement";
            referencedColumns: ["code"];
          },
        ];
      };
      partenaire_documents: {
        Row: {
          bucket: string;
          contrat_id: string | null;
          created_at: string;
          id: string;
          mime_type: string | null;
          nom: string;
          notes: string | null;
          partenaire_id: string;
          storage_path: string;
          taille_octets: number | null;
          type: Database["public"]["Enums"]["type_document_partenaire"];
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          bucket?: string;
          contrat_id?: string | null;
          created_at?: string;
          id?: string;
          mime_type?: string | null;
          nom: string;
          notes?: string | null;
          partenaire_id: string;
          storage_path: string;
          taille_octets?: number | null;
          type?: Database["public"]["Enums"]["type_document_partenaire"];
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          bucket?: string;
          contrat_id?: string | null;
          created_at?: string;
          id?: string;
          mime_type?: string | null;
          nom?: string;
          notes?: string | null;
          partenaire_id?: string;
          storage_path?: string;
          taille_octets?: number | null;
          type?: Database["public"]["Enums"]["type_document_partenaire"];
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "partenaire_documents_contrat_fk";
            columns: ["contrat_id"];
            isOneToOne: false;
            referencedRelation: "contrats_partenaires";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "partenaire_documents_partenaire_id_fkey";
            columns: ["partenaire_id"];
            isOneToOne: false;
            referencedRelation: "partenaires";
            referencedColumns: ["id"];
          },
        ];
      };
      partenaire_historique: {
        Row: {
          ancien_statut: string | null;
          contrat_id: string | null;
          created_at: string;
          created_by: string | null;
          details: Json;
          evenement: string;
          id: string;
          nouveau_statut: string | null;
          partenaire_id: string;
        };
        Insert: {
          ancien_statut?: string | null;
          contrat_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          details?: Json;
          evenement: string;
          id?: string;
          nouveau_statut?: string | null;
          partenaire_id: string;
        };
        Update: {
          ancien_statut?: string | null;
          contrat_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          details?: Json;
          evenement?: string;
          id?: string;
          nouveau_statut?: string | null;
          partenaire_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partenaire_historique_contrat_fk";
            columns: ["contrat_id"];
            isOneToOne: false;
            referencedRelation: "contrats_partenaires";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "partenaire_historique_partenaire_id_fkey";
            columns: ["partenaire_id"];
            isOneToOne: false;
            referencedRelation: "partenaires";
            referencedColumns: ["id"];
          },
        ];
      };
      partenaire_membres: {
        Row: {
          created_at: string;
          fonction: string | null;
          id: string;
          is_active: boolean;
          partenaire_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          fonction?: string | null;
          id?: string;
          is_active?: boolean;
          partenaire_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          fonction?: string | null;
          id?: string;
          is_active?: boolean;
          partenaire_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partenaire_membres_partenaire_id_fkey";
            columns: ["partenaire_id"];
            isOneToOne: false;
            referencedRelation: "partenaires";
            referencedColumns: ["id"];
          },
        ];
      };
      partenaire_notifications: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_lue: boolean;
          lien: string | null;
          message: string;
          niveau: string;
          partenaire_id: string;
          titre: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_lue?: boolean;
          lien?: string | null;
          message: string;
          niveau?: string;
          partenaire_id: string;
          titre: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_lue?: boolean;
          lien?: string | null;
          message?: string;
          niveau?: string;
          partenaire_id?: string;
          titre?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partenaire_notifications_partenaire_id_fkey";
            columns: ["partenaire_id"];
            isOneToOne: false;
            referencedRelation: "partenaires";
            referencedColumns: ["id"];
          },
        ];
      };
      partenaires: {
        Row: {
          adresse: string | null;
          categorie: string | null;
          commune: string | null;
          conventionne: boolean;
          created_at: string;
          created_by: string | null;
          date_convention: string | null;
          description: string | null;
          email: string | null;
          id: string;
          is_active: boolean;
          is_public: boolean;
          logo_url: string | null;
          nom: string;
          notes: string | null;
          numero: string | null;
          ordre: number;
          responsable_email: string | null;
          responsable_fonction: string | null;
          responsable_nom: string | null;
          responsable_telephone: string | null;
          site_web: string | null;
          slug: string;
          statut: Database["public"]["Enums"]["statut_partenaire"];
          telephone: string | null;
          type: Database["public"]["Enums"]["type_partenaire"];
          updated_at: string;
          ville: string;
        };
        Insert: {
          adresse?: string | null;
          categorie?: string | null;
          commune?: string | null;
          conventionne?: boolean;
          created_at?: string;
          created_by?: string | null;
          date_convention?: string | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          is_public?: boolean;
          logo_url?: string | null;
          nom: string;
          notes?: string | null;
          numero?: string | null;
          ordre?: number;
          responsable_email?: string | null;
          responsable_fonction?: string | null;
          responsable_nom?: string | null;
          responsable_telephone?: string | null;
          site_web?: string | null;
          slug: string;
          statut?: Database["public"]["Enums"]["statut_partenaire"];
          telephone?: string | null;
          type: Database["public"]["Enums"]["type_partenaire"];
          updated_at?: string;
          ville?: string;
        };
        Update: {
          adresse?: string | null;
          categorie?: string | null;
          commune?: string | null;
          conventionne?: boolean;
          created_at?: string;
          created_by?: string | null;
          date_convention?: string | null;
          description?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          is_public?: boolean;
          logo_url?: string | null;
          nom?: string;
          notes?: string | null;
          numero?: string | null;
          ordre?: number;
          responsable_email?: string | null;
          responsable_fonction?: string | null;
          responsable_nom?: string | null;
          responsable_telephone?: string | null;
          site_web?: string | null;
          slug?: string;
          statut?: Database["public"]["Enums"]["statut_partenaire"];
          telephone?: string | null;
          type?: Database["public"]["Enums"]["type_partenaire"];
          updated_at?: string;
          ville?: string;
        };
        Relationships: [];
      };
      pec_decisions: {
        Row: {
          ancien_statut: string | null;
          created_at: string;
          decide_par: string | null;
          decision: string;
          id: string;
          montant_approuve_usd: number | null;
          motif: string | null;
          nouveau_statut: string | null;
          prise_en_charge_id: string;
        };
        Insert: {
          ancien_statut?: string | null;
          created_at?: string;
          decide_par?: string | null;
          decision: string;
          id?: string;
          montant_approuve_usd?: number | null;
          motif?: string | null;
          nouveau_statut?: string | null;
          prise_en_charge_id: string;
        };
        Update: {
          ancien_statut?: string | null;
          created_at?: string;
          decide_par?: string | null;
          decision?: string;
          id?: string;
          montant_approuve_usd?: number | null;
          motif?: string | null;
          nouveau_statut?: string | null;
          prise_en_charge_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pec_decisions_prise_en_charge_id_fkey";
            columns: ["prise_en_charge_id"];
            isOneToOne: false;
            referencedRelation: "prises_en_charge";
            referencedColumns: ["id"];
          },
        ];
      };
      pec_prestations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          libelle: string;
          montant_unitaire_usd: number;
          montant_usd: number;
          notes: string | null;
          prise_en_charge_id: string;
          quantite: number;
          type: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          libelle: string;
          montant_unitaire_usd?: number;
          montant_usd?: number;
          notes?: string | null;
          prise_en_charge_id: string;
          quantite?: number;
          type: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          libelle?: string;
          montant_unitaire_usd?: number;
          montant_usd?: number;
          notes?: string | null;
          prise_en_charge_id?: string;
          quantite?: number;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pec_prestations_prise_en_charge_id_fkey";
            columns: ["prise_en_charge_id"];
            isOneToOne: false;
            referencedRelation: "prises_en_charge";
            referencedColumns: ["id"];
          },
        ];
      };
      personnel: {
        Row: {
          created_at: string;
          created_by: string | null;
          date_embauche: string | null;
          departement: string | null;
          email: string | null;
          fonction: string | null;
          grade: string | null;
          id: string;
          is_active: boolean;
          matricule: string;
          nom: string;
          notes: string | null;
          photo_url: string | null;
          postnom: string | null;
          prenom: string | null;
          sexe: string | null;
          statut: string;
          telephone: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          date_embauche?: string | null;
          departement?: string | null;
          email?: string | null;
          fonction?: string | null;
          grade?: string | null;
          id?: string;
          is_active?: boolean;
          matricule: string;
          nom: string;
          notes?: string | null;
          photo_url?: string | null;
          postnom?: string | null;
          prenom?: string | null;
          sexe?: string | null;
          statut?: string;
          telephone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          date_embauche?: string | null;
          departement?: string | null;
          email?: string | null;
          fonction?: string | null;
          grade?: string | null;
          id?: string;
          is_active?: boolean;
          matricule?: string;
          nom?: string;
          notes?: string | null;
          photo_url?: string | null;
          postnom?: string | null;
          prenom?: string | null;
          sexe?: string | null;
          statut?: string;
          telephone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      prises_en_charge: {
        Row: {
          adherent_id: string | null;
          beneficiaire_id: string | null;
          carte_id: string | null;
          contrat_id: string | null;
          created_at: string;
          created_by: string | null;
          date_execution: string | null;
          decide_le: string | null;
          decide_par: string | null;
          decision_motif: string | null;
          id: string;
          info_demandee: string | null;
          info_requise: boolean;
          montant_approuve_usd: number | null;
          montant_estime_usd: number;
          montant_realise_usd: number | null;
          motif: string;
          numero: string;
          partenaire_id: string;
          prestations: Json;
          statut: Database["public"]["Enums"]["statut_prise_en_charge"];
          updated_at: string;
        };
        Insert: {
          adherent_id?: string | null;
          beneficiaire_id?: string | null;
          carte_id?: string | null;
          contrat_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_execution?: string | null;
          decide_le?: string | null;
          decide_par?: string | null;
          decision_motif?: string | null;
          id?: string;
          info_demandee?: string | null;
          info_requise?: boolean;
          montant_approuve_usd?: number | null;
          montant_estime_usd?: number;
          montant_realise_usd?: number | null;
          motif: string;
          numero: string;
          partenaire_id: string;
          prestations?: Json;
          statut?: Database["public"]["Enums"]["statut_prise_en_charge"];
          updated_at?: string;
        };
        Update: {
          adherent_id?: string | null;
          beneficiaire_id?: string | null;
          carte_id?: string | null;
          contrat_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_execution?: string | null;
          decide_le?: string | null;
          decide_par?: string | null;
          decision_motif?: string | null;
          id?: string;
          info_demandee?: string | null;
          info_requise?: boolean;
          montant_approuve_usd?: number | null;
          montant_estime_usd?: number;
          montant_realise_usd?: number | null;
          motif?: string;
          numero?: string;
          partenaire_id?: string;
          prestations?: Json;
          statut?: Database["public"]["Enums"]["statut_prise_en_charge"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prises_en_charge_adherent_id_fkey";
            columns: ["adherent_id"];
            isOneToOne: false;
            referencedRelation: "adherents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prises_en_charge_beneficiaire_id_fkey";
            columns: ["beneficiaire_id"];
            isOneToOne: false;
            referencedRelation: "beneficiaires";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prises_en_charge_carte_id_fkey";
            columns: ["carte_id"];
            isOneToOne: false;
            referencedRelation: "cartes_membre";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prises_en_charge_contrat_id_fkey";
            columns: ["contrat_id"];
            isOneToOne: false;
            referencedRelation: "contrats_partenaires";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prises_en_charge_partenaire_id_fkey";
            columns: ["partenaire_id"];
            isOneToOne: false;
            referencedRelation: "partenaires";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          fonction: string | null;
          full_name: string | null;
          id: string;
          is_active: boolean;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          fonction?: string | null;
          full_name?: string | null;
          id: string;
          is_active?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          fonction?: string | null;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      soldes_adherents: {
        Row: {
          adherent_id: string;
          derniere_operation: string | null;
          droits_ouverts: boolean;
          mensualites_validees: number;
          solde: number;
          total_du: number;
          total_paye: number;
          updated_at: string;
        };
        Insert: {
          adherent_id: string;
          derniere_operation?: string | null;
          droits_ouverts?: boolean;
          mensualites_validees?: number;
          solde?: number;
          total_du?: number;
          total_paye?: number;
          updated_at?: string;
        };
        Update: {
          adherent_id?: string;
          derniere_operation?: string | null;
          droits_ouverts?: boolean;
          mensualites_validees?: number;
          solde?: number;
          total_du?: number;
          total_paye?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "soldes_adherents_adherent_id_fkey";
            columns: ["adherent_id"];
            isOneToOne: true;
            referencedRelation: "adherents";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      appartient_partenaire: {
        Args: { _partenaire_id: string; _user_id: string };
        Returns: boolean;
      };
      lier_mon_compte_beneficiaire: {
        Args: { _code: string };
        Returns: Json;
      };
      mon_contexte_compte: {
        Args: never;
        Returns: {
          role: Database["public"]["Enums"]["app_role"];
          contexte: string;
          adherent_id: string | null;
          beneficiaire_id: string | null;
          partenaire_id: string | null;
          identifiant: string | null;
        }[];
      };
      owns_beneficiaire: {
        Args: { _beneficiaire_id: string; _user_id: string };
        Returns: boolean;
      };
      partenaire_verifier_code: {
        Args: { _code?: string; _partenaire_id: string; _token?: string };
        Returns: Json;
      };
      can_manage_adherents: { Args: { _user_id: string }; Returns: boolean };
      can_manage_cms: { Args: { _user_id: string }; Returns: boolean };
      can_manage_finance: { Args: { _user_id: string }; Returns: boolean };
      carte_conditions: { Args: { _adherent_id: string }; Returns: Json };
      contrat_actif_partenaire: {
        Args: { _partenaire_id: string };
        Returns: string;
      };
      contrat_valide: { Args: { _contrat_id: string }; Returns: boolean };
      droits_ouverts: { Args: { _adherent_id: string }; Returns: boolean };
      emettre_carte: {
        Args: {
          _adherent_id?: string;
          _motif?: string;
          _paiement_id?: string;
          _personnel_id?: string;
        };
        Returns: string;
      };
      emettre_carte_beneficiaire: {
        Args: {
          _beneficiaire_id: string;
          _motif?: string;
          _paiement_id?: string;
        };
        Returns: string;
      };
      facture_controler: {
        Args: {
          _avis?: string;
          _decision: string;
          _facture_id: string;
          _montant_valide?: number;
        };
        Returns: Json;
      };
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][];
          _user_id: string;
        };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: { _user_id: string }; Returns: boolean };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      next_matricule: { Args: never; Returns: string };
      ordre_payer: {
        Args: { _mode: string; _ordre_id: string; _reference?: string };
        Returns: Json;
      };
      ordre_valider: {
        Args: { _decision?: string; _motif?: string; _ordre_id: string };
        Returns: Json;
      };
      owns_adherent: {
        Args: { _adherent_id: string; _user_id: string };
        Returns: boolean;
      };
      param_numeric: {
        Args: { _cle: string; _defaut: number };
        Returns: number;
      };
      partenaire_eligibilite: {
        Args: { _matricule?: string; _partenaire_id: string; _token?: string };
        Returns: Json;
      };
      partenaire_verifier_adherent: {
        Args: { _partenaire_id: string; _token: string };
        Returns: Json;
      };
      partenaires_de: { Args: { _user_id: string }; Returns: string[] };
      pec_decider: {
        Args: {
          _decision: string;
          _montant?: number;
          _motif?: string;
          _pec_id: string;
        };
        Returns: Json;
      };
      pec_enregistrer_prestations: {
        Args: { _pec_id: string; _prestations: Json };
        Returns: Json;
      };
      plafond_disponible: { Args: { _adherent_id: string }; Returns: Json };
      recalculer_solde: { Args: { _adherent_id: string }; Returns: undefined };
      traiter_retards: { Args: never; Returns: number };
      verifier_carte: { Args: { _token: string }; Returns: Json };
    };
    Enums: {
      app_role:
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
      cms_statut: "brouillon" | "publie" | "archive";
      lien_parente: "conjoint" | "enfant" | "parent" | "autre";
      media_type: "image" | "video" | "document" | "audre";
      mode_paiement: "especes" | "mobile_money" | "virement" | "carte" | "cheque";
      reseau_social:
        | "facebook"
        | "instagram"
        | "tiktok"
        | "youtube"
        | "linkedin"
        | "x"
        | "whatsapp"
        | "telegram"
        | "messenger"
        | "truth_social"
        | "threads";
      statut_adherent:
        "actif" | "suspendu" | "expire" | "en_attente" | "resilie" | "inactif" | "decede";
      statut_contrat: "brouillon" | "actif" | "suspendu" | "expire" | "resilie";
      statut_cotisation: "due" | "partielle" | "payee" | "en_retard" | "annulee";
      statut_facture: "brouillon" | "soumise" | "validee" | "payee" | "rejetee";
      statut_partenaire: "en_attente" | "actif" | "suspendu" | "resilie";
      statut_prise_en_charge:
        "soumise" | "en_revue" | "approuvee" | "refusee" | "executee" | "annulee";
      tier_code: "bronze" | "argent" | "or" | "platine";
      type_adhesion: "individuel" | "familial" | "collectif";
      type_document:
        | "piece_identite"
        | "photo"
        | "justificatif_domicile"
        | "acte_naissance"
        | "contrat"
        | "certificat_medical"
        | "autre";
      type_document_partenaire:
        "convention" | "agrement" | "licence" | "rccm" | "identite" | "facture" | "autre";
      type_partenaire:
        | "hopital"
        | "pharmacie"
        | "laboratoire"
        | "centre_bien_etre"
        | "entreprise"
        | "structure_sanitaire"
        | "dispensaire";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "administrateur",
        "directeur_general",
        "coordonnateur",
        "medecin_conseil",
        "financier",
        "agent_humanitas",
        "entreprise",
        "hopital",
        "pharmacie",
        "laboratoire",
        "centre_bien_etre",
        "adherent",
      ],
      cms_statut: ["brouillon", "publie", "archive"],
      lien_parente: ["conjoint", "enfant", "parent", "autre"],
      media_type: ["image", "video", "document", "audre"],
      mode_paiement: ["especes", "mobile_money", "virement", "carte", "cheque"],
      reseau_social: [
        "facebook",
        "instagram",
        "tiktok",
        "youtube",
        "linkedin",
        "x",
        "whatsapp",
        "telegram",
        "messenger",
        "truth_social",
        "threads",
      ],
      statut_adherent: [
        "actif",
        "suspendu",
        "expire",
        "en_attente",
        "resilie",
        "inactif",
        "decede",
      ],
      statut_contrat: ["brouillon", "actif", "suspendu", "expire", "resilie"],
      statut_cotisation: ["due", "partielle", "payee", "en_retard", "annulee"],
      statut_facture: ["brouillon", "soumise", "validee", "payee", "rejetee"],
      statut_partenaire: ["en_attente", "actif", "suspendu", "resilie"],
      statut_prise_en_charge: [
        "soumise",
        "en_revue",
        "approuvee",
        "refusee",
        "executee",
        "annulee",
      ],
      tier_code: ["bronze", "argent", "or", "platine"],
      type_adhesion: ["individuel", "familial", "collectif"],
      type_document: [
        "piece_identite",
        "photo",
        "justificatif_domicile",
        "acte_naissance",
        "contrat",
        "certificat_medical",
        "autre",
      ],
      type_document_partenaire: [
        "convention",
        "agrement",
        "licence",
        "rccm",
        "identite",
        "facture",
        "autre",
      ],
      type_partenaire: [
        "hopital",
        "pharmacie",
        "laboratoire",
        "centre_bien_etre",
        "entreprise",
        "structure_sanitaire",
        "dispensaire",
      ],
    },
  },
} as const;
