
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("Starting ULTIMATE CLEANUP...");
    const { data, error: fetchError } = await supabase.from('declarations').select('*');
    if (fetchError || !data) {
        console.error("Fetch error:", fetchError);
        return;
    }

    const forbiddenRegex = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi;
    let count = 0;

    for (const row of data) {
        const str = JSON.stringify(row);
        if (forbiddenRegex.test(str)) {
            console.log(`ZOMBIE DETECTED in ID: ${row.id}`);

            // Clean the entire object string
            const cleanedStr = str.replace(forbiddenRegex, 'N/A');
            const cleanedRow = JSON.parse(cleanedStr);

            // Explicitly force 'type' to 'N/A' just in case
            if (cleanedRow.vehicle) cleanedRow.vehicle.type = 'N/A';
            if (cleanedRow.meta?.taxpayerData) cleanedRow.meta.taxpayerData.type = 'N/A';

            console.log(`Saving cleaned version for ${row.id}...`);
            const { error: updateError } = await supabase
                .from('declarations')
                .update(cleanedRow)
                .eq('id', row.id);

            if (updateError) {
                console.error(`Error saving ${row.id}:`, updateError);
            } else {
                count++;
            }
        }
    }

    console.log(`ULTIMATE CLEANUP FINISHED. Cleaned ${count} zombies.`);
}
run();
