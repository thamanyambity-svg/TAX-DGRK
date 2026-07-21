import { describe, it, expect } from 'vitest';
import { proposerPrixBase, parseCv, montantFC, TAUX_FC } from './scan-pricing';

describe('proposerPrixBase', () => {
    it('Personnel ≤ 10 CV → 58.70', () => {
        expect(proposerPrixBase('Personnel', 8)).toBe(58.70);
        expect(proposerPrixBase('PERSONNEL', 10)).toBe(58.70);
        expect(proposerPrixBase('personnel', 0)).toBe(58.70);
    });
    it('Personnel ≥ 11 CV → 64.50', () => {
        expect(proposerPrixBase('Personnel', 11)).toBe(64.50);
        expect(proposerPrixBase('personnel', 24)).toBe(64.50);
    });
    it('Usage autre que Personnel → 64.50 par défaut', () => {
        expect(proposerPrixBase('Transport', 8)).toBe(64.50);
        expect(proposerPrixBase('Marchandises', 30)).toBe(64.50);
        expect(proposerPrixBase('', 5)).toBe(64.50);
    });
});

describe('parseCv', () => {
    it('extrait le nombre depuis des formats variés', () => {
        expect(parseCv('08')).toBe(8);
        expect(parseCv('9 CV')).toBe(9);
        expect(parseCv('11cv')).toBe(11);
        expect(parseCv('')).toBe(0);
        expect(parseCv('inconnu')).toBe(0);
    });
});

describe('montantFC', () => {
    it('multiplie le prix de base par 2244.76', () => {
        expect(TAUX_FC).toBe(2244.76);
        expect(montantFC(58.70)).toBe(141756.39);
        expect(montantFC(64.50)).toBe(155762.98);
    });
});
