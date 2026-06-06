import { getSavedDeclarations } from '../lib/store';

async function findJohn() {
    const decls = await getSavedDeclarations();
    
    // Search the full stringified object to be safe
    const johnDecls = decls.filter(d => 
        JSON.stringify(d).toUpperCase().includes("MPOLESHA") ||
        JSON.stringify(d).toUpperCase().includes("MBUYI")
    );

    console.log(`Found ${johnDecls.length} declarations with MPOLESHA or MBUYI:`);
    
    johnDecls.forEach(decl => {
        console.log(`\n--- ID: ${decl.id} ---`);
        console.log(`Taxpayer:`, JSON.stringify(decl.taxpayer));
        console.log(`Meta:`, JSON.stringify(decl.meta));
        console.log(`Created At:`, decl.createdAt);
        console.log(`Status:`, decl.status);
    });
}

findJohn();
