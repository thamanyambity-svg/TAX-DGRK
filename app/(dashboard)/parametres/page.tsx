'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Settings2,
    ToggleLeft,
    ToggleRight,
    AlertTriangle,
    CheckCircle2,
    Info,
    RefreshCw,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { getTariffMode, setTariffMode, TariffMode } from '@/lib/tariff-mode';
import { GRILLE_2026, TAUX_FC } from '@/lib/tarif-2026';

export default function ParametresPage() {
    const [mode, setMode] = useState<TariffMode>('legacy');
    const [pending, setPending] = useState<TariffMode | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showGrille, setShowGrille] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setMode(getTariffMode());
    }, []);

    const handleToggleRequest = (newMode: TariffMode) => {
        if (newMode === mode) return;
        setPending(newMode);
        setShowConfirm(true);
    };

    const handleConfirm = () => {
        if (!pending) return;
        setTariffMode(pending);
        setMode(pending);
        setShowConfirm(false);
        setPending(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleCancel = () => {
        setShowConfirm(false);
        setPending(null);
    };

    const isNew = mode === 'new2026';

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings2 className="h-6 w-6 text-violet-600" />
                        Paramètres Administrateur
                    </h1>
                    <p className="text-gray-500 text-sm">Contrôle avancé du système de taxation</p>
                </div>
            </div>

            {/* Success Banner */}
            {saved && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    <p className="text-green-800 font-medium text-sm">
                        Mode tarifaire mis à jour avec succès. Toutes les nouvelles déclarations utiliseront ce barème.
                    </p>
                </div>
            )}

            {/* ── SECTION PRINCIPALE : MODE TARIFAIRE ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 text-lg">Mode de Calcul des Taxes</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Sélectionnez la grille tarifaire à appliquer pour les <strong>nouvelles déclarations</strong>.
                        Les dossiers existants ne seront pas affectés.
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {/* OPTION A : Grille Actuelle (Legacy) */}
                    <button
                        onClick={() => handleToggleRequest('legacy')}
                        className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                            mode === 'legacy'
                                ? 'border-violet-500 bg-violet-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    mode === 'legacy' ? 'border-violet-500' : 'border-gray-300'
                                }`}>
                                    {mode === 'legacy' && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">📋 Grille Actuelle</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Système existant basé sur la puissance fiscale (CV) et le poids.
                                        Tarifs : 58.70 $ / 64.50 $ / 70.10 $ + frais bancaires.
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">0–10 CV → $58.70</span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">11–15 CV → $64.50</span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">&gt;15 CV → $70.10</span>
                                    </div>
                                </div>
                            </div>
                            {mode === 'legacy' && (
                                <span className="shrink-0 text-xs bg-violet-600 text-white px-3 py-1 rounded-full font-semibold">ACTIF</span>
                            )}
                        </div>
                    </button>

                    {/* OPTION B : Grille 2026 */}
                    <button
                        onClick={() => handleToggleRequest('new2026')}
                        className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                            mode === 'new2026'
                                ? 'border-amber-500 bg-amber-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    mode === 'new2026' ? 'border-amber-500' : 'border-gray-300'
                                }`}>
                                    {mode === 'new2026' && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">🆕 Grille 2026 — Arrêté HVK 30 Jan 2026</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Nouvelle grille officielle de l'Hôtel de Ville de Kinshasa. Personnes Physiques uniquement.
                                        Inclut Motocycles, Tourisme (par CV), Utilitaires (par tonnage), Tracteurs/Remorques, Unités Flottantes.
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Moto → $11.00</span>
                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Tourisme 11–15 CV → $80.00</span>
                                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Util &gt;20T → $150.00</span>
                                    </div>
                                </div>
                            </div>
                            {mode === 'new2026' && (
                                <span className="shrink-0 text-xs bg-amber-500 text-white px-3 py-1 rounded-full font-semibold">ACTIF</span>
                            )}
                        </div>
                    </button>

                    {/* Info */}
                    <div className="flex items-start gap-2 bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>
                            Ce paramètre est sauvegardé localement sur cet appareil.
                            Taux de change actuel : <strong>1 USD = {TAUX_FC.toLocaleString()} FC</strong>.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── GRILLE TARIFAIRE 2026 ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                <button
                    onClick={() => setShowGrille(!showGrille)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                    <h2 className="font-bold text-gray-900 text-lg">📄 Grille Complète 2026</h2>
                    {showGrille ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                </button>

                {showGrille && (
                    <div className="overflow-x-auto border-t border-gray-100">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Catégorie</th>
                                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Impôt</th>
                                    <th className="text-right px-4 py-3 font-semibold text-gray-700">TSC</th>
                                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Redevance</th>
                                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Imprimé</th>
                                    <th className="text-right px-4 py-3 font-semibold text-violet-700 bg-violet-50">Total (USD)</th>
                                    <th className="text-right px-4 py-3 font-semibold text-green-700 bg-green-50">Équiv. FC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {GRILLE_2026.map((ligne, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-800">{ligne.label}</td>
                                        <td className="px-4 py-3 text-right text-gray-600">
                                            {ligne.tarif.ivh != null ? `$${ligne.tarif.ivh.toFixed(2)}` : `$${(ligne.tarif.impot ?? 0).toFixed(2)}`}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600">
                                            {ligne.tarif.ivh != null ? '—' : `$${(ligne.tarif.tsc ?? 0).toFixed(2)}`}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600">${ligne.tarif.redevance.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-gray-600">${ligne.tarif.imprime.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-violet-700 bg-violet-50">
                                            ${ligne.tarif.total.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-green-700 bg-green-50 text-xs">
                                            {Math.round(ligne.tarif.total * TAUX_FC).toLocaleString()} FC
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="text-xs text-gray-400 px-4 py-3">
                            * Les frais bancaires (+4 USD) s'ajoutent au total lors de la création d'une déclaration.
                            Taux : 1 USD = {TAUX_FC} FC
                        </p>
                    </div>
                )}
            </div>

            {/* ── MODAL DE CONFIRMATION ── */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Confirmer le changement</h3>
                                <p className="text-xs text-gray-500">Action administrateur</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                            Vous allez basculer vers la <strong>
                                {pending === 'new2026' ? '🆕 Grille 2026 (Arrêté HVK)' : '📋 Grille Actuelle'}
                            </strong>.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Les déclarations existantes ne seront pas modifiées. Seules les <strong>nouvelles déclarations</strong> utiliseront ce barème.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-colors"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
