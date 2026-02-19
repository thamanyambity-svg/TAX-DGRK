
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function forceClean() {
    const id = 'DECL-2026-1579CC17';
    console.log(`🔥 FORCING CLEAN ON ${id}...`);

    const { data: decl } = await supabase.from('declarations').select('*').eq('id', id).single();
    if (!decl) {
        console.log("Not found.");
        return;
    }

    // Explicitly clean the vehicle object
    const newVehicle = { ...decl.vehicle, type: 'N/A', genre: 'N/A' };

    // Explicitly clean meta taxpayerData if it exists
    let newMeta = { ...decl.meta };
    if (newMeta.taxpayerData) {
        newMeta.taxpayerData = { ...newMeta.taxpayerData, type: 'N/A' };
    }

    const { error } = await supabase.from('declarations')
        .update({ vehicle: newVehicle, meta: newMeta })
        .eq('id', id);

    if (error) console.error("Error:", error);
    else console.log("✅ Update successful.");

    // Verify
    const { data: verify } = await supabase.from('declarations').select('vehicle').eq('id', id).single();
    console.log("Verified Vehicle:", verify?.vehicle ? JSON.stringify(verify.vehicle, null, 2) : "NULL");
}

forceClean();
