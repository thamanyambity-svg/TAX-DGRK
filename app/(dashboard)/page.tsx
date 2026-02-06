'use client';

import { FileText, ArrowRight, RefreshCw, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Declaration } from '@/types';

export default function Home() {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);

  useEffect(() => {
    async function fetchDeclarations() {
      // Use the robust Store function (Static -> DB fallback)
      const { getSavedDeclarations } = await import('@/lib/store');
      const data = await getSavedDeclarations(); // Always returns data instantly now
      if (data) {
        // Sort mostly by ID string descending as a proxy for recency if date is same
        const sorted = [...data].sort((a, b) => b.id.localeCompare(a.id));
        setDeclarations(sorted);
      }
    }

    fetchDeclarations();
  }, []);

  const regenerate = async () => {
    window.location.reload(); // Simple reload is fastest way to refresh given static data strategy
  };

  const handleDelete = async (id: string) => {
    // CONFIRMATION AVANT SUPPRESSION
    if (confirm("ATTENTION ADMIN : Êtes-vous sûr de vouloir SUPPRIMER définitivement ce dossier ? Cette action est irréversible.")) {
      const { deleteDeclaration } = await import('@/lib/store');
      const success = await deleteDeclaration(id);
      if (success) {
        // Mise à jour locale immédiate
        setDeclarations(prev => prev.filter(d => d.id !== id));
      } else {
        alert("Erreur lors de la suppression. Vérifiez la console.");
      }
    }
  };

  /* FILTERING STATE */
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'week', 'month'

  const filteredDeclarations = declarations.filter(decl => {
    // 1. Text Search
    const searchLower = searchTerm.toLowerCase();
    const matchesText =
      decl.id.toLowerCase().includes(searchLower) ||
      decl.vehicle.plate.toLowerCase().includes(searchLower) ||
      ((decl.meta?.manualTaxpayer as any)?.name || '').toLowerCase().includes(searchLower);

    if (!matchesText) return false;

    // 2. Date Filter
    if (dateFilter === 'all') return true;

    const declDate = new Date(decl.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const declTime = new Date(declDate.getFullYear(), declDate.getMonth(), declDate.getDate()).getTime();

    if (dateFilter === 'today') {
      return declTime === today;
    }
    if (dateFilter === 'yesterday') {
      const yesterday = today - (24 * 60 * 60 * 1000);
      return declTime === yesterday;
    }
    if (dateFilter === 'week') {
      const weekAgo = today - (7 * 24 * 60 * 60 * 1000);
      return declTime >= weekAgo;
    }
    if (dateFilter === 'month') {
      const monthAgo = today - (30 * 24 * 60 * 60 * 1000);
      return declTime >= monthAgo;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-700 to-blurple-500 rounded-2xl p-8 text-white flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bonjour, Josuah</h1>
          <p className="text-violet-100">Bienvenue sur votre portail fiscal numérique.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/create"
            className="flex items-center gap-2 bg-white text-violet-700 px-5 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:bg-gray-50"
          >
            <FileText className="h-5 w-5" />
            Nouvelle Déclaration
          </Link>
          <Link
            href="/import"
            className="flex items-center gap-2 bg-white/10 text-white px-5 py-3 rounded-full font-semibold shadow-lg hover:bg-white/20 transition-all border border-white/20"
          >
            <FileText className="h-5 w-5" />
            Importer Excel
          </Link>
          <button
            onClick={regenerate}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
            title="Rafraîchir"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Déclarations Récentes <span className="text-gray-400 text-sm font-normal">({filteredDeclarations.length})</span>
        </h2>

        <div className="flex gap-3 w-full md:w-auto">
          {/* DATE FILTER */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
          >
            <option value="all">📅 Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="yesterday">Hier</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
          </select>

          {/* SEARCH INPUT */}
          <div className="relative flex-1 md:flex-none">
            <input
              type="text"
              placeholder="Rechercher (ID, Nom, Plaque)..."
              className="pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-violet-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredDeclarations.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
          <p className="text-gray-400">Aucune déclaration trouvée pour ces critères.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeclarations.map((decl) => (
            <div key={decl.id} className="relative group decl-card">
              {/* Le Link doit être en block pour prendre toute la place, mais on gère le bouton à part */}
              <Link href={`/declarations/${decl.id}/receipt`} className="block h-full">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all h-full flex flex-col">

                  {/* HEADER CARD */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-mint-50 rounded-lg flex items-center justify-center text-mint-600">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* STATUT */}
                      <span className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full uppercase",
                        decl.status === 'Payée' ? "bg-green-100 text-green-700" : "bg-violet-100 text-violet-700"
                      )}>
                        {decl.status}
                      </span>

                      {/* EDIT BUTTON (Admin Only) */}
                      <Link
                        href={`/edit/${decl.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all z-20"
                        title="Modifier ce dossier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>

                      {/* DELETE BUTTON (Admin Only) */}
                      <button
                        onClick={(e) => {
                          e.preventDefault(); // Empêche l'ouverture du Link
                          e.stopPropagation();
                          handleDelete(decl.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all z-20"
                        title="Supprimer ce dossier"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* CONTENT CARD */}
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 truncate" title={(decl.meta?.manualTaxpayer as any)?.name}>
                      {(decl.meta?.manualTaxpayer as any)?.name || 'Contribuable'}
                    </h3>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">{decl.vehicle.plate}</span>
                      <span className="text-xs text-gray-400 font-mono">{decl.id}</span>
                    </div>
                  </div>

                  {/* FOOTER CARD */}
                  <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">
                      FC {decl.tax.totalAmountFC.toLocaleString()}
                    </span>
                    <div className="flex items-center text-sm font-medium text-violet-600 group-hover:text-violet-700">
                      Voir <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>

                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper for class names
function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
