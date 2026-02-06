
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkKinPlusData() {
    console.log('🔍 Inspecting KIN PLUS Fleet Data...');

    // Fetch all declarations where taxapayer name contains "KIN PLUS" (checking both root and meta)
    // Since filtering deep JSON is hard in simple query, fetching all and filtering in JS is safer for this check.
    const { data: decls, error } = await supabase.from('declarations').select('*');

    if (error) {
        console.error(error);
        return;
    }

    const kinPlusDecls = decls.filter(d => {
        const name = d.vehicle?.type === 'Personne Morale' ? d.taxpayer?.name : '';
        const metaName = d.meta?.manualTaxpayer?.name;
        const target = 'KIN PLUS';
        return (name && name.includes(target)) || (metaName && metaName.includes(target));
    });

    console.log(`Found ${kinPlusDecls.length} vehicles for KIN PLUS.`);
    console.table(kinPlusDecls.map(d => ({
        ID: d.id,
        Modele: `${d.vehicle.marque} ${d.vehicle.modele}`,
        Plaque: d.vehicle.plate,
        Chassis: d.vehicle.chassis,
        NDP: d.meta?.ndpId || 'N/A'
    })));

    // Check for duplicates
    const plates = kinPlusDecls.map(d => d.vehicle.plate);
    const chassis = kinPlusDecls.map(d => d.vehicle.chassis);
    const uniquePlates = new Set(plates);
    const uniqueChassis = new Set(chassis);

    if (uniquePlates.size !== plates.length) {
        console.log('❌ ALERT: DUPLICATE PLATES DETECTED!');
    } else {
        console.log('✅ Plates are unique.');
    }

    if (uniqueChassis.size !== chassis.length) {
        console.log('❌ ALERT: DUPLICATE CHASSIS DETECTED!');
    } else {
        console.log('✅ Chassis are unique.');
    }
}

checkKinPlusData();
