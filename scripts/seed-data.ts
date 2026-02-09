
import { createClient } from '@supabase/supabase-js';
import { calculateTax } from '../lib/tax-rules';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Règles de dates
const START_DATE = new Date('2026-01-15T09:00:00');
const END_DATE = new Date('2026-02-07T14:00:00');

function getRandomValidDate() {
    let found = false;
    let randomDate = new Date();

    while (!found) {
        const startTimestamp = START_DATE.getTime();
        const endTimestamp = END_DATE.getTime();
        const randomTimestamp = Math.floor(Math.random() * (endTimestamp - startTimestamp)) + startTimestamp;
        randomDate = new Date(randomTimestamp);

        const day = randomDate.getDay(); // 0: Dimanche, 6: Samedi
        const hour = randomDate.getHours();
        const minutes = randomDate.getMinutes();
        const timeValue = hour + minutes / 60;

        // Règle Dimanche
        if (day === 0) continue;

        // Règle Samedi (08h30 - 14h00)
        if (day === 6) {
            if (timeValue >= 8.5 && timeValue <= 14) {
                found = true;
            }
            continue;
        }

        // Règle Semaine (09h00 - 17h30)
        if (timeValue >= 9 && timeValue <= 17.5) {
            found = true;
        }
    }
    return randomDate.toISOString();
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
        const type = Math.random() > 0.3 ? 'Personne Physique' : 'Personne Morale';
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
