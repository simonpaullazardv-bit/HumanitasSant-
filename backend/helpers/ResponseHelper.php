<?php
namespace Humanitas\Backend\Helpers;

/**
 * Helper de Formatage des Réponses API REST
 */
class ResponseHelper {

    public static function json($data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status' => $statusCode >= 200 && $statusCode < 300 ? 'success' : 'error',
            'code' => $statusCode,
            'timestamp' => date('c'),
            'data' => $data
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit();
    }

    public static function error(string $message, int $statusCode = 400, $details = null): void {
        self::json([
            'message' => $message,
            'details' => $details
        ], $statusCode);
    }
}
