
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Recursively search and replace 'Personne Physique' or 'Personne Morale' with 'N/A'
 */
function deepClean(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string') {
            const forbidden = ['PERSONNE PHYSIQUE', 'PERSONNE MORALE', 'PHYSOU', 'MORAL'];
            const upper = obj.toUpperCase();
            if (forbidden.some(f => upper.includes(f))) {
                return 'N/A';
            }
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(deepClean);
    }

    const cleaned: any = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cleaned[key] = deepClean(obj[key]);
        }
    }
    return cleaned;
}

async function terminateZombies() {
    console.log("☣️  TOTAL EXTERMINATION INITIATED: Searching for 'Personne Physique/Morale' zombies...");

    const { data: rows, error } = await supabase.from('declarations').select('*');
    if (error) {
        console.error("Error fetching rows:", error);
        return;
    }

    console.log(`Found ${rows.length} records. Analyzing...`);

    let affectedCount = 0;
    for (const row of rows) {
        const rowStr = JSON.stringify(row);
        if (rowStr.includes('Personne Physique') || rowStr.includes('Personne Morale')) {
            console.log(`ZOMBIE DETECTED in ID: ${row.id}. Cleaning...`);

            const cleanedRow = deepClean(row);

            // Re-stringify to confirm it's gone
            if (JSON.stringify(cleanedRow).includes('Personne Physique')) {
                console.error(`ERROR: Cleaning failed for ${row.id}`);
                continue;
            }

            const { error: updateError } = await supabase
                .from('declarations')
                .update({
                    vehicle: cleanedRow.vehicle,
                    meta: cleanedRow.meta,
                    taxpayer: cleanedRow.taxpayer
                })
                .eq('id', row.id);

            if (updateError) {
                console.error(`Failed to update ${row.id}:`, updateError.message);
            } else {
                affectedCount++;
            }
        }
    }

    console.log(`\n✅ MISSION COMPLETE! ${affectedCount} zombies were successfully terminated.`);
    console.log("All records are now forced to 'N/A'.");
}

terminateZombies();
