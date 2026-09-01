<?php
namespace Humanitas\Backend\Models;

use Humanitas\Backend\Services\SupabaseService;

/**
 * Modèle Cotisation
 */
class Cotisation {

    private SupabaseService $supabase;

    public function __construct() {
        $this->supabase = new SupabaseService();
    }

    public function getByAdherent(string $adherentId): array {
        return $this->supabase->query("cotisations?adherent_id=eq.{$adherentId}&order=created_at.desc");
    }

    public function create(array $data): array {
        return $this->supabase->query('cotisations', 'POST', $data);
    }
}
