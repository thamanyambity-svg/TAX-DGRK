'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ScanLine, Loader2, CheckCircle2, AlertTriangle, RotateCcw, Save } from 'lucide-react';
import { resizeImageToBase64 } from '@/lib/image-resize';
import { proposerPrixBase, parseCv, montantFC } from '@/lib/scan-pricing';
import { saveDeclaration } from '@/lib/store';
import { generateDeclarationId, generateNoteId, getSecureSequence } from '@/lib/generator';
import { Declaration } from '@/types';
import { DonneesVehicule, ResultatExtraction } from '@/lib/scan-types';

type Mode = 'page' | 'carte';
type Statut = 'idle' | 'extracting' | 'review' | 'saving' | 'saved' | 'error';

const CHAMPS_VIDES: DonneesVehicule = {
    nom: '', nif: '', adresse: '', plaque: '', chassis: '',
    marque_type: '', cv: '', usage: '', genre: '', annee: '', couleur: '', poids: '',
};

export default function ScanPage() {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>('carte');
    const [filePage, setFilePage] = useState<File | null>(null);
    const [fileRecto, setFileRecto] = useState<File | null>(null);
    const [fileVerso, setFileVerso] = useState<File | null>(null);

    const [statut, setStatut] = useState<Statut>('idle');
    const [erreur, setErreur] = useState<string>('');
    const [donnees, setDonnees] = useState<DonneesVehicule>(CHAMPS_VIDES);
    const [aVerifier, setAVerifier] = useState<string[]>([]);
    const [qualite, setQualite] = useState<ResultatExtraction['qualite_photo']>('bonne');
    const [prixBase, setPrixBase] = useState<number>(64.50);
    const [savedId, setSavedId] = useState<string>('');

    const previews = useMemo(() => ({
        page: filePage ? URL.createObjectURL(filePage) : '',
        recto: fileRecto ? URL.createObjectURL(fileRecto) : '',
        verso: fileVerso ? URL.createObjectURL(fileVerso) : '',
    }), [filePage, fileRecto, fileVerso]);

    // Libère les blob URLs quand les fichiers changent ou au démontage (évite la fuite mémoire)
    useEffect(() => {
        return () => {
            Object.values(previews).forEach((u) => { if (u) URL.revokeObjectURL(u); });
        };
    }, [previews]);

    const setField = (k: keyof DonneesVehicule, v: string) => {
        const next = { ...donnees, [k]: v };
        setDonnees(next);
        if (k === 'usage' || k === 'cv') {
            setPrixBase(proposerPrixBase(next.usage, parseCv(next.cv)));
        }
    };

    const handleExtract = async () => {
        setErreur('');
        const files: File[] = mode === 'page'
            ? (filePage ? [filePage] : [])
            : [fileRecto, fileVerso].filter(Boolean) as File[];

        if (mode === 'page' && !filePage) { setErreur('Ajoute la photo du document (Zone 1).'); return; }
        if (mode === 'carte' && (!fileRecto || !fileVerso)) { setErreur('Ajoute le recto ET le verso de la carte.'); return; }

        setStatut('extracting');
        try {
            const images = await Promise.all(files.map((f) => resizeImageToBase64(f)));
            const res = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images, typeDoc: mode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Échec de l\'extraction');

            const r = data as ResultatExtraction;
            setDonnees(r.donnees);
            setAVerifier(r.champs_a_verifier || []);
            setQualite(r.qualite_photo || 'bonne');
            setPrixBase(proposerPrixBase(r.donnees.usage, parseCv(r.donnees.cv)));
            setStatut('review');
        } catch (e) {
            setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
            setStatut('error');
        }
    };

    const handleValidate = async () => {
        if (!donnees.plaque.trim()) { setErreur('La plaque est obligatoire.'); return; }
        setErreur('');
        setStatut('saving');
        try {
            const sequence = getSecureSequence();
            const id = generateDeclarationId(sequence);
            const noteId = generateNoteId(sequence);
            const now = new Date().toISOString();
            const totalFC = montantFC(prixBase);

            const nom = (donnees.nom || 'INCONNU').toUpperCase();
            const nif = (donnees.nif || 'N/A').toUpperCase();
            const adresse = (donnees.adresse || 'KINSHASA').toUpperCase();

            const newDecl: Declaration = {
                id,
                status: 'Payée',
                createdAt: now,
                updatedAt: now,
                taxpayer: { name: nom, nif, address: adresse, type: 'N/A' },
                vehicle: {
                    plate: donnees.plaque.toUpperCase(),
                    chassis: donnees.chassis.toUpperCase(),
                    marque: donnees.marque_type.toUpperCase(),
                    modele: '',
                    fiscalPower: `${parseCv(donnees.cv)} CV`,
                    category: 'Vignette Automobile',
                    genre: 'N/A',
                    couleur: donnees.couleur || '',
                    annee: donnees.annee || '',
                    weight: donnees.poids || '-',
                    type: 'N/A',
                } as Declaration['vehicle'],
                tax: { baseRate: prixBase, currency: 'USD', totalAmountFC: totalFC },
                meta: {
                    systemId: id,
                    reference: noteId.replace('NDP - 2026-', ''),
                    ndpId: noteId,
                    manualBaseAmount: prixBase,
                    manualTaxpayer: { name: nom, nif, address: adresse },
                    manualPlate: donnees.plaque.toUpperCase(),
                    manualNIF: nif,
                    manualTaxpayerName: nom,
                    manualTaxpayerAddress: adresse,
                    source: 'scan',
                },
            };

            const result = await saveDeclaration(newDecl);
            if (!result.success) throw new Error(result.error || 'Échec de l\'enregistrement');
            setSavedId(id);
            setStatut('saved');
        } catch (e) {
            setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
            setStatut('error');
        }
    };

    const handleReset = () => {
        setFilePage(null); setFileRecto(null); setFileVerso(null);
        setDonnees(CHAMPS_VIDES); setAVerifier([]); setQualite('bonne');
        setPrixBase(64.50); setSavedId(''); setErreur(''); setStatut('idle');
    };

    const champClass = (k: keyof DonneesVehicule) =>
        `w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500 ${
            aVerifier.includes(k) ? 'border-amber-400 bg-amber-50' : 'border-gray-300 bg-white'
        }`;

    // IMPORTANT : fonction (pas un composant interne) pour éviter la perte de focus
    // des inputs à chaque frappe (un composant redéfini à chaque render serait remonté).
    const renderChamp = (k: keyof DonneesVehicule, label: string) => (
        <div className="flex flex-col gap-1" key={k}>
            <label className="text-[11px] uppercase font-bold text-gray-500 tracking-wide flex items-center gap-1">
                {label}
                {aVerifier.includes(k) && <AlertTriangle className="h-3 w-3 text-amber-500" />}
            </label>
            <input className={champClass(k)} value={donnees[k]} onChange={(e) => setField(k, e.target.value)} />
        </div>
    );

    // --- Écran de succès ---
    if (statut === 'saved') {
        return (
            <div className="max-w-2xl mx-auto py-20 px-4 text-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900">Véhicule enregistré</h1>
                <p className="text-gray-500 mt-2 font-mono">{savedId}</p>
                <div className="flex gap-3 justify-center mt-8">
                    <button onClick={handleReset} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700">
                        <ScanLine className="h-4 w-4" /> Nouveau véhicule
                    </button>
                    <button onClick={() => router.push(`/declarations/${savedId}/receipt`)} className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                        Voir le récépissé
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Scan IA</h1>
                    <p className="text-gray-500 text-sm">Extraction automatique depuis les documents.</p>
                </div>
            </div>

            {erreur && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> {erreur}
                </div>
            )}

            {statut !== 'review' && (
                <>
                    {/* Choix du mode */}
                    <div className="flex gap-2 mb-6">
                        <button onClick={() => setMode('page')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${mode === 'page' ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-white border-gray-200 text-gray-600'}`}>Document 1 page</button>
                        <button onClick={() => setMode('carte')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${mode === 'carte' ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-white border-gray-200 text-gray-600'}`}>Carte 2 faces</button>
                    </div>

                    {/* Zones d'upload */}
                    {mode === 'page' ? (
                        <ZoneUpload label="ZONE 1 — Document 1 page" hint="Volet jaune, demande d'immatriculation, ou carte (2 faces sur une photo)" preview={previews.page} onFile={setFilePage} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ZoneUpload label="ZONE 2 — Carte RECTO (Propriétaire)" hint="Nom, adresse, NIF" preview={previews.recto} onFile={setFileRecto} />
                            <ZoneUpload label="ZONE 3 — Carte VERSO (Véhicule)" hint="Marque, plaque, châssis, CV" preview={previews.verso} onFile={setFileVerso} />
                        </div>
                    )}

                    <button
                        onClick={handleExtract}
                        disabled={statut === 'extracting'}
                        className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50"
                    >
                        {statut === 'extracting' ? <><Loader2 className="h-5 w-5 animate-spin" /> Lecture en cours…</> : <><ScanLine className="h-5 w-5" /> Extraire avec l'IA</>}
                    </button>
                </>
            )}

            {statut === 'review' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Photos */}
                    <div className="space-y-3">
                        {qualite === 'faible' && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> Qualité photo faible — vérifie chaque champ attentivement.
                            </div>
                        )}
                        {mode === 'page' && previews.page && <img src={previews.page} alt="document" className="w-full rounded-lg border" />}
                        {mode === 'carte' && previews.recto && <img src={previews.recto} alt="recto" className="w-full rounded-lg border" />}
                        {mode === 'carte' && previews.verso && <img src={previews.verso} alt="verso" className="w-full rounded-lg border" />}
                    </div>

                    {/* Formulaire de revue */}
                    <div className="space-y-4">
                        <div className="border rounded-lg p-4 bg-white">
                            <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">Contribuable</h3>
                            <div className="space-y-3">
                                {renderChamp('nom', 'Nom / Raison Sociale')}
                                {renderChamp('nif', 'NIF')}
                                {renderChamp('adresse', 'Adresse')}
                            </div>
                        </div>
                        <div className="border rounded-lg p-4 bg-white">
                            <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">Véhicule</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {renderChamp('plaque', 'Plaque')}
                                {renderChamp('chassis', 'Chassis')}
                                {renderChamp('marque_type', 'Marque / Type')}
                                {renderChamp('cv', 'CV')}
                                {renderChamp('usage', 'Usage')}
                                {renderChamp('genre', 'Genre')}
                                {renderChamp('annee', 'Année')}
                                {renderChamp('couleur', 'Couleur')}
                                {renderChamp('poids', 'Poids')}
                            </div>
                        </div>
                        <div className="border rounded-lg p-4 bg-white">
                            <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">Taxation</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] uppercase font-bold text-gray-500">Prix de base ($)</label>
                                    <select value={prixBase} onChange={(e) => setPrixBase(parseFloat(e.target.value))} className="px-3 py-2 text-sm border border-gray-300 rounded-md font-mono">
                                        <option value={58.70}>58.70</option>
                                        <option value={58.20}>58.20</option>
                                        <option value={63.10}>63.10</option>
                                        <option value={64.50}>64.50</option>
                                        <option value={68.20}>68.20</option>
                                        <option value={70.10}>70.10</option>
                                        <option value={70.30}>70.30</option>
                                    </select>
                                </div>
                                <div className="ml-auto text-right">
                                    <div className="text-[11px] uppercase font-bold text-gray-500">Montant total</div>
                                    <div className="text-xl font-extrabold text-[#D32F2F]">FC {montantFC(prixBase).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                                <RotateCcw className="h-4 w-4" /> Recommencer
                            </button>
                            <button onClick={handleValidate} disabled={(statut as Statut) === 'saving'} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
                                {(statut as Statut) === 'saving' ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</> : <><Save className="h-4 w-4" /> Valider & Enregistrer</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Zone d'upload réutilisable
function ZoneUpload({ label, hint, preview, onFile }: { label: string; hint: string; preview: string; onFile: (f: File) => void }) {
    return (
        <label className="block border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-violet-400 transition-colors bg-white">
            <div className="text-[11px] font-bold uppercase text-gray-500 tracking-wide">{label}</div>
            <div className="text-[11px] text-gray-400 mb-2">{hint}</div>
            {preview ? (
                <img src={preview} alt="aperçu" className="w-full h-48 object-contain rounded-md" />
            ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Cliquer pour ajouter une photo</div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </label>
    );
}
