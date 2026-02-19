
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugUpdate() {
    const id = "DECL-2026-1587BEEF";
    console.log(`Debug updating ${id}...`);

    const { data: current } = await supabase.from('declarations').select('*').eq('id', id).single();
    if (!current) {
        console.log("Record not found.");
        return;
    }

    const payload = {
        vehicle: { ...current.vehicle, type: 'N/A', genre: 'N/A' },
        meta: {
            ...current.meta,
            taxpayerData: current.meta.taxpayerData ? { ...current.meta.taxpayerData, type: 'N/A' } : current.meta.taxpayerData,
            manualTaxpayer: current.meta.manualTaxpayer ? { ...current.meta.manualTaxpayer, type: 'N/A' } : current.meta.manualTaxpayer
        }
    };

    const { data, error, status } = await supabase.from('declarations').update(payload).eq('id', id).select();

    if (error) {
        console.error("Update Error:", error);
    } else {
        console.log("Update Status:", status);
        console.log("Updated Data:", JSON.stringify(data?.[0]?.vehicle, null, 2));
    }
}

debugUpdate();
