
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Save, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveDeclaration } from '@/lib/store';
import { generateDeclarationId } from '@/lib/generator';
import { calculateTax } from '@/lib/tax-rules';
import { Declaration } from '@/types';

// Template for the user to download
const EXCEL_TEMPLATE = [
    {
        PROPRIÉTAIRE: "STE EXEMPLE SARL",
        NIF: "A1234567M",
        "ADRESSE (GOMBE/AUTRE)": "12 AV. EXEMPLE, KINSHASA",
        MARQUE: "TOYOTA",
        MODÈLE: "HILUX",
        PLAQUE: "1234AB01",
        "NUMÉRO CHASSIS": "JNX123456789",
        CV: 12,
        CATEGORIE: "Véhicule utilitaire",
        GENRE: "PICK-UP",
        COULEUR: "BLANC",
        ANNEE: 2024,
        STATUS: 'Payé'
    }
];

export default function ImportPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet(EXCEL_TEMPLATE);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modele_Import");
        XLSX.writeFile(wb, "Modele_Import_Vehicules.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const bstr = event.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws);

                // --- FUZZY COLUMN MAPPING HELPER ---
                const findValue = (row: any, code: string) => {
                    const keys = Object.keys(row);
                    const normalizedCode = code.toLowerCase().replace(/_/g, '');

                    // Priority 1: Exact Match (Case Insensitive)
                    let key = keys.find(k => k.toLowerCase().replace(/_/g, '') === normalizedCode);

                    // Priority 2: Keywords / Aliases
                    if (!key) {
                        const keywords: Record<string, string[]> = {
                            'NOM': ['propriétaire', 'proprietaire', 'client', 'societe', 'société', 'nom', 'contribuable'],
                            'NIF': ['nif', 'impot', 'idnat'],
                            'ADRESSE': ['adresse (gombe/autre)', 'adresse', 'address', 'domicile', 'ville'],
                            'PLAQUE': ['plaque', 'immatriculation', 'numero'],
                            'CHASSIS': ['chassis', 'numéro chassis', 'numero chassis', 'vin', 'serie'],
                            'MARQUE': ['marque', 'brand'],
                            'MODELE': ['modèle', 'modele', 'model'],
                            'PUISSANCE_CV': ['cv', 'puissance', 'chevaux', 'fiscal', 'pui'],
                            'CATEGORIE': ['catégorie', 'categorie', 'type', 'genre'],
                            'COULEUR': ['couleur', 'color', 'coul'],
                            'ANNEE': ['année', 'annee', 'year'],
                            'STATUS': ['status', 'statut', 'etat']
                        };

                        const aliases = keywords[code] || [];
                        key = keys.find(k => {
                            const normKey = k.toLowerCase();
                            return aliases.some(alias => normKey.includes(alias));
                        });
                    }

                    return key ? row[key] : undefined;
                };

                // Normalize Data using Fuzzy Logic
                const data = rawData.map((row: any) => ({
                    NOM: findValue(row, 'NOM'),
                    NIF: findValue(row, 'NIF'),
                    ADRESSE: findValue(row, 'ADRESSE'),
                    PLAQUE: findValue(row, 'PLAQUE'),
                    CHASSIS: findValue(row, 'CHASSIS'),
                    MARQUE: findValue(row, 'MARQUE'),
                    MODELE: findValue(row, 'MODELE'),
                    PUISSANCE_CV: findValue(row, 'PUISSANCE_CV'),
                    CATEGORIE: findValue(row, 'CATEGORIE'), // Often missing in simple files, will default
                    GENRE: findValue(row, 'GENRE'),
                    COULEUR: findValue(row, 'COULEUR'),
                    ANNEE: findValue(row, 'ANNEE'),
                    TYPE_CONTRIBUABLE: findValue(row, 'TYPE_CONTRIBUABLE'),
                    STATUS: findValue(row, 'STATUS')
                }));

                // Process preview data
                const processed = data.map((row: any, index: number) => {
                    // Smart parse CV (handle "15 CV", "15", "15CV")
                    let cvStr = (row.PUISSANCE_CV || '0').toString();
                    const cvMatch = cvStr.match(/(\d+)/);
                    const cv = cvMatch ? parseInt(cvMatch[1], 10) : 0;

                    // Auto-categorize based on explicit Category or fallback
                    // Tax calculation handles the CV based logic
                    const taxInfo = calculateTax(cv, row.CATEGORIE || '');

                    return {
                        ...row,
                        _id: index,
                        _taxUSD: taxInfo.totalAmount,
                        // Looser validation: If Chassis is missing but Plate exists, user might want to edit later? 
                        // But for "Payée" documents we usually need everything. Let's keep distinct check.
                        // We assume NOM is mandatory. CHASSIS is mandatory.
                        _valid: !!(row.PLAQUE && (row.CHASSIS || row.VIN) && (row.NOM || row.CLIENT)) || (!!row.PLAQUE && !!row.CHASSIS) // Fallback logic
                    };
                });

                setPreviewData(processed);
                setUploadStatus('idle');
                setLogs([]);
            } catch (error) {
                console.error("Read error", error);
                setUploadStatus('error');
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleImport = async () => {
        if (!previewData.length) return;
        setIsProcessing(true);
        const newLogs: string[] = [];

        try {
            let successCount = 0;
            const EXCHANGE_RATE = 2355; // Keep consistent

            for (const row of previewData) {
                if (!row._valid) {
                    newLogs.push(`⚠️ Skipped Line (Missing Data): ${row.PLAQUE || 'No Plate'}`);
                    continue;
                }

                // Generate ID
                const randomSeq = Math.floor(Math.random() * 900000) + 100000;
                const id = `DECL-2026-IMP-${randomSeq}`; // Special prefix for imports

                const status = row.STATUS && row.STATUS.toLowerCase().includes('pay') ? 'Payée' : 'Payée'; // Default to Payée as requested, override logic if needed

                // Prepare Payload
                const newDecl: Declaration = {
                    id,
                    status: 'Payée', // FORCE "Payée" per latest request
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    taxpayer: { // Explicitly mapping for safety
                        name: row.NOM || 'INCONNU',
                        nif: row.NIF || 'N/A',
                        address: row.ADRESSE || 'KINSHASA',
                        type: row.TYPE_CONTRIBUABLE || 'Personne Morale' // Default if not specified, often Corporate
                    },
                    vehicle: {
                        plate: (row.PLAQUE || '').toString().toUpperCase(),
                        chassis: (row.CHASSIS || '').toString().toUpperCase(),
                        marque: (row.MARQUE || '').toUpperCase(),
                        modele: (row.MODELE || '').toUpperCase(),
                        fiscalPower: `${row.PUISSANCE_CV} CV`,
                        category: row.CATEGORIE || 'Vignette Automobile',
                        genre: row.GENRE || '',
                        couleur: row.COULEUR || '',
                        annee: (row.ANNEE || '').toString(),
                        weight: row.POIDS || '-',
                        type: row.TYPE_CONTRIBUABLE || 'Personne Physique',
                    } as any, // Cast for loose typing
                    tax: {
                        baseRate: row._taxUSD,
                        currency: 'USD',
                        totalAmountFC: row._taxUSD * EXCHANGE_RATE
                    },
                    meta: {
                        systemId: id,
                        reference: `IMPORT-${new Date().toLocaleDateString()}`,
                        manualTaxpayer: {
                            name: row.NOM || 'INCONNU',
                            nif: row.NIF || 'N/A', // Store NIF in meta too based on previous logic
                            address: row.ADRESSE || 'KINSHASA',
                        }
                    }
                } as any;

                const result = await saveDeclaration(newDecl);

                if (result.success) {
                    successCount++;
                } else {
                    newLogs.push(`❌ Failed to import ${row.PLAQUE}: ${result.error}`);
                }
            }

            setUploadStatus('success');
            newLogs.push(`✅ Successfully imported ${successCount} vehicles.`);
            setLogs(newLogs);

            // Wait a bit then redirect
            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (error: any) {
            console.error("Import error", error);
            setUploadStatus('error');
            const msg = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
            newLogs.push(`❌ Critical Error: ${msg}`);
            setLogs(newLogs);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Importation Excel</h1>
                    <p className="text-gray-500 text-sm">Importez une flotte complète en une seule fois.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* LEFT: Upload & Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 text-green-600" /> Etape 1 : Le Modèle
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Téléchargez le modèle Excel pré-rempli pour vous assurer d'avoir les bonnes colonnes.
                        </p>
                        <button
                            onClick={handleDownloadTemplate}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition"
                        >
                            <Download className="h-4 w-4" /> Télécharger Modèle
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Upload className="h-5 w-5 text-blue-600" /> Etape 2 : L'Import
                        </h3>
                        <label className="block w-full cursor-pointer group">
                            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 group-hover:bg-blue-50 group-hover:border-blue-300 transition-all">
                                {file ? (
                                    <div className="flex flex-col items-center text-blue-600">
                                        <FileSpreadsheet className="h-8 w-8 mb-2" />
                                        <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-500 group-hover:text-blue-500">
                                        <Upload className="h-8 w-8 mb-2" />
                                        <span className="text-sm">Cliquez pour choisir un fichier</span>
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>

                    {uploadStatus === 'success' && (
                        <div className="bg-green-50 p-4 rounded-lg flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-green-800">Succès !</p>
                                <p className="text-sm text-green-600">Redirection vers le tableau de bord...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Preview Table */}
                <div className="md:col-span-2">
                    {previewData.length > 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[600px]">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Aperçu des données</h3>
                                    <p className="text-xs text-gray-500">{previewData.length} véhicules détectés</p>
                                </div>
                                <button
                                    onClick={handleImport}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? 'Traitement...' : 'Valider & Importer'}
                                    {!isProcessing && <Save className="h-4 w-4" />}
                                </button>
                            </div>

                            <div className="overflow-auto flex-1 p-0">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-gray-500">Plaque</th>
                                            <th className="px-4 py-3 font-medium text-gray-500">Marque/Modèle</th>
                                            <th className="px-4 py-3 font-medium text-gray-500">CV</th>
                                            <th className="px-4 py-3 font-medium text-gray-500">Taxe Calculée</th>
                                            <th className="px-4 py-3 font-medium text-gray-500">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {previewData.map((row) => (
                                            <tr key={row._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 font-mono font-medium">{row.PLAQUE}</td>
                                                <td className="px-4 py-2">{row.MARQUE} {row.MODELE}</td>
                                                <td className="px-4 py-2">{row.PUISSANCE_CV}</td>
                                                <td className="px-4 py-2 font-bold text-indigo-600">${row._taxUSD?.toFixed(2)}</td>
                                                <td className="px-4 py-2">
                                                    {row._valid ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            Valide
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                            Manquant
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                            <FileSpreadsheet className="h-12 w-12 mb-4 opacity-50" />
                            <p>Les données apparaîtront ici après l'upload.</p>
                        </div>
                    )}
                </div>
            </div>

            {logs.length > 0 && (
                <div className="mt-8 bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 max-h-40 overflow-auto">
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
            )}
        </div>
    );
}
