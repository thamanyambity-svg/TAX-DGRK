// Gestion du mode tarifaire (localStorage)
// 'legacy'   = Ancienne grille (système actuel 2025)
// 'new2026'  = Nouvelle grille Arrêté Hôtel de Ville 30 Jan 2026

export type TariffMode = 'legacy' | 'new2026';

const KEY = 'tariff_mode';

export function getTariffMode(): TariffMode {
    if (typeof window === 'undefined') return 'legacy';
    return (localStorage.getItem(KEY) as TariffMode) || 'legacy';
}

export function setTariffMode(mode: TariffMode): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY, mode);
    // Émettre un événement pour que les composants React se re-rendent
    window.dispatchEvent(new CustomEvent('tariffModeChanged', { detail: mode }));
}

export function useTariffModeLabel(mode: TariffMode): string {
    return mode === 'new2026'
        ? '🆕 Grille 2026 (Arrêté HVK)'
        : '📋 Grille Actuelle (Système existant)';
}
