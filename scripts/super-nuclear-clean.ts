
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

const ZOMBIE_REGEX = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi;

async function superNuclearClean() {
    console.log("🚀 STARTING SUPER NUCLEAR CLEAN...");

    // 1. Clean Declarations
    const { data: decls } = await supabase.from('declarations').select('*');
    if (decls) {
        console.log(`Scanning ${decls.length} declarations...`);
        for (const row of decls) {
            let needsUpdate = false;

            // Force N/A at the root level of vehicle
            if (row.vehicle) {
                if (row.vehicle.type !== 'N/A') {
                    row.vehicle.type = 'N/A';
                    needsUpdate = true;
                }
                if (row.vehicle.genre !== 'N/A') {
                    row.vehicle.genre = 'N/A';
                    needsUpdate = true;
                }
            }

            // Clean meta for zombie strings and N/A prefixes in address
            if (row.meta) {
                let metaStr = JSON.stringify(row.meta);
                if (ZOMBIE_REGEX.test(metaStr)) {
                    const cleanedMeta = JSON.parse(metaStr.replace(ZOMBIE_REGEX, 'N/A'));
                    row.meta = cleanedMeta;
                    needsUpdate = true;
                }

                // Specifically clean address prefixes like "N/A, " or "PERSONNE PHYSIQUE, "
                const addrFields = ['taxpayerData', 'manualTaxpayer'];
                addrFields.forEach(field => {
                    if (row.meta[field] && row.meta[field].address) {
                        const oldAddr = row.meta[field].address;
                        const newAddr = oldAddr.replace(/^(N\/A|PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)),?\s*/gi, '').trim();
                        if (newAddr !== oldAddr) {
                            row.meta[field].address = newAddr || 'KINSHASA';
                            needsUpdate = true;
                        }
                    }
                });
            }

            if (needsUpdate) {
                console.log(`🧹 Updating Declaration ${row.id}`);
                await supabase.from('declarations').update({
                    vehicle: row.vehicle,
                    meta: row.meta
                }).eq('id', row.id);
            }
        }
    }

    // 2. Clean Receipt Logs
    const { data: logs } = await supabase.from('receipt_logs').select('*');
    if (logs) {
        console.log(`Scanning ${logs.length} logs...`);
        for (const log of logs) {
            let logStr = JSON.stringify(log.full_receipt_data);
            if (ZOMBIE_REGEX.test(logStr) || log.full_receipt_data?.vehicle?.type !== 'N/A') {
                console.log(`🧹 Cleaning Log ${log.id}`);
                const cleanedData = JSON.parse(logStr.replace(ZOMBIE_REGEX, 'N/A'));
                if (cleanedData.vehicle) {
                    cleanedData.vehicle.type = 'N/A';
                    cleanedData.vehicle.genre = 'N/A';
                }
                await supabase.from('receipt_logs').update({
                    full_receipt_data: cleanedData
                }).eq('id', log.id);
            }
        }
    }

    console.log("✅ SUPER NUCLEAR CLEAN COMPLETE.");
}

superNuclearClean();
