<?php
namespace Humanitas\Backend\Services;

/**
 * Service de Génération des Attestations et Récépissés PDF
 */
class PdfGeneratorService {

    public function generateAttestationAdhesion(array $adherent): string {
        $pdfContent = "HUMANITAS SANTÉ - ATTESTATION D'ADHÉSION\n";
        $pdfContent .= "Nom & Prénom: " . $adherent['nom'] . " " . $adherent['prenom'] . "\n";
        $pdfContent .= "Numéro d'adhérent: " . $adherent['numero_adherent'] . "\n";
        $pdfContent .= "Formule souscrite: " . strtoupper($adherent['formule']) . "\n";
        $pdfContent .= "Date d'émission: " . date('d/m/Y') . "\n";
        
        $filePath = __DIR__ . '/../uploads/attestation_' . $adherent['numero_adherent'] . '.txt';
        file_put_contents($filePath, $pdfContent);
        return $filePath;
    }
}
