import { updateDeclaration } from '../lib/store';

const ids = [
    'DECL-2026-157A1D2E',
    'DECL-2026-157EBA0E',
    'DECL-2026-1584C51D',
    'DECL-2026-157C87ED',
    'DECL-2026-157B602D',
    'DECL-2026-15891D25',
    'DECL-2026-157E861F',
    'DECL-2026-1579E552'
];

async function update() {
    console.log(`Starting update of ${ids.length} declarations...`);
    for (const id of ids) {
        const result = await updateDeclaration(id, { status: 'En attente de paiement' as any });
        if (result.success) {
            console.log(`✅ ID: ${id} updated successfully.`);
        } else {
            console.error(`❌ ID: ${id} failed to update: ${result.error}`);
        }
    }
    console.log('Update process complete.');
}

update();
