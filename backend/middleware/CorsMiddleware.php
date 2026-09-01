<?php
namespace Humanitas\Backend\Middleware;

/**
 * Middleware d'Autorisation des Requêtes Cross-Origin (CORS)
 */
class CorsMiddleware {

    public static function handle(): void {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }
}
