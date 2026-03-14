'use client';
// force-redeploy: 2026-03-02T21:30
export const dynamic = 'force-dynamic';

import { CheckCircle2, Clock, Truck, User, CreditCard, FileText, Wallet, Calendar, ShieldCheck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateDeclaration, generateNote, DECL_BASE } from '@/lib/generator';
import { use, useState, useEffect } from 'react';
import { getDeclarationById } from '@/lib/store';
import Image from 'next/image';

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
    const [dueDate, setDueDate] = useState<string | null>(null);

    // 2. Client Side Override (Manual Store - Async)
    useEffect(() => {
        let isMounted = true;
        async function fetchManualData() {
            try {
                const manualDecl = await getDeclarationById(id);
                if (isMounted && manualDecl) {
                    const manualNote = generateNote(manualDecl);
                    // Force the actual status from the declaration
                    manualNote.status = manualDecl.status;

                    if ((manualDecl.meta as any).manualTaxpayer) {
                        manualNote.taxpayer = (manualDecl.meta as any).manualTaxpayer;
                    }
                    setNote(manualNote);

                    // Set real dates from declaration
                    if (manualDecl.createdAt) {
                        const d = new Date(manualDecl.createdAt);
                        setCreatedAt(d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Africa/Kinshasa' })
                            + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kinshasa' }));
                    }
                }
            } catch (e) {
                console.error("Failed to verify manual data", e);
            }
        }
        fetchManualData();
        return () => { isMounted = false; };
    }, [id]);

    const status = note.status || 'Attente de paiement';
    const isPayee = status === 'Payé' || status === 'Payée';

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-4 font-sans text-slate-900">
            {/* Top Logos Bar */}
            <div className="w-full max-w-md flex justify-around items-center mb-8 mt-4 bg-white/50 py-3 rounded-2xl border border-white">
                <div className="h-10 w-24 relative opacity-80 grayscale hover:grayscale-0 transition-all">
                    <img src="/dgrk-logo.jpg" alt="DGRK" className="h-full object-contain" />
                </div>
                <div className="h-0.5 w-8 bg-slate-200 rotate-90"></div>
                <div className="flex items-center gap-1.5 opacity-90">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-[10px]">IRMS</span>
                    </div>
                    <span className="text-xs font-bold tracking-tight text-slate-700">IRMS</span>
                </div>
            </div>

            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-100 flex flex-col items-center pt-10 pb-10">
                
                {/* Header Section */}
                <div className="flex flex-col items-center text-center px-6 mb-8">
                    <div className="mb-4 relative">
                        <div className="absolute inset-0 bg-green-500/10 blur-xl rounded-full"></div>
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-[#F0FAF5] relative">
                            <Check className="h-10 w-10 text-[#22C55E]" strokeWidth={3} />
                        </div>
                    </div>
                    <h1 className="text-xl font-extrabold text-[#1E293B] mb-1">Vérification de Facture</h1>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Direction Générale des Recettes de Kinshasa</p>
                </div>

                <div className="w-full px-8 flex flex-col items-center mb-8">
                    <h2 className="text-lg font-bold text-[#1E293B] mb-2">Facture {note.id}</h2>
                    <span className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold",
                        isPayee
                            ? "bg-[#F0FAF5] text-[#22C55E]"
                            : "bg-[#FFF9EA] text-[#F59E0B]"
                    )}>
                        {isPayee ? 'Payé' : status}
                    </span>
                </div>

                {/* Vehicle Details Cards */}
                <div className="w-full px-8 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Truck className="h-4 w-4 text-indigo-600" />
                        <span className="text-[11px] font-bold text-indigo-900/60 uppercase tracking-widest">Détails du véhicule</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#FFFFFF] border border-slate-100 rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter mb-1 block">Plaque</span>
                            <span className="text-lg font-black text-[#1E293B] tracking-tight">{note.vehicle?.plate || '---'}</span>
                        </div>
                        <div className="bg-[#FFFFFF] border border-slate-100 rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter mb-1 block">Châssis</span>
                            <span className="text-sm font-bold text-[#1E293B] truncate block" title={note.vehicle?.chassis}>
                                {note.vehicle?.chassis ? note.vehicle.chassis.slice(-10) : '---'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* List Items */}
                <div className="w-full px-8 space-y-4 mb-2">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex flex-col flex-1 border-b border-slate-50 pb-3">
                            <span className="text-[11px] font-bold text-slate-400 mb-0.5">Contribuable:</span>
                            <span className="text-sm font-bold text-slate-700 leading-tight capitalize">{note.taxpayer.name}</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileText className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex flex-col flex-1 border-b border-slate-50 pb-3">
                            <span className="text-[11px] font-bold text-slate-400 mb-0.5">Type d'impôt:</span>
                            <span className="text-sm font-bold text-slate-700 leading-tight uppercase">VEHICLE</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Wallet className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex flex-col flex-1 border-b border-slate-50 pb-3">
                            <span className="text-[11px] font-bold text-slate-400 mb-0.5">Montant dû:</span>
                            <span className="text-base font-black text-slate-800 tracking-tight">
                                FC {note.payment.totalAmountFC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Calendar className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex flex-col flex-1 pb-3">
                            <span className="text-[11px] font-bold text-slate-400 mb-0.5">Date de création:</span>
                            <span className="text-sm font-bold text-slate-700 leading-tight">{createdAt || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Certification Badge Section */}
                <div className="w-full px-6 mt-6">
                    <div className="bg-[#F0F7FF] rounded-[1.5rem] p-5 relative overflow-hidden group border border-blue-50">
                        <div className="absolute top-[-20px] right-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-700">
                             <ShieldCheck className="h-32 w-32 text-blue-900" />
                        </div>
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-blue-900 font-extrabold text-sm mb-1">Authentification Certifiée</h3>
                                <p className="text-blue-700/70 text-[10px] leading-relaxed font-semibold">
                                    Ce document est authentique et a été émis par la Direction Générale des Recettes de Kinshasa (DGRK).
                                </p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-tighter">ID: {note.id}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <footer className="mt-10 mb-8 flex flex-col items-center">
                 <p className="text-[11px] font-bold text-slate-400/60 uppercase tracking-widest">© 2026 DGRK - Système IRMS</p>
                 <div className="h-1 w-12 bg-slate-200 mt-4 rounded-full"></div>
            </footer>
        </div>
    );
}
