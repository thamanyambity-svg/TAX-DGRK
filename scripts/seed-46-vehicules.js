const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mpzyucmgmobglotflrdi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4MfXaSvhj6DudFWrqoUyJQ_p4ZZuejk';
const TAUX_FC = 2244.76;
const DECL_BASE = 0x1579A000;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getSecureSequence() {
    return Math.floor(Math.random() * 0xFFFFF);
}

function generateDeclarationId(seq) {
    const id = DECL_BASE + seq;
    return 'DECL-2026-' + id.toString(16).toUpperCase();
}

function generateNoteId(seq) {
    const id = DECL_BASE + seq;
    return 'NDP - 2026 - ' + id.toString(16).toUpperCase();
}

function parseCv(cvRaw) {
    const m = String(cvRaw || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}

function proposerPrixBase(usage, cv) {
    const estPersonnel = /personnel/i.test(usage || '');
    if (estPersonnel) return cv <= 10 ? 58.70 : 64.50;
    if (/marchandises/i.test(usage || '')) {
        if (cv <= 10) return 64.50;
        if (cv <= 20) return 68.20;
        return 70.30;
    }
    if (/transport|taxi|bus/i.test(usage || '')) {
        if (cv <= 10) return 63.10;
        return 70.10;
    }
    return 64.50;
}

function montantFC(prixBase) {
    return Math.round(prixBase * TAUX_FC * 100) / 100;
}

const vehicles = [
    // ===== ENTRIES 1-12: Format simple (sans plaque/chassis) =====
    { num: 1, marque: 'EICHER 5660', marqueType: 'EICHER - 5660', genre: 'CAMION', annee: 2025, cv: 13, couleur: 'BLANC', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'S-MART SPRL', adresse: '645, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '0001MX01', chassis: 'EICHER5660MX001' },
    { num: 2, marque: 'MAHINDRA', marqueType: 'MAHINDRA', genre: 'JEEP', annee: 2024, cv: 13, couleur: 'NOIRE', usage: 'PERSONNEL', nif: 'A1300245G', proprietaire: 'S-MART S.P.R.L', adresse: '648, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '0002MX02', chassis: 'MAHINDRA2024X002' },
    { num: 3, marque: 'TATA LPT 613/38', marqueType: 'TATA - LPT 613/38', genre: 'CAMION', annee: 2025, cv: 9, couleur: 'BLANCHE', usage: 'MARCHANDISES', nif: 'A11611051201D', proprietaire: 'STE SNS IMMOBILIER SARL', adresse: '60, av. JUSTICE, C/GOMBE, KINSHASA', plaque: '0003MX03', chassis: 'TATALPT613X003' },
    { num: 4, marque: 'MAHINDRA JEEP', marqueType: 'MAHINDRA - JEEP', genre: 'JEEP', annee: 2023, cv: 9, couleur: 'BLANC', usage: 'PERSONNEL', nif: 'A2151425W', proprietaire: 'SAMAY-HOSPITALITY', adresse: 'C/GOMBE, KINSHASA', plaque: '0004MX04', chassis: 'MAHINDRAJEEPX004' },
    { num: 5, marque: 'MAHINDRA GRISE', marqueType: 'MAHINDRA', genre: 'JEEP', annee: 2023, cv: 9, couleur: 'GRIS', usage: 'PERSONNEL', nif: 'A2151425W', proprietaire: 'SAMAY HOSPITALITY', adresse: 'C/GOMBE, KINSHASA', plaque: '0005MX05', chassis: 'MAHINDRAGRISX005' },
    { num: 6, marque: 'TATA PASSENG', marqueType: 'TATA - PASSENG', genre: 'MINI BUS', annee: 2015, cv: 48, couleur: 'BLANCHE', usage: 'TRANSPORT', nif: 'A113100245G', proprietaire: 'S-MART SPRL', adresse: '645, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '0006MX06', chassis: 'TATAPASSENGX006' },
    { num: 7, marque: 'EICHER 5660 BDD', marqueType: 'EICHER - 5660', genre: 'CAMION', annee: 2025, cv: 13, couleur: 'BLANC', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'S-MART SPRL', adresse: '645, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '0007MX07', chassis: 'EICHER5660BDDX007' },
    { num: 8, marque: 'TATA LPT 613/38 KIPUSHI', marqueType: 'TATA - LPT 613/38', genre: 'CAMION', annee: 2025, cv: 48, couleur: 'BLANCHE', usage: 'MARCHANDISES', nif: 'A13100245G', proprietaire: 'S-MART SPRL', adresse: '645, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '0008MX08', chassis: 'TATALPTKIPUSHX008' },
    { num: 9, marque: 'MAHINDRA GRISE BOMA', marqueType: 'MAHINDRA', genre: 'JEEP', annee: 2023, cv: 13, couleur: 'GRISE', usage: 'PERSONNEL', nif: 'A1300245G', proprietaire: 'S-MART S.P.R.L', adresse: '648, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '0009MX09', chassis: 'MAHINDRABOMAX009' },
    { num: 10, marque: 'TATA SFC407', marqueType: 'TATA - SFC407', genre: 'CAMION', annee: 2024, cv: 26, couleur: 'BLANC', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'S-MART SPRL', adresse: '645, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '0010MX10', chassis: 'TATASFC407X010' },
    { num: 11, marque: 'TATA TRUCK LPT1118', marqueType: 'TATA - TRUCK LPT1118', genre: 'CAMION', annee: 2023, cv: 11, couleur: 'BLANCHE', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'ETS LES VAINQUEURS SHOKALODE ZANANBU SOUBI', adresse: 'C/GOMBE, KINSHASA', plaque: '0011MX11', chassis: 'TATALPT1118X011' },
    { num: 12, marque: 'TATA XENON 4X4', marqueType: 'TATA - XENON 4X4', genre: 'CAMIONNETTE', annee: 2025, cv: 24, couleur: 'BLANCHE', usage: 'MARCHANDISES', nif: 'A13100245G', proprietaire: 'S-MART SPRL', adresse: '645, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '0012MX12', chassis: 'TATAXENON4X4X012' },

    // ===== ENTRIES 13-46: Format détaillé (avec données réelles) =====
    { num: 13, marqueType: 'JAC - HFC model LJ11K', genre: 'CAMIONNETTE', annee: 2014, cv: 9, couleur: 'ROUGE', usage: 'MARCHANDISES', nif: 'A2413667', proprietaire: 'S-MART SARL', adresse: '645, av. DU MARCHE C/GOMBE, KINSHASA', plaque: '0049AS01', chassis: 'LJ11KDCD2F1001511' },
    { num: 14, marqueType: 'TATA - CAM LPT-613 model MAT38', genre: 'CAMION', annee: 2022, cv: 18, couleur: 'BLANC', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'STE S-MART SARL', adresse: '648, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '0315BQ01', chassis: 'MAT381330P7L00537' },
    { num: 15, marqueType: 'TATA - CAM LPT-613 model MAT38', genre: 'CAMION', annee: 2022, cv: 18, couleur: 'BLANC', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'STE S-MART SARL', adresse: '648, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '0316BQ01', chassis: 'MAT381330P7L00538' },
    { num: 16, marqueType: 'CLW PICK UP model L162', genre: 'CAMIONNETTE', annee: 2023, cv: 13, couleur: 'BLANC', usage: 'PERSONNEL', nif: 'A1300245G', proprietaire: 'STE S-MART SARL', adresse: '14, av. MBUJI MAYI, C/GOMBE, KINSHASA', plaque: '1053AN05', chassis: 'L16254CT6M0000703' },
    { num: 17, marqueType: 'CLW PICK UP model L162', genre: 'CAMIONNETTE', annee: 2023, cv: 13, couleur: 'BLANC', usage: 'PERSONNEL', nif: 'A1300245G', proprietaire: 'STE S-MART SARL', adresse: '14, av. MBUJI MAYI, C/GOMBE, KINSHASA', plaque: '1055AN05', chassis: 'L16254CT8M0000702' },
    { num: 18, marqueType: 'HELI - HELI', genre: 'VEHICULE SPECIAL', annee: 2024, cv: 12, couleur: 'ROUGE', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'SOCIETE S-MART SARL', adresse: '04, av. MBUJI MAYI C/GOMBE, KINSHASA', plaque: '1264AN05', chassis: '010503H0071' },
    { num: 19, marqueType: 'CLW - truck-I1621', genre: 'CAMIONNETTE', annee: 2024, cv: 13, couleur: 'BLANC', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'STE S-MART SARL', adresse: '14, av. MBUJI MAYI C/GOMBE, KINSHASA', plaque: '2013BT01', chassis: 'L1621FR62R0000844' },
    { num: 20, marqueType: 'TATA - XENON', genre: 'CAMIONNETTE', annee: 2015, cv: 11, couleur: 'BLANC', usage: 'PERSONNEL', nif: 'A1300245G', proprietaire: 'STE S-MART SARL', adresse: '14, av. MBUJI MAYI C/GOMBE, KINSHASA', plaque: '2174AS01', chassis: 'MAT464072FSL00999' },
    { num: 21, marqueType: 'TATA LTP13', genre: 'CAMION', annee: 2022, cv: 28, couleur: 'BLANCHE', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'S-MART SARL', adresse: 'AV MBUJI-MAI N°11 C/GOMBE', plaque: '5805AA24', chassis: 'MAT391330P7L00754' },
    { num: 22, marqueType: 'TATA LTP13', genre: 'CAMION', annee: 2022, cv: 28, couleur: 'BLANCHE', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'S-MART SARL', adresse: 'AV MBUJI-MAI N°11 C/GOMBE', plaque: '5807AA24', chassis: 'MAT381330P7L00747' },
    { num: 23, marqueType: 'JAC', genre: 'PICK UP', annee: 2006, cv: 14, couleur: 'BLEU', usage: 'MARCHANDISES', nif: 'A0811495E', proprietaire: 'S MART SARL', adresse: '15, av. DU MARCHE, C/KINSHASA, KINSHASA', plaque: '6628AH10', chassis: 'JAC01266' },
    { num: 24, marqueType: 'JAC', genre: 'PICK UP', annee: 2006, cv: 14, couleur: 'BLEU', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'STE S-MARTE SARL', adresse: '15, av. DU MARCHE C/KINSHASA, KINSHASA', plaque: '6629AH10', chassis: 'JAC23534' },
    { num: 25, marqueType: 'HYUNDAI - Hd72 model KMFGA', genre: 'CAMIONNETTE', annee: 2022, cv: 9, couleur: 'BLANC', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'STE S-SMART SARL', adresse: '645, av. DU MARCHE C/GOMBE, KINSHASA', plaque: '6939BN01', chassis: 'KMFGA17BPNC356940' },
    { num: 26, marqueType: 'JAC HFC', genre: 'CAMIONNETTE', annee: 2021, cv: 9, couleur: 'BLEU', usage: 'PERSONNEL', nif: 'A1300254G', proprietaire: 'STE S-MART SARL', adresse: 'N°1, av. MBUJI-MAYI, C/GOMBE, KINSHASA', plaque: '7148BM01', chassis: 'LJ11KEBC6M1122066' },
    { num: 27, marqueType: 'HYUNDAI - PALISADE model KMHR3', genre: 'JEEP', annee: 2022, cv: 9, couleur: 'GRIS FONCEE', usage: 'PERSONNEL', nif: 'A1300245G', proprietaire: 'STE S-MART SARL', adresse: '645, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '7407BM01', chassis: 'KMHR381CDNU409298' },
    { num: 28, marqueType: 'HYUNDAI - HD 45 model KMFJA17', genre: 'VEHICULE SPECIAL', annee: 2017, cv: 12, couleur: 'BLANC', usage: 'PERSONNEL', nif: 'A1300245G', proprietaire: 'STE S-MART SARL', adresse: '645, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '7512BA01', chassis: 'KMFJA17BPGC301537' },
    { num: 29, marqueType: 'DONG - FUNG', genre: 'CAMIONNETTE', annee: 2022, cv: 14, couleur: 'BLANC', usage: 'PERSONNEL', nif: 'A07001254C', proprietaire: 'STE S-MART SARL', adresse: '645, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '7785AL10', chassis: '81G3NA113698' },
    { num: 30, marqueType: 'SUZUKI - SWIFT model Zc71', genre: 'VOITURE', annee: 2009, cv: 7, couleur: 'MARONNE', usage: 'PERSONNEL', nif: '078772A', proprietaire: 'STE S-MART SARL', adresse: '645, av. DU MARCHE, Q/REVOLUTION, C/GOMBE, KINSHASA', plaque: '7921BK01', chassis: 'ZC71S423437' },
    { num: 31, marqueType: 'SUZUKI SPRESSO model MA3RF', genre: 'VOITURE', annee: 2023, cv: 8, couleur: 'SILVER', usage: 'PERSONNEL', nif: 'A1300845G', proprietaire: 'STE SMART SARL', adresse: '1A, av. MBUJI MAYI, C/GOMBE, KINSHASA', plaque: '8606AB04', chassis: 'MA3RFL61S00475642' },
    { num: 32, marqueType: 'MAHINDRA - KUV 100KG model MA1VF', genre: 'JEEP', annee: 2023, cv: 13, couleur: 'NOIR', usage: 'PERSONNEL', nif: 'A1300225G', proprietaire: 'STE SMART SARL', adresse: '645, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '8624AB04', chassis: 'MA1VF2NDCP6E85757' },
    { num: 33, marqueType: 'MAHINDRA - KUV 100KG model MA1VF', genre: 'JEEP', annee: 2023, cv: 13, couleur: 'BLANC', usage: 'PERSONNEL', nif: 'A1300855G', proprietaire: 'STE SMART SARL', adresse: '645, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '8628AB04', chassis: 'MA1VF2NDCP6E85754' },
    { num: 34, marqueType: 'TOYOTA - HIACE model TRH20', genre: 'MINI BUS', annee: 2006, cv: 12, couleur: 'BLANC', usage: 'PERSONNEL', nif: 'A07001254C', proprietaire: 'ST-S-MART SARL', adresse: '1A, av. MBUJI MAYI, C/GOMBE, KINSHASA', plaque: '8868AA25', chassis: 'TRH2000032461' },
    { num: 35, marqueType: 'FORCE MOTORS', genre: 'MINI BUS', annee: 2023, cv: 13, couleur: 'BLANC', usage: 'MARCHANDISES', nif: 'A2410801Z', proprietaire: 'STE S.MART SARL', adresse: '645, av. DU MARCHE C/GOMBE, KINSHASA', plaque: '9371AV05', chassis: 'MC1E1BGD4RP013420' },
    { num: 36, marqueType: 'TATA - LPT709 model MAT38', genre: 'CAMIONNETTE', annee: 2023, cv: 13, couleur: 'BLANC', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'STE S-MART SARL', adresse: '645, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '9695AV05', chassis: 'MAT386321P7L00627' },
    { num: 37, marqueType: 'TOYOTA - NOAH', genre: 'VOITURE', annee: 2008, cv: 8, couleur: 'GRIS', usage: 'PERSONNEL', nif: 'A24139729G', proprietaire: 'KIKANDI PILI PILI MUHAMAD', adresse: '29, av. MAISON Q/PLATEAU PROFESSIONE C/LEMBA, KINSHASA', plaque: '0324BP01', chassis: 'ZRR700138734' },
    { num: 38, marqueType: 'JAC model Y13K', genre: 'PICK UP', annee: 2014, cv: 12, couleur: 'BLANC', usage: 'PERSONNEL', nif: 'A1310245F', proprietaire: 'STE S-MART SARL', adresse: '15, av. DU MARCHE, C/GOMBE, KINSHASA', plaque: '0890AW01', chassis: 'Y13KEDC854000218' },
    { num: 39, marqueType: 'SUZUKI - SWIFT model Zc715', genre: 'VOITURE', annee: 2007, cv: 6, couleur: 'CHOCOLAT', usage: 'PERSONNEL', nif: 'A1301820G', proprietaire: 'SOCIETE SNS IMMOBILIER', adresse: '60, av. JUSTICE, C/GOMBE, KINSHASA', plaque: '2699AA12', chassis: 'ZC71S-568250' },
    { num: 40, marqueType: 'TOYOTA - VOXY model ZRR70', genre: 'VOITURE', annee: 2008, cv: 9, couleur: 'NOIR', usage: 'PERSONNEL', nif: 'A0811495E', proprietaire: 'STE SNS IMMOBILIER', adresse: '60, av. JUSTICE, C/GOMBE, KINSHASA', plaque: '2843BC01', chassis: 'ZRR700109472' },
    { num: 41, marqueType: 'TOYOTA - RUSH j210e', genre: 'JEEP', annee: 2020, cv: 9, couleur: 'SILVER', usage: 'PERSONNEL', nif: 'A1300245G', proprietaire: 'STE S-MART', adresse: '14, av. MBUJI MAYI C/GOMBE, KINSHASA', plaque: '0842BS01', chassis: 'J210E0018104' },
    { num: 42, marqueType: 'JAC - HFC 5042', genre: 'CAMIONNETTE', annee: 2019, cv: 9, couleur: 'ROUGE', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'STE SRK SARL', adresse: '07, av. BON ACCUEIL, C/GOMBE, KINSHASA', plaque: '1610AK10', chassis: 'LJ11KBBC6K1112599' },
    { num: 43, marqueType: 'MAZDA - BT50 model MIMZU', genre: 'PICK UP', annee: 2020, cv: 9, couleur: 'BLANC', usage: 'PERSONNEL', nif: 'A2031784W', proprietaire: 'STE SRK SRAL', adresse: '07, av. DE LA GOMBE, C/GOMBE, KINSHASA', plaque: '2353AA12', chassis: 'MIMZURY006LW025986' },
    { num: 44, marqueType: 'SUZUKI - SWIFT model Zc725', genre: 'VOITURE', annee: 2014, cv: 7, couleur: 'BLEU', usage: 'PERSONNEL', nif: 'A0811495E', proprietaire: 'MINSARIYA SHAM MALUAC', adresse: 'A1, av. MBUJI MAYI, C/GOMBE, KINSHASA', plaque: '2662AA12', chassis: 'ZC725-227776' },
    { num: 45, marqueType: 'JAC HFC', genre: 'CAMIONNETTE', annee: 2019, cv: 9, couleur: 'ROUGE', usage: 'MARCHANDISES', nif: 'A1300245G', proprietaire: 'STE SRK SARL', adresse: '07, av. BON ACCUEIL, C/GOMBE, KINSHASA', plaque: '1610AK10', chassis: 'LJ11KBBC6K1112599' },
    { num: 46, marqueType: 'TOYOTA - RAV4 HYBRID model JTLMR6', genre: 'JEEP', annee: 2020, cv: 10, couleur: 'GRIS', usage: 'PERSONNEL', nif: 'A2403318E', proprietaire: 'LA SOCIETE SRK SARL', adresse: '07, av. BON ACCUEIL, C/GOMBE, KINSHASA', plaque: '8934AB04', chassis: 'JTMR63FV0J002939' },
];

// Track used sequences to avoid duplicates
const usedSeqs = new Set();

async function main() {
    console.log('Début de création des 46 déclarations...\n');

    let success = 0;
    let errors = [];

    for (const v of vehicles) {
        let seq;
        do { seq = getSecureSequence(); } while (usedSeqs.has(seq));
        usedSeqs.add(seq);

        const id = generateDeclarationId(seq);
        const noteId = generateNoteId(seq);
        const cv = parseCv(v.cv);
        const baseRate = proposerPrixBase(v.usage, cv);
        const totalFC = montantFC(baseRate);

        const now = new Date();
        const bordereau = new Date(now.getTime() + 60 * 60000);

        const nom = v.proprietaire.toUpperCase();
        const nif = (v.nif || 'N/A').toUpperCase();
        const adresse = (v.adresse || 'KINSHASA').toUpperCase();

        const marqueType = (v.marqueType || v.marque || '').toUpperCase();
        const parts = marqueType.split(' - ');
        const marque = parts[0] || marqueType;
        const modele = parts[1] || '';

        const usage = v.usage.toUpperCase();
        let category = 'Vignette Automobile';
        if (/CAMIONNETTE|PICK.?UP/i.test(v.genre)) category = 'Camionnette';
        else if (/CAMION/i.test(v.genre)) category = 'Camion';
        else if (/JEEP/i.test(v.genre)) category = 'Jeep';
        else if (/VOITURE/i.test(v.genre)) category = 'Voiture';
        else if (/MINI.?BUS/i.test(v.genre)) category = 'Mini Bus';
        else if (/VEHICULE.?SPECIAL/i.test(v.genre)) category = 'Véhicule Spécial';

        const decl = {
            id,
            status: 'En attente de paiement',
            created_at: now.toISOString(),
            updated_at: bordereau.toISOString(),
            vehicle: {
                plate: v.plaque.toUpperCase(),
                chassis: (v.chassis || '').toUpperCase(),
                marque,
                modele,
                fiscalPower: cv + ' CV',
                category,
                genre: 'N/A',
                couleur: v.couleur.toUpperCase(),
                annee: String(v.annee),
                anneeImmat: String(v.annee),
                weight: '-',
                type: 'N/A',
            },
            tax: { baseRate, currency: 'USD', totalAmountFC: totalFC },
            meta: {
                systemId: id,
                reference: noteId.replace('NDP - 2026 - ', ''),
                ndpId: noteId,
                manualBaseAmount: baseRate,
                taxpayerData: { name: nom, nif, address: adresse, type: 'N/A' },
                manualTaxpayer: { name: nom, nif, address: adresse, type: 'N/A' },
                manualPlate: v.plaque.toUpperCase(),
                manualNIF: nif,
                manualTaxpayerName: nom,
                manualTaxpayerAddress: adresse,
                manualMarqueType: marqueType,
                manualFiscalPower: cv + ' CV',
                manualUsage: usage,
                source: 'seed-46',
                annee_fiscale: 2026,
            },
        };

        const { error } = await supabase.from('declarations').insert(decl);
        if (error) {
            errors.push({ num: v.num, id, error: error.message });
            console.error('  ✗ ' + v.num + '. ' + id + ' — ' + error.message);
        } else {
            success++;
            console.log('  ✓ ' + v.num + '. ' + id + ' | ' + v.plaque + ' | ' + nom.substring(0, 25));
        }
    }

    console.log('\n═══════════════════════════════════');
    console.log('Résumé : ' + success + '/' + vehicles.length + ' créées');
    if (errors.length > 0) {
        console.log('Erreurs :');
        errors.forEach(e => console.log('  - ' + e.num + ': ' + e.error));
    }

    // Afficher le regroupement par NIF
    console.log('\nGroupement par NIF :');
    const groups = {};
    for (const v of vehicles) {
        const nif = (v.nif || 'N/A').toUpperCase();
        if (!groups[nif]) groups[nif] = { count: 0, names: new Set() };
        groups[nif].count++;
        groups[nif].names.add(v.proprietaire.toUpperCase());
    }
    for (const [nif, g] of Object.entries(groups)) {
        console.log('  ' + nif + ' → ' + g.count + ' véhicules (' + [...g.names].join(', ') + ')');
    }
}

main().catch(console.error);
