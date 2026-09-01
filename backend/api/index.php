<?php
require_once __DIR__ . '/../middleware/CorsMiddleware.php';
require_once __DIR__ . '/../helpers/ResponseHelper.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../services/SupabaseService.php';

use Humanitas\Backend\Middleware\CorsMiddleware;

// Traitement des requêtes CORS
CorsMiddleware::handle();

// Inclusion des routes API
require_once __DIR__ . '/../routes/api.php';
