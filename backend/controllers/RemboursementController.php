<?php
namespace Humanitas\Backend\Controllers;

use Humanitas\Backend\Models\Remboursement;
use Humanitas\Backend\Helpers\ResponseHelper;

class RemboursementController {

    private Remboursement $model;

    public function __construct() {
        $this->model = new Remboursement();
    }

    public function listByAdherent(string $adherentId): void {
        $result = $this->model->getByAdherent($adherentId);
        ResponseHelper::json($result['data']);
    }

    public function create(): void {
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $this->model->submitClaim($data);
        ResponseHelper::json($result['data'], 201);
    }
}
