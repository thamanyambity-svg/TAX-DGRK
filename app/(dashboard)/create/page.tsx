'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, FileText, Car, User } from 'lucide-react';
import { TaxpayerType, VehicleCategory, Declaration } from '@/types';
import { saveDeclaration } from '@/lib/store';
import { generateDeclarationId, generateNoteId, getSecureSequence } from '@/lib/generator';
import { getNowOrBusinessHours } from '@/lib/business-calendar';

export default function NewDeclarationPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        taxpayerType: 'N/A' as TaxpayerType,
        name: '',
        nif: '', // ADDED: Numéro d'Impôt field
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

    // --- DYNAMIC TAX CALCULATION ---
    const { calculateTax } = require('@/lib/tax-rules');

    // Helper to get CV number safely
    const getCV = (powerStr: string) => {
        const match = powerStr.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    };

    // Calculate current tax based on form state for Preview & Submission
    const currentTax = calculateTax(getCV(formData.fiscalPower), formData.category, formData.weight);
    const EXCHANGE_RATE = 2355;
    // User Requirement: Receipt shows RAW price (creditAmount), Bordereau shows Total (w/ fees)
    // We store the RAW price in the declaration so the Receipt (which reads stored data) is correct.
    const currentAmountFC = currentTax.creditAmount * EXCHANGE_RATE;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Generate a unique sequence based on time to avoid collisions (Grave Error Fix)
        const sequence = getSecureSequence();
        const id = generateDeclarationId(sequence);
        const noteId = generateNoteId(sequence);

        // Use the calculated tax from the rules
        // Store RAW PRICE (creditAmount) for Receipt
        const baseRate = currentTax.creditAmount;
        let totalAmount = currentAmountFC;

        const dateIso = getNowOrBusinessHours();

        const newDeclaration: Declaration = {
            id,
            createdAt: dateIso,
            updatedAt: dateIso,
            status: 'Payée', // Default to Payée for 'N/A' as per previous unified rule
            vehicle: {
                category: formData.category,
                type: formData.taxpayerType,
                plate: formData.plate.toUpperCase(),
                chassis: formData.chassis.toUpperCase(),
                fiscalPower: formData.fiscalPower,
                weight: formData.weight,
                marque: (formData as any).marque?.toUpperCase() || '',
                modele: (formData as any).modele?.toUpperCase() || '',
                genre: 'N/A', // Force Usage N/A
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
                manualTaxpayer: {
                    name: formData.name.toUpperCase(),
                    nif: formData.nif.toUpperCase(),
                    address: formData.address.toUpperCase(),
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

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="bg-red-600 text-white p-4 rounded-xl mb-4 font-bold text-center animate-pulse">
                VERSION 2.0 - PROTECTION ZOMBIE ACTIVÉE
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
                            <label className="block text-sm font-medium text-indigo-600 mb-1">🛡️ Type (Standardisé N/A)</label>
                            <select
                                disabled
                                className="w-full rounded-lg border-indigo-200 border px-3 py-2 text-sm bg-indigo-50 text-indigo-700 cursor-not-allowed outline-none appearance-none font-bold"
                                value="N/A"
                            >
                                <option value="N/A">N/A (FIXED)</option>
                            </select>
                            <p className="text-[10px] text-indigo-400 mt-1 italic">Sélection bloquée : Aucun zombie autorisé.</p>
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>

                        {/* NEW: Numéro d'Impôt Field - VERY IMPORTANT */}
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
                        <Car className="h-5 w-5 text-mint-600" />
                        <h2 className="font-semibold text-gray-900">Information Véhicule</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                            <select
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as VehicleCategory })}
                            >
                                <option value="Vignette Automobile">Vignette Automobile</option>
                                <option value="Véhicule utilitaire">Véhicule utilitaire (Standard)</option>
                                <option value="Véhicule touristique">Véhicule touristique (Standard)</option>
                                <option value="touristique_light">Touristique Light (0-10 CV)</option>
                                <option value="utilitaire_heavy">Utilitaire Heavy (Poids lourd)</option>
                                <option value="Transport public">Transport public</option>
                            </select>
                        </div>

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

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Puissance Fiscale <span className="text-xs text-gray-500">(Détermine le prix)</span></label>
                            <input
                                type="text"
                                placeholder="Ex: 11 CV"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                                value={formData.fiscalPower}
                                onChange={(e) => setFormData({ ...formData, fiscalPower: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Poids</label>
                            <input
                                type="text"
                                placeholder="Ex: 1.5 tonnes"
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* LIVE ESTIMATION BANNER */}
                    <div className="bg-indigo-50 px-6 py-4 border-t border-indigo-100 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Montant Estimé à Payer</p>
                            <p className="text-[10px] text-indigo-400">Basé sur {getCV(formData.fiscalPower)} CV et type {formData.category}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-indigo-700">${currentTax.creditAmount.toFixed(2)} <span className="text-[10px] uppercase text-gray-400 font-medium">(Hors Frais)</span></p>
                            <p className="text-xs text-indigo-500 font-mono">~ {currentAmountFC.toLocaleString()} FC</p>
                        </div>
                    </div>
                </div>

                {/* Action */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Traitement...' : 'Enregistrer & Imprimer'}
                        {!isSubmitting && <Save className="h-5 w-5" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
