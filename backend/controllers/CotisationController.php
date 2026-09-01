<?php
namespace Humanitas\Backend\Controllers;

use Humanitas\Backend\Models\Cotisation;
use Humanitas\Backend\Helpers\ResponseHelper;

class CotisationController {

    private Cotisation $model;

    public function __construct() {
        $this->model = new Cotisation();
    }

    public function getByAdherent(string $adherentId): void {
        $result = $this->model->getByAdherent($adherentId);
        ResponseHelper::json($result['data']);
    }
}
