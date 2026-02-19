
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("SEARCHING FOR ANY NON-N/A TYPE...");
    let offset = 0;
    const limit = 100;
    let foundCount = 0;

    while (true) {
        const { data, error } = await supabase
            .from('declarations')
            .select('id, vehicle, meta')
            .range(offset, offset + limit - 1);

        if (error) break;
        if (!data || data.length === 0) break;

        data.forEach(d => {
            const vType = d.vehicle?.type;
            const mType = d.meta?.taxpayerData?.type;
            const tType = (d as any).taxpayer?.type;

            if (
                (vType && vType !== 'N/A') ||
                (mType && mType !== 'N/A') ||
                (tType && tType !== 'N/A')
            ) {
                console.log(`🔴 NON-N/A TYPE in ID: ${d.id}`);
                console.log(`   Vehicle Type: ${vType}`);
                console.log(`   Meta Taxpayer Type: ${mType}`);
                console.log(`   (Root) Taxpayer Type: ${tType}`);
                foundCount++;
            }
        });

        offset += limit;
    }

    console.log(`Search finished. Total non-N/A found: ${foundCount}`);
}
run();
