/**
 * Convertit un label interne de catégorie (GRILLE_2026, manualMarqueType, vehicle.category)
 * en libellé lisible pour l'affichage final sur les documents (récépissé, étiquette).
 *
 * Règles :
 *   Tourisme 1–7 CV          → Touristique light
 *   Tourisme 8–10 / 11–15 / >15 CV → Touristique Medium
 *   Utilitaire ≤ 3,5T        → Utilitaire light
 *   Utilitaire 3,5–10T / 10–20T    → Utilitaire Medium
 *   Utilitaire > 20T         → Utilitaire Heavy
 *   Tracteur (Agricole/Routier)     → Tracteur
 *   Remorque (≤5T / >5T)           → Remorque
 *   Bateau de plaisance/transport   → Bateau
 *   Baleinière à moteur             → Baleinière
 *   Motocycle                       → Motocycle
 */
export function mapCategoryToDisplayLabel(raw: string): string {
    const s = (raw || '').toLowerCase().trim();

    // ── Touristique ───────────────────────────────────────────────────────
    if (s.includes('tourisme') || s.includes('touristique')) {
        // 1–7 CV ou "light" → Touristique light
        if (
            s.includes('light') ||
            (s.includes('1') && (s.includes('–7') || s.includes('-7') || s.includes('7')))
        ) return 'Touristique light';
        // Tout le reste → Medium
        return 'Touristique Medium';
    }

    // ── Utilitaire ────────────────────────────────────────────────────────
    if (s.includes('utilitaire')) {
        // Heavy : > 20T ou "heavy"
        if (s.includes('heavy') || (s.includes('>') && s.includes('20'))) return 'Utilitaire Heavy';
        // Light : ≤ 3,5T ou "light"
        if (s.includes('light') || s.includes('≤') || s.includes('3,5') || s.includes('3.5')) return 'Utilitaire light';
        // Medium : tout le reste (3,5–10T et 10–20T)
        return 'Utilitaire Medium';
    }

    // ── Tracteur ──────────────────────────────────────────────────────────
    if (s.includes('tracteur') || s.includes('tractor')) return 'Tracteur';

    // ── Remorque ──────────────────────────────────────────────────────────
    if (s.includes('remorque')) return 'Remorque';

    // ── Baleinière (avant "bateau" pour éviter le match partiel) ─────────
    if (s.includes('balein')) return 'Baleinière';

    // ── Bateau ────────────────────────────────────────────────────────────
    if (s.includes('bateau') || s.includes('plaisance')) return 'Bateau';

    // ── Motocycle ─────────────────────────────────────────────────────────
    if (s.includes('moto')) return 'Motocycle';

    // Fallback : retourner tel quel
    return raw;
}
