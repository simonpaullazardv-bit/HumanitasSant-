# Données institutionnelles HUMANITAS

## Structure recommandée

- `institutional.ts` : contenu institutionnel exploité par les routes (mission, vision, valeurs, adhésion, présentation, historique, objectifs, offres et message DG).
- `references/` : copies JSON de référence, non utilisées directement par le frontend.
- `docs/` : contenus éditoriaux séparés et notes de référence.
- `site.ts` : identité publique, médias, navigation et liens sociaux actifs.
- `socials.ts` : catalogue des réseaux sociaux ; seuls les comptes disposant d’une URL confirmée sont affichés.
- `public-fallbacks.ts` : données publiques locales de secours lorsque Supabase ne fournit pas encore de contenu.

Les contenus locaux restent disponibles comme fallback. Supabase pourra ensuite prendre la priorité lorsqu’un contenu public valide est publié.
