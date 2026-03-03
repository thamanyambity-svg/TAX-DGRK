import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://aekmxhcfdqsvlpkycpsn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
);

const RATE = 2355;

// Tax grid — ONLY based on CV power (no category exception except motos)
function getCorrectBaseRate(category: string, fiscalPower: string | number | undefined): number | null {
    const cat = (category || '').toLowerCase();

    // Motorcycles — fixed flat rate
    if (cat === 'motorcycle_bicycle') return 12.20;

    const cv = typeof fiscalPower === 'number'
        ? fiscalPower
        : parseInt(String(fiscalPower || '0').replace(/[^\d]/g, '')) || 0;

    if (cv > 15) return 70.10;
    if (cv > 10) return 64.50;  // 11-15 CV
    if (cv > 0) return 58.70;  // 1-10 CV

    // CV unknown / 0 — skip correction
    return null;
}

async function run() {
    // Fetch all BRALIMA declarations
    const { data, error } = await supabase
        .from('declarations')
        .select('id, status, vehicle, tax, meta')
        .or('meta->>manualTaxpayer.like.%A04965%,meta->>taxpayerData.like.%A04965%');

    if (error || !data) {
        console.error('Fetch error:', error);
        return;
    }

    console.log(`Found ${data.length} BRALIMA declarations\n`);
    console.log('ID'.padEnd(25), 'Plate'.padEnd(12), 'Cat'.padEnd(22), 'CV'.padEnd(6), 'Weight'.padEnd(8), 'Stored$'.padEnd(10), 'Correct$'.padEnd(10), 'OK?');
    console.log('-'.repeat(110));

    const toFix: { id: string; plate: string; newBase: number; newFC: number }[] = [];

    for (const d of data) {
        const cat = d.vehicle?.category || 'N/A';
        const fp = d.vehicle?.fiscalPower ?? d.vehicle?.fiscal_power ?? '?';
        const storedBase = d.tax?.baseRate ?? d.tax?.principalTaxUSD ?? 0;
        const plate = d.vehicle?.plate || '?';

        const correctBase = getCorrectBaseRate(cat, fp);

        const ok = correctBase !== null && Math.abs(storedBase - correctBase) < 0.01 ? '✅' : '❌';

        console.log(
            d.id.padEnd(25),
            plate.padEnd(12),
            cat.padEnd(22),
            String(fp).padEnd(6),
            `$${storedBase}`.padEnd(10),
            correctBase !== null ? `$${correctBase}`.padEnd(10) : 'SKIP'.padEnd(10),
            ok
        );

        if (ok === '❌' && correctBase !== null) {
            toFix.push({
                id: d.id,
                plate,
                newBase: correctBase,
                newFC: Math.round(correctBase * RATE * 100) / 100,
            });
        }
    }

    console.log(`\n${toFix.length} entries need correction.`);

    if (toFix.length === 0) {
        console.log('All prices are correct!');
        return;
    }

    console.log('\nFixing...');
    let fixed = 0;
    for (const fix of toFix) {
        const { error: updateErr } = await supabase
            .from('declarations')
            .update({
                tax: {
                    baseRate: fix.newBase,
                    currency: 'USD',
                    totalAmountFC: fix.newFC,
                    principalTaxUSD: fix.newBase,
                }
            })
            .eq('id', fix.id);

        if (updateErr) {
            console.error(`❌ Failed ${fix.plate}: ${updateErr.message}`);
        } else {
            console.log(`✅ Fixed ${fix.plate} (${fix.id}) → $${fix.newBase} / FC ${fix.newFC.toLocaleString()}`);
            fixed++;
        }
    }

    console.log(`\nDone: ${fixed}/${toFix.length} corrected.`);
}

run();
