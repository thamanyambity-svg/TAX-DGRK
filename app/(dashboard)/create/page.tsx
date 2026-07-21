'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, FileText, Car, User, AlertCircle } from 'lucide-react';
import { TaxpayerType, VehicleCategory, Declaration } from '@/types';
import { saveDeclaration } from '@/lib/store';
import { generateDeclarationId, generateNoteId, getSecureSequence } from '@/lib/generator';
import { getNowOrBusinessHours } from '@/lib/business-calendar';
import { getTariffMode, TariffMode } from '@/lib/tariff-mode';
import { calculateTax } from '@/lib/tax-rules';
import {
    calculer2026,
    Categorie2026,
    SOUS_CATEGORIES_2026,
    PRIMARY_CATEGORIES_2026,
    getCvFromLabel,
    getTonnageFromLabel
} from '@/lib/tarif-2026';

function getCV(powerStr: string): number {
    const m = (powerStr || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}

export default function NewDeclarationPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tariffMode, setTariffModeState] = useState<TariffMode>('legacy');

    useEffect(() => {
        setTariffModeState(getTariffMode());
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        taxpayerType: 'N/A' as TaxpayerType,
        name: '',
        nif: '',
        address: '',
        city: 'Kinshasa',
        category: 'Vignette Automobile' as VehicleCategory,
        plate: '',
        chassis: '',
        fiscalPower: '',
        weight: '',
        marque: '',
        modele: '',
    });

    // 2026 specific state
    const [primaryCategory2026, setPrimaryCategory2026] = useState(PRIMARY_CATEGORIES_2026[0]);
    const [sousCategorie2026, setSousCategorie2026] = useState(
        SOUS_CATEGORIES_2026.find(sc => sc.group === PRIMARY_CATEGORIES_2026[0]) || SOUS_CATEGORIES_2026[0]
    );

    const handlePrimaryCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPrimary = e.target.value;
        setPrimaryCategory2026(newPrimary);
        const firstMatch = SOUS_CATEGORIES_2026.find(sc => sc.group === newPrimary);
        if (firstMatch) {
            setSousCategorie2026(firstMatch);
        }
    };

    const filteredSubCategories = SOUS_CATEGORIES_2026.filter(sc => sc.group === primaryCategory2026);

    // ── CALCUL TAXES ──────────────────────────────────────────────────────────
    const EXCHANGE_RATE = 2414.93;

    let currentAmountUSD = 0;
    let currentAmountFC = 0;
    let tarif2026Breakdown: { impot: number; tsc: number; redevance: number; imprime: number; total: number; categorie: string } | null = null;

    if (tariffMode === 'new2026') {
        const cvForCalc = getCvFromLabel(sousCategorie2026.label).min;
        const tonnageForCalc = getTonnageFromLabel(sousCategorie2026.label);
        const result = calculer2026({ categorie: sousCategorie2026.categorie, cv: cvForCalc, tonnage: tonnageForCalc });
        tarif2026Breakdown = result;
        currentAmountUSD = result.total;
        currentAmountFC = Math.round(result.total * EXCHANGE_RATE);
    } else {
        // Mode Legacy (Ancien barème)
        const legacyTax = calculateTax(getCV(formData.fiscalPower), formData.category, formData.weight);
        currentAmountUSD = legacyTax.creditAmount;
        currentAmountFC = Math.round(legacyTax.creditAmount * EXCHANGE_RATE);
    }

    // ── SOUMISSION ─────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const sequence = getSecureSequence();
        const id = generateDeclarationId(sequence);
        const noteId = generateNoteId(sequence);

        let baseRate = currentAmountUSD;
        let totalAmount = currentAmountFC;

        const dateIso = getNowOrBusinessHours();

        const ZOMBIE_RE = /PERSONNE\s+(PHYSIQUE|MORALE|PHYSOU|MORAL)/gi;
        const cleanAddress = (addr: string) =>
            addr.replace(ZOMBIE_RE, '').replace(/^\s*(N\/A|N\/A,|[,\s/-])+/, '').trim() || addr.trim();

        // Déterminer la catégorie véhicule à enregistrer
        let vehicleCategory: VehicleCategory = 'Vignette Automobile';
        if (tariffMode === 'new2026') {
            vehicleCategory = 
                sousCategorie2026.categorie === 'moto' ? 'Motocycle'
                : sousCategorie2026.categorie === 'tourisme' ? 'Vignette Automobile'
                : sousCategorie2026.categorie === 'utilitaire' ? 'Véhicule utilitaire'
                : sousCategorie2026.categorie === 'tracteur_agricole' || sousCategorie2026.categorie === 'tracteur_routier' ? 'Véhicule tracteur'
                : sousCategorie2026.categorie === 'remorque' ? 'Véhicule remorque'
                : 'Bateau';
        } else {
            vehicleCategory = formData.category;
        }

        const newDeclaration: Declaration = {
            id,
            createdAt: dateIso,
            updatedAt: dateIso,
            status: 'Payée',
            vehicle: {
                category: vehicleCategory,
                type: 'N/A',
                plate: formData.plate.toUpperCase(),
                chassis: formData.chassis.toUpperCase(),
                fiscalPower: formData.fiscalPower,
                weight: formData.weight,
                marque: (formData as any).marque?.toUpperCase() || '',
                modele: (formData as any).modele?.toUpperCase() || '',
                genre: 'N/A',
            },
            tax: {
                baseRate,
                currency: 'USD',
                totalAmountFC: totalAmount,
            },
            meta: {
                systemId: id,
                reference: noteId.replace('NDP - 2026-', ''),
                ndpId: noteId,
                tariffMode: tariffMode,
                tariffLabel: tariffMode === 'new2026' ? sousCategorie2026.label : formData.category,
                manualBaseAmount: baseRate,
                manualTaxpayer: {
                    name: formData.name.toUpperCase(),
                    nif: formData.nif.toUpperCase(),
                    address: cleanAddress(formData.address.toUpperCase()),
                    type: 'N/A',
                }
            }
        } as any;

        try {
            const result = await saveDeclaration(newDeclaration);
            if (!result.success) {
                alert(`Erreur lors de la création: ${result.error}`);
                setIsSubmitting(false);
                return;
            }
        } catch (error: any) {
            console.error("Critical error:", error);
            alert(`Erreur critique système: ${error.message || error}`);
            setIsSubmitting(false);
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 800));
        router.push(`/declarations/${id}/receipt`);
    };

    // ── RENDU ─────────────────────────────────────────────────────────────────

    const is2026 = tariffMode === 'new2026';

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Bandeau mode tarifaire */}
            <div className={`p-4 rounded-xl mb-4 font-bold text-center flex items-center justify-center gap-2 ${
                is2026 ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
            }`}>
                {is2026 
                    ? '🆕 GRILLE 2026 ACTIVE — Arrêté HVK 30 Jan 2026'
                    : '📋 GRILLE ACTUELLE ACTIVE — Système existant (Retardataires / 2025)'
                }
            </div>

            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nouvelle Déclaration</h1>
                    <p className="text-gray-500 text-sm">Remplissez la fiche ci-dessous pour générer les documents.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Section 1: Contribuable */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <User className="h-5 w-5 text-indigo-600" />
                        <h2 className="font-semibold text-gray-900">Information Contribuable</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Numéro d'Impôt / NIF <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: A1234567K"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none uppercase tracking-wide font-mono bg-yellow-50/50 border-yellow-200 text-gray-900"
                                value={formData.nif}
                                onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Le NIF est obligatoire pour la validité du récépissé.</p>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet / Raison Sociale</label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: Josuah Kitona"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse Complète</label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: 12 Av. de la Libération, Gombe"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Véhicule */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Car className="h-5 w-5 text-indigo-600" />
                        <h2 className="font-semibold text-gray-900">Information Véhicule</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* CATÉGORIE — SELON LE MODE */}
                        {is2026 ? (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Catégorie Principale — Grille 2026 <span className="text-amber-500 text-xs font-normal">(Arrêté HVK)</span>
                                </label>
                                <select
                                    className="w-full rounded-lg border-amber-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900 bg-amber-50/30 mb-4"
                                    value={primaryCategory2026}
                                    onChange={handlePrimaryCategoryChange}
                                >
                                    {PRIMARY_CATEGORIES_2026.map((cat, i) => (
                                        <option key={i} value={cat}>{cat}</option>
                                    ))}
                                </select>

                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sous-catégorie
                                </label>
                                <select
                                    className="w-full rounded-lg border-amber-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900 bg-amber-50/30"
                                    value={SOUS_CATEGORIES_2026.indexOf(sousCategorie2026)}
                                    onChange={(e) => setSousCategorie2026(SOUS_CATEGORIES_2026[parseInt(e.target.value)])}
                                >
                                    {filteredSubCategories.map((sc, i) => (
                                        <option key={i} value={SOUS_CATEGORIES_2026.indexOf(sc)}>
                                            {sc.label.replace(`${sc.group} — `, '').replace(sc.group + ' ', '')}
                                        </option>
                                    ))}
                                </select>
                                {/* Preview du tarif 2026 */}
                                {tarif2026Breakdown && (
                                    <div className="mt-2 text-xs text-gray-500 flex gap-3 flex-wrap">
                                        <span>Impôt: <strong>${tarif2026Breakdown.impot.toFixed(2)}</strong></span>
                                        <span>TSC: <strong>${tarif2026Breakdown.tsc.toFixed(2)}</strong></span>
                                        <span>Redevance: <strong>${tarif2026Breakdown.redevance.toFixed(2)}</strong></span>
                                        <span>Imprimé: <strong>${tarif2026Breakdown.imprime.toFixed(2)}</strong></span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie (Grille Actuelle / Legacy)</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as VehicleCategory })}
                                >
                                    <option value="Vignette Automobile">Vignette Automobile (Standard)</option>
                                    <option value="touristique_updated">Touristique ($58.70)</option>
                                    <option value="touristique_light">Touristique Light (0-10 CV)</option>
                                    <option value="touristique_medium">Touristique Medium ($63.10)</option>
                                    <option value="utilitaire_heavy">Utilitaire Heavy (Poids lourd - $68.20)</option>
                                    <option value="Véhicule utilitaire">Véhicule utilitaire (Standard)</option>
                                    <option value="Véhicule touristique">Véhicule touristique (Standard)</option>
                                    <option value="Transport public">Transport public</option>
                                </select>
                            </div>
                        )}

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                            <input
                                type="text"
                                placeholder="Ex: TOYOTA"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none uppercase text-gray-900"
                                value={formData.marque}
                                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                            <input
                                type="text"
                                placeholder="Ex: PRADO"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none uppercase text-gray-900"
                                value={formData.modele}
                                onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plaque d'immatriculation</label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: 1234AB01"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none uppercase font-mono text-gray-900"
                                value={formData.plate}
                                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de Châssis (VIN)</label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: JNX..."
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none uppercase font-mono text-gray-900"
                                value={formData.chassis}
                                onChange={(e) => setFormData({ ...formData, chassis: e.target.value })}
                            />
                        </div>

                        {/* Puissance Fiscale */}
                        {(!is2026 || sousCategorie2026.requireCV) && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Puissance Fiscale {!is2026 && <span className="text-xs text-indigo-600">(Détermine le prix : ≤10 CV = 58.70$, 11-15 CV = 64.50$, &gt;15 CV = 70.10$)</span>}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: 11 CV"
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                                    value={formData.fiscalPower}
                                    onChange={(e) => setFormData({ ...formData, fiscalPower: e.target.value })}
                                />
                            </div>
                        )}

                        {/* Poids */}
                        {(!is2026 || sousCategorie2026.requireTonnage) && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Poids <span className="text-xs text-gray-500">(Tonnage)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: 7.5 (en tonnes)"
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    {/* LIVE ESTIMATION BANNER */}
                    <div className={`px-6 py-4 border-t flex justify-between items-center ${
                        is2026 ? 'bg-amber-50 border-amber-100' : 'bg-indigo-50 border-indigo-100'
                    }`}>
                        <div>
                            <p className={`text-xs font-semibold uppercase tracking-wider ${
                                is2026 ? 'text-amber-700' : 'text-indigo-700'
                            }`}>
                                Montant Estimé à Payer
                            </p>
                            <p className={`text-[10px] ${is2026 ? 'text-amber-500' : 'text-indigo-500'}`}>
                                {is2026 ? `Grille 2026 — ${sousCategorie2026.label}` : `Grille Actuelle — ${formData.category}`}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={`text-xl font-bold ${is2026 ? 'text-amber-700' : 'text-indigo-700'}`}>
                                ${currentAmountUSD.toFixed(2)} <span className="text-[10px] uppercase text-gray-400 font-medium">(Hors Frais Bancaires)</span>
                            </p>
                            <p className={`text-xs font-mono ${is2026 ? 'text-amber-500' : 'text-indigo-500'}`}>
                                ~ {Math.round(currentAmountFC).toLocaleString()} FC
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex items-center gap-2 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                            is2026 ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                        }`}
                    >
                        {isSubmitting ? 'Traitement...' : 'Enregistrer & Imprimer'}
                        {!isSubmitting && <Save className="h-5 w-5" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
