import { Declaration, NoteDePerception, TaxpayerType, VehicleCategory } from '@/types';

// Constants for generation
const CATEGORIES: VehicleCategory[] = [
    'Motocycle', 'Véhicule utilitaire', 'Véhicule touristique',
    'Véhicule tracteur', 'Véhicule remorque', 'Transport public',
    'Immatriculé IT', 'Exonéré'
];

const TAXPAYER_TYPES: TaxpayerType[] = ['Personne Physique', 'Personne Morale'];

const CITIES = ['Kinshasa', 'Lubumbashi', 'Goma', 'Matadi', 'Kisangani'];
const COMMUNES = ['Gombe', 'Kintambo', 'Ngaliema', 'Limete', 'Makala', 'Bandalungwa'];

// Helper to generate a consistent logical ID from a sequence number
// User requested base: DECL-2026-B9ED76
export const DECL_BASE = 0xB9ED76;
export const NDP_BASE = 0x1579A471;

export function generateDeclarationId(sequence: number): string {
    const currentId = DECL_BASE + sequence;
    const hexSuffix = currentId.toString(16).toUpperCase();
    return `DECL-2026-${hexSuffix}`;
}

export function generateNoteId(sequence: number): string {
    const currentId = NDP_BASE + sequence;
    const hexSuffix = currentId.toString(16).toUpperCase();
    return `NDP-2026-${hexSuffix}`;
}

// ... (keep getFromList and getStableDate as is, omitted for brevity if not changing) ...
// Actually I need to replace the whole block or be very specific. 
// I will target the top part first to export constants.

// ...



// Deterministic random helper (simple LCG or just modulo for demo)
function getFromList<T>(list: T[], seed: number): T {
    return list[seed % list.length];
}

// Helper for deterministic dates based on sequence
// Helper for deterministic dates based on sequence
function getStableDate(sequence: number, offsetDays = 0): string {
    // Base date: Jan 1, 2026
    const baseLine = new Date('2026-01-01T10:00:00Z').getTime();

    // Fix for large IDs: Use modulo 365 to keep the date within 2026
    // This prevents "Invalid Time Value" errors for sequences like 0x26547276
    const dayOffset = (sequence % 365) + offsetDays;

    const date = new Date(baseLine + (dayOffset * 86400000));
    return date.toISOString();
}

export function generateDeclaration(sequence: number): Declaration {
    const id = generateDeclarationId(sequence);
    const type = getFromList(TAXPAYER_TYPES, sequence);
    const category = getFromList(CATEGORIES, sequence);

    // Algorithmic generation of vehicle data
    const plate = `${1000 + sequence}BA${sequence % 10}${Math.floor(sequence / 10) % 10}`;
    const chassis = `JNX${sequence}00${2026 + sequence}XYZ`; // Pseudo-VIN

    // Tax calculation logic (Mock)
    // "REAJUSTE LE TAUX DECHANGE SUR BASE DE CECI POUR LES VEHICULE ENTRE 1 ET 11CV Taux du Document (Officiel Vignette) 2 355 FC 64,50 $"
    const EXCHANGE_RATE = 2355;
    let baseRate = 50 + (CATEGORIES.indexOf(category) * 15.5);

    // Apply specific rule for generated data if we can infer CV
    // In this generator, CV is `${10 + (sequence % 20)} CV`
    const cvValue = 10 + (sequence % 20);
    if (cvValue >= 1 && cvValue <= 11) {
        baseRate = 64.50;
    }

    let totalAmount = baseRate * EXCHANGE_RATE;

    // User request: "cette somme en dollard doit faire FC 151,910"
    if (baseRate === 64.50) {
        totalAmount = 151910;
    }

    const declaration: Declaration = {
        id,
        createdAt: getStableDate(sequence), // Deterministic date
        updatedAt: getStableDate(sequence),
        status: sequence % 3 === 0 ? 'Payée' : 'Facturée', // Cycle statuses
        vehicle: {
            category,
            type,
            plate,
            chassis,
            fiscalPower: `${10 + (sequence % 20)} CV`,
            weight: `${1 + (sequence % 5)} tonnes`,
        },
        tax: {
            baseRate,
            currency: 'FC',
            totalAmountFC: totalAmount,
        },
        meta: {
            systemId: `SYS-${sequence.toString(16).toUpperCase()}`,
            reference: `REF-${20260000 + sequence}`
        }
    };

    return declaration;
}

export function generateNote(declaration: Declaration): NoteDePerception {
    // 1. Prefer Stored Unique ID
    if (declaration.meta && declaration.meta.ndpId) {
        return {
            id: declaration.meta.ndpId,
            declarationId: declaration.id,
            taxpayer: {
                name: declaration.vehicle.type === 'Personne Morale'
                    ? (declaration.taxpayer?.name || declaration.meta?.manualTaxpayer?.name || `ENTREPRISE SARL`)
                    : (declaration.taxpayer?.name || declaration.meta?.manualTaxpayer?.name || `CONTRIBUABLE`),
                nif: declaration.taxpayer?.nif || declaration.meta?.manualTaxpayer?.nif || 'N/A',
                address: declaration.taxpayer?.address || declaration.meta?.manualTaxpayer?.address || 'N/A',
            },
            vehicle: {
                chassis: declaration.vehicle.chassis,
                plate: declaration.vehicle.plate,
                category: declaration.vehicle.category,
                fiscalPower: declaration.vehicle.fiscalPower,
                genre: declaration.vehicle.genre,
                marque: declaration.vehicle.marque,
                modele: declaration.vehicle.modele,
            },
            bankDetails: {
                reservedBox: true,
            },
            payment: {
                principalTaxUSD: declaration.tax.baseRate,
                totalAmountFC: declaration.tax.totalAmountFC,
            },
            generatedAt: declaration.createdAt,
        };
    }

    // 2. Legacy Fallback (Only for fresh mock data)
    // Extract sequence from ID for consistency (simple parsing)
    const sequenceStr = declaration.id.split('-').pop();
    // Parse as Hex because ID is hex
    const declarationVal = parseInt(sequenceStr || '0', 16);

    // Calculate offset from base
    let sequence = 0;
    if (!isNaN(declarationVal)) {
        sequence = declarationVal - DECL_BASE;
    }
    if (sequence < 0) sequence = 0;

    return {
        id: generateNoteId(sequence),
        declarationId: declaration.id,
        taxpayer: {
            name: declaration.vehicle.type === 'Personne Morale' ? `ENTREPRISE ${sequence} SARL` : `CITOYEN ${sequence} KITONA`,
            nif: `A${(sequence + 90000).toString()}K`,
            address: `${sequence * 12 + 1} Av. Des Poids Lourds, ${getFromList(COMMUNES, sequence)}, ${getFromList(CITIES, sequence)}`,
        },
        vehicle: {
            chassis: declaration.vehicle.chassis,
            plate: declaration.vehicle.plate,
            category: declaration.vehicle.category,
            fiscalPower: declaration.vehicle.fiscalPower,
            genre: declaration.vehicle.genre,
            marque: declaration.vehicle.marque,
            modele: declaration.vehicle.modele,
        },
        bankDetails: {
            reservedBox: true,
        },
        payment: {
            principalTaxUSD: declaration.tax.baseRate,
            totalAmountFC: declaration.tax.totalAmountFC,
        },
        generatedAt: declaration.createdAt,
    };
}
