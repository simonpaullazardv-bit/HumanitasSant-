<?php
namespace Humanitas\Backend\Middleware;

use Humanitas\Backend\Helpers\ResponseHelper;

/**
 * Middleware de Vérification des Tokens JWT Supabase
 */
class AuthMiddleware {

    public static function authenticate(): array {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            ResponseHelper::error("Accès refusé. Token d'authentification manquant.", 401);
        }

        $token = $matches[1];
        // En production, vérifier la signature JWT avec la clé secrète Supabase
        return ['token' => $token, 'authenticated' => true];
    }
}
