
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
    console.log("Starting migration: Setting Taxpayer Type to N/A for all records...")

    const { data: rows, error } = await supabase.from('declarations').select('*');

    if (error) {
        console.error("Error fetching rows:", error);
        return;
    }

    console.log(`Found ${rows.length} rows.`);

    let validCount = 0;
    for (const row of rows) {

        // 1. Update Meta (Taxpayer Data)
        const newMeta = row.meta || {};
        if (newMeta.taxpayerData) {
            newMeta.taxpayerData.type = 'N/A';
        } else {
            newMeta.taxpayerData = { type: 'N/A', name: 'INCONNU', nif: '', address: '' };
        }

        // 2. Update Vehicle Type (often mirrors owner type)
        const newVehicle = row.vehicle || {};
        newVehicle.type = 'N/A';

        const { error: updateError } = await supabase
            .from('declarations')
            .update({
                vehicle: newVehicle,
                meta: newMeta
            })
            .eq('id', row.id);

        if (updateError) {
            console.error(`Failed to update ${row.id}:`, updateError);
        } else {
            validCount++;
        }
    }

    console.log(`Migration complete. Updated ${validCount} rows.`);
}

migrate();
