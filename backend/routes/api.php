<?php
use Humanitas\Backend\Controllers\AdherentController;
use Humanitas\Backend\Controllers\CotisationController;
use Humanitas\Backend\Controllers\RemboursementController;
use Humanitas\Backend\Controllers\PartenaireController;
use Humanitas\Backend\Controllers\AuthController;
use Humanitas\Backend\Helpers\ResponseHelper;

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

switch ($uri) {
    case '/api/v1/auth/login':
        if ($method === 'POST') (new AuthController())->login();
        break;

    case '/api/v1/adherents':
        if ($method === 'GET') (new AdherentController())->index();
        break;

    case '/api/v1/partenaires':
        if ($method === 'GET') (new PartenaireController())->index();
        break;

    case '/api/v1/remboursements':
        if ($method === 'POST') (new RemboursementController())->create();
        break;

    default:
        ResponseHelper::error("Route non trouvée", 404);
}
