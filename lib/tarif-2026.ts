/**
 * GRILLE TARIFAIRE 2026 — Personnes Morales
 * Arrêté du Ministre Provincial N°SC/003/GPK/MIN.FIN.ECO.NUM/MKO/MBC/2026
 * du 30 Janvier 2026 — Exercice 2026
 * Annexe 1 (Personnes Morales — Véhicules Terrestres)
 * Annexe 3 (Unités Flottantes — commune PM/PP)
 *
 * Structure terrestre :
 *   impot     = Impôt sur les véhicules (USD)
 *   tsc       = Taxe Spéciale de Circulation routière (USD)
 *   redevance = Redevance (USD)
 *   imprime   = Frais d'imprimé (USD)
 *   total     = Somme des 4 composantes (= creditAmount)
 *
 * Structure flottante (Annexe 3) :
 *   ivh       = Impôt sur les Véhicules/Huil (USD) — remplace impot + tsc
 *   redevance = Redevance (USD)
 *   imprime   = Frais d'imprimé (USD)
 *   total     = Somme (ivh + redevance + imprime)
 *
 * Les frais bancaires (+4 USD) s'appliquent toujours en sus.
 */

export { TAUX_FC } from './scan-pricing';

export interface Tarif2026Breakdown {
    impot?: number;      // Terrestre uniquement
    tsc?: number;        // Terrestre uniquement
    ivh?: number;        // Flottant uniquement (Annexe 3)
    redevance: number;
    imprime: number;
    total: number;
    categorie: string;
}

export type Categorie2026 =
    | 'moto'
    | 'tourisme'
    | 'utilitaire'
    | 'tracteur'
    | 'remorque'
    | 'bateau';

export interface Calcul2026Input {
    categorie: Categorie2026;
    cv?: number;
    tonnage?: number;
    sousCategorie?: string;
    regime?: 'PM' | 'PP';
}

// ─── SOUS-CATÉGORIES ──────────────────────────────────────────────────────────
export const SOUS_CATEGORIES_2026: {
    categorie: Categorie2026;
    label: string;
    requireCV?: boolean;
    requireTonnage?: boolean;
    group: string;
}[] = [
    // Motocycles
    { categorie: 'moto', label: 'Bicycle — Toutes cylindrées', group: 'Motocycles' },
    { categorie: 'moto', label: 'Tricycle', group: 'Motocycles' },
    // Tourisme (Nouvelle grille 2026: Voiture & Jeep)
    { categorie: 'tourisme', label: 'Véhicule de Tourisme Light (1–10 CV)', requireCV: true, group: 'Véhicules de Tourisme' },
    { categorie: 'tourisme', label: 'Véhicule de Tourisme Medium (11–15 CV)', requireCV: true, group: 'Véhicules de Tourisme' },
    { categorie: 'tourisme', label: 'Véhicule de Tourisme Heavy (> 15 CV)', requireCV: true, group: 'Véhicules de Tourisme' },
    // Utilitaires (Nouvelle grille 2026: Tonnage + CV)
    { categorie: 'utilitaire', label: 'Véhicule Utilitaire Light (≤ 2.500 kg, 1–10 CV)', requireTonnage: true, requireCV: true, group: 'Véhicules Utilitaires' },
    { categorie: 'utilitaire', label: 'Véhicule Utilitaire Medium (2.500–10.000 kg, 11–15 CV)', requireTonnage: true, requireCV: true, group: 'Véhicules Utilitaires' },
    { categorie: 'utilitaire', label: 'Véhicule Utilitaire Heavy (> 10.000 kg, > 15 CV)', requireTonnage: true, requireCV: true, group: 'Véhicules Utilitaires' },
    // Tracteurs
    { categorie: 'tracteur', label: 'Tracteur (1–10 CV)', requireCV: true, group: 'Tracteurs' },
    { categorie: 'tracteur', label: 'Tracteur (11–15 CV)', requireCV: true, group: 'Tracteurs' },
    { categorie: 'tracteur', label: 'Tracteur (> 15 CV)', requireCV: true, group: 'Tracteurs' },
    // Remorques
    { categorie: 'remorque', label: 'Remorque < 2.500 kg', requireTonnage: true, group: 'Remorques' },
    { categorie: 'remorque', label: 'Remorque 2.500–10.000 kg', requireTonnage: true, group: 'Remorques' },
    { categorie: 'remorque', label: 'Remorque > 10.000 kg', requireTonnage: true, group: 'Remorques' },
    // B.B.A — Baleinières, Barges et autres embarcations
    { categorie: 'bateau', label: 'B.B.A 0–300 M³', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'B.B.A 301–450 M³', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'B.B.A 451–1.000 M³', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'B.B.A > 1.000 M³', group: 'Unités Flottantes' },
    // Plaisance
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 15 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 25 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 40 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 48 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 50 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 60 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 61–65 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 75 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 85 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 90 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 115 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 140 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 150 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 151 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 200 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 250 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'Plaisance T.M.R.T. 251–279 CV', group: 'Unités Flottantes' },
    // T.D.M.
    { categorie: 'bateau', label: 'T.D.M. 61–150 CV — Tarif A', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'T.D.M. 61–150 CV — Tarif B', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'T.D.M. 151–250 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'T.D.M. 251–279 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'T.D.M. 280–593 CV', group: 'Unités Flottantes' },
    { categorie: 'bateau', label: 'T.D.M. > 593 CV', group: 'Unités Flottantes' },
];

export const PRIMARY_CATEGORIES_2026 = Array.from(new Set(SOUS_CATEGORIES_2026.map(sc => sc.group)));

// ─── HELPERS PARSING ──────────────────────────────────────────────────────────

export const getCvFromLabel = (label: string): { min: number; max: number } => {
    if (label.includes('1–10')) return { min: 1, max: 10 };
    if (label.includes('11–15')) return { min: 11, max: 15 };
    if (label.includes('> 15') || label.includes('plus de 15')) return { min: 16, max: 99 };
    // Motos: bicycle = cv 0, tricycle = cv 1
    if (label.includes('Tricycle')) return { min: 1, max: 1 };
    if (label.includes('Bicycle')) return { min: 0, max: 0 };
    return { min: 0, max: 99 };
};

export const getTonnageFromLabel = (label: string): number => {
    if (label.includes('< 2.500') || label.includes('moins de 2.500')) return 1;
    if (label.includes('2.500–10.000') || label.includes('2.500 à 10.000')) return 5;
    if (label.includes('> 10.000') || label.includes('plus de 10.000')) return 15;
    return 1;
};

// ─── MOTOCYCLES ───────────────────────────────────────────────────────────────
const BICYCLE: Tarif2026Breakdown = { // PM = PP
    impot: 9.50, tsc: 2.50, redevance: 0.00, imprime: 5.00, total: 17.00,
    categorie: 'Bicycle — Toutes cylindrées',
};
const TRICYCLE: Tarif2026Breakdown = { // PM = PP
    impot: 11.00, tsc: 4.00, redevance: 0.00, imprime: 5.00, total: 20.00,
    categorie: 'Tricycle',
};

// ─── PM RATES (Annexe 1 — Personnes Morales) ──────────────────────────────────

const PM_TOURISME_1_10: Tarif2026Breakdown = {
    impot: 35.60, tsc: 32.40, redevance: 12.00, imprime: 5.00, total: 85.00,
    categorie: 'Véhicule de Tourisme Light (1–10 CV) – PM',
};
const PM_TOURISME_11_15: Tarif2026Breakdown = {
    impot: 39.20, tsc: 38.40, redevance: 12.00, imprime: 5.00, total: 94.60,
    categorie: 'Véhicule de Tourisme Medium (11–15 CV) – PM',
};
const PM_TOURISME_PLUS15: Tarif2026Breakdown = {
    impot: 44.00, tsc: 43.20, redevance: 12.00, imprime: 5.00, total: 104.20,
    categorie: 'Véhicule de Tourisme Heavy (> 15 CV) – PM',
};

const PM_UTIL_M2K5: Tarif2026Breakdown = {
    impot: 28.00, tsc: 39.20, redevance: 12.00, imprime: 5.00, total: 84.20,
    categorie: 'Véhicule Utilitaire Light (≤ 2.500 kg, 1–10 CV) – PM',
};
const PM_UTIL_2K5_10K: Tarif2026Breakdown = {
    impot: 32.00, tsc: 43.20, redevance: 12.00, imprime: 5.00, total: 92.20,
    categorie: 'Véhicule Utilitaire Medium (2.500–10.000 kg, 11–15 CV) – PM',
};
const PM_UTIL_P10K: Tarif2026Breakdown = {
    impot: 35.10, tsc: 49.80, redevance: 12.00, imprime: 5.00, total: 100.90,
    categorie: 'Véhicule Utilitaire Heavy (> 10.000 kg, > 15 CV) – PM',
};

const PM_TRACTEUR_1_10: Tarif2026Breakdown = {
    impot: 26.80, tsc: 23.60, redevance: 12.00, imprime: 5.00, total: 67.40,
    categorie: 'Tracteur — 1 à 10 CV – PM',
};
const PM_TRACTEUR_11_15: Tarif2026Breakdown = {
    impot: 34.60, tsc: 28.40, redevance: 12.00, imprime: 5.00, total: 80.00,
    categorie: 'Tracteur — 11 à 15 CV – PM',
};
const PM_TRACTEUR_PLUS15: Tarif2026Breakdown = {
    impot: 35.20, tsc: 34.40, redevance: 12.00, imprime: 5.00, total: 86.60,
    categorie: 'Tracteur — Plus de 15 CV – PM',
};

const PM_REMORQUE_M2K5: Tarif2026Breakdown = {
    impot: 31.60, tsc: 28.40, redevance: 12.00, imprime: 5.00, total: 77.00,
    categorie: 'Remorque — Moins de 2.500 kg – PM',
};
const PM_REMORQUE_2K5_10K: Tarif2026Breakdown = {
    impot: 35.20, tsc: 34.40, redevance: 12.00, imprime: 5.00, total: 86.60,
    categorie: 'Remorque — 2.500 à 10.000 kg – PM',
};
const PM_REMORQUE_P10K: Tarif2026Breakdown = {
    impot: 40.00, tsc: 39.20, redevance: 12.00, imprime: 5.00, total: 96.20,
    categorie: 'Remorque — Plus de 10.000 kg – PM',
};

// ─── PP RATES (Annexe 2 — Personnes Physiques) ────────────────────────────────

const PP_TOURISME_1_10: Tarif2026Breakdown = {
    impot: 35.60, tsc: 30.40, redevance: 6.00, imprime: 5.00, total: 77.00,
    categorie: 'Véhicule de Tourisme Light (1–10 CV)',
};
const PP_TOURISME_11_15: Tarif2026Breakdown = {
    impot: 39.20, tsc: 34.90, redevance: 6.00, imprime: 5.00, total: 85.10,
    categorie: 'Véhicule de Tourisme Medium (11–15 CV)',
};
const PP_TOURISME_PLUS15: Tarif2026Breakdown = {
    impot: 44.00, tsc: 39.40, redevance: 6.00, imprime: 5.00, total: 94.40,
    categorie: 'Véhicule de Tourisme Heavy (> 15 CV)',
};

const PP_UTIL_M2K5: Tarif2026Breakdown = {
    impot: 28.00, tsc: 31.60, redevance: 6.00, imprime: 5.00, total: 70.60,
    categorie: 'Véhicule Utilitaire Light (≤ 2.500 kg, 1–10 CV)',
};
const PP_UTIL_2K5_10K: Tarif2026Breakdown = {
    impot: 32.00, tsc: 30.40, redevance: 6.00, imprime: 5.00, total: 73.40,
    categorie: 'Véhicule Utilitaire Medium (2.500–10.000 kg, 11–15 CV)',
};
const PP_UTIL_P10K: Tarif2026Breakdown = {
    impot: 35.10, tsc: 34.90, redevance: 6.00, imprime: 5.00, total: 81.00,
    categorie: 'Véhicule Utilitaire Heavy (> 10.000 kg, > 15 CV)',
};

const PP_TRACTEUR_1_10: Tarif2026Breakdown = {
    impot: 26.80, tsc: 23.60, redevance: 6.00, imprime: 5.00, total: 61.40,
    categorie: 'Tracteur — 1 à 10 CV',
};
const PP_TRACTEUR_11_15: Tarif2026Breakdown = {
    impot: 31.60, tsc: 28.40, redevance: 6.00, imprime: 5.00, total: 71.00,
    categorie: 'Tracteur — 11 à 15 CV',
};
const PP_TRACTEUR_PLUS15: Tarif2026Breakdown = {
    impot: 35.20, tsc: 34.40, redevance: 6.00, imprime: 5.00, total: 80.60,
    categorie: 'Tracteur — Plus de 15 CV',
};

const PP_REMORQUE_M2K5: Tarif2026Breakdown = {
    impot: 31.60, tsc: 28.40, redevance: 6.00, imprime: 5.00, total: 71.00,
    categorie: 'Remorque — Moins de 2.500 kg',
};
const PP_REMORQUE_2K5_10K: Tarif2026Breakdown = {
    impot: 35.20, tsc: 34.40, redevance: 6.00, imprime: 5.00, total: 80.60,
    categorie: 'Remorque — 2.500 à 10.000 kg',
};
const PP_REMORQUE_P10K: Tarif2026Breakdown = {
    impot: 40.00, tsc: 39.20, redevance: 6.00, imprime: 5.00, total: 90.20,
    categorie: 'Remorque — Plus de 10.000 kg',
};

// ─── UNITÉS FLOTTANTES (Annexe 3) ────────────────────────────────────────────
const makeBateau = (ivh: number, redevance: number, imprime: number, categorie: string): Tarif2026Breakdown => ({
    impot: 0, tsc: 0, ivh, redevance, imprime, total: ivh + redevance + imprime, categorie,
});

const BATEAUX: Record<string, Tarif2026Breakdown> = {
    'B.B.A 0–300 M³': makeBateau(61.70, 6.10, 5.00, 'Baleinière, Barge — 0 à 300 M³'),
    'B.B.A 301–450 M³': makeBateau(122.80, 12.20, 5.00, 'Baleinière, Barge — 301 à 450 M³'),
    'B.B.A 451–1.000 M³': makeBateau(183.70, 18.30, 5.00, 'Baleinière, Barge — 451 à 1.000 M³'),
    'B.B.A > 1.000 M³': makeBateau(195.70, 19.50, 5.00, 'Baleinière, Barge — Plus de 1.000 M³'),
    'Plaisance T.M.R.T. 15 CV': makeBateau(14.10, 1.40, 5.00, 'Plaisance — T.M.R.T. 15 CV'),
    'Plaisance T.M.R.T. 25 CV': makeBateau(24.10, 2.40, 5.00, 'Plaisance — T.M.R.T. 25 CV'),
    'Plaisance T.M.R.T. 40 CV': makeBateau(32.70, 3.20, 5.00, 'Plaisance — T.M.R.T. 40 CV'),
    'Plaisance T.M.R.T. 48 CV': makeBateau(36.30, 3.60, 5.00, 'Plaisance — T.M.R.T. 48 CV'),
    'Plaisance T.M.R.T. 50 CV': makeBateau(36.30, 3.60, 5.00, 'Plaisance — T.M.R.T. 50 CV'),
    'Plaisance T.M.R.T. 60 CV': makeBateau(39.20, 3.90, 5.00, 'Plaisance — T.M.R.T. 60 CV'),
    'Plaisance T.M.R.T. 61–65 CV': makeBateau(46.00, 4.60, 5.00, 'Plaisance — T.M.R.T. 61 à 65 CV'),
    'Plaisance T.M.R.T. 75 CV': makeBateau(46.00, 4.60, 5.00, 'Plaisance — T.M.R.T. 75 CV'),
    'Plaisance T.M.R.T. 85 CV': makeBateau(46.00, 4.60, 5.00, 'Plaisance — T.M.R.T. 85 CV'),
    'Plaisance T.M.R.T. 90 CV': makeBateau(49.90, 4.90, 5.00, 'Plaisance — T.M.R.T. 90 CV'),
    'Plaisance T.M.R.T. 115 CV': makeBateau(53.90, 5.30, 5.00, 'Plaisance — T.M.R.T. 115 CV'),
    'Plaisance T.M.R.T. 140 CV': makeBateau(56.50, 5.60, 5.00, 'Plaisance — T.M.R.T. 140 CV'),
    'Plaisance T.M.R.T. 150 CV': makeBateau(80.30, 8.00, 5.00, 'Plaisance — T.M.R.T. 150 CV'),
    'Plaisance T.M.R.T. 151 CV': makeBateau(75.70, 7.50, 5.00, 'Plaisance — T.M.R.T. 151 CV'),
    'Plaisance T.M.R.T. 200 CV': makeBateau(82.90, 8.20, 5.00, 'Plaisance — T.M.R.T. 200 CV'),
    'Plaisance T.M.R.T. 250 CV': makeBateau(99.70, 9.90, 5.00, 'Plaisance — T.M.R.T. 250 CV'),
    'Plaisance T.M.R.T. 251–279 CV': makeBateau(103.40, 10.30, 5.00, 'Plaisance — T.M.R.T. 251 à 279 CV'),
    'T.D.M. 61–150 CV — Tarif A': makeBateau(29.70, 2.90, 5.00, 'T.D.M. — 61 à 150 CV (A)'),
    'T.D.M. 61–150 CV — Tarif B': makeBateau(52.00, 5.20, 5.00, 'T.D.M. — 61 à 150 CV (B)'),
    'T.D.M. 151–250 CV': makeBateau(75.10, 7.50, 5.00, 'T.D.M. — 151 à 250 CV'),
    'T.D.M. 251–279 CV': makeBateau(17.10, 1.70, 5.00, 'T.D.M. — 251 à 279 CV'),
    'T.D.M. 280–593 CV': makeBateau(254.40, 25.40, 5.00, 'T.D.M. — 280 à 593 CV'),
    'T.D.M. > 593 CV': makeBateau(270.00, 27.00, 5.00, 'T.D.M. — Plus de 593 CV'),
};

// ─── FONCTION PRINCIPALE DE CALCUL ──────────────────────────────────────────

export function calculer2026(input: Calcul2026Input): Tarif2026Breakdown {
    const { categorie, cv = 0, tonnage = 0, sousCategorie, regime = 'PM' } = input;
    const isPM = regime === 'PM';

    switch (categorie) {
        case 'moto':
            return cv >= 1 ? TRICYCLE : BICYCLE;

        case 'tourisme': {
            if (cv <= 10) return isPM ? PM_TOURISME_1_10 : PP_TOURISME_1_10;
            if (cv <= 15) return isPM ? PM_TOURISME_11_15 : PP_TOURISME_11_15;
            return isPM ? PM_TOURISME_PLUS15 : PP_TOURISME_PLUS15;
        }

        case 'utilitaire': {
            if (tonnage > 10 || cv > 15) return isPM ? PM_UTIL_P10K : PP_UTIL_P10K;
            if (tonnage > 2.5 || cv >= 11) return isPM ? PM_UTIL_2K5_10K : PP_UTIL_2K5_10K;
            return isPM ? PM_UTIL_M2K5 : PP_UTIL_M2K5;
        }

        case 'tracteur': {
            if (cv <= 10) return isPM ? PM_TRACTEUR_1_10 : PP_TRACTEUR_1_10;
            if (cv <= 15) return isPM ? PM_TRACTEUR_11_15 : PP_TRACTEUR_11_15;
            return isPM ? PM_TRACTEUR_PLUS15 : PP_TRACTEUR_PLUS15;
        }

        case 'remorque': {
            if (tonnage <= 2.5) return isPM ? PM_REMORQUE_M2K5 : PP_REMORQUE_M2K5;
            if (tonnage <= 10) return isPM ? PM_REMORQUE_2K5_10K : PP_REMORQUE_2K5_10K;
            return isPM ? PM_REMORQUE_P10K : PP_REMORQUE_P10K;
        }

        case 'bateau': {
            if (sousCategorie && BATEAUX[sousCategorie]) {
                return BATEAUX[sousCategorie];
            }
            return BATEAUX['Plaisance T.M.R.T. 40 CV'] || makeBateau(32.70, 3.20, 5.00, 'Plaisance — T.M.R.T. 40 CV');
        }

        default:
            return isPM ? PM_TOURISME_1_10 : PP_TOURISME_1_10;
    }
}

// ─── GRILLE COMPLÈTE POUR AFFICHAGE PARAMÈTRES ─────────────────────────────

export const GRILLE_2026: Array<{ label: string; categorie: string; tarif: Tarif2026Breakdown }> = [
    { label: 'Bicycle — Toutes cylindrées', categorie: 'Motocycle', tarif: BICYCLE },
    { label: 'Tricycle', categorie: 'Motocycle', tarif: TRICYCLE },
    { label: 'Tourisme 1–10 CV', categorie: 'Véhicule de Tourisme', tarif: PM_TOURISME_1_10 },
    { label: 'Tourisme 11–15 CV', categorie: 'Véhicule de Tourisme', tarif: PM_TOURISME_11_15 },
    { label: 'Tourisme > 15 CV', categorie: 'Véhicule de Tourisme', tarif: PM_TOURISME_PLUS15 },
    { label: 'Utilitaire < 2.500 kg', categorie: 'Véhicule Utilitaire', tarif: PM_UTIL_M2K5 },
    { label: 'Utilitaire 2.500–10.000 kg', categorie: 'Véhicule Utilitaire', tarif: PM_UTIL_2K5_10K },
    { label: 'Utilitaire > 10.000 kg', categorie: 'Véhicule Utilitaire', tarif: PM_UTIL_P10K },
    { label: 'Tracteur 1–10 CV', categorie: 'Tracteur', tarif: PM_TRACTEUR_1_10 },
    { label: 'Tracteur 11–15 CV', categorie: 'Tracteur', tarif: PM_TRACTEUR_11_15 },
    { label: 'Tracteur > 15 CV', categorie: 'Tracteur', tarif: PM_TRACTEUR_PLUS15 },
    { label: 'Remorque < 2.500 kg', categorie: 'Remorque', tarif: PM_REMORQUE_M2K5 },
    { label: 'Remorque 2.500–10.000 kg', categorie: 'Remorque', tarif: PM_REMORQUE_2K5_10K },
    { label: 'Remorque > 10.000 kg', categorie: 'Remorque', tarif: PM_REMORQUE_P10K },
    { label: 'Tourisme 1–10 CV (PP)', categorie: 'Véhicule de Tourisme PP', tarif: PP_TOURISME_1_10 },
    { label: 'Tourisme 11–15 CV (PP)', categorie: 'Véhicule de Tourisme PP', tarif: PP_TOURISME_11_15 },
    { label: 'Tourisme > 15 CV (PP)', categorie: 'Véhicule de Tourisme PP', tarif: PP_TOURISME_PLUS15 },
    { label: 'Utilitaire < 2.500 kg (PP)', categorie: 'Véhicule Utilitaire PP', tarif: PP_UTIL_M2K5 },
    { label: 'Utilitaire 2.500–10.000 kg (PP)', categorie: 'Véhicule Utilitaire PP', tarif: PP_UTIL_2K5_10K },
    { label: 'Utilitaire > 10.000 kg (PP)', categorie: 'Véhicule Utilitaire PP', tarif: PP_UTIL_P10K },
    { label: 'Tracteur 1–10 CV (PP)', categorie: 'Tracteur PP', tarif: PP_TRACTEUR_1_10 },
    { label: 'Tracteur 11–15 CV (PP)', categorie: 'Tracteur PP', tarif: PP_TRACTEUR_11_15 },
    { label: 'Tracteur > 15 CV (PP)', categorie: 'Tracteur PP', tarif: PP_TRACTEUR_PLUS15 },
    { label: 'Remorque < 2.500 kg (PP)', categorie: 'Remorque PP', tarif: PP_REMORQUE_M2K5 },
    { label: 'Remorque 2.500–10.000 kg (PP)', categorie: 'Remorque PP', tarif: PP_REMORQUE_2K5_10K },
    { label: 'Remorque > 10.000 kg (PP)', categorie: 'Remorque PP', tarif: PP_REMORQUE_P10K },
    ...Object.entries(BATEAUX).map(([label, tarif]) => ({
        label, categorie: 'Unité Flottante', tarif,
    })),
];
