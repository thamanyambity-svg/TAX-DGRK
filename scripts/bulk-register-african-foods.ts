
import { createClient } from '@supabase/supabase-js';
import { getSecureSequence, generateDeclarationId, generateNoteId } from '../lib/generator';
import { getNowOrBusinessHours } from '../lib/business-calendar';
import { calculateTax } from '../lib/tax-rules';
import { Declaration, VehicleCategory } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aekmxhcfdqsvlpkycpsn.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFla214aGNmZHFzdmxwa3ljcHNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTg1OTAsImV4cCI6MjA4NTY5NDU5MH0._zsSPTyD-MaEOrarBg-QuTnqwAsyxRFowY51ZTWloag';

const supabase = createClient(supabaseUrl, supabaseKey);

const COMPANY_INFO = {
    nif: 'A0700404Y',
    name: 'STE AFRICAN FOODS & BEVERAGES',
    address: 'LIMETE',
    city: 'KINSHASA'
};

const VEHICLES_DATA = [
    { plate: '9517BV01', cv: 28, weight: '28 tonnes', chassis: '639', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '9518BV01', cv: 28, weight: '28 tonnes', chassis: '630', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '9516BV01', cv: 28, weight: '28 tonnes', chassis: '638', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '9515BV01', cv: 28, weight: '28 tonnes', chassis: '8420', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '2918AW01', cv: 13, weight: '', chassis: '68585', price: 64.5, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '8751AS01', cv: 15, weight: '', chassis: '68586', price: 64.5, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '1104AK01', cv: 30, weight: '30 tonnes', chassis: '68587', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '3874BM01', cv: 12, weight: '', chassis: '68589', price: 64.5, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '3281BS01', cv: 21, weight: '21 tonnes', chassis: '68592', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '2725BQ01', cv: 21, weight: '21 tonnes', chassis: '68593', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '4785BQ01', cv: 13, weight: '', chassis: '68595', price: 64.5, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '2450AP01', cv: 13, weight: '', chassis: '68596', price: 64.5, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '1977AX01', cv: 20, weight: '15 tonnes', chassis: '68598', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '4950BH01', cv: 13, weight: '', chassis: '12591', price: 64.5, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '3369BS01', cv: 20, weight: '15 tonnes', chassis: '68599', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '3505AW01', cv: 10, weight: '', chassis: '68601', price: 58.7, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '3369BS01', cv: 20, weight: '15 tonnes', chassis: '68603', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '3732BG01', cv: 12, weight: '', chassis: '19592', price: 64.5, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '0992BT01', cv: 10, weight: '', chassis: '68605', price: 58.7, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '5066BA01', cv: 13, weight: '', chassis: '68606', price: 64.5, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '2724BQ01', cv: 21, weight: '21 tonnes', chassis: '68607', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '4868BF01', cv: 21, weight: '21 tonnes', chassis: '68608', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '0488AG10', cv: 17, weight: '', chassis: '68610', price: 70.3, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '3626BA01', cv: 20, weight: '15 tonnes', chassis: '493', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '3370BS01', cv: 13, weight: '', chassis: '0160', price: 64.5, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '7222BP01', cv: 0, weight: '10 tonnes', chassis: '68613', price: 63.1, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '2918AW01', cv: 13, weight: '', chassis: '68615', price: 64.5, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '0881AS01', cv: 10, weight: '', chassis: '68618', price: 58.7, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '3284BS01', cv: 8, weight: '', chassis: '68619', price: 58.7, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '7581BC01', cv: 8, weight: '', chassis: '68621', price: 58.7, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '7580BC01', cv: 8, weight: '', chassis: '68626', price: 58.7, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '8855AT01', cv: 8, weight: '', chassis: '68629', price: 58.7, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '0660BM01', cv: 0, weight: '9 tonnes', chassis: '1798', price: 64.5, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '4872BF01', cv: 21, weight: '21 tonnes', chassis: '68933', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '3425BA01', cv: 18, weight: '15 tonnes', chassis: '907', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '9103BP01', cv: 8, weight: '', chassis: '68637', price: 58.7, category: 'Véhicule touristique' as VehicleCategory },
    { plate: '6745AY01', cv: 0, weight: '13 tonnes', chassis: '00136', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '7026AJ10', cv: 30, weight: '30 tonnes', chassis: '68647', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '0790BN01', cv: 21, weight: '21 tonnes', chassis: '82062', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
    { plate: '1750AR01', cv: 0, weight: '15 tonnes', chassis: '68649', price: 68.2, category: 'utilitaire_heavy' as VehicleCategory },
];

async function runBulkRegistration() {
    console.log(`Starting bulk registration for ${COMPANY_INFO.name} (${VEHICLES_DATA.length} vehicles)`);

    const EXCHANGE_RATE = 2355;
    const baseSequence = getSecureSequence(); // Generate 1 base sequence
    let currentSequence = baseSequence;
    const dateIso = getNowOrBusinessHours();

    let successCount = 0;

    for (const vehicle of VEHICLES_DATA) {
        const id = generateDeclarationId(currentSequence);
        const noteId = generateNoteId(currentSequence);

        const currentAmountFC = vehicle.price * EXCHANGE_RATE;

        const newDeclaration: Declaration = {
            id,
            createdAt: dateIso,
            updatedAt: dateIso,
            status: 'Payée',
            vehicle: {
                category: vehicle.category,
                type: 'N/A',
                plate: vehicle.plate,
                chassis: vehicle.chassis,
                fiscalPower: vehicle.cv > 0 ? `${vehicle.cv} CV` : '',
                weight: vehicle.weight,
                marque: '',
                modele: '',
                genre: 'N/A',
            },
            tax: {
                baseRate: vehicle.price,
                currency: 'USD',
                totalAmountFC: currentAmountFC,
            },
            meta: {
                systemId: id,
                reference: noteId.replace('NDP - 2026-', ''),
                ndpId: noteId,
                manualTaxpayer: {
                    name: COMPANY_INFO.name,
                    nif: COMPANY_INFO.nif,
                    address: COMPANY_INFO.address,
                    type: 'N/A',
                }
            }
        } as any;

        const { error } = await supabase
            .from('declarations')
            .insert([{
                id: newDeclaration.id,
                createdAt: newDeclaration.createdAt,
                updatedAt: newDeclaration.updatedAt,
                status: newDeclaration.status,
                vehicle: newDeclaration.vehicle,
                tax: newDeclaration.tax,
                meta: newDeclaration.meta
            }]);

        if (error) {
            console.error(`Failed to insert ${vehicle.plate}:`, error);
        } else {
            successCount++;
            console.log(`Successfully registered: ${vehicle.plate} (Decl: ${id}, NDP: ${noteId})`);
        }

        currentSequence++; // Increment sequence to ensure bordereaux follow in order

        // Small delay to prevent rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`Bulk registration complete. Successfully inserted ${successCount}/${VEHICLES_DATA.length} vehicles.`);
}

runBulkRegistration();
