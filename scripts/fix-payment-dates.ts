
import { createClient } from '@supabase/supabase-js'
import { getPaymentDate } from '../lib/business-calendar'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDates() {
    console.log("📅 FIXING PAYMENT DATES (Rule: +22h)...");
    const { data: decls } = await supabase.from('declarations').select('*');

    if (!decls) return;

    for (const d of decls) {
        const creation = d.createdAt || (d as any).created_at;
        if (!creation) continue;

        const correctPaymentDate = getPaymentDate(creation);

        // Only update if different or manualPaymentDate is missing/wrong
        const currentManual = d.meta?.manualPaymentDate;

        if (currentManual !== correctPaymentDate) {
            console.log(`Updating ${d.id}: ${creation} -> ${correctPaymentDate}`);
            const updatedMeta = {
                ...d.meta,
                manualPaymentDate: correctPaymentDate
            };

            await supabase.from('declarations').update({
                meta: updatedMeta
            }).eq('id', d.id);
        }
    }
    console.log("✅ ALL DATES SYNCHRONIZED.");
}

fixDates();
