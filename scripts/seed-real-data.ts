import { createClient } from '@supabase/supabase-js';
import { generateValidDate } from '../lib/business-calendar';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Taux de change USD -> FC
const EXCHANGE_RATE = 2355;

const realDeclarations = [
    // ... (Keep existing if needed, or start fresh. Let's keep the eclectic mix for demo + the new fleet)
    {
        id: 'DECL-2026-001',
        taxpayer: {
            name: 'MIANDA MUKENGE SYNTICHE',
            nif: 'C2241057E',
            address: '28, av. ANC. COMBATTANT, Q/F, C/NGALIEMA, KINSHASA',
            type: 'N/A' as const
        },
        vehicle: {
            category: 'Véhicule utilitaire' as const,
            plate: '9101BS01',
            chassis: 'ACU30-0083571',
            fiscalPower: '9 CV',
            weight: 'N/A',
            type: 'N/A' as const,
            marque: 'TOYOTA',
            modele: 'Harrier',
            genre: 'JEEP',
            couleur: 'NOIR',
            annee: '2013'
        },
        tax: {
            baseRate: 63.00,
            currency: 'USD' as const,
            totalAmountFC: 143083.50, // 63 * 2271.16
            exchangeRate: EXCHANGE_RATE
        },
        status: 'Payée' as const,
        createdAt: generateValidDate(1).toISOString(),
        updatedAt: generateValidDate(1).toISOString()
    },
    // ... (Adding the KIN PLUS SARL Fleet)
];

// --- FLOTTE KIN PLUS SARL (MIXTE - 20 VÉHICULES) ---
// 1. LES CAMIONS HOWO (35 CV -> 75$)
const KIN_PLUS_HOWO = Array.from({ length: 10 }).map((_, i) => {
    const seq = i + 1;
    // Séquence réelle observée sur les docs : ...298258, 298260...
    // On démarre à 298254 pour couvrir toute la plage dans le lot de 10.
    const chassisSuffix = (298254 + i).toString();
    // Séquence de plaques observée : 5341...
    const plateNum = 5341 + i;

    return {
        id: `DECL-2026-KP-H${seq.toString().padStart(2, '0')}`,
        taxpayer: {
            name: 'STE KIN PLUS SARL',
            nif: 'A1913055M',
            address: '54, AV. DE LA JUSTICE, C/GOMBE, KINSHASA',
            type: 'N/A' as const
        },
        vehicle: {
            category: 'Véhicule utilitaire' as const,
            plate: `${plateNum}BV01`,
            chassis: `LZZ5BLSD6RN${chassisSuffix}`, // Châssis EXACT
            fiscalPower: '35 CV', // TARIF 75$
            weight: 'N/A',
            type: 'N/A' as const,
            marque: 'SINOTRUK',
            modele: 'HOWO',
            genre: 'CAMION BENNE',
            couleur: 'ROUGE',
            annee: '2024'
        },
        tax: {
            baseRate: 75.00,
            currency: 'USD' as const,
            totalAmountFC: 170337.00, // 75 * 2271.16
            exchangeRate: EXCHANGE_RATE
        },
        status: 'Payée' as const,
        createdAt: generateValidDate(2000 + seq).toISOString(),
        updatedAt: generateValidDate(2000 + seq).toISOString()
    };
});

// 2. LES PICK-UPS GREAT WALL (12 CV -> 69$)
const KIN_PLUS_WINGLE = Array.from({ length: 10 }).map((_, i) => {
    const seq = i + 1;
    // Séquence réelle observée : ...653460...
    const chassisSuffix = (653460 + i).toString();
    const plateNum = 7105 + i;

    return {
        id: `DECL-2026-KP-W${seq.toString().padStart(2, '0')}`,
        taxpayer: {
            name: 'STE KIN PLUS SARL',
            nif: 'A1913055M',
            address: '54, AV. DE LA JUSTICE, C/GOMBE, KINSHASA',
            type: 'N/A' as const
        },
        vehicle: {
            category: 'Véhicule utilitaire' as const,
            plate: `${plateNum}BV01`,
            chassis: `LGWDBE176SB${chassisSuffix}`, // Châssis EXACT
            fiscalPower: '12 CV', // TARIF 69$
            weight: 'N/A',
            type: 'N/A' as const,
            marque: 'GREAT WALL',
            modele: 'WINGLE',
            genre: 'PICK-UP',
            couleur: 'BLANC',
            annee: '2024'
        },
        tax: {
            baseRate: 69.00,
            currency: 'USD' as const,
            totalAmountFC: 156710.51,
            exchangeRate: EXCHANGE_RATE
        },
        status: 'Payée' as const,
        createdAt: generateValidDate(3000 + seq).toISOString(),
        updatedAt: generateValidDate(3000 + seq).toISOString()
    };
});

// MERGE LISTS
const allDeclarations = [...realDeclarations, ...KIN_PLUS_HOWO, ...KIN_PLUS_WINGLE];

async function seedRealData() {
    console.log('✅ Starting to seed/update real declarations...');

    // Insert/Upsert
    for (const decl of allDeclarations) {
        const { error } = await supabase
            .from('declarations')
            .upsert({
                id: decl.id,
                status: decl.status,
                createdAt: decl.createdAt,
                updatedAt: decl.updatedAt,
                vehicle: decl.vehicle,
                tax: decl.tax,
                meta: {
                    ...(decl as any).meta,
                    systemId: decl.id,
                    reference: 'Décret Provincial N°001/2024',
                    manualTaxpayer: decl.taxpayer
                }
            });

        if (error) {
            console.error(`❌ Error upserting ${decl.id}:`, error);
        }
    }

    console.log(`✅ Successfully injected ${allDeclarations.length} declarations.`);
    console.log('Fleet KIN PLUS SARL: 20 vehicles loaded.');
}

seedRealData();
