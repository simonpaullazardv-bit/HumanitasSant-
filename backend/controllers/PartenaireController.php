<?php
namespace Humanitas\Backend\Controllers;

use Humanitas\Backend\Models\Partenaire;
use Humanitas\Backend\Helpers\ResponseHelper;

class PartenaireController {

    private Partenaire $model;

    public function __construct() {
        $this->model = new Partenaire();
    }

    public function index(): void {
        $result = $this->model->getAllActive();
        ResponseHelper::json($result['data']);
    }
}
