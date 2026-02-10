import { Declaration, NoteDePerception, TaxpayerType, VehicleCategory } from '@/types';

// Constants for generation
const CATEGORIES: VehicleCategory[] = [
    'Motocycle', 'Véhicule utilitaire', 'Véhicule touristique',
    'touristique_light', 'utilitaire_heavy',
    'Véhicule tracteur', 'Véhicule remorque', 'Transport public',
    'Immatriculé IT', 'Exonéré'
];

const TAXPAYER_TYPES: TaxpayerType[] = ['Personne Physique', 'Personne Morale'];

const CITIES = ['Kinshasa', 'Lubumbashi', 'Goma', 'Matadi', 'Kisangani'];
const COMMUNES = ['Gombe', 'Kintambo', 'Ngaliema', 'Limete', 'Makala', 'Bandalungwa'];

const CONGO_NAMES = [
    'MUKENDI', 'TSHIMANGA', 'LIKUTA', 'MBALA', 'KABAMBA', 'NGALULA', 'ILUNGA', 'MWAMBA',
    'MUTOMBO', 'NDAYA', 'KABEDI', 'KABONGO', 'TSHIBANGU', 'MUSAU', 'KALONJI', 'MULUMBA',
    'TSHISUAKA', 'MBUYI', 'KADIMA', 'KABEYA', 'TSHIBOLA', 'MPUTU', 'KANYINDA', 'MUTEBA',
    'LUKUSA', 'TSHILOMBO', 'KAYEMBE', 'BOKETSHU', 'YAMBA', 'MALU'
];

const PHONE_PREFIXES = ['81', '82', '85', '89', '97', '99'];

function generateRandomPhone(seed: number): string {
    if (seed % 7 === 0) return ''; // Randomly empty
    const prefix = getFromList(PHONE_PREFIXES, seed);
    // Generate 7 digits based on seed
    const digits = ((seed * 1234567) % 10000000).toString().padStart(7, '0');
    return `+243${prefix}${digits}`;
}

export { CONGO_NAMES, generateRandomPhone };

// Helper to generate a consistent logical ID from a sequence number
// User requested base series: 1579A471
export const DECL_BASE = 0x1579A000;
export const NDP_BASE = 0x1579A000;

/**
 * Generates a unique sequence number within a controlled hex range.
 */
export function getSecureSequence(): number {
    // Generate a 5-digit random number to append to the base
    // This keeps the result in the 1579AXXX range and ensures hex-only characters
    return Math.floor(Math.random() * 0xFFFFF);
}

export function generateDeclarationId(sequence: number): string {
    const currentId = DECL_BASE + sequence;
    const hexSuffix = currentId.toString(16).toUpperCase();
    return `DECL-2026-${hexSuffix}`;
}

export function generateNoteId(sequence: number): string {
    const currentId = NDP_BASE + sequence;
    const hexSuffix = currentId.toString(16).toUpperCase();
    return `NDP - 2026-${hexSuffix}`;
}

// Deterministic random helper (simple LCG or just modulo for demo)
function getFromList<T>(list: T[], seed: number): T {
    return list[seed % list.length];
}

// Helper for deterministic dates based on sequence
import { generateValidDate } from './business-calendar';

function getStableDate(sequence: number, offsetDays = 0): string {
    // Generate a valid date based on the sequence
    const date = generateValidDate(sequence + offsetDays);
    return date.toISOString();
}

export function generateDeclaration(sequence: number): Declaration {
    const id = generateDeclarationId(sequence);
    const type = getFromList(TAXPAYER_TYPES, sequence);
    const category = getFromList(CATEGORIES, sequence);

    // Algorithmic generation of vehicle data
    const plate = `${1000 + sequence}BA${sequence % 10}${Math.floor(sequence / 10) % 10}`;
    const chassis = `JNX${sequence}00${2026 + sequence}XYZ`; // Pseudo-VIN

    // Tax calculation logic (Updated sync with tax-rules.ts)
    const { calculateTax } = require('./tax-rules');
    const cvValue = 10 + (sequence % 20); // Generator range
    const weightStr = `${1 + (sequence % 15)} tonnes`; // Generate logical weight
    const taxInfo = calculateTax(cvValue, category, weightStr);

    // Consistent with Create Page: stored baseRate is Raw Price (creditAmount)
    const baseRate = taxInfo.creditAmount;
    const EXCHANGE_RATE = 2271.1668;
    const totalAmount = (taxInfo.totalAmount) * EXCHANGE_RATE; // Pay Total in FC

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
            fiscalPower: `${cvValue} CV`,
            weight: weightStr,
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
    // 1. Extract the unique ID suffix from the Declaration (e.g., 1579A471)
    const idParts = declaration.id.split('-');
    const rawSuffix = idParts[idParts.length - 1] || '0';
    let hexSuffix = rawSuffix.toUpperCase();

    // --- LEGACY/IMPORT FALLBACK ---
    // If the ID is an import (IMP) or not a 8-char hex, force it into the target series
    const isStandardHex = /^[0-9A-F]{8}$/.test(hexSuffix);
    const isLegacy = declaration.id.includes('IMP') || !isStandardHex;

    if (isLegacy) {
        // Deterministic mapping to ensure stable IDs for existing records
        // Extract numbers from the suffix or use a hash of the full ID
        const numericSeed = parseInt(rawSuffix.replace(/[^0-9]/g, '') || '1', 10);
        const stableId = 0x1579A000 + (numericSeed % 0xFFFFF);
        hexSuffix = stableId.toString(16).toUpperCase();
    }

    // 2. Format the Reference strictly: NDP - 2026-XXXXXXXX
    // This uses the declaration suffix to ensure absolute uniqueness per vehicle
    const referenceId = `NDP - 2026-${hexSuffix}`;

    const taxpayerName = declaration.meta?.manualTaxpayer?.name ||
        (declaration.taxpayer as any)?.name ||
        "CONTRIBUABLE";


    const finalNote: NoteDePerception = {
        id: referenceId,
        declarationId: declaration.id,
        taxpayer: {
            name: taxpayerName,
            nif: declaration.meta?.manualTaxpayer?.nif || "N/A",
            address: declaration.meta?.manualTaxpayer?.address || "KINSHASA",
        },
        vehicle: declaration.vehicle,
        bankDetails: { reservedBox: true },
        payment: {
            principalTaxUSD: declaration.tax.baseRate,
            totalAmountFC: declaration.tax.totalAmountFC,
        },
        generatedAt: declaration.createdAt,
    };

    // Override with explicit stored data if it exists
    if (declaration.meta && (declaration.meta as any).taxpayerData) {
        finalNote.taxpayer = (declaration.meta as any).taxpayerData;
    }
    if (declaration.meta?.manualTaxpayer) {
        finalNote.taxpayer = {
            ...finalNote.taxpayer,
            ...declaration.meta.manualTaxpayer
        };
    }

    return finalNote;
}
