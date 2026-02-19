
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aekmxhcfdqsvlpkycpsn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag'

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectRow() {
    const id = 'DECL-2026-15828687';
    console.log(`Inspecting row ${id}...`);

    const { data, error } = await supabase
        .from('declarations')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error("Error fetching row:", error);
        return;
    }

    console.log("Full content:", JSON.stringify(data, null, 2));
}

inspectRow();
