'use client';

export const dynamic = 'force-dynamic';

import { use, useState, useEffect } from 'react';
import { getDeclarationById } from '@/lib/store';
import { generateDeclaration, generateNote, DECL_BASE } from '@/lib/generator';
import QRCode from 'react-qr-code';

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    // 1. Initial State (Algorithmic / Server Safe)
    const [note, setNote] = useState(() => {
        const idParts = id.split('-');
        const sequencePart = idParts[idParts.length - 1];
        const fullIdValue = parseInt(sequencePart, 16);

        let sequence = 0;
        if (!isNaN(fullIdValue)) {
            sequence = fullIdValue - DECL_BASE;
        }
        if (sequence < 0) sequence = 1;

        const decl = generateDeclaration(sequence);
        return generateNote(decl);
    });

    // 2. Client Side Override (Manual Store - Async)
    useEffect(() => {
        let isMounted = true;
        async function fetchManualData() {
            try {
                // The ID passed is Declaration ID
                const manualDecl = await getDeclarationById(id);
                if (isMounted && manualDecl) {
                    const manualNote = generateNote(manualDecl);
                    if ((manualDecl.meta as any).manualTaxpayer) {
                        manualNote.taxpayer = (manualDecl.meta as any).manualTaxpayer;
                    }
                    setNote(manualNote);
                }
            } catch (e) {
                console.error("Failed to verify manual data", e);
            }
        }
        fetchManualData();
        return () => { isMounted = false; };
    }, [id]);

    // --- HARDCODED DATES AS REQUESTED ---
    const VALID_FROM = "01/01/2024";
    const VALID_TO = "01/01/2025";
    const EXERCISE_YEAR = "2024/2025";

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            {/* VIGNETTE CONTAINER - FIXED ASPECT RATIO CARD */}
            <div className="relative w-full max-w-[340px] aspect-[4/3.8] bg-white rounded-[30px] border-[12px] border-[#1a365d] shadow-2xl overflow-hidden flex flex-col">

                {/* WATERMARK BACKGROUND */}
                <div className="absolute inset-0 flex items-center justify-center z-0 opacity-[0.03] pointer-events-none rotate-[-45deg]">
                    <span className="text-6xl font-bold text-gray-900 whitespace-nowrap">DGRK • TAXE</span>
                </div>

                {/* HEADER */}
                <div className="relative z-10 pt-4 px-4 flex flex-col items-center">
                    {/* LOGOS ROW */}
                    <div className="flex justify-between items-center w-full px-2 mb-1">
                        <div className="w-16">
                            <img src="/logo-dgrk-form.jpg" alt="DGRK" className="h-10 object-contain mx-auto" />
                        </div>
                        <div className="w-16">
                            <span className="font-bold text-[#4a148c] text-xl tracking-tighter">IRMS</span>
                            <span className="block text-[6px] text-[#4a148c] text-center leading-none">DGRK</span>
                        </div>
                    </div>

                    {/* TITLES */}
                    <div className="text-center space-y-0.5 mb-2">
                        <h1 className="text-[#1a365d] font-bold text-[10px] uppercase tracking-wide leading-tight">
                            RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                        </h1>
                        <h2 className="text-[#1a365d] font-bold text-[9px] uppercase tracking-wide leading-tight">
                            VILLE DE KINSHASA — DIRECTION GÉNÉRALE DES RECETTES
                        </h2>
                    </div>

                    {/* BLUE LINE SEPARATOR */}
                    <div className="w-full h-[2px] bg-[#1a365d] mb-3"></div>

                    {/* YEAR PILL */}
                    <div className="bg-[#1a365d] text-white px-8 py-1.5 rounded-full mb-3 shadow-md">
                        <span className="text-xl font-bold tracking-widest">{EXERCISE_YEAR}</span>
                    </div>

                    {/* LICENSE PLATE BOX */}
                    <div className="border-[3px] border-[#1a365d] rounded-xl bg-white px-8 py-1 mb-2 shadow-sm w-4/5 flex justify-center">
                        <span className="text-4xl font-extrabold text-black font-mono tracking-wider truncate">
                            {note.vehicle.plate || '-------'}
                        </span>
                    </div>

                    {/* VEHICLE TECH INFO */}
                    <div className="text-center mb-3">
                        <p className="text-[#1a365d] font-bold text-xs uppercase tracking-wide">
                            {(note.vehicle as any).manualMarqueType || note.vehicle.category || 'Véhicule'}
                        </p>
                        <p className="text-[#1a365d] font-bold text-xs">
                            {note.vehicle.fiscalPower || '0 CV'} • {note.vehicle.weight || '0 T'}
                        </p>
                    </div>
                </div>

                {/* BOTTOM SECTION: QR & META */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-4 w-full">

                    {/* QR CODE - Centered */}
                    <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm mb-2">
                        <QRCode
                            value={`https://tax-portal-two.vercel.app/verify/${id}`}
                            size={90}
                            viewBox={`0 0 256 256`}
                        />
                    </div>

                    {/* FOOTER TEXTS */}
                    <div className="text-center space-y-0.5">
                        <p className="text-[9px] font-bold text-[#1a365d] uppercase tracking-wide">
                            REF: {note.id}
                        </p>
                        <p className="text-[9px] font-bold text-[#1a365d]">
                            Valide du {VALID_FROM} au {VALID_TO}
                        </p>
                    </div>

                    {/* HOLOGRAM ZONE (Simulated) */}
                    <div className="absolute bottom-4 right-4 w-12 h-12 border border-dashed border-gray-300 rounded-lg flex items-center justify-center opacity-50">
                        <span className="text-[6px] text-gray-400 text-center leading-tight">HOLOGRAM<br />ZONE</span>
                    </div>
                </div>
            </div>

            <p className="absolute bottom-4 text-xs text-gray-400 font-medium">
                Scanner Officiel DGRK • v2.4
            </p>
        </div>
    );
}
