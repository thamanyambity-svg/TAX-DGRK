
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

const ZOMBIE_REGEX = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi;

function deepExterminate(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string') {
            if (ZOMBIE_REGEX.test(obj)) {
                if (obj.trim().match(ZOMBIE_REGEX)) return 'N/A';
                return obj.replace(ZOMBIE_REGEX, '').replace(/^[,\s]+/, '').trim();
            }
        }
        return obj;
    }
    if (Array.isArray(obj)) return obj.map(deepExterminate);
    const cleaned: any = {};
    for (const key in obj) {
        cleaned[key] = deepExterminate(obj[key]);
        if (key === 'type' || key === 'genre') {
            if (ZOMBIE_REGEX.test(String(cleaned[key]))) cleaned[key] = 'N/A';
        }
    }
    return cleaned;
}

async function startExtermination() {
    console.log("☣️ STARTING ULTRA DEEP EXTERMINATION (v7)...");

    // Scan ALL declarations
    const { data: decls } = await supabase.from('declarations').select('*');
    if (decls) {
        console.log(`Scanning ${decls.length} declarations...`);
        for (const row of decls) {
            const raw = JSON.stringify(row);
            if (ZOMBIE_REGEX.test(raw)) {
                console.log(`🧹 Cleaning Declaration ${row.id}...`);
                const cleaned = deepExterminate(row);
                await supabase.from('declarations').update({
                    vehicle: cleaned.vehicle,
                    meta: cleaned.meta,
                    taxpayer: cleaned.taxpayer || null
                }).eq('id', row.id);
            }
        }
    }

    // Scan ALL logs
    const { data: logs } = await supabase.from('receipt_logs').select('*');
    if (logs) {
        console.log(`Scanning ${logs.length} logs...`);
        for (const log of logs) {
            const raw = JSON.stringify(log);
            if (ZOMBIE_REGEX.test(raw)) {
                console.log(`🧹 Cleaning Log ${log.id}...`);
                const cleanedData = deepExterminate(log.full_receipt_data);
                await supabase.from('receipt_logs').update({
                    full_receipt_data: cleanedData
                }).eq('id', log.id);
            }
        }
    }

    console.log("✅ ULTRA EXTERMINATION COMPLETE.");
}

startExtermination();
