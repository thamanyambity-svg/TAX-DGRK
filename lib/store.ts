import { Declaration } from '@/types';
import { supabase } from './supabase';

// Session cache to ensure instant availability after creation (Fixes "Too long loading" error)
const SESSION_CACHE: Declaration[] = [];

/**
 * FINAL FIREWALL: Recursively wipes 'Personne Physique' or 'Personne Morale' from any object.
 */
const cleanZombies = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string') {
            const forbiddenRegex = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi;
            // Surgically REMOVE the zombie string. Also strip trailing/leading separators and N/A prefixes.
            let cleaned = obj.replace(forbiddenRegex, '').trim();
            cleaned = cleaned.replace(/^\s*(N\/A|[,/\s-])+/, '').replace(/[,/\s-]+$/, '').trim();
            return cleaned || 'N/A';
        }
        return obj;
    }
    if (Array.isArray(obj)) return obj.map(cleanZombies);
    const cleaned: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cleaned[key] = cleanZombies(obj[key]);
        }
    }
    return cleaned;
};

// Async implementation for Supabase
// Async implementation for Supabase
export const saveDeclaration = async (rawDecl: Declaration): Promise<{ success: boolean, id?: string, error?: string }> => {
    try {
        const decl = cleanZombies(rawDecl);
        // 1. Cache immediately (optimistic)
        SESSION_CACHE.push(decl);

        // 2. Insert into primary 'declarations' table
        // DB Schema Analysis (Step Id: 3423): 
        // Columns found: id, createdAt, updatedAt, status, vehicle, tax, meta.
        // MISSING: 'taxpayer'.
        // FIX: Start moving taxpayer into 'meta' to persist it, and remove from root.

        const dbPayload = cleanZombies({
            ...decl,
            meta: {
                ...decl.meta,
                // Ensure we save the taxpayer data inside meta since root column is missing
                taxpayerData: decl.taxpayer
            }
        });

        // FINAL CHECK FOR ZOMBIES
        const payloadStr = JSON.stringify(dbPayload);
        if (/PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/i.test(payloadStr)) {
            console.error("⛔ CRITICAL: A ZOMBIE TRIED TO BYPASS FILTERS!", dbPayload);
            // Forced emergency wipe on the string
            const forcedClean = JSON.parse(payloadStr.replace(/PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi, 'N/A'));
            Object.assign(dbPayload, forcedClean);
        }

        // FORCE N/A on vehicle type/genre unconditionally before save
        if (dbPayload.vehicle) {
            dbPayload.vehicle.type = 'N/A';
            dbPayload.vehicle.genre = 'N/A';
        }

        // FORCE address cleaning in meta
        const cleanAddr = (s: string) => (s || '').replace(/PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi, '').replace(/^\s*(N\/A|N\/A,|[,/\s-])+/, '').trim() || '';
        if (dbPayload.meta?.manualTaxpayer) {
            dbPayload.meta.manualTaxpayer.type = 'N/A';
            const a = cleanAddr(dbPayload.meta.manualTaxpayer.address);
            if (a) dbPayload.meta.manualTaxpayer.address = a;
        }
        if (dbPayload.meta?.taxpayerData) {
            dbPayload.meta.taxpayerData.type = 'N/A';
            const a = cleanAddr(dbPayload.meta.taxpayerData.address);
            if (a) dbPayload.meta.taxpayerData.address = a;
        }

        // Remove 'taxpayer' from root as column doesn't exist
        delete (dbPayload as any).taxpayer;

        const { data, error } = await supabase
            .from('declarations')
            .insert([dbPayload])
            .select();

        if (error) {
            console.error("Error inserting document: ", error);
            // Rollback cache if needed, but SESSION_CACHE is loose
            return { success: false, error: error.message || JSON.stringify(error) };
        }

        console.log("Document saved:", data);

        // 3. SECURE LOGGING (Non-blocking)
        try {
            const qrContent = `https://tax-portal-two.vercel.app/verify/${decl.id}`;
            // CRITICAL: Log the CLEANED payload (not raw decl) to avoid zombie data in logs
            const cleanedForLog = cleanZombies({
                ...decl,
                vehicle: { ...decl.vehicle, type: 'N/A', genre: 'N/A' }
            });
            const logEntry = {
                reference_number: decl.id,
                qr_code_content: qrContent,
                full_receipt_data: cleanedForLog,
                created_at: new Date().toISOString()
            };

            const { error: logError } = await supabase
                .from('receipt_logs')
                .insert([logEntry]);

            if (logError) {
                console.error("Warning: Failed to log receipt to audit trail:", logError);
            }
        } catch (logEx) {
            console.warn("Could not save to receipt_logs:", logEx);
        }

        return { success: true, id: decl.id };
    } catch (e: any) {
        console.error("Error saving declaration: ", e);
        return { success: false, error: e.message || String(e) };
    }
};

export const getSavedDeclarations = async (): Promise<Declaration[]> => {
    try {
        const { data, error } = await supabase
            .from('declarations')
            .select('*');

        if (error) throw error;

        return (data || []).map((d: any) => {
            const rawTaxpayer = d.taxpayer || (d.meta && d.meta.taxpayerData) || { name: 'Inconnu', nif: '', address: '' };
            return {
                ...d,
                createdAt: d.created_at || d.createdAt,
                updatedAt: d.updated_at || d.updatedAt,
                taxpayer: {
                    ...rawTaxpayer,
                    type: 'N/A' // FORCE N/A - ABSOLUTELY NO EXCEPTIONS
                },
                // Also force in vehicle if it exists there
                vehicle: d.vehicle ? { ...d.vehicle, type: 'N/A', genre: 'N/A' } : d.vehicle
            };
        }) as Declaration[];
    } catch (e) {
        console.error("Error fetching documents: ", e);
        return [];
    }
};

export const getDeclarationById = async (id: string): Promise<Declaration | undefined> => {
    // 1. Check Session Cache (Instant)
    const cached = SESSION_CACHE.find(d => d.id === id);
    if (cached) return cached;

    try {
        const { data, error } = await supabase
            .from('declarations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error("Error fetching document by ID: ", error);
            }
            return undefined;
        }

        // NORMAL RECOVERY
        if (data) {
            const rawTaxpayer = data.taxpayer || (data.meta && data.meta.taxpayerData) || { name: 'Inconnu', nif: '', address: '' };
            return {
                ...data,
                createdAt: data.created_at || data.createdAt,
                updatedAt: data.updated_at || data.updatedAt,
                taxpayer: {
                    ...rawTaxpayer,
                    type: 'N/A' // FORCE N/A
                },
                vehicle: data.vehicle ? { ...data.vehicle, type: 'N/A', genre: 'N/A' } : data.vehicle
            } as Declaration;
        }

        // 3. FALLBACK: Deterministic Generator (Allow previews of logical IDs even if not in DB)
        if (id.startsWith('DECL-2026-')) {
            const { generateDeclaration, DECL_BASE } = await import('./generator');
            const sequenceStr = id.split('-').pop();
            const val = parseInt(sequenceStr || '0', 16);
            if (!isNaN(val) && val >= DECL_BASE) {
                return generateDeclaration(val - DECL_BASE);
            }
        }

        return undefined;
    } catch (e) {
        console.error("Unexpected error: ", e);
        return undefined;
    }
};

export const deleteDeclaration = async (id: string): Promise<boolean> => {
    try {
        // Remove from memory cache if present
        const idx = SESSION_CACHE.findIndex(d => d.id === id);
        if (idx !== -1) SESSION_CACHE.splice(idx, 1);

        // Delete from Supabase
        const { error } = await supabase
            .from('declarations')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting declaration:", error);
            return false;
        }

        return true;
    } catch (e) {
        console.error("Exception deleting declaration:", e);
        return false;
    }
};

export const updateDeclaration = async (id: string, rawUpdates: Partial<Declaration>): Promise<{ success: boolean, error?: string }> => {
    try {
        const updates = cleanZombies(rawUpdates);
        // 1. Fetch current full state to ensure we have a complete object for Upsert
        // We try cache first, then DB
        let current = SESSION_CACHE.find(d => d.id === id);
        if (!current) {
            const { data } = await supabase.from('declarations').select('*').eq('id', id).single();
            if (data) {
                current = {
                    ...data,
                    createdAt: data.created_at || data.createdAt,
                    updatedAt: data.updated_at || data.updatedAt,
                };
            }
        }

        if (!current) {
            return { success: false, error: "Document original introuvable." };
        }

        // 2. Merge Updates & Clean entire result
        const merged: Declaration = cleanZombies({
            ...current,
            ...updates,
            updatedAt: new Date().toISOString()
        });

        // 3. Update Memory Cache
        const idx = SESSION_CACHE.findIndex(d => d.id === id);
        if (idx !== -1) {
            SESSION_CACHE[idx] = merged;
        } else {
            SESSION_CACHE.push(merged);
        }

        const dbPayload = cleanZombies({
            ...merged,
            meta: {
                ...merged.meta,
                taxpayerData: merged.taxpayer
            }
        });

        // FINAL CHECK FOR ZOMBIES
        const payloadStr = JSON.stringify(dbPayload);
        if (/PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/i.test(payloadStr)) {
            console.error("⛔ CRITICAL: A ZOMBIE TRIED TO BYPASS UPDATE FILTERS!", dbPayload);
            // Forced emergency wipe on the string
            const forcedClean = JSON.parse(payloadStr.replace(/PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi, 'N/A'));
            Object.assign(dbPayload, forcedClean);
        }

        delete (dbPayload as any).taxpayer;

        const { error } = await supabase
            .from('declarations')
            .upsert(dbPayload)
            .select();

        if (error) {
            console.error("Error updating declaration:", error);
            return { success: false, error: error.message || JSON.stringify(error) };
        }

        return { success: true };
    } catch (e: any) {
        console.error("Exception updating declaration:", e);
        return { success: false, error: e.message || String(e) };
    }
};
