
import { createClient } from '@supabase/supabase-js'
import { generateNote } from '../lib/generator'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const { data } = await supabase.from('declarations').select('*').order('updatedAt', { ascending: false }).limit(5);
    if (!data) return;

    data.forEach(d => {
        const note = generateNote(d);
        console.log(`--- ID: ${d.id} ---`);
        console.log(`Taxpayer Type: ${note.taxpayer.type}`);
        console.log(`Vehicle Type: ${note.vehicle.type}`);
    });
}
run();
