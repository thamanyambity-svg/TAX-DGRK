import { supabase } from '../lib/supabase';

async function checkData() {
    const { data, error } = await supabase
        .from('declarations')
        .select('id, status')
        .order('id');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Current declarations in Supabase:');
        console.table(data);
    }
}

checkData();
