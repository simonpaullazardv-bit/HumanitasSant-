<?php
namespace Humanitas\Backend\Helpers;

/**
 * Helper de Validation des Entrées Utilisateur
 */
class Validator {

    public static function validateRequired(array $data, array $requiredFields): array {
        $errors = [];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty(trim((string)$data[$field]))) {
                $errors[$field] = "Le champ '{$field}' est obligatoire.";
            }
        }
        return $errors;
    }

    public static function sanitizeEmail(string $email): string {
        return filter_var(trim($email), FILTER_SANITIZE_EMAIL);
    }
}
