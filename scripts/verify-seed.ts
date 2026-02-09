
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
    console.log('🔍 Verifying Data Integrity...');

    // 1. Check Total Count
    const { count, error: countError } = await supabase
        .from('declarations')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('❌ Error getting count:', countError);
        return;
    }
    console.log(`📊 Total Declarations: ${count} (Expected: 29)`);

    // 2. Analyze KIN PLUS Fleet
    const { data: fleet, error: fleetError } = await supabase
        .from('declarations')
        .select('vehicle, tax')
        .eq('meta->manualTaxpayer->>name', 'STE KIN PLUS SARL');

    if (fleetError) {
        console.error('❌ Error fetching fleet:', fleetError);
        return;
    }

    console.log(`🚛 KIN PLUS Fleet Size: ${fleet.length} (Expected: 20)`);

    // 3. Breakdown by Type/Price
    let howoCount = 0;
    let wingleCount = 0;
    let price75 = 0;
    let price69 = 0;

    fleet.forEach(d => {
        // Check Vehicle Type
        if ((d.vehicle as any).modele === 'HOWO') howoCount++;
        if ((d.vehicle as any).modele === 'WINGLE') wingleCount++;

        // Check Price
        if ((d.tax as any).baseRate === 75) price75++;
        if ((d.tax as any).baseRate === 69) price69++;
    });

    console.log(`   - HOWO Trucks (35CV): ${howoCount}`);
    console.log(`   - Wingle Pickups (12CV): ${wingleCount}`);
    console.log(`   - Tax $75 Checks: ${price75}`);
    console.log(`   - Tax $69 Checks: ${price69}`);

    if (howoCount === 10 && wingleCount === 10 && price75 === 10 && price69 === 10) {
        console.log('✅ INTEGRETY CHECK PASSED: Fleet composition is perfect.');
    } else {
        console.warn('⚠️ INTEGRETY WARNING: Fleet composition mismatch.');
    }
}

verifyData();
