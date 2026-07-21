'use client';

import React from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Settings2,
    Info,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { GRILLE_2026, TAUX_FC } from '@/lib/tarif-2026';

export default function ParametresPage() {
    const [showGrille, setShowGrille] = React.useState(true);

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

            {/* ── SECTION PRINCIPALE : MODE TARIFAIRE ── */}
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100">
                    <h2 className="font-bold text-gray-900 text-lg">Mode de Calcul des Taxes</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Le système utilise actuellement la grille tarifaire <strong>2026</strong>.
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3 p-5 rounded-xl border-2 border-amber-500 bg-amber-50">
                        <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">🆕 Grille 2026 — Arrêté HVK 30 Jan 2026</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Nouvelle grille officielle de l'Hôtel de Ville de Kinshasa. Personnes Physiques uniquement.
                                Inclut Motocycles, Tourisme (par CV), Utilitaires (par tonnage), Tracteurs/Remorques, Unités Flottantes.
                            </p>
                        </div>
                        <span className="shrink-0 text-xs bg-amber-500 text-white px-3 py-1 rounded-full font-semibold">ACTIF</span>
                    </div>

                    {/* Info */}
                    <div className="flex items-start gap-2 bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>
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
                                        <td className="px-4 py-3 text-right text-gray-600">${ligne.tarif.impot.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right text-gray-600">${ligne.tarif.tsc.toFixed(2)}</td>
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
        </div>
    );
}
