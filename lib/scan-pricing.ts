// Taux de change fixe USD -> FC (cohérent avec le reste du système)
export const TAUX_FC = 2355;

// Extrait le nombre de CV depuis une chaîne ("08", "9 CV", "11cv" -> 8, 9, 11)
export function parseCv(cvRaw: string): number {
    const m = String(cvRaw || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}

// Règle métier:
//   Usage Personnel (tout genre): 0-10 CV -> 58.70 ; 11 CV et + -> 64.50
//   Tout autre usage: 64.50 par défaut (corrigeable ensuite)
export function proposerPrixBase(usage: string, cv: number): number {
    const estPersonnel = /personnel/i.test(usage || '');
    if (estPersonnel) {
        return cv <= 10 ? 58.70 : 64.50;
    }
    return 64.50;
}

// Montant en Francs Congolais à partir du prix de base USD
export function montantFC(prixBase: number): number {
    return Math.round(prixBase * TAUX_FC * 100) / 100;
}
