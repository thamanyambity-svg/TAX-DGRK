'use client';
// force-redeploy: 2026-03-14T11:00
export const dynamic = 'force-dynamic';
import { Truck, User, FileText, Wallet, Calendar } from 'lucide-react';
import { generateDeclaration, generateNote, DECL_BASE } from '@/lib/generator';
import { use, useState, useEffect } from 'react';
import { getDeclarationById } from '@/lib/store';

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [note, setNote] = useState(() => {
        const idParts = id.split('-');
        const sequencePart = idParts[idParts.length - 1];
        const fullIdValue = parseInt(sequencePart, 16);
        let sequence = 0;
        if (!isNaN(fullIdValue)) sequence = fullIdValue - DECL_BASE;
        if (sequence < 0) sequence = 1;
        const decl = generateDeclaration(sequence);
        return generateNote(decl);
    });
    const [createdAt, setCreatedAt] = useState<string | null>(null);

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
                        setCreatedAt(d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Africa/Kinshasa' })
                            + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kinshasa' }));
                    }
                }
            } catch (e) { console.error(e); }
        }
        fetchManualData();
        return () => { isMounted = false; };
    }, [id]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center p-4 font-sans text-slate-900">
            <div className="w-full max-w-md flex justify-center items-center mb-10 mt-6 px-4">
                <img src="/header-logos.png" alt="DGRK IRMS LOGOS" className="w-full h-auto object-contain" />
            </div>
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.03)] overflow-hidden border border-slate-50 flex flex-col items-center pt-12 pb-10">
                <div className="flex flex-col items-center text-center px-6 mb-8">
                    <div className="mb-6">
                        <div className="w-24 h-24 relative flex items-center justify-center">
                            <img src="/check-success.png" alt="Success" className="w-full h-auto" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-[#1E293B] mb-1">Vérification de Facture</h1>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.15em] opacity-80">Direction Générale des Recettes de Kinshasa</p>
                </div>
                <div className="w-full px-8 flex flex-col items-center mb-10">
                    <h2 className="text-xl font-extrabold text-[#1E293B] mb-2.5 tracking-tight">Facture {note.id}</h2>
                    <span className="bg-[#E7F6EC] text-[#059669] px-6 py-2 rounded-full text-[13px] font-black uppercase tracking-wider shadow-sm">Payé</span>
                </div>
                <div className="w-full px-8 mb-10">
                    <div className="flex items-center gap-2 mb-4 opacity-60">
                        <Truck className="h-4 w-4 text-indigo-600" />
                        <span className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Détails du véhicule</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#FFFFFF] border border-slate-100 rounded-3xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Plaque</span>
                            <span className="text-xl font-black text-[#1E293B] tracking-tighter">{note.vehicle?.plate || '---'}</span>
                        </div>
                        <div className="bg-[#FFFFFF] border border-slate-100 rounded-3xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] overflow-hidden">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Châssis</span>
                            <span className="text-sm font-black text-[#1E293B] truncate block tracking-tight">{note.vehicle?.chassis || '---'}</span>
                        </div>
                    </div>
                </div>
                <div className="w-full px-10 space-y-6 mb-6">
                    <div className="flex items-center gap-5">
                        <User className="h-5 w-5 text-slate-300 flex-shrink-0" />
                        <div className="flex justify-between items-center w-full border-b border-slate-50 pb-4">
                            <span className="text-[12px] font-bold text-slate-400">Contribuable:</span>
                            <span className="text-sm font-black text-slate-800 tracking-tight text-right">{note.taxpayer.name}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <FileText className="h-5 w-5 text-slate-300 flex-shrink-0" />
                        <div className="flex justify-between items-center w-full border-b border-slate-50 pb-4">
                            <span className="text-[12px] font-bold text-slate-400">Type d'impôt:</span>
                            <span className="text-sm font-black text-slate-800 tracking-tight uppercase text-right">VEHICLE</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <Wallet className="h-5 w-5 text-slate-300 flex-shrink-0" />
                        <div className="flex justify-between items-center w-full border-b border-slate-50 pb-4">
                            <span className="text-[12px] font-bold text-slate-400">Montant dû:</span>
                            <span className="text-lg font-black text-slate-900 tracking-tighter text-right">FC {note.payment.totalAmountFC.toLocaleString('fr-FR')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <Calendar className="h-5 w-5 text-slate-300 flex-shrink-0" />
                        <div className="flex justify-between items-center w-full pb-1">
                            <span className="text-[12px] font-bold text-slate-400">Date de création:</span>
                            <span className="text-sm font-black text-slate-800 tracking-tight text-right">{createdAt || '—'}</span>
                        </div>
                    </div>
                </div>
                <div className="w-full px-8 mt-6">
                    <div className="bg-[#F0F7FF] rounded-[2.5rem] p-8 border border-blue-50/50">
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[#1E40AF] font-black text-[15px] tracking-tight">Authentification Certifiée</h3>
                            <p className="text-blue-600/70 text-[12px] leading-relaxed font-bold">Ce document est authentique et a été émis par la Direction Générale des Recettes de Kinshasa (DGRK).</p>
                            <div className="mt-4 pt-4 border-t border-blue-100/30">
                                <span className="text-[12px] font-black text-blue-400 uppercase tracking-widest opacity-80">ID: {note.id}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="mt-12 mb-12 flex flex-col items-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] opacity-40">© 2026 DGRK - Système IRMS</p>
            </footer>
        </div>
    );
}
