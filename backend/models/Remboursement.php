<?php
namespace Humanitas\Backend\Models;

use Humanitas\Backend\Services\SupabaseService;

/**
 * Modèle Demande de Remboursement
 */
class Remboursement {

    private SupabaseService $supabase;

    public function __construct() {
        $this->supabase = new SupabaseService();
    }

    public function getByAdherent(string $adherentId): array {
        return $this->supabase->query("demandes_remboursement?adherent_id=eq.{$adherentId}&order=created_at.desc");
    }

    public function submitClaim(array $data): array {
        return $this->supabase->query('demandes_remboursement', 'POST', $data);
    }
}
