
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
    console.log('--- INSPECTION SCHEMA TABLE DECLARATIONS ---');

    // 1. Essai de lecture
    const { data, error } = await supabase.from('declarations').select('*').limit(1);

    if (error) {
        console.error("Erreur lecture:", error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Colonnes trouvées (basé sur 1 ligne existante):');
        console.log(Object.keys(data[0]).join(', '));
    } else {
        console.log('⚠️ Table vide. Impossible de déduire les colonnes par lecture.');
        console.log('Essai d insertion dummy pour voir l erreur...');

        const { error: insErr } = await supabase.from('declarations').insert([{ id: 'TEST-SCHEMA', status: 'debug' }]);
        if (insErr) {
            console.log("Erreur insertion:", insErr.message);
            // Cette erreur nous dira souvent "Column X does not exist" ou "Missing required column Y"
        }
    }
}

check();
