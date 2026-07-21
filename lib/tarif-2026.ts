/**
 * GRILLE TARIFAIRE 2026 — Personnes Physiques
 * Arrêté de l'Hôtel de Ville de Kinshasa — 30 Janvier 2026
 *
 * Structure du tarif pour chaque catégorie :
 *   impot       = Impôt principal (USD)
 *   tsc         = Taxe Spéciale de Circulation (USD)
 *   redevance   = Redevance (USD)
 *   imprime     = Frais d'imprimé (USD)
 *   total       = Somme des 4 composantes (= creditAmount pour le récépissé)
 *
 * Les frais bancaires (+4 USD) s'appliquent toujours en sus, comme dans le système actuel.
 */

// Taux de change importé depuis la source centrale
export { TAUX_FC } from './scan-pricing';

export interface Tarif2026Breakdown {
    impot: number;
    tsc: number;
    redevance: number;
    imprime: number;
    total: number;           // = creditAmount (affiché sur le récépissé)
    categorie: string;       // Libellé lisible pour les documents
}

// ─── TYPES D'ENTRÉE ──────────────────────────────────────────────────────────

export type Categorie2026 =
    | 'moto'
    | 'tourisme'
    | 'utilitaire'
    | 'tracteur_agricole'
    | 'tracteur_routier'
    | 'remorque'
    | 'bateau_baleiniere'
    | 'bateau_plaisance'
    | 'bateau_transport';

export interface Calcul2026Input {
    categorie: Categorie2026;
    cv?: number;           // Pour véhicules de tourisme
    tonnage?: number;      // Pour utilitaires et remorques
}

// ─── Sous-catégories 2026 ─────────────────────────────────────────────────────
export const SOUS_CATEGORIES_2026: {
    categorie: Categorie2026;
    label: string;
    requireCV?: boolean;
    requireTonnage?: boolean;
    group: string;
}[] = [
    { categorie: 'moto', label: 'Motocycle (toutes cylindrées)', group: 'Motocycles' },
    { categorie: 'tourisme', label: 'Véhicule de Tourisme (1–7 CV)', requireCV: true, group: 'Véhicules de Tourisme' },
    { categorie: 'tourisme', label: 'Véhicule de Tourisme (8–10 CV)', requireCV: true, group: 'Véhicules de Tourisme' },
    { categorie: 'tourisme', label: 'Véhicule de Tourisme (11–15 CV)', requireCV: true, group: 'Véhicules de Tourisme' },
    { categorie: 'tourisme', label: 'Véhicule de Tourisme (> 15 CV)', requireCV: true, group: 'Véhicules de Tourisme' },
    { categorie: 'utilitaire', label: 'Véhicule Utilitaire ≤ 3,5 T', requireTonnage: true, group: 'Véhicules Utilitaires' },
    { categorie: 'utilitaire', label: 'Véhicule Utilitaire 3,5–10 T', requireTonnage: true, group: 'Véhicules Utilitaires' },
    { categorie: 'utilitaire', label: 'Véhicule Utilitaire 10–20 T', requireTonnage: true, group: 'Véhicules Utilitaires' },
    { categorie: 'utilitaire', label: 'Véhicule Utilitaire > 20 T', requireTonnage: true, group: 'Véhicules Utilitaires' },
    { categorie: 'tracteur_agricole', label: 'Tracteur Agricole', group: 'Tracteurs & Remorques' },
    { categorie: 'tracteur_routier', label: 'Tracteur Routier', group: 'Tracteurs & Remorques' },
    { categorie: 'remorque', label: 'Remorque ≤ 5 T', requireTonnage: true, group: 'Tracteurs & Remorques' },
    { categorie: 'remorque', label: 'Remorque > 5 T', requireTonnage: true, group: 'Tracteurs & Remorques' },
    { categorie: 'bateau_baleiniere', label: 'Baleinière à moteur', group: 'Unités Flottantes' },
    { categorie: 'bateau_plaisance', label: 'Bateau de plaisance', group: 'Unités Flottantes' },
    { categorie: 'bateau_transport', label: 'Bateau de transport', group: 'Unités Flottantes' },
];

export const PRIMARY_CATEGORIES_2026 = Array.from(new Set(SOUS_CATEGORIES_2026.map(sc => sc.group)));

// Helper to determine CV from label
export const getCvFromLabel = (label: string): { min: number; max: number } => {
    if (label.includes('1–7')) return { min: 1, max: 7 };
    if (label.includes('8–10')) return { min: 8, max: 10 };
    if (label.includes('11–15')) return { min: 11, max: 15 };
    if (label.includes('> 15')) return { min: 16, max: 99 };
    return { min: 0, max: 99 };
};

// Helper to determine tonnage from label
export const getTonnageFromLabel = (label: string): number => {
    if (label.includes('≤ 3,5')) return 3;
    if (label.includes('3,5–10')) return 7;
    if (label.includes('10–20')) return 15;
    if (label.includes('> 20')) return 25;
    if (label.includes('≤ 5')) return 4;
    if (label.includes('> 5')) return 10;
    return 1;
};

// ─── MOTOCYCLES ──────────────────────────────────────────────────────────────
const MOTO: Tarif2026Breakdown = {
    impot: 7.50,
    tsc: 2.50,
    redevance: 0.50,
    imprime: 0.50,
    total: 11.00,
    categorie: 'Motocycle — Toutes cylindrées',
};

// ─── VÉHICULES DE TOURISME (par puissance fiscale en CV) ─────────────────────
const TOURISME_1_7: Tarif2026Breakdown = {
    impot: 35.00,
    tsc: 10.00,
    redevance: 1.50,
    imprime: 1.50,
    total: 48.00,
    categorie: 'Véhicule de Tourisme — 1 à 7 CV',
};

const TOURISME_8_10: Tarif2026Breakdown = {
    impot: 40.00,
    tsc: 15.00,
    redevance: 2.00,
    imprime: 2.00,
    total: 59.00,
    categorie: 'Véhicule de Tourisme — 8 à 10 CV',
};

const TOURISME_11_15: Tarif2026Breakdown = {
    impot: 55.00,
    tsc: 20.00,
    redevance: 2.50,
    imprime: 2.50,
    total: 80.00,
    categorie: 'Véhicule de Tourisme — 11 à 15 CV',
};

const TOURISME_PLUS15: Tarif2026Breakdown = {
    impot: 70.00,
    tsc: 30.00,
    redevance: 3.00,
    imprime: 3.00,
    total: 106.00,
    categorie: 'Véhicule de Tourisme — Plus de 15 CV',
};

// ─── VÉHICULES UTILITAIRES (par tonnage) ─────────────────────────────────────
const UTIL_3T5: Tarif2026Breakdown = {
    impot: 40.00,
    tsc: 15.00,
    redevance: 2.00,
    imprime: 2.00,
    total: 59.00,
    categorie: 'Véhicule Utilitaire — ≤ 3,5 tonnes',
};

const UTIL_3T5_10T: Tarif2026Breakdown = {
    impot: 55.00,
    tsc: 20.00,
    redevance: 2.50,
    imprime: 2.50,
    total: 80.00,
    categorie: 'Véhicule Utilitaire — 3,5 à 10 tonnes',
};

const UTIL_10T_20T: Tarif2026Breakdown = {
    impot: 70.00,
    tsc: 25.00,
    redevance: 3.00,
    imprime: 3.00,
    total: 101.00,
    categorie: 'Véhicule Utilitaire — 10 à 20 tonnes',
};

const UTIL_PLUS20T: Tarif2026Breakdown = {
    impot: 100.00,
    tsc: 40.00,
    redevance: 5.00,
    imprime: 5.00,
    total: 150.00,
    categorie: 'Véhicule Utilitaire — Plus de 20 tonnes',
};

// ─── TRACTEURS & REMORQUES ───────────────────────────────────────────────────
const TRACTEUR_AGRICOLE: Tarif2026Breakdown = {
    impot: 25.00,
    tsc: 10.00,
    redevance: 1.50,
    imprime: 1.50,
    total: 38.00,
    categorie: 'Tracteur Agricole',
};

const TRACTEUR_ROUTIER: Tarif2026Breakdown = {
    impot: 70.00,
    tsc: 25.00,
    redevance: 3.00,
    imprime: 3.00,
    total: 101.00,
    categorie: 'Tracteur Routier',
};

const REMORQUE_5T: Tarif2026Breakdown = {
    impot: 30.00,
    tsc: 10.00,
    redevance: 1.50,
    imprime: 1.50,
    total: 43.00,
    categorie: 'Remorque — ≤ 5 tonnes',
};

const REMORQUE_PLUS5T: Tarif2026Breakdown = {
    impot: 50.00,
    tsc: 20.00,
    redevance: 2.50,
    imprime: 2.50,
    total: 75.00,
    categorie: 'Remorque — Plus de 5 tonnes',
};

// ─── UNITÉS FLOTTANTES ───────────────────────────────────────────────────────
const BATEAU_BALEINIERE: Tarif2026Breakdown = {
    impot: 40.00,
    tsc: 15.00,
    redevance: 2.00,
    imprime: 2.00,
    total: 59.00,
    categorie: 'Baleinière à moteur',
};

const BATEAU_PLAISANCE: Tarif2026Breakdown = {
    impot: 70.00,
    tsc: 25.00,
    redevance: 3.00,
    imprime: 3.00,
    total: 101.00,
    categorie: 'Bateau de plaisance',
};

const BATEAU_TRANSPORT: Tarif2026Breakdown = {
    impot: 100.00,
    tsc: 40.00,
    redevance: 5.00,
    imprime: 5.00,
    total: 150.00,
    categorie: 'Bateau de transport de personnes/marchandises',
};

// ─── FONCTION PRINCIPALE DE CALCUL ──────────────────────────────────────────

export function calculer2026(input: Calcul2026Input): Tarif2026Breakdown {
    const { categorie, cv = 0, tonnage = 0 } = input;

    switch (categorie) {
        case 'moto':
            return MOTO;

        case 'tourisme': {
            if (cv <= 7) return TOURISME_1_7;
            if (cv <= 10) return TOURISME_8_10;
            if (cv <= 15) return TOURISME_11_15;
            return TOURISME_PLUS15;
        }

        case 'utilitaire': {
            if (tonnage <= 3.5) return UTIL_3T5;
            if (tonnage <= 10) return UTIL_3T5_10T;
            if (tonnage <= 20) return UTIL_10T_20T;
            return UTIL_PLUS20T;
        }

        case 'tracteur_agricole':
            return TRACTEUR_AGRICOLE;

        case 'tracteur_routier':
            return TRACTEUR_ROUTIER;

        case 'remorque': {
            if (tonnage <= 5) return REMORQUE_5T;
            return REMORQUE_PLUS5T;
        }

        case 'bateau_baleiniere':
            return BATEAU_BALEINIERE;

        case 'bateau_plaisance':
            return BATEAU_PLAISANCE;

        case 'bateau_transport':
            return BATEAU_TRANSPORT;

        default:
            return TOURISME_8_10; // Fallback raisonnable
    }
}

// Grille complète pour affichage dans la page Paramètres
export const GRILLE_2026: Array<{ label: string; categorie: string; tarif: Tarif2026Breakdown }> = [
    { label: 'Motocycle — Toutes cylindrées', categorie: 'Motocycle', tarif: MOTO },
    { label: 'Tourisme 1–7 CV', categorie: 'Véhicule de Tourisme', tarif: TOURISME_1_7 },
    { label: 'Tourisme 8–10 CV', categorie: 'Véhicule de Tourisme', tarif: TOURISME_8_10 },
    { label: 'Tourisme 11–15 CV', categorie: 'Véhicule de Tourisme', tarif: TOURISME_11_15 },
    { label: 'Tourisme > 15 CV', categorie: 'Véhicule de Tourisme', tarif: TOURISME_PLUS15 },
    { label: 'Utilitaire ≤ 3,5T', categorie: 'Véhicule Utilitaire', tarif: UTIL_3T5 },
    { label: 'Utilitaire 3,5–10T', categorie: 'Véhicule Utilitaire', tarif: UTIL_3T5_10T },
    { label: 'Utilitaire 10–20T', categorie: 'Véhicule Utilitaire', tarif: UTIL_10T_20T },
    { label: 'Utilitaire > 20T', categorie: 'Véhicule Utilitaire', tarif: UTIL_PLUS20T },
    { label: 'Tracteur Agricole', categorie: 'Tracteur/Remorque', tarif: TRACTEUR_AGRICOLE },
    { label: 'Tracteur Routier', categorie: 'Tracteur/Remorque', tarif: TRACTEUR_ROUTIER },
    { label: 'Remorque ≤ 5T', categorie: 'Tracteur/Remorque', tarif: REMORQUE_5T },
    { label: 'Remorque > 5T', categorie: 'Tracteur/Remorque', tarif: REMORQUE_PLUS5T },
    { label: 'Baleinière à moteur', categorie: 'Unité Flottante', tarif: BATEAU_BALEINIERE },
    { label: 'Bateau de plaisance', categorie: 'Unité Flottante', tarif: BATEAU_PLAISANCE },
    { label: 'Bateau de transport', categorie: 'Unité Flottante', tarif: BATEAU_TRANSPORT },
];
