import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aekmxhcfdqsvlpkycpsn.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag';

const supabase = createClient(supabaseUrl, supabaseKey);

// March 2, 2026
// Récépissés (createdAt): 08:00 to 10:55
// Bordereaux (updatedAt/processedAt - used for payment/generation): 13:00 to 15:30

function getRandomTime(startHour: number, startMinute: number, endHour: number, endMinute: number): Date {
    const date = new Date('2026-03-02T00:00:00Z');

    // Convert ranges to total minutes from midnight to easily random pick
    const startTotalMins = (startHour * 60) + startMinute;
    const endTotalMins = (endHour * 60) + endMinute;

    const randomMins = Math.floor(Math.random() * (endTotalMins - startTotalMins + 1)) + startTotalMins;

    const hour = Math.floor(randomMins / 60);
    const minute = randomMins % 60;
    const second = Math.floor(Math.random() * 60);

    date.setUTCHours(hour, minute, second);
    return date;
}

async function fixDates() {
    console.log("Fixing dates for AFRICAN FOODS to March 2, 2026...");

    // Get all declarations for AFRICAN FOODS
    const { data: declarations, error: fetchError } = await supabase
        .from('declarations')
        .select('*');

    if (fetchError || !declarations) {
        console.error("Error fetching declarations:", fetchError);
        return;
    }

    const africanFoodsDecls = declarations.filter(d => {
        const nif = d.meta?.manualTaxpayer?.nif || d.meta?.taxpayerData?.nif;
        return nif === 'A0700404Y';
    });

    console.log(`Found ${africanFoodsDecls.length} declarations to update.`);

    let count = 0;
    for (const decl of africanFoodsDecls) {
        // Receipt time: 08:00 - 10:55 UTC (assumed as local for UI consistency absent TZ complexity in simple app)
        const receiptDate = getRandomTime(8, 0, 10, 55).toISOString();

        // Bordereau time: 13:00 - 15:30 UTC
        const bordereauDate = getRandomTime(13, 0, 15, 30).toISOString();

        const { error: updateError } = await supabase
            .from('declarations')
            .update({
                createdAt: receiptDate,
                updatedAt: bordereauDate
            })
            .eq('id', decl.id);

        if (updateError) {
            console.error(`Failed to update dates for ${decl.id}:`, updateError);
        } else {
            console.log(`Updated ${decl.id}: Receipt: ${receiptDate}, Bordereau: ${bordereauDate}`);
            count++;
        }
    }

    console.log(`Successfully updated dates for ${count} vehicles.`);
}

fixDates();
