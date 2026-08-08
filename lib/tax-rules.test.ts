import { describe, it, expect } from 'vitest';
import { calculateAccountingBilletage, calculateTax, USD_DENOMINATIONS } from './tax-rules';

describe('USD_DENOMINATIONS', () => {
    it("n'inclut pas le billet de 2 USD", () => {
        expect(USD_DENOMINATIONS).not.toContain(2);
    });

    it('liste les coupures en circulation, ordre décroissant', () => {
        expect(USD_DENOMINATIONS).toEqual([100, 50, 20, 10, 5, 1]);
    });

    it('est gelée : une coupure ne peut pas être réintroduite à chaud', () => {
        expect(Object.isFrozen(USD_DENOMINATIONS)).toBe(true);
        // En mode non strict la mutation échoue silencieusement, en strict elle jette :
        // les deux sont acceptables, ce qui compte est que la liste ne bouge pas.
        try {
            (USD_DENOMINATIONS as unknown as number[]).push(2);
        } catch {
            // TypeError attendue en mode strict
        }
        expect(USD_DENOMINATIONS).toEqual([100, 50, 20, 10, 5, 1]);
        expect(calculateAccountingBilletage(63).map((r) => r.value)).not.toContain(2);
    });
});

describe('calculateAccountingBilletage', () => {
    it("n'émet jamais de coupure de 2 USD", () => {
        for (let montant = 1; montant <= 500; montant++) {
            const values = calculateAccountingBilletage(montant).map((r) => r.value);
            expect(values).not.toContain(2);
        }
    });

    it("n'émet que des coupures existantes", () => {
        for (let montant = 1; montant <= 500; montant++) {
            for (const row of calculateAccountingBilletage(montant)) {
                expect(USD_DENOMINATIONS).toContain(row.value);
            }
        }
    });

    it('décompose les totaux réels des bordereaux', () => {
        // 58.20/58.70 -> ceil + 4 = 63
        expect(calculateAccountingBilletage(63)).toEqual([
            { value: 50, count: 1, total: 50 },
            { value: 10, count: 1, total: 10 },
            { value: 1, count: 3, total: 3 },
        ]);
        // 64.50 -> ceil + 4 = 69
        expect(calculateAccountingBilletage(69)).toEqual([
            { value: 50, count: 1, total: 50 },
            { value: 10, count: 1, total: 10 },
            { value: 5, count: 1, total: 5 },
            { value: 1, count: 4, total: 4 },
        ]);
        // 68.20 -> ceil + 4 = 73
        expect(calculateAccountingBilletage(73)).toEqual([
            { value: 50, count: 1, total: 50 },
            { value: 20, count: 1, total: 20 },
            { value: 1, count: 3, total: 3 },
        ]);
    });

    it('conserve la somme des coupures égale au montant', () => {
        for (let montant = 1; montant <= 500; montant++) {
            const somme = calculateAccountingBilletage(montant).reduce((acc, r) => acc + r.total, 0);
            expect(Math.round(somme * 100) / 100).toBe(montant);
        }
    });
});

describe('calculateTax', () => {
    it('produit un billetage sans 2 USD pour les catégories courantes', () => {
        const cas: [number, string, string | undefined][] = [
            [8, 'touristique_light', undefined],
            [8, 'touristique_updated', undefined],
            [12, 'touristique_medium', undefined],
            [15, 'utilitaire_heavy', '8 tonnes'],
            [15, 'utilitaire_heavy', '15 tonnes'],
        ];
        for (const [cv, type, poids] of cas) {
            const res = calculateTax(cv, type, poids);
            const somme = res.billBreakdown.reduce((acc, r) => acc + r.total, 0);
            expect(res.billBreakdown.map((r) => r.value)).not.toContain(2);
            expect(Math.round(somme * 100) / 100).toBe(res.totalAmount);
        }
    });
});
