
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Taux
const EXCHANGE_RATE = 2355;

const newDeclarations = [
    // 5. TOYOTA RUSH - MUSONGELA NYEMBO PATIENT (Feuille Verte)
    {
        id: 'DECL-2026-NEW-05',
        meta: {
            manualTaxpayer: {
                name: 'MUSONGELA NYEMBO PATIENT',
                nif: 'C2208528X',
                address: '144, ISOKI, C/KINSHASA', // Ou C/LINGWALA selon quartier
                type: 'N/A' as const
            }
        },
        vehicle: {
            category: 'Véhicule utilitaire' as const,
            plate: '6978BT01',
            chassis: 'J210E-0036664',
            fiscalPower: '9 CV', // Tarif 63$ (explicite sur doc)
            weight: 'N/A',
            type: 'N/A' as const,
            marque: 'TOYOTA',
            modele: 'RUSH',
            genre: 'JEEP',
            couleur: 'GRIS',
            annee: '2009'
        },
        tax: {
            baseRate: 63.00,
            currency: 'USD' as const,
            totalAmountFC: 143083.51,
            exchangeRate: EXCHANGE_RATE
        },
        status: 'Payée' as const,
        createdAt: new Date('2025-01-13').toISOString(), // Date manuscrite 13/01/2025
        updatedAt: new Date('2025-01-13').toISOString()
    },

    // 6. LEXUS (TOYOTA) - NGOZA RAMAZANI GISELE (Feuille Verte)
    {
        id: 'DECL-2026-NEW-06',
        meta: {
            manualTaxpayer: {
                name: 'NGOZA RAMAZANI GISELE',
                nif: 'A241XXXX', // Pas de NIF visible explicitement, générique
                address: 'AV. LOMAMI N° 49 A, Q/LISALA, C/KINTAMBO',
                type: 'N/A' as const
            }
        },
        vehicle: {
            category: 'Véhicule utilitaire' as const,
            plate: '6010BB01', // Lecture difficile, meilleure estimation
            chassis: 'AGL10-2402451',
            fiscalPower: '14 CV', // Estimation RX270 (souvent >11CV) -> Tarif 69$
            weight: 'N/A',
            type: 'N/A' as const,
            marque: 'LEXUS',
            modele: 'RX270',
            genre: 'JEEP',
            couleur: 'NOIRE',
            annee: '2011'
        },
        tax: {
            baseRate: 69.00,
            currency: 'USD' as const,
            totalAmountFC: 156710.51,
            exchangeRate: EXCHANGE_RATE
        },
        status: 'Payée' as const,
        createdAt: new Date('2024-01-20').toISOString(), // Date estimée (pas visible clairement)
        updatedAt: new Date('2024-01-20').toISOString()
    }
];

async function appendData() {
    console.log('🚀 Appending 2 new declarations (Rush Gray & Lexus Black)...');

    const { error } = await supabase
        .from('declarations')
        .insert(newDeclarations);

    if (error) {
        console.error('❌ Error appending data:', error);
    } else {
        console.log('✅ Successfully added 2 new declarations.');
        newDeclarations.forEach(d => console.log(`   + Added: ${d.vehicle.marque} ${d.vehicle.modele} (${d.vehicle.plate})`));
    }
}

appendData();
