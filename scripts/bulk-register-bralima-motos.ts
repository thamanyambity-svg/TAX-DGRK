import { createClient } from '@supabase/supabase-js';
import { getSecureSequence, generateDeclarationId, generateNoteId } from '../lib/generator';

const supabase = createClient(
    'https://aekmxhcfdqsvlpkycpsn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
);

const COMPANY = {
    nif: 'A04965',
    name: 'BRALIMA SARL',
    address: 'AVENUE DU DRAPEAU, BARUMBU, KINSHASA',
};

// Only chassis and plate are needed per vehicle
const MOTOS = [
    { chassis: 'LBPKE179000045698', plate: '01KZ720' },
    { chassis: 'LBPKE179000043737', plate: '01KZ721' },
    { chassis: 'LBPKE179000043722', plate: '01KZ722' },
    { chassis: 'LBPKE179000043760', plate: '01KZ761' },
    { chassis: 'LBPKE179000043789', plate: '01KZ762' },
    { chassis: 'LBPKE179000043816', plate: '01KZ710' },
];

const BASE_RATE_USD = 12.20;
const TOTAL_FC = 36850;
const TARGET_DATE = '2026-03-03';

async function run() {
    console.log(`Registering ${MOTOS.length} BRALIMA motorcycles...`);

    let sequence = getSecureSequence();
    let success = 0;

    for (const moto of MOTOS) {
        const id = generateDeclarationId(sequence);
        const noteId = generateNoteId(sequence);

        // Random time between 08:30 and 11:30
        const hour = 8 + Math.floor(Math.random() * 3);
        const min = Math.floor(Math.random() * 60);
        const dateIso = `${TARGET_DATE}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00.000Z`;

        const decl = {
            id,
            createdAt: dateIso,
            updatedAt: dateIso,
            status: 'Attente de paiement',
            vehicle: {
                category: 'motorcycle_bicycle',
                plate: moto.plate,
                chassis: moto.chassis,
                fiscalPower: '- CV',
                weight: '0 T',
                marque: 'YAMAHA',
                modele: 'XTZ 125E',
                type: 'N/A',
                genre: 'N/A',
            },
            tax: {
                baseRate: BASE_RATE_USD,
                currency: 'USD',
                totalAmountFC: TOTAL_FC,
            },
            meta: {
                ndpId: noteId,
                systemId: id,
                reference: noteId.replace('NDP - 2026-', ''),
                taxpayerData: {
                    nif: COMPANY.nif,
                    name: COMPANY.name,
                    address: COMPANY.address,
                    type: 'N/A',
                },
                manualTaxpayer: {
                    nif: COMPANY.nif,
                    name: COMPANY.name,
                    address: COMPANY.address,
                    type: 'N/A',
                },
            },
        };

        const { error } = await supabase.from('declarations').insert([decl]);
        if (error) {
            console.error(`❌ ${moto.plate}: ${error.message}`);
        } else {
            console.log(`✅ ${moto.plate} | ${id} | ${dateIso}`);
            success++;
        }

        sequence++;
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\nDone: ${success}/${MOTOS.length} registered.`);
}

run();
