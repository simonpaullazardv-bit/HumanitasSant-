<?php
namespace Humanitas\Backend\Models;

use Humanitas\Backend\Services\SupabaseService;

/**
 * Modèle Partenaire & Prestataire de Santé
 */
class Partenaire {

    private SupabaseService $supabase;

    public function __construct() {
        $this->supabase = new SupabaseService();
    }

    public function getAllActive(): array {
        return $this->supabase->query("partenaires?est_conventionne=eq.true&order=nom_etablissement.asc");
    }

    public function getByCity(string $city): array {
        return $this->supabase->query("partenaires?ville=ilike.*{$city}*&est_conventionne=eq.true");
    }
}
