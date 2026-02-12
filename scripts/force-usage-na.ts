
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
    console.log("Starting migration: Forcing Usage / Genre to N/A for all records...")

    // Fetch all for update
    const { data: rows, error } = await supabase.from('declarations').select('*');

    if (error) {
        console.error("Error fetching rows:", error);
        return;
    }

    console.log(`Found ${rows.length} rows to update.`);

    let validCount = 0;
    for (const row of rows) {

        // Update Vehicle Genre/Usage to N/A
        const newVehicle = row.vehicle || {};
        const oldGenre = newVehicle.genre;

        // Force Update
        newVehicle.genre = 'N/A';

        const { error: updateError } = await supabase
            .from('declarations')
            .update({
                vehicle: newVehicle,
            })
            .eq('id', row.id);

        if (updateError) {
            console.error(`Failed to update ${row.id}:`, updateError);
        } else {
            validCount++;
            if (validCount % 50 === 0) process.stdout.write('.');
        }
    }

    console.log(`\nMigration complete. Updated ${validCount} / ${rows.length} rows.`);
}

migrate();
