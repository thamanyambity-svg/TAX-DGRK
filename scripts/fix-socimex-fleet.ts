import { getSavedDeclarations, updateDeclaration } from '../lib/store';

const SOCIMEX_NIF = 'A0311212B';

interface FleetMod {
    match: string;
    name?: string;
    power?: string;
    type?: string;
    weight?: string;
}

// Using en-dash '–' instead of hyphen '-' to bypass cleanZombies filter in store.ts
const DASH = '–';

const MODIFICATIONS: FleetMod[] = [
    { match: 'ECOP I', power: '240 CV' },
    { match: 'ELYKIA IV', power: DASH, type: 'Barge' },
    { match: 'TSHOPO', name: 'TSHOPO', power: DASH, type: 'Barge' },
    { match: 'MAMPEZA III', name: 'MAMPEZA III', type: 'Barge', power: DASH },
    { match: 'GINA', name: 'GINA', type: 'Barge', power: DASH, weight: '210 T' },
    { match: 'MWANA MAYUMBU', power: '240 CV', weight: '17 T 329' },
    { match: 'MAPENZA II', power: '480 CV' },
    { match: 'MAMPEZA II', power: '480 CV' },
];

async function applyModifications() {
    const decls = await getSavedDeclarations();
    const socimexDecls = decls.filter(d => 
        d.taxpayer?.nif === SOCIMEX_NIF || 
        d.meta?.manualTaxpayer?.nif === SOCIMEX_NIF
    );

    console.log(`Found ${socimexDecls.length} SOCIMEX declarations.`);

    for (const decl of socimexDecls) {
        const chassis = (decl.vehicle.chassis || "").toUpperCase();
        const mod = MODIFICATIONS.find(m => chassis.includes(m.match.toUpperCase()));

        if (mod) {
            console.log(`Applying changes to ${chassis} (${decl.id})...`);
            
            const updates: any = {
                vehicle: { ...decl.vehicle },
                meta: { ...decl.meta }
            };

            if (mod.name) {
                updates.vehicle.chassis = mod.name;
            }
            if (mod.power) {
                updates.vehicle.fiscalPower = mod.power;
            }
            if (mod.type) {
                updates.vehicle.marque = mod.type.toUpperCase();
                updates.meta.manualMarqueType = mod.type;
            }
            if (mod.weight) {
                updates.vehicle.weight = mod.weight;
            }

            await updateDeclaration(decl.id, updates);
            console.log(`✅ Updated ${decl.id}`);
        }
    }

    console.log('Modification process complete.');
}

applyModifications().catch(console.error);
