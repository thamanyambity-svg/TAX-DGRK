import { createClient } from '@supabase/supabase-js';
import { calculateTax } from '../lib/tax-rules';
import { generateValidDate } from '../lib/business-calendar';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function getRandomValidDate() {
    return generateValidDate(Math.floor(Math.random() * 1000000)).toISOString();
}

async function updateExistingAndAddNew() {
    console.log("🚀 Lancement du peuplement de données...");

    // 1. Récupérer les enregistrements existants
    const { data: existing, error: fetchError } = await supabase.from('declarations').select('id');
    if (fetchError) {
        console.error("Erreur récup existing:", fetchError);
        return;
    }

    console.log(`📝 Mise à jour de ${existing.length} enregistrements existants...`);
    for (const record of existing) {
        const newDate = getRandomValidDate();
        await supabase.from('declarations').update({ createdAt: newDate }).eq('id', record.id);
    }

    // 2. Ajouter de nouveaux enregistrements réalistes
    console.log("➕ Ajout de 30 nouveaux enregistrements...");
    const noms = ["KABAMBA MUKENDI", "MBALA TSHIMANGA", "NGALULA KALONJI", "KAPINGA MULUMBA", "ILUNGA KABEYA", "MWAMBA KADIMA", "MUTOMBO KABEYA", "NDAYA TSHIBOLA", "MUKADI TSHISUAKA", "TSHIBANGU MBUYI", "KABEDI KABONGO"];
    const marques = ["TOYOTA", "NISSAN", "HYUNDAI", "MITSUBISHI", "MERCEDES", "SUZUKI"];
    const modeles = ["Land Cruiser", "Patrol", "Santa Fe", "Pajero", "Actros", "Vitara"];

    for (let i = 0; i < 30; i++) {
        const name = noms[Math.floor(Math.random() * noms.length)] + " " + i;
        const fiscalPower = (Math.floor(Math.random() * 20) + 5);
        const type = 'N/A';
        const date = getRandomValidDate();

        const taxInfo = calculateTax(fiscalPower, 'Véhicule utilitaire');

        const newDecl = {
            id: `DECL-2026-NEW-${100 + i}`,
            createdAt: date,
            status: 'Payée',
            taxpayer: {
                name: name,
                nif: `KN${Math.floor(Math.random() * 900000) + 100000}`,
                address: `N/A, ${Math.random() > 0.5 ? 'GOMBE' : 'LIMETE'}`,
                type: type
            },
            vehicle: {
                category: 'Vignette Automobile',
                plate: `${Math.floor(Math.random() * 9000)}AB${Math.floor(Math.random() * 99)}`,
                type: type,
                chassis: `5TYZE${Math.random().toString(36).substring(7).toUpperCase()}${Math.floor(Math.random() * 100000)}`,
                fiscalPower: `${fiscalPower} CV`,
                weight: "1 T",
                marque: marques[Math.floor(Math.random() * marques.length)],
                modele: modeles[Math.floor(Math.random() * modeles.length)]
            },
            tax: {
                baseRate: taxInfo.totalAmount,
                currency: 'USD',
                totalAmountFC: taxInfo.totalAmount * 2271.16
            },
            meta: {
                manualTaxpayer: {
                    name: name,
                    nif: `KN${Math.floor(Math.random() * 900000) + 100000}`,
                    address: `N/A, ${Math.random() > 0.5 ? 'GOMBE' : 'LIMETE'}`,
                    type: type
                }
            }
        };

        await supabase.from('declarations').insert(newDecl);
    }

    console.log("✅ Opération terminée avec succès !");
}

updateExistingAndAddNew();
