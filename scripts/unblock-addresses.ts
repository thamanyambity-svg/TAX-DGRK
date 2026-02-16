
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function unblockAddresses() {
    console.log("🧹 UNBLOCKING ADDRESSES AND USAGE...");

    const { data: rows, error } = await supabase.from('declarations').select('*');
    if (error) {
        console.error("Error:", error);
        return;
    }

    let fixedCount = 0;

    for (const row of rows) {
        let changed = false;
        const newVehicle = { ...row.vehicle };
        const newMeta = JSON.parse(JSON.stringify(row.meta || {}));

        // 1. Force Usage N/A
        if (newVehicle.type !== 'N/A') {
            newVehicle.type = 'N/A';
            changed = true;
        }

        // 2. Clean Address prefixes ('N/A, ', 'PERSONNE PHYSIQUE, ', etc.)
        if (newMeta.manualTaxpayer?.address) {
            const oldAddr = newMeta.manualTaxpayer.address;
            const newAddr = oldAddr.replace(/^(N\/A|PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL))(,?\s*)/i, '').trim();
            if (newAddr !== oldAddr) {
                newMeta.manualTaxpayer.address = newAddr || 'KINSHASA';
                changed = true;
            }
        }

        if (changed) {
            console.log(`Fixing ${row.id}: ${row.meta?.manualTaxpayer?.address} -> ${newMeta.manualTaxpayer?.address}`);
            await supabase.from('declarations').update({
                vehicle: newVehicle,
                meta: newMeta
            }).eq('id', row.id);
            fixedCount++;
        }
    }

    console.log(`\n✅ DONE! Fixed ${fixedCount} records.`);
}

unblockAddresses();
