<?php
namespace Humanitas\Tests;

use PHPUnit\Framework\TestCase;
use Humanitas\Backend\Helpers\Validator;

class BackendTest extends TestCase {

    public function testRequiredValidation(): void {
        $data = ['email' => 'adherent@humanitas.ci'];
        $errors = Validator::validateRequired($data, ['email', 'nom']);
        
        $this->assertArrayHasKey('nom', $errors);
        $this->assertArrayNotHasKey('email', $errors);
    }
}
