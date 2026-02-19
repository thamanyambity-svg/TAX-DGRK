
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function nuclearClean() {
    console.log("☢️ NUCLEAR CLEAN STARTING...");
    const { data: decls } = await supabase.from('declarations').select('*');
    if (!decls) return;

    for (const d of decls) {
        let str = JSON.stringify(d);
        if (/Personne (Physique|Morale)/gi.test(str)) {
            console.log(`Cleaning ${d.id}...`);
            // Radical string replacement on the whole object
            const cleanedStr = str.replace(/Personne (Physique|Morale)/gi, 'N/A');
            const cleaned = JSON.parse(cleanedStr);

            // Re-clean addresses specifically
            if (cleaned.meta?.taxpayerData?.address) {
                cleaned.meta.taxpayerData.address = cleaned.meta.taxpayerData.address.replace(/^N\/A,\s*/i, '').trim();
            }
            if (cleaned.meta?.manualTaxpayer?.address) {
                cleaned.meta.manualTaxpayer.address = cleaned.meta.manualTaxpayer.address.replace(/^N\/A,\s*/i, '').trim();
            }

            await supabase.from('declarations').update({
                vehicle: cleaned.vehicle,
                meta: cleaned.meta,
                taxpayer: cleaned.taxpayer || null
            }).eq('id', d.id);
        }
    }
    console.log("☢️ NUCLEAR CLEAN COMPLETE.");
}

nuclearClean();
