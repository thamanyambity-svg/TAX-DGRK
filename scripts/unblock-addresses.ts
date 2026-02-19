
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

const ZOMBIE_REGEX = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi;

async function unblockAddresses() {
    console.log("🔓 UNBLOCKING REAL ADDRESSES (Removing N/A and Zombie prefixes)...");
    const { data: decls } = await supabase.from('declarations').select('*');
    if (!decls) return;

    for (const d of decls) {
        let needsUpdate = false;
        const meta = d.meta ? JSON.parse(JSON.stringify(d.meta)) : {};

        const fields = ['taxpayerData', 'manualTaxpayer'];
        fields.forEach(f => {
            if (meta[f] && meta[f].address) {
                const old = meta[f].address;
                // Surgical cleaning: Remove zombie pattern and "N/A" prefixes
                let cleaned = old.replace(ZOMBIE_REGEX, '').trim();
                cleaned = cleaned.replace(/^(N\/A|[,/\s-])+/, '').trim();

                if (cleaned !== old) {
                    console.log(`🔓 ID ${d.id}: "${old}" -> "${cleaned}"`);
                    meta[f].address = cleaned || 'KINSHASA';
                    needsUpdate = true;
                }
            }
        });

        if (needsUpdate) {
            await supabase.from('declarations').update({ meta }).eq('id', d.id);
        }
    }
    console.log("✅ ALL ADDRESSES UNBLOCKED.");
}

unblockAddresses();
