
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSpecific() {
    // The ID from the screenshot refers to the NDP (Note de Perception)
    // Often NDP ID matches DECL ID suffix, or is stored in meta.
    // Screenshot ID: NDP-2026-157A775E
    // Let's guess the declaration ID is DECL-2026-157A775E
    const targetId = 'DECL-2026-157A775E';

    console.log(`🔎 Checking ${targetId} for zombies...`);

    const { data, error } = await supabase
        .from('declarations')
        .select('*')
        .eq('id', targetId)
        .single();

    if (error) {
        console.log("Not found or error:", error.message);
        return;
    }

    console.log("Record found. Checking content...");
    const str = JSON.stringify(data);
    const forbiddenRegex = /PERSONNE\s+(PHYSIQUE|MORALE)/i;

    if (forbiddenRegex.test(str)) {
        console.error("🚨 ZOMBIE DETECTED in this specific record!");
        console.log(str.substring(0, 500) + "..."); // Print snippet

        // Kill it
        const cleaned = JSON.parse(str.replace(/PERSONNE\s+(PHYSIQUE|MORALE)/gi, 'N/A'));

        // Update
        const { error: updateError } = await supabase
            .from('declarations')
            .update({
                vehicle: cleaned.vehicle,
                meta: cleaned.meta,
                tax: cleaned.tax
                // We don't update taxpayer col as it might be missing/moved
            })
            .eq('id', targetId);

        if (updateError) console.error("Update failed:", updateError);
        else console.log("✅ TERMINATED locally.");
    } else {
        console.log("✅ Record is CLEAN. No 'Personne Physique' found in DB for this ID.");
    }
}

checkSpecific();
