import { getDeclarationById } from './lib/store';

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

async function inspect() {
    for (const id of ids) {
        const decl = await getDeclarationById(id);
        if (decl) {
            console.log(`ID: ${id}, Status: "${decl.status}", Plate: "${decl.vehicle.plate}"`);
        } else {
            console.log(`ID: ${id} not found in DB.`);
        }
    }
}

inspect();
