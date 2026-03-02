'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileArchive, Loader2, CheckCircle2 } from 'lucide-react';
import { Declaration } from '@/types';
import JSZip from 'jszip';
import { getElementAsPDFBlob } from '@/lib/pdf-utils';
import { createPortal } from 'react-dom';

// Simple Receipt Skeleton for background rendering
import { NoteDePerception } from '@/types';
import { generateNote } from '@/lib/generator';

// This is a minimal version of ReceiptView designed for PDF capture
const HiddenReceiptRenderer = ({ decl }: { decl: Declaration }) => {
    const note = generateNote(decl);
    if (decl.meta?.manualTaxpayer) {
        note.taxpayer = (decl.meta as any).manualTaxpayer;
    }

    // We'll use a very basic structure or even better, if possible, 
    // we should use the actual component but it's complex for the demo.
    // For now I'll just put a simple representation.
    return (
        <div id={`hidden-receipt-${decl.id}`} style={{ width: '210mm', padding: '20mm', background: 'white', color: 'black' }}>
            <h1 style={{ textAlign: 'center' }}>RÉCÉPISSÉ - {decl.id}</h1>
            <p><strong>Contribuable:</strong> {note.taxpayer.name}</p>
            <p><strong>NIF:</strong> {note.taxpayer.nif}</p>
            <p><strong>Plaque:</strong> {decl.vehicle.plate}</p>
            <p><strong>Châssis:</strong> {decl.vehicle.chassis}</p>
            <p><strong>Montant:</strong> {decl.tax.totalAmountFC.toLocaleString()} FC</p>
            <p><strong>Status:</strong> {decl.status}</p>
            <hr />
            <p style={{ fontSize: '10px' }}>Généré le: {new Date(decl.createdAt).toLocaleString()}</p>
        </div>
    );
};

export default function BulkDownloadButton({ declarations, companyName }: { declarations: Declaration[], companyName: string }) {
    const [status, setStatus] = useState<'idle' | 'preparing' | 'generating' | 'done'>('idle');
    const [progress, setProgress] = useState(0);
    const [currentDecl, setCurrentDecl] = useState<Declaration | null>(null);

    const handleDownloadZip = async () => {
        if (status !== 'idle') return;

        setStatus('preparing');
        setProgress(0);

        const zip = new JSZip();
        const folder = zip.folder(`Dossier_${companyName.replace(/\s+/g, '_')}`);

        for (let i = 0; i < declarations.length; i++) {
            const decl = declarations[i];
            setCurrentDecl(decl);
            setStatus('generating');
            setProgress(Math.round(((i + 1) / declarations.length) * 100));

            // Wait for DOM to render if necessary
            await new Promise(resolve => setTimeout(resolve, 500));

            const blob = await getElementAsPDFBlob(`hidden-receipt-${decl.id}`);
            if (blob && folder) {
                folder.file(`recepisse_${decl.vehicle.plate}.pdf`, blob);
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BRA-PORTAL-DOSSIER-${companyName.toUpperCase()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setStatus('done');
        setTimeout(() => setStatus('idle'), 3000);
    };

    return (
        <>
            <button
                onClick={handleDownloadZip}
                disabled={status !== 'idle'}
                className={`flex-1 ${status === 'done' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-800 hover:bg-black text-white'} py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-sm border`}
            >
                {status === 'idle' && (
                    <>
                        <FileArchive className="h-5 w-5" />
                        Télécharger Dossier Complet (ZIP)
                    </>
                )}
                {(status === 'preparing' || status === 'generating') && (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Génération... {progress}%
                    </>
                )}
                {status === 'done' && (
                    <>
                        <CheckCircle2 className="h-5 w-5" />
                        Prêt !
                    </>
                )}
            </button>

            {/* Hidden Rendering Area for PDF generation */}
            {currentDecl && createPortal(
                <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', pointerEvents: 'none' }}>
                    <HiddenReceiptRenderer decl={currentDecl} />
                </div>,
                document.body
            )}
        </>
    );
}
