<?php
namespace Humanitas\Backend\Controllers;

use Humanitas\Backend\Helpers\ResponseHelper;
use Humanitas\Backend\Services\SupabaseService;

class AuthController {

    private SupabaseService $supabase;

    public function __construct() {
        $this->supabase = new SupabaseService();
    }

    public function login(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        ResponseHelper::json([
            'message' => 'Authentification réussie via Supabase Auth API',
            'session' => [
                'access_token' => 'jwt_demo_token',
                'user' => ['email' => $input['email'] ?? 'adherent@humanitas.ci']
            ]
        ]);
    }
}
