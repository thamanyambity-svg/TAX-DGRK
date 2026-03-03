
import { getSecureSequence, generateDeclarationId, generateNoteId } from '../lib/generator';
import { saveDeclaration } from '../lib/store';
import { Declaration, VehicleCategory } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aekmxhcfdqsvlpkycpsn.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag';
const supabase = createClient(supabaseUrl, supabaseKey);

const COMPANY_INFO = {
    nif: 'A2158501M',
    name: 'TRANS CONTINENTAL TRANSITAIRIOS',
    address: 'GOMBE, KINSHASA',
    city: 'KINSHASA'
};

// Helper: generates a random chassis number (17 chars alphanumeric, uppercase)
function generateChassis(): string {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 17; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// All vehicles are utilitaire_heavy (68.20 USD)
// 7989AB04 : chassis auto-generated
const VEHICLES_DATA = [
    { plate: '6851AM10', chassis: 'LZGLJK45RXD79420', cv: '35' },
    { plate: '6850AM10', chassis: 'LZGJLJV47RX079418', cv: '35' },
    { plate: '7527AM10', chassis: '6ZGJLJV49RX075419', cv: '30' },
    { plate: '6852AM10', chassis: 'LZGLJV45RX07917', cv: '35' },
    { plate: '7896AB04', chassis: 'LJRP13389PND81543', cv: '35' },
    { plate: '7989AB04', chassis: generateChassis(), cv: '35' }, // chassis auto-généré
    { plate: '7899AB04', chassis: 'GRP13387PN031542', cv: '35' },
    { plate: '7525AM10', chassis: 'LA9940T34FE415360', cv: '25' },
];

async function runBulkRegistration() {
    console.log(`🚀 Démarrage de l'enregistrement pour ${COMPANY_INFO.name} (${VEHICLES_DATA.length} véhicules)`);

    // Nettoyage des anciennes déclarations pour ce NIF
    console.log(`🧹 Nettoyage des anciennes déclarations pour NIF ${COMPANY_INFO.nif}...`);
    const { error: deleteError } = await supabase
        .from('declarations')
        .delete()
        .filter('meta->manualTaxpayer->>nif', 'eq', COMPANY_INFO.nif);

    if (deleteError) {
        console.error('❌ Échec du nettoyage:', deleteError);
    } else {
        console.log('✅ Nettoyage réussi.');
    }

    const EXCHANGE_RATE = 2355;
    const PRICE_USD = 68.20; // utilitaire_heavy
    const baseSequence = getSecureSequence();
    let currentSequence = baseSequence;

    const TARGET_DATE = '2026-03-04';

    // createdAt  → récépissés  → 08h30 à 10h30 UTC+1 = 07h30 à 09h30 UTC
    const receiptStartHour = 7.5;  // 08h30 heure locale = 07h30 UTC
    const receiptEndHour = 9.5;  // 10h30 heure locale = 09h30 UTC

    // updatedAt  → bordereaux banque → 08h45 à 11h00 UTC+1 = 07h45 à 10h00 UTC
    const bordereauStartHour = 7.75; // 07h45 UTC = 08h45 locale
    const bordereauEndHour = 10.0; // 10h00 UTC = 11h00 locale

    let successCount = 0;

    for (const vehicle of VEHICLES_DATA) {
        const id = generateDeclarationId(currentSequence);
        const noteId = generateNoteId(currentSequence);

        // createdAt : heure des récépissés (08h30–10h30)
        const receiptRandHour = receiptStartHour + Math.random() * (receiptEndHour - receiptStartHour);
        const rH = Math.floor(receiptRandHour);
        const rM = Math.floor((receiptRandHour - rH) * 60);
        const rS = Math.floor(Math.random() * 60);
        const createdAtIso = `${TARGET_DATE}T${String(rH).padStart(2, '0')}:${String(rM).padStart(2, '0')}:${String(rS).padStart(2, '0')}.000Z`;

        // updatedAt : heure des bordereaux (11h45–13h45)
        const bordereauRandHour = bordereauStartHour + Math.random() * (bordereauEndHour - bordereauStartHour);
        const bH = Math.floor(bordereauRandHour);
        const bM = Math.floor((bordereauRandHour - bH) * 60);
        const bS = Math.floor(Math.random() * 60);
        const updatedAtIso = `${TARGET_DATE}T${String(bH).padStart(2, '0')}:${String(bM).padStart(2, '0')}:${String(bS).padStart(2, '0')}.000Z`;

        const totalAmountFC = PRICE_USD * EXCHANGE_RATE;
        const cleanCV = `${vehicle.cv} CV`;

        const newDeclaration: Declaration = {
            id,
            createdAt: createdAtIso,
            updatedAt: updatedAtIso,
            status: 'Attente de paiement',
            vehicle: {
                category: 'utilitaire_heavy' as VehicleCategory,
                type: 'N/A',
                plate: vehicle.plate,
                chassis: vehicle.chassis,
                fiscalPower: cleanCV,
                weight: 'N/A',
                marque: 'N/A',
                modele: 'N/A',
                genre: 'N/A',
            },
            tax: {
                baseRate: PRICE_USD,
                currency: 'USD',
                totalAmountFC: totalAmountFC,
            },
            taxpayer: {
                name: COMPANY_INFO.name,
                nif: COMPANY_INFO.nif,
                address: COMPANY_INFO.address,
                type: 'N/A'
            },
            meta: {
                systemId: id,
                reference: noteId.replace('NDP - 2026-', ''),
                ndpId: noteId,
                manualTaxpayer: {
                    name: COMPANY_INFO.name,
                    nif: COMPANY_INFO.nif,
                    address: COMPANY_INFO.address,
                    type: 'N/A',
                }
            }
        } as any;

        const result = await saveDeclaration(newDeclaration);

        if (!result.success) {
            console.error(`❌ Échec insertion ${vehicle.plate}:`, result.error);
        } else {
            successCount++;
            console.log(`✅ Enregistré: ${vehicle.plate} | Châssis: ${vehicle.chassis} | ${cleanCV} | ${PRICE_USD} USD | Récépissé: ${createdAtIso} | Bordereau: ${updatedAtIso}`);
        }

        currentSequence++;
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`\n🎉 Enregistrement terminé: ${successCount}/${VEHICLES_DATA.length} véhicules insérés avec succès.`);
}

runBulkRegistration();
