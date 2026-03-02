
import { getSecureSequence, generateDeclarationId, generateNoteId } from '../lib/generator';
import { saveDeclaration } from '../lib/store';
import { Declaration, VehicleCategory } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aekmxhcfdqsvlpkycpsn.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag';
const supabase = createClient(supabaseUrl, supabaseKey);

const COMPANY_INFO = {
    nif: 'A04965',
    name: 'BRALIMA SARL',
    address: 'AVENUE DU DRAPEAU, BARUMBU, KINSHASA',
    city: 'KINSHASA'
};

const VEHICLES_DATA = [
    // --- LIST 1 (25 vehicles) - utilitaire_heavy (68.20 USD) ---
    { plate: '9940BT01', chassis: 'JSAGJB74VS5100530', cv: '7', cat: 'utilitaire_heavy' },
    { plate: '9933BT01', chassis: 'JSAGJB74VS5100401', cv: '7', cat: 'utilitaire_heavy' },
    { plate: '9938BT01', chassis: 'JSAGJB74VS5100446', cv: '7', cat: 'utilitaire_heavy' },
    { plate: '9937BT01', chassis: 'JSAGJB74VS5100485', cv: '7', cat: 'utilitaire_heavy' },
    { plate: '9936BT01', chassis: 'JSAGJB74VS5100647', cv: '7', cat: 'utilitaire_heavy' },
    { plate: '9935BT01', chassis: 'JSAGJB74VS5100663', cv: '7', cat: 'utilitaire_heavy' },
    { plate: '9939BT01', chassis: 'JSAGJB74VS5100717', cv: '7', cat: 'utilitaire_heavy' },
    { plate: '3492BV01', chassis: 'ACVTFS87JPD155029', cv: '12', cat: 'utilitaire_heavy' },
    { plate: '3336BV01', chassis: 'ACVTFS87JPD155035', cv: '12', cat: 'utilitaire_heavy' },
    { plate: '3337BV01', chassis: 'ACVTFS87JPD160093', cv: '12', cat: 'utilitaire_heavy' },
    { plate: '5018BV01', chassis: 'MA3JJC74WS0184633', cv: '7', cat: 'utilitaire_heavy' },
    { plate: '5019BV01', chassis: 'MA3JJC74WS0185359', cv: '7', cat: 'utilitaire_heavy' },
    { plate: '3490BV01', chassis: 'JTFSK22P200028897', cv: '13', cat: 'utilitaire_heavy' },
    { plate: '1749AN10', chassis: 'AHTDK8CB400920921', cv: '13', cat: 'utilitaire_heavy' },
    { plate: '1744AN10', chassis: 'AHTDK8CBX00920941', cv: '13', cat: 'utilitaire_heavy' },
    { plate: '1743AN10', chassis: 'AHTDK8CB300920943', cv: '13', cat: 'utilitaire_heavy' },
    { plate: '1746AN10', chassis: 'AHTDK8CB500920944', cv: '13', cat: 'utilitaire_heavy' },
    { plate: '1737AN10', chassis: 'AHTDK8CB700920945', cv: '13', cat: 'utilitaire_heavy' },
    { plate: '1745AN10', chassis: 'AHTDK8CB900920946', cv: '13', cat: 'utilitaire_heavy' },
    { plate: '1739AN10', chassis: 'AHTDK8CB600920953', cv: '13', cat: 'utilitaire_heavy' },
    { plate: '1740AN10', chassis: 'AHTDK8CB800920954', cv: '13', cat: 'utilitaire_heavy' },
    { plate: '1741AN10', chassis: 'AHTDK8CBX00920955', cv: '13', cat: 'utilitaire_heavy' },
    { plate: '1742AN10', chassis: 'AHTDK8CB100920956', cv: '13', cat: 'utilitaire_heavy' },
    { plate: '0515AA11', chassis: 'MA3JJC74WS0212607', cv: '7', cat: 'utilitaire_heavy' },
    { plate: '0576AA11', chassis: 'MA3JJC74WS0214159', cv: '8', cat: 'utilitaire_heavy' },

    // --- LIST 2 (22 vehicles) - touristique_medium (64.50 USD) ---
    { plate: '1836BV01', chassis: 'VF630N339SD000079', cv: '420', cat: 'touristique_medium' },
    { plate: '5016BV01', chassis: 'VF631E333RD001557', cv: '420', cat: 'touristique_medium' },
    { plate: '5017BV01', chassis: 'VF631E334RD001566', cv: '420', cat: 'touristique_medium' },
    { plate: '6555AN10', chassis: '9ADK1243RSM545048', cv: '00', cat: 'touristique_medium' },
    { plate: '6556AN10', chassis: '9ADK1243RSM545049', cv: '00', cat: 'touristique_medium' },
    { plate: '6625AM10', chassis: 'VF640J833SB000578', cv: '53', cat: 'touristique_medium' },
    { plate: '6822AN10', chassis: 'ZCFA41TM4R2747932', cv: '53', cat: 'touristique_medium' },
    { plate: '3494BV01', chassis: 'ZCFA41TM4R2747933', cv: '53', cat: 'touristique_medium' },
    { plate: '3499BV01', chassis: 'ZCFA41TM6R2747934', cv: '53', cat: 'touristique_medium' },
    { plate: '3589BV01', chassis: 'WJME3TSS6LC419766', cv: '420', cat: 'touristique_medium' },
    { plate: '3500BV01', chassis: 'ZCFA41TM8S2756334', cv: '53', cat: 'touristique_medium' },
    { plate: '3498BV01', chassis: 'ZCFA41TMX52756335', cv: '53', cat: 'touristique_medium' },
    { plate: '6819AN10', chassis: 'ZCFB41LH5S2757190', cv: '60', cat: 'touristique_medium' },
    { plate: '1158BV01', chassis: 'MEC2071RKRP150543', cv: '230', cat: 'touristique_medium' },
    { plate: '1159BV01', chassis: 'MEC2071RKRP150251', cv: '230', cat: 'touristique_medium' },
    { plate: '6628AM10', chassis: 'LGAX3C149R9850627', cv: '270', cat: 'touristique_medium' },
    { plate: '7126BV01', chassis: 'ZCFB41LH7S2757756', cv: '60', cat: 'touristique_medium' },
    { plate: '9304BV01', chassis: 'WJME33TT9SC546217', cv: '380', cat: 'touristique_medium' },
    { plate: '9305BV01', chassis: 'WJME33TT0SC546218', cv: '380', cat: 'touristique_medium' },
    { plate: '2442AN10', chassis: 'VF640K833TB000930', cv: '53', cat: 'touristique_medium' },
    { plate: '2440AN10', chassis: 'VF630N339TD000097', cv: '420', cat: 'touristique_medium' },
    { plate: '2348AN10', chassis: 'VF630N337TD000096', cv: '420', cat: 'touristique_medium' }
];

async function runBulkRegistration() {
    console.log(`Starting final status update for ${COMPANY_INFO.name} (${VEHICLES_DATA.length} vehicles)`);

    // Cleanup old declarations for this NIF to ensure no duplicates
    console.log(`Cleaning up old declarations for NIF ${COMPANY_INFO.nif}...`);
    const { error: deleteError } = await supabase
        .from('declarations')
        .delete()
        .filter('meta->manualTaxpayer->>nif', 'eq', COMPANY_INFO.nif);

    if (deleteError) {
        console.error("Cleanup failed:", deleteError);
    } else {
        console.log("Cleanup successful.");
    }

    const EXCHANGE_RATE = 2355;
    const baseSequence = getSecureSequence();
    let currentSequence = baseSequence;

    const TARGET_DATE = '2026-03-03';
    const startHour = 8.5;
    const endHour = 11.5;

    let successCount = 0;

    for (const vehicle of VEHICLES_DATA) {
        const id = generateDeclarationId(currentSequence);
        const noteId = generateNoteId(currentSequence);

        const randomHour = startHour + Math.random() * (endHour - startHour);
        const hours = Math.floor(randomHour);
        const minutes = Math.floor((randomHour - hours) * 60);
        const dateIso = `${TARGET_DATE}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`;

        const priceUSD = vehicle.cat === 'touristique_medium' ? 64.50 : 68.20;
        const currentAmountFC = priceUSD * EXCHANGE_RATE;

        // Custom CV logic: If "00", set to "-"
        const cleanCV = (vehicle.cv === '00' || vehicle.cv === '0') ? '-' : `${vehicle.cv} CV`;

        const newDeclaration: Declaration = {
            id,
            createdAt: dateIso,
            updatedAt: dateIso,
            status: 'Attente de paiement', // UPDATED STATUS
            vehicle: {
                category: vehicle.cat as VehicleCategory,
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
                baseRate: priceUSD,
                currency: 'USD',
                totalAmountFC: currentAmountFC,
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
            console.error(`Failed to insert ${vehicle.plate}:`, result.error);
        } else {
            successCount++;
            console.log(`Successfully registered: ${vehicle.plate} (Status: Attente de paiement)`);
        }

        currentSequence++;
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`Bulk registration complete. Successfully inserted ${successCount}/${VEHICLES_DATA.length} vehicles.`);
}

runBulkRegistration();
