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

                            {/* Triangle rouge décoratif (conforme image 782) */}
                            <div
                                className="absolute right-[30px] bottom-[15px]"
                                style={{
                                    width: 0,
                                    height: 0,
                                    borderTop: '18px solid transparent',
                                    borderBottom: '18px solid transparent',
                                    borderLeft: '28px solid #C40000', // Rouge banque profond
                                }}
                            ></div>
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
                            {/* Ligne Crédit & USD - Alignées sur une grille de 80 chars */}
                            <div className="whitespace-pre">
                                <span className="inline-block">Nous portons au credit du compte no 33000061711-79   USD :</span>
                                <span className="inline-block w-[140px] text-right">{displayCredit.toFixed(2)}</span>
                            </div>

                            {/* Ligne Valeur - Alignée exactement sous USD : */}
                            <div className="whitespace-pre">
                                <span className="inline-block">                                                    Valeur :</span>
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
