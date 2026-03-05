import { supabase } from '../lib/supabase';

async function checkSchema() {
    console.log('Querying declarations...');
    const { data, error } = await supabase
        .from('declarations')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        const record = data[0];
        console.log('Keys in first record:', Object.keys(record));
        console.log('ID:', record.id);
        console.log('CreatedAt (raw):', (record as any).created_at);
        console.log('UpdatedAt (raw):', (record as any).updated_at);
        console.log('Meta:', JSON.stringify(record.meta, null, 2));
    } else {
        console.log('No data found in declarations table.');
    }
}

checkSchema();
