import { getSavedDeclarations, updateDeclaration } from '../lib/store';

const TARGET_NIF = 'A0311212B';

async function fixSocimex() {
    const decls = await getSavedDeclarations();
    const socimexDecls = decls.filter(d => 
        (d.meta?.manualTaxpayer?.name || "").toUpperCase().includes("SOCIMEX")
    );

    console.log(`Found ${socimexDecls.length} SOCIMEX declarations to fix.`);

    for (const decl of socimexDecls) {
        if (decl.meta?.manualTaxpayer?.nif === 'N/A' || !decl.meta?.manualTaxpayer?.nif) {
            console.log(`Updating ID: ${decl.id} to NIF: ${TARGET_NIF}`);
            const updates = {
                meta: {
                    ...decl.meta,
                    manualTaxpayer: {
                        ...decl.meta.manualTaxpayer,
                        nif: TARGET_NIF
                    }
                }
            };
            const result = await updateDeclaration(decl.id, updates);
            if (result.success) {
                console.log(`✅ ID: ${decl.id} updated.`);
            } else {
                console.error(`❌ ID: ${decl.id} failed: ${result.error}`);
            }
        } else {
            console.log(`ID: ${decl.id} already has NIF: ${decl.meta.manualTaxpayer.nif}`);
        }
    }
    console.log('Fix complete.');
}

fixSocimex();
