
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function fixCategories() {
    console.log('🔄 Auto-correcting Vehicle Categories...');

    // 1. Fetch all declarations
    const { data: decls, error } = await supabase.from('declarations').select('*');

    if (error) {
        console.error(error);
        return;
    }

    let updatedCount = 0;

    for (const d of decls) {
        let newCategory = d.vehicle.category;
        const genre = d.vehicle.genre?.toUpperCase() || '';
        const modele = d.vehicle.modele?.toUpperCase() || '';

        // RULE: HOWO Trucks -> Véhicule utilitaire
        if (modele.includes('HOWO') || genre.includes('CAMION') || genre.includes('TRUCK')) {
            newCategory = 'Véhicule utilitaire';
        }
        // RULE: Jeeps, Pickups, Voitures (Prado, Lexus, Rush, Wingle) -> Vignette Automobile
        else if (genre.includes('JEEP') || genre.includes('VOITURE') || genre.includes('PICK-UP') || modele.includes('WINGLE')) {
            newCategory = 'Vignette Automobile';
        }

        // Apply Update if changed
        if (newCategory !== d.vehicle.category) {
            const newVehicle = { ...d.vehicle, category: newCategory };
            await supabase
                .from('declarations')
                .update({ vehicle: newVehicle })
                .eq('id', d.id);

            console.log(`   📝 ${d.id} (${d.vehicle.marque} ${d.vehicle.modele}): ${d.vehicle.category} -> ${newCategory}`);
            updatedCount++;
        }
    }

    console.log(`✅ Completed. Updated ${updatedCount} records.`);
}

fixCategories();
