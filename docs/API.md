# Documentation des Endpoints REST API PHP

## Authentification
- `POST /api/v1/auth/login` : Authentification et génération du token de session.

## Adhérents
- `GET /api/v1/adherents` : Liste des adhérents (réservé aux gestionnaires/admins).
- `GET /api/v1/adherents/{id}` : Consultation de la fiche adhérent.

## Partenaires
- `GET /api/v1/partenaires` : Consultation de l'annuaire des hôpitaux et pharmacies conventionnés.

## Remboursements
- `POST /api/v1/remboursements` : Soumission d'une nouvelle demande de remboursement de soins.
