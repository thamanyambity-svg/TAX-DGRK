import { getSavedDeclarations, updateDeclaration } from '../lib/store';
import { DeclarationStatus } from '../types';

const SOCIMEX_NIF = 'A0311212B';

async function fixSocimexPaid() {
    const decls = await getSavedDeclarations();
    const socimexDecls = decls.filter(d => 
        (d.taxpayer?.nif === SOCIMEX_NIF || 
        d.meta?.manualTaxpayer?.nif === SOCIMEX_NIF || 
        (d.meta?.manualTaxpayer?.name || "").toUpperCase().includes("SOCIMEX") ||
        (d.taxpayer?.name || "").toUpperCase().includes("SOCIMEX"))
        && d.vehicle.category === 'Bateau'
    );

    console.log(`Found ${socimexDecls.length} SOCIMEX boat declarations to fix.`);

    for (const decl of socimexDecls) {
        if (decl.status === 'Payé') {
            console.log(`ID: ${decl.id} is already Payé.`);
            continue;
        }

        console.log(`Updating ID: ${decl.id} to Payé... (Current status: ${decl.status})`);
        const updates: any = {
            status: 'Payé' as DeclarationStatus,
            meta: {
                ...decl.meta,
                paymentStatus: 'PAID'
            }
        };
        const result = await updateDeclaration(decl.id, updates);
        if (result.success) {
            console.log(`✅ ID: ${decl.id} updated.`);
        } else {
            console.error(`❌ ID: ${decl.id} failed: ${result.error}`);
        }
    }
    console.log('Fix complete.');
}

fixSocimexPaid().catch(console.error);
