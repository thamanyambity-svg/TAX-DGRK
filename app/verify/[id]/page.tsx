'use client';
// force-redeploy: 2026-03-14T14:45
export const dynamic = 'force-dynamic';

import { CheckCircle2, Clock, Truck, User, CreditCard, FileText, Wallet, Calendar, ShieldCheck, Check } from 'lucide-react';
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
        <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center p-4 font-sans text-slate-900 pb-20">
            {/* Top Logos Bar */}
            <div className="w-full max-w-sm flex justify-center items-center mb-6 mt-4">
                <img src="/header-logos.png" alt="DGRK IRMS" className="w-full h-auto" />
            </div>

            <div className="w-full max-w-[380px] bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col items-center py-8">
                
                {/* Header Section */}
                <div className="flex flex-col items-center text-center px-6 mb-4">
                    <h1 className="text-xl font-bold text-[#1E293B] mb-1">Vérification de Facture</h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Direction Générale des Recettes de Kinshasa</p>
                </div>

                <div className="mb-6">
                    <img src="/check-success.png" alt="Success" className="w-20 h-20" />
                </div>

                <div className="w-full px-8 flex flex-col items-center mb-6">
                    <h2 className="text-lg font-bold text-[#1E293B] mb-2 tracking-tight">Facture {note.id}</h2>
                    <span className="bg-[#ECFDF5] text-[#10B981] px-4 py-1 rounded-full text-[12px] font-bold shadow-sm">
                        Payé
                    </span>
                </div>

                {/* Details Card */}
                <div className="w-full px-6 mb-6">
                    <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Truck className="h-4 w-4 text-blue-600" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Détails du véhicule</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                                <span className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Plaque</span>
                                <span className="text-base font-bold text-[#1E293B]">{note.vehicle?.plate || '---'}</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm overflow-hidden">
                                <span className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Châssis</span>
                                <span className="text-[11px] font-bold text-[#1E293B] truncate block" title={note.vehicle?.chassis}>
                                    {note.vehicle?.chassis || '---'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info List */}
                <div className="w-full px-6 space-y-4 mb-6">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-slate-300" />
                            <span className="text-[11px] font-medium text-slate-500">Contribuable:</span>
                        </div>
                        <span className="text-[12px] font-bold text-slate-800 text-right max-w-[180px] truncate">{note.taxpayer.name}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-slate-300" />
                            <span className="text-[11px] font-medium text-slate-500">Type d'impôt:</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 uppercase">VEHICLE</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <Wallet className="h-4 w-4 text-slate-300" />
                            <span className="text-[11px] font-medium text-slate-500">Montant dû:</span>
                        </div>
                        <span className="text-[13px] font-bold text-slate-900">
                            FC {note.payment.totalAmountFC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-slate-300" />
                            <span className="text-[11px] font-medium text-slate-500">Date de création:</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-800">{createdAt || '—'}</span>
                    </div>
                </div>

                {/* Certification */}
                <div className="w-full px-6">
                    <div className="bg-[#EFF6FF] rounded-2xl p-4 border border-blue-100 flex gap-3">
                        <ShieldCheck className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1">
                            <h3 className="text-blue-900 font-bold text-[13px]">Authentification Certifiée</h3>
                            <p className="text-blue-600/80 text-[10px] leading-tight font-medium">
                                Ce document est authentique et a été émis par la Direction Générale des Recettes de Kinshasa (DGRK).
                            </p>
                            <span className="text-[10px] font-bold text-blue-400 uppercase mt-1">ID: {note.id}</span>
                        </div>
                    </div>
                </div>

            </div>

            <footer className="mt-8 flex flex-col items-center">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">© 2026 DGRK - Système IRMS</p>
            </footer>
        </div>
    );
}
