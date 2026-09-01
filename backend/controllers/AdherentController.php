<?php
namespace Humanitas\Backend\Controllers;

use Humanitas\Backend\Models\Adherent;
use Humanitas\Backend\Helpers\ResponseHelper;

class AdherentController {

    private Adherent $model;

    public function __construct() {
        $this->model = new Adherent();
    }

    public function index(): void {
        $result = $this->model->getAll();
        ResponseHelper::json($result['data']);
    }

    public function show(string $id): void {
        $result = $this->model->getById($id);
        if (empty($result['data'])) {
            ResponseHelper::error("Adhérent non trouvé.", 404);
        }
        ResponseHelper::json($result['data'][0]);
    }
}
