import { supabase } from '../lib/supabase';

async function checkSpecificDeclaration() {
    const id = 'DECL-2026-157A3E0E';
    console.log(`Checking declaration: ${id}`);
    const { data, error } = await supabase
        .from('declarations')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data) {
        console.log('ID:', data.id);
        console.log('Status:', data.status);
        console.log('CreatedAt:', data.createdAt || (data as any).created_at);
        console.log('UpdatedAt:', data.updatedAt || (data as any).updated_at);
        console.log('Meta:', JSON.stringify(data.meta, null, 2));
    } else {
        console.log('Declaration not found.');
    }
}

checkSpecificDeclaration();
