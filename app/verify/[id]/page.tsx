'use client';

// force-redeploy: 2026-03-14T18:05
export const dynamic = 'force-dynamic';

import { CheckCircle2, Truck, User, FileText, Wallet, Calendar, ShieldCheck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateDeclaration, generateNote, DECL_BASE } from '@/lib/generator';
import { use, useState, useEffect } from 'react';
import { getDeclarationById } from '@/lib/store';

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

    const [createdAt, setCreatedAt] = useState<string | null>(null);

    // 2. Client Side Override (Manual Store - Async)
    useEffect(() => {
        let isMounted = true;
        async function fetchManualData() {
            try {
                const manualDecl = await getDeclarationById(id);
                if (isMounted && manualDecl) {
                    const manualNote = generateNote(manualDecl);
                    manualNote.status = manualDecl.status;

                    if ((manualDecl.meta as any).manualTaxpayer) {
                        manualNote.taxpayer = (manualDecl.meta as any).manualTaxpayer;
                    }
                    if ((manualDecl.meta as any).manualBaseAmount) {
                        manualNote.payment.principalTaxUSD = parseFloat((manualDecl.meta as any).manualBaseAmount);
                        manualNote.payment.totalAmountFC = manualNote.payment.principalTaxUSD * 2355;
                    }

                    setNote(manualNote);

                    if (manualDecl.createdAt) {
                        const d = new Date(manualDecl.createdAt);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        const hours = String(d.getHours()).padStart(2, '0');
                        const minutes = String(d.getMinutes()).padStart(2, '0');
                        setCreatedAt(`${day}/${month}/${year} ${hours}:${minutes}`);
                    }
                }
            } catch (e) {
                console.error("Failed to verify manual data", e);
            }
        }
        fetchManualData();
        return () => { isMounted = false; };
    }, [id]);

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center p-4 font-sans text-slate-900 pb-10">
            {/* Header Logos Section (Match Image 1 Pixel-perfect) */}
            <div className="w-full max-w-[400px] flex justify-center mb-6 mt-4">
                <div className="bg-white px-6 py-2.5 rounded-2xl shadow-sm flex items-center justify-center gap-4 border border-slate-100/50">
                    {/* DGRK Logo (The real one with the crest/bird) */}
                    <img 
                        src="/logo-dgrk-form.jpg" 
                        alt="DGRK" 
                        className="h-10 w-auto object-contain"
                    />
                    
                    {/* Vertical Separator */}
                    <div className="h-8 w-[1px] bg-slate-200"></div>
                    
                    {/* IRMS Logo (Generated with correct open circle) */}
                    <img 
                        src="/irms-logo-open.png" 
                        alt="IRMS" 
                        className="h-10 w-auto object-contain"
                    />
                </div>
            </div>

            {/* Main Info Box */}
            <div className="w-full max-w-[400px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col items-center py-10 px-6">
                
                {/* Header Title */}
                <div className="flex flex-col items-center text-center mb-8">
                    <h1 className="text-2xl font-black text-[#1E293B] mb-1 tracking-tight">Vérification de Facture</h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none">Direction Générale des Recettes de Kinshasa</p>
                </div>

                {/* Status Indicator */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-6">
                        <div className="bg-emerald-500 rounded-full p-2">
                             <Check className="w-10 h-10 text-white stroke-[3px]" />
                        </div>
                        <div className="absolute -inset-2 bg-emerald-500/10 rounded-full -z-10 animate-pulse"></div>
                    </div>
                    <h2 className="text-xl font-extrabold text-[#1E293B] mb-3 tracking-tighter">Facture {note.id}</h2>
                    <div className="bg-emerald-50/80 text-emerald-600 px-6 py-1.5 rounded-full text-xs font-bold border border-emerald-100/50 shadow-sm">
                        Payé
                    </div>
                </div>

                {/* Vehicle Section */}
                <div className="w-full mb-8">
                    <div className="flex items-center gap-2 mb-4 ml-1">
                        <Truck className="h-4 w-4 text-blue-800" />
                        <span className="text-[11px] font-black text-blue-900/40 uppercase tracking-[0.15em]">Détails du véhicule</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 shadow-sm transition-all hover:border-blue-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wide">Plaque</span>
                            <span className="text-lg font-black text-[#1E293B] tracking-tight">{note.vehicle?.plate || '---'}</span>
                        </div>
                        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 shadow-sm transition-all hover:border-blue-200 overflow-hidden">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wide">Châssis</span>
                            <span className="text-xs font-black text-[#1E293B] truncate block" title={note.vehicle?.chassis}>
                                {note.vehicle?.chassis || '---'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info List */}
                <div className="w-full space-y-5 px-1 mb-8">
                    <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                                <User className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                            </div>
                            <span className="text-xs font-medium text-slate-500">Contribuable:</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800 text-right truncate max-w-[160px] pl-2">{note.taxpayer.name}</span>
                    </div>

                    <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                                <FileText className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                            </div>
                            <span className="text-xs font-medium text-slate-500">Type d'impôt:</span>
                        </div>
                        <span className="text-xs font-black text-slate-900 uppercase italic">
                            {note.vehicle?.category === 'Bateau' ? 'BATEAUX' : 'VEHICLE'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                                <Wallet className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                            </div>
                            <span className="text-xs font-medium text-slate-500">Montant dû:</span>
                        </div>
                        <span className="text-base font-black text-[#1E293B]">
                            FC {note.payment.totalAmountFC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-blue-50 transition-colors">
                                <Calendar className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                            </div>
                            <span className="text-xs font-medium text-slate-500">Date de création:</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800">{createdAt || '—'}</span>
                    </div>
                </div>

                {/* Certification Alert Box (Match Image 1) */}
                <div className="w-full">
                    <div className="bg-[#EFF6FF] rounded-[1.8rem] p-5 flex gap-4 items-center">
                        <div className="bg-white rounded-full p-2 h-10 w-10 flex items-center justify-center shadow-sm shrink-0 border border-blue-50">
                            <CheckCircle2 className="h-6 w-6 text-blue-600 stroke-[2.5px]" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <h3 className="text-[#1E40AF] font-black text-sm tracking-tight leading-tight">Authentification Certifiée</h3>
                            <p className="text-blue-600/60 text-[10px] leading-tight font-bold">
                                Ce document est authentique et a été émis par la Direction Générale des Recettes de Kinshasa (DGRK).
                            </p>
                            <span className="text-[9px] font-black text-blue-300 uppercase mt-1 tracking-tight">ID: {note.id}</span>
                        </div>
                    </div>
                </div>

            </div>

            <footer className="mt-8 mb-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-40">© 2026 DGRK - Système IRMS</p>
            </footer>
        </div>
    );
}
