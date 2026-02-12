'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getDeclarationById } from '@/lib/store';
import { Declaration } from '@/types';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { calculateTax } from '@/lib/tax-rules';
import { generateNote } from '@/lib/generator';

export default function BordereauPage() {
    const params = useParams();
    // Robust ID retrieval with fallback
    let rawId = params?.id as string;

    // EMERGENCY FALLBACK: If params.id is missing or 'undefined', parse from URL
    if ((!rawId || rawId === 'undefined' || rawId === '[id]') && typeof window !== 'undefined') {
        try {
            const segments = window.location.pathname.split('/');
            const idx = segments.indexOf('declarations');
            if (idx !== -1 && segments[idx + 1]) {
                const recoveredId = segments[idx + 1];
                if (recoveredId && recoveredId !== '[id]') {
                    rawId = recoveredId;
                    console.warn("⚠️ Params missing. ID recovered from window.location:", rawId);
                }
            }
        } catch (e) { }
    }
    const id = rawId && rawId !== 'undefined' ? decodeURIComponent(rawId).trim() : '';

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

    // Calculs pour le bordereau - Correction HEX
    const { DECL_BASE } = require('@/lib/generator');
    const idSuffix = id.split('-').pop() || '';
    const declarationVal = parseInt(idSuffix, 16);
    const sequence = !isNaN(declarationVal) ? declarationVal - DECL_BASE : 0;
    const bordereauNo = 39383 + (Math.abs(sequence) % 100000); // Plage plus large pour éviter les doublons bordereau

    const creationDate = decl.createdAt ? new Date(decl.createdAt) : new Date();

    // --- 48H DIFFERENCE LOGIC ---
    const { getPaymentDate } = require('@/lib/business-calendar');
    // Use manual override if available in meta, otherwise calculate standard 48h
    const paymentDateStr = (decl.meta as any)?.manualPaymentDate || getPaymentDate(decl.createdAt);
    const paymentDate = new Date(paymentDateStr);

    const dateStr = paymentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const timeStr = paymentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

    // Tax calculation
    let displayTotal = 0;
    let displayCredit = 0;
    let timbre = 3.45;
    let taxes = 0.00; // Updated: Total bank fee is 3.45 as per user request
    let taxInfo: any = {}; // Initialize empty

    // FIX: Check for manual base amount override first
    if ((decl.meta as any)?.manualBaseAmount) {
        // User manually set the "Base Price" (Credit)
        const rawBase = parseFloat((decl.meta as any).manualBaseAmount);

        // Custom Rounding Rule: Bank always rounds UP to nearest integer
        // Examples: 58.70 -> 59, 64.50 -> 65, 68.20 -> 69
        displayCredit = rawBase; // Use exact value from receipt for summation

        // Bank Fee Logic: Always Credit + 3.45$ (as per latest request)
        displayTotal = displayCredit + 3.45;

        // Mock taxInfo for manual override to prevent crashes
        taxInfo = {
            textAmount: `${Math.floor(displayTotal)}`, // Simplified text representation, integer usually
            billBreakdown: [
                { value: displayTotal, count: 1, total: displayTotal }
            ]
        };
    } else {
        // Standard Auto-Calculation
        taxInfo = calculateTax(
            Number(decl.vehicle.fiscalPower) || 0,
            decl.vehicle.category,
            decl.vehicle.weight
        );
        displayTotal = taxInfo.totalAmount;
        displayCredit = taxInfo.creditAmount;
        timbre = taxInfo.timbre;
        taxes = taxInfo.taxe;
    }

    // --- AUTOMATION: REMETTANT & MOTIF ---
    const { CONGO_NAMES, generateRandomPhone } = require('@/lib/generator');

    // 2. Récupérer l'ID NDP pour le motif
    const note = generateNote(decl);
    const taxpayerRef = note.id;

    // Seed based on sequence for stability (use absolute value to avoid negative modulo issues)
    const safeSequence = Math.abs(sequence);
    const facilitatorName = CONGO_NAMES[safeSequence % CONGO_NAMES.length] || 'MUKENDI';

    // Ensure last name is different from first name
    let lastNameIndex = (safeSequence * 7) % CONGO_NAMES.length;
    if (CONGO_NAMES[lastNameIndex] === facilitatorName) {
        lastNameIndex = (lastNameIndex + 1) % CONGO_NAMES.length;
    }
    const facilitatorLastName = CONGO_NAMES[lastNameIndex] || 'TSHIMANGA';

    const facilitatorPhone = generateRandomPhone(safeSequence);

    const remettantDisplay = `${facilitatorName} ${facilitatorLastName} / ${facilitatorPhone}`.replace(/\/ $/, '');
    // --- ADMINISTRATIVE MODIFICATION (POUR TOUS) ---
    // User requested format for Bordereau: NAME /1579A471 (ID Suffix)
    const ownerFullName = (note.taxpayer.name || 'CLIENT').trim().toUpperCase();
    const noteSuffix = note.id.split('-').pop() || '';
    const motifDisplay = `${ownerFullName} /${noteSuffix}`;

    return (
        <div className="min-h-screen bg-gray-100 py-8 text-black">
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
                    className="relative w-full h-full bg-white shadow-xl px-[30px] py-[20px] text-[10pt] leading-[1.2] box-border"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        fontFamily: '"Courier New", Courier, monospace',
                        fontWeight: 400,
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
                    <div className="content-layer relative z-10 text-gray-800" style={{ fontFamily: '"Courier New", Courier, monospace', fontWeight: 400 }}>
                        {/* ESPACE POUR LE LOGO */}
                        <div className="h-[120px]"></div>

                        {/* TITRE & NUMERO - ALIGNEMENT CENTRE */}
                        <div className="text-center mb-4 whitespace-pre">
                            <span>BORDEREAU DE VERSEMENT DEVISE No  {bordereauNo}</span>
                        </div>

                        {/* REF ET DATE - ALIGNEMENT GRID */}
                        <div className="whitespace-pre mb-8 pl-10">
                            <span>33000061711-79                                     {dateStr} a {timeStr}</span>
                        </div>

                        {/* BLOC INFO - FORMAT TERMINAL BANCAIRE AVEC TRIANGLE ROUGE (RECALIBRÉ) */}
                        <div className="relative mb-6 text-[10pt] leading-[1.3] whitespace-pre">
                            <div className="flex">
                                <div className="w-[500px]">Agence      ....: 00010 AGENCE GOMBE</div>
                                <div></div>
                            </div>
                            <div className="flex">
                                <div className="w-[500px]">Devise      ....: USD   DOLLAR USA</div>
                                <div>VILLE DE KINSHASA</div>
                            </div>
                            <div className="flex">
                                <div className="w-[500px]">Caisse      ....: 140   CAISSE SEC. GOMBE USD - 140</div>
                                <div>COLONEL EBEYA</div>
                            </div>
                            <div className="flex">
                                <div className="w-[500px]">Guichetier  ..: VNGOMBA</div>
                                <div>     GOMBE</div>
                            </div>
                            <div className="flex">
                                <div className="w-[500px]">Gestionnaire  : DIRECTEUR GENERAL</div>
                                <div>KINSHASA</div>
                            </div>
                            <div className="flex">
                                <div className="w-[500px]"></div>
                                <div>KINSHASA</div>
                            </div>

                            {/* Symbole rouge banque (reproduction exacte image 834) */}
                            <div className="absolute right-[20px] bottom-[20px]">
                                <svg width="35" height="35" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path
                                        d="M100,0 L100,100 L0,85 C40,75 70,45 100,0 Z"
                                        fill="#C40000"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* REMETTANT & MOTIF - POINTS ALIGNÉS */}
                        <div className="mb-6 mt-8 whitespace-pre text-[10pt]">
                            <div>Nom du remettant ..: {remettantDisplay.toUpperCase()}</div>
                            <div className="ml-[185px]">310 - REP DEM CONGO</div>
                            <div className="mt-1">Motif             : {motifDisplay.toUpperCase()}</div>
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

                        {/* FOOTER - ALIGNEMENT CARACTÈRE PAR CARACTÈRE (GRID) */}
                        <div className="mt-10 text-[10pt] leading-[1.4] text-gray-800" style={{ fontFamily: '"Courier New", Courier, monospace', fontWeight: 400 }}>
                            {/* Ligne Crédit & USD - Alignement millimétré des deux-points */}
                            <div className="whitespace-pre">
                                <span className="inline-block">Nous portons au credit du compte no 33000061711-79   USD :</span>
                                <span className="inline-block w-[140px] text-right">{displayCredit.toFixed(2)}</span>
                            </div>

                            {/* Ligne Valeur - Alignement parfait (50 espaces + Valeur :) */}
                            <div className="whitespace-pre">
                                <span className="inline-block">                                                  Valeur :</span>
                                <span className="inline-block w-[140px] text-right">{dateStr}</span>
                            </div>

                            {/* Montant en lettres */}
                            <div className="mt-2 text-gray-800">
                                <span>Soit {taxInfo.textAmount} USD</span>
                            </div>

                            {/* Matrice de signatures ultra-calibrée avec mention intégrée */}
                            <div className="mt-1 whitespace-pre leading-[1.3] text-gray-800">
                                <div>------------------------------------</div>
                                <div>      CLIENT       !    GUICHETIER    !</div>
                                <div>                   !                  !</div>
                                <div>                   !                  !</div>
                                <div>                   !                  !  OPERATION EFFECTUEE</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
