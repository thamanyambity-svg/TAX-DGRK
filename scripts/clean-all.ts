
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanDB() {
    console.log("Cleaning ALL records: Usage (genre) and Taxpayer Type to 'N/A'...");
    const { data: rows } = await supabase.from('declarations').select('*');
    if (!rows) return;

    for (const row of rows) {
        const vehicle = row.vehicle || {};
        vehicle.type = 'N/A';
        vehicle.genre = 'N/A';

        const meta = row.meta || {};
        if (meta.taxpayerData) meta.taxpayerData.type = 'N/A';
        if (meta.manualTaxpayer) meta.manualTaxpayer.type = 'N/A';

        await supabase.from('declarations').update({ vehicle, meta }).eq('id', row.id);
    }
    console.log("Cleanup finished.");
}

cleanDB();
