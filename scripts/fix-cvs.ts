import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aekmxhcfdqsvlpkycpsn.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCVs() {
    console.log("Fixing CV values...");

    const fixes = [
        { plate: '7222BP01', cv: '12 CV' }, // Vehicule 26
        { plate: '6745AY01', cv: '20 CV' }, // Vehicule 37
        { plate: '1750AR01', cv: '20 CV' }  // Vehicule 40
    ];

    for (const fix of fixes) {
        // Fetch current to keep other vehicle fields intact
        const { data: declarations, error: fetchError } = await supabase
            .from('declarations')
            .select('*')
            .filter('vehicle->>plate', 'eq', fix.plate);

        if (fetchError || !declarations || declarations.length === 0) {
            console.error(`Error fetching or not found for plate ${fix.plate}:`, fetchError);
            continue;
        }

        for (const decl of declarations) {
            const updatedVehicle = { ...decl.vehicle, fiscalPower: fix.cv };

            const { error: updateError } = await supabase
                .from('declarations')
                .update({ vehicle: updatedVehicle })
                .eq('id', decl.id);

            if (updateError) {
                console.error(`Failed to update ${fix.plate} (${decl.id}):`, updateError);
            } else {
                console.log(`Successfully updated ${fix.plate} to ${fix.cv} (ID: ${decl.id})`);
            }
        }
    }
    console.log("Done fixing CVs.");
}

fixCVs();
