<?php
namespace Humanitas\Backend\Models;

use Humanitas\Backend\Services\SupabaseService;

/**
 * Modèle Adhérent
 */
class Adherent {

    private SupabaseService $supabase;

    public function __construct() {
        $this->supabase = new SupabaseService();
    }

    public function getAll(): array {
        return $this->supabase->query('adherents?select=*,profiles(*)');
    }

    public function getById(string $id): array {
        return $this->supabase->query("adherents?id=eq.{$id}&select=*,profiles(*)");
    }

    public function create(array $data): array {
        return $this->supabase->query('adherents', 'POST', $data);
    }
}
