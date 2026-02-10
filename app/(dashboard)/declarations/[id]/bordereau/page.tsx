'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDeclarationById } from '@/lib/store';
import { Declaration } from '@/types';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { calculateTax } from '@/lib/tax-rules';
import { generateNote } from '@/lib/generator';

export default function BordereauPage({ params }: { params: { id: string } }) {
    let rawId = params?.id;
    if ((!rawId || rawId === 'undefined') && typeof window !== 'undefined') {
        try {
            const segments = window.location.pathname.split('/');
            const idx = segments.indexOf('declarations');
            if (idx !== -1) rawId = segments[idx + 1];
        } catch (e) { }
    }
    const id = rawId ? decodeURIComponent(rawId) : '';

    const router = useRouter();
    const [decl, setDecl] = useState<Declaration | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Charger les styles d'impression
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/print.css';
        link.media = 'print';
        document.head.appendChild(link);

        return () => {
            // Nettoyage optionnel (parfois mieux de laisser pour éviter le flash)
            // document.head.removeChild(link);
        };
    }, []);

    useEffect(() => {
        if (!id) return;
        getDeclarationById(id).then(d => {
            if (d) setDecl(d);
        });
    }, [id]);

    const handleDownloadPDF = async () => {
        if (isGeneratingPDF) return;
        setIsGeneratingPDF(true);
        try {
            const { downloadElementAsPDF } = await import('@/lib/pdf-utils');
            await downloadElementAsPDF('printable-bordereau', `bordereau-${id}`);
        } catch (error) {
            console.error('PDF error', error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handlePrint = () => {
        // Force le chargement du fond avant d'imprimer
        const bgImg = new Image();
        bgImg.src = '/bordereau-bg.png';
        bgImg.onload = () => {
            window.print();
        };
        // Fallback rapide
        setTimeout(() => window.print(), 1000);
    };

    if (!decl) return <div className="p-10 text-center font-mono text-sm">Chargement...</div>;

    // Calculs pour le bordereau
    const idSuffix = id.split('-').pop() || '';
    const numericPart = idSuffix.replace(/\D/g, '');
    const sequence = parseInt(numericPart, 10) || 0;
    const bordereauNo = 39383 + (sequence % 10000); // Base cohérente avec la démo

    const creationDate = decl.createdAt ? new Date(decl.createdAt) : new Date();
    const dateStr = creationDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const timeStr = creationDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

    // Tax calculation
    const taxInfo = calculateTax(Number(decl.vehicle.fiscalPower) || 0, decl.vehicle.type || '');
    const displayTotal = taxInfo.totalAmount;
    const displayCredit = taxInfo.creditAmount;
    const timbre = taxInfo.timbre;
    const taxes = taxInfo.taxe;

    // --- AUTOMATION: REMETTANT & MOTIF ---
    const { CONGO_NAMES, generateRandomPhone } = require('@/lib/generator');

    // 2. Récupérer l'ID NDP pour le motif
    const note = generateNote(decl);
    const taxpayerRef = note.id;

    // Seed based on sequence for stability
    const facilitatorName = CONGO_NAMES[sequence % CONGO_NAMES.length];
    const facilitatorLastName = CONGO_NAMES[(sequence * 7) % CONGO_NAMES.length];
    const facilitatorPhone = generateRandomPhone(sequence);

    const remettantDisplay = `${facilitatorName} ${facilitatorLastName} / ${facilitatorPhone}`.replace(/\/ $/, '');

    // Motif: Prenom proprietaire + NDP ID
    const ownerFullName = (decl.meta?.manualTaxpayer?.name || 'CLIENT').trim();
    const ownerFirstName = ownerFullName.split(' ')[0].toUpperCase();
    const motifDisplay = `${ownerFirstName} / ${taxpayerRef}`;

    return (
        <div className="min-h-screen bg-gray-100 py-8 font-mono font-normal text-black">
            {/* Toolbar */}
            <div className="no-print max-w-[210mm] mx-auto mb-6 px-4 flex justify-between items-center">
                <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-black bg-white px-4 py-2 rounded shadow-sm text-sm">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPDF}
                        className="bg-white border text-gray-700 hover:bg-gray-50 px-4 py-2 rounded shadow-sm text-sm flex items-center gap-2"
                    >
                        {isGeneratingPDF ? (
                            <span className="animate-spin h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent rounded-full" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        Télécharger PDF
                    </button>
                    <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm text-sm hover:bg-blue-700 flex items-center gap-2">
                        <Printer className="h-4 w-4" /> Imprimer
                    </button>
                </div>
            </div>

            {/* Zone d'impression - ID root pour CSS */}
            <div
                id="printable-root"
                className="mx-auto"
                style={{ width: '210mm', minHeight: '297mm', position: 'relative' }}
            >
                <div
                    id="printable-bordereau"
                    ref={componentRef}
                    className="relative w-full h-full bg-white shadow-xl px-[30px] py-[20px] text-[10pt] font-normal leading-[1.15] box-border"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        fontFamily: '"Courier New", Courier, monospace',
                        position: 'relative'
                    }}
                >
                    {/* Image de fond pour impression */}
                    <img
                        src="/bordereau-bg.png"
                        alt="Fond"
                        className="bg-overlay absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                        style={{ zIndex: 0 }}
                    />

                    {/* Contenu du bordereau */}
                    <div className="content-layer relative z-10">
                        {/* ESPACE POUR LE LOGO */}
                        <div className="h-[120px]"></div>

                        {/* TITRE & NUMERO */}
                        <div className="text-center mb-6">
                            <span className="tracking-[4px]">
                                BORDEREAU DE VERSEMENT DEVISE No
                            </span>
                            <span className="ml-2">{bordereauNo}</span>
                        </div>

                        {/* REF ET DATE */}
                        <div className="flex justify-between mb-4">
                            <div>33000061711-79</div>
                            <div>
                                {dateStr} a {timeStr}
                            </div>
                        </div>

                        {/* BLOC INFO - Format exact */}
                        <div className="space-y-0 mb-4 text-[10pt]">
                            <div className="flex">
                                <span className="w-[100px]">Agence</span>
                                <span className="mr-1">....:</span>
                                <span>00010 AGENCE GOMBE</span>
                            </div>
                            <div className="flex">
                                <span className="w-[100px]">Devise</span>
                                <span className="mr-1">....:</span>
                                <span>USD</span>
                                <span className="ml-4">DOLLAR USA</span>
                            </div>
                            <div className="flex justify-between">
                                <div className="flex">
                                    <span className="w-[100px]">Caisse</span>
                                    <span className="mr-1">....:</span>
                                    <span>140</span>
                                    <span className="ml-4">CAISSE SEC. GOMBE USD - 140</span>
                                </div>
                                <span>VILLE DE KINSHASA</span>
                            </div>
                            <div className="flex justify-between">
                                <div className="flex">
                                    <span className="w-[100px]">Guichetier</span>
                                    <span className="mr-1">..:</span>
                                    <span>VNGOMBA</span>
                                </div>
                                <span>COLONEL EBEYA</span>
                            </div>
                            <div className="flex justify-between">
                                <div className="flex">
                                    <span className="w-[100px]">Gestionnaire</span>
                                    <span className="mr-1">:</span>
                                    <span>DIRECTEUR GENERAL</span>
                                </div>
                                <span>GOMBE</span>
                            </div>
                            <div className="flex justify-end">
                                <span>KINSHASA</span>
                            </div>
                            <div className="flex justify-end">
                                <span>KINSHASA</span>
                            </div>
                        </div>

                        {/* REMETTANT - Format exact aligné (DONNÉES CORRECTES MAINTENUES) */}
                        <div className="mb-4 mt-4 space-y-0">
                            <div className="flex">
                                <span className="w-[160px] flex justify-between">
                                    <span>Nom du remettant</span>
                                    <span className="mr-2">.:</span>
                                </span>
                                <span>{remettantDisplay.toUpperCase()}</span>
                            </div>
                            <div className="ml-[160px]">
                                310 - REP DEM CONGO
                            </div>
                            <div className="flex">
                                <span className="w-[160px] flex justify-between">
                                    <span>Motif</span>
                                    <span className="mr-2">:</span>
                                </span>
                                <span>{motifDisplay.toUpperCase()}</span>
                            </div>
                        </div>

                        {/* MONTANTS */}
                        <div className="mb-4 mt-6">
                            <div className="flex">
                                <span className="w-[180px]">Montant versement :</span>
                                <span className="ml-4">{displayTotal.toFixed(2)} USD</span>
                            </div>
                            <div className="flex">
                                <span className="w-[180px]">Timbre ...........:</span>
                                <span className="ml-4 w-[80px]">{timbre.toFixed(2)} USD</span>
                                <span className="ml-8">Taxe ......:</span>
                                <span className="ml-4">{taxes.toFixed(2)} USD</span>
                            </div>
                            <div className="flex">
                                <span className="w-[180px]">Frais ............:</span>
                                <span className="ml-4">0.00 USD</span>
                            </div>
                        </div>

                        {/* GRILLE DE CALCUL */}
                        <div className="mb-6 mt-6">
                            {/* Headers */}
                            <div className="flex text-[9pt]">
                                <span className="w-[60px]">Valeur</span>
                                <span className="w-[60px] text-center">Nombre</span>
                                <span className="w-[80px] text-right">Montant</span>
                                <span className="w-[80px]"></span>
                                <span className="w-[60px] text-center">Nombre</span>
                                <span className="w-[80px] text-right">Montant</span>
                            </div>
                            <div className="flex text-[9pt] text-gray-600">
                                <span className="w-[60px]"></span>
                                <span className="w-[60px] text-center">recu</span>
                                <span className="w-[80px] text-right">recu</span>
                                <span className="w-[80px]"></span>
                                <span className="w-[60px] text-center">rendu</span>
                                <span className="w-[80px] text-right">rendu</span>
                            </div>

                            <div className="mt-2">
                                {/* Dynamic bill rows */}
                                {taxInfo.billBreakdown.map((row: any, i: number) => (
                                    <div key={i} className="flex text-[9pt]">
                                        <span className="w-[60px]">{row.value.toFixed(2).replace('.', ',')}</span>
                                        <span className="w-[60px] text-center">{row.count}</span>
                                        <span className="w-[80px] text-right">{row.total.toFixed(2)}</span>
                                        <span className="w-[80px]"></span>
                                        <span className="w-[60px] text-center">0</span>
                                        <span className="w-[80px] text-right">0.00</span>
                                    </div>
                                ))}
                            </div>

                            {/* Separators - Tirets réduits (CORRECTION MAINTENUE) */}
                            <div className="flex text-[9pt] mt-2">
                                <span className="w-[60px]"></span>
                                <span className="w-[140px]">------------------</span>
                                <span className="w-[80px]"></span>
                                <span className="w-[140px]">------------------</span>
                            </div>

                            {/* Totals - Ajoutés pour compléter la grille comme demandé dans l'exemple */}
                            <div className="flex text-[9pt]">
                                <span className="w-[60px]">Total recu</span>
                                <span className="w-[60px]"></span>
                                <span className="w-[80px] text-right">{displayTotal.toFixed(2)}</span>
                                <span className="w-[40px]"></span>
                                <span className="w-[40px]">Rendu</span>
                                <span className="w-[60px]"></span>
                                <span className="w-[80px] text-right">0.00</span>
                            </div>
                        </div>

                        {/* FOOTER - MISE EN FORME PHYSIQUE BANQUE (STRICT CONFORMITY) */}
                        <div className="mt-10 font-mono text-[9.5pt] leading-[1.3] text-gray-800">
                            {/* Lignes Crédit & Valeur */}
                            <div className="flex whitespace-pre">
                                <span className="flex-1">Nous portons au credit du compte no 33000061711-79</span>
                                <div className="w-[280px]">
                                    <div className="flex justify-between">
                                        <span>USD :</span>
                                        <span className="mr-8">{displayCredit.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Valeur :</span>
                                        <span className="mr-8">{dateStr}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Montant en lettres */}
                            <div className="mt-1">
                                <span>Soit {taxInfo.textAmount} USD</span>
                            </div>

                            {/* Espace & Tirets */}
                            <div className="mt-4">
                                <span>------------------------------------</span>
                            </div>

                            {/* Matrice de Signatures & Opération */}
                            <div className="mt-1 whitespace-pre">
                                <div className="flex">
                                    <div className="w-[360px]">
                                        <div>      CLIENT       !    GUICHETIER    !</div>
                                        <div>                   !                  !</div>
                                        <div>                   !                  !</div>
                                        <div className="flex items-end">
                                            <span className="flex-1">                   !                  !</span>
                                            <span className="text-[9pt] tracking-[0.1em]">        OPERATION EFFECTUEE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
