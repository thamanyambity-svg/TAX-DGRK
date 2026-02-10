// Enums extracted from screenshots
export type TaxpayerType = 'Personne Morale' | 'Personne Physique';

export type VehicleCategory =
  | 'Vignette Automobile'
  | 'Motocycle'
  | 'Véhicule utilitaire'
  | 'Véhicule touristique'
  | 'touristique_light'
  | 'utilitaire_heavy'
  | 'Véhicule tracteur'
  | 'Véhicule remorque'
  | 'Transport public'
  | 'Immatriculé IT'
  | 'Exonéré';

export type DeclarationStatus = 'Payée' | 'En attente' | 'Facturée';

export interface VehicleInfo {
  category: VehicleCategory;
  plate: string;
  type: TaxpayerType;
  chassis: string;
  fiscalPower: string; // e.g. "11 CV"
  weight: string; // e.g. "1 tonnes"
  marque?: string;
  modele?: string;
  genre?: string;
  couleur?: string;
  annee?: string;
  imageUrl?: string;
}

export interface TaxBreakdown {
  baseRate: number;
  currency: 'USD' | 'FC';
  totalAmountFC: number; // e.g. 151910
  exchangeRate?: number; // implied
}

export interface Declaration {
  id: string; // e.g. "DECL-2026-B9ED76"
  createdAt: string; // ISO date
  updatedAt: string;
  status: DeclarationStatus;
  vehicle: VehicleInfo;
  tax: TaxBreakdown;
  taxpayer?: {
    name: string;
    nif: string;
    address: string;
    type: string;
  };
  meta: {
    systemId: string;
    reference: string; // "Provincial Decree..."
    [key: string]: any;
  };
}

export interface NoteDePerception {
  id: string; // e.g. "NDP-2026-1579A471"
  declarationId: string;
  taxpayer: {
    name: string; // "JOSUAH KITONA"
    nif: string; // "KN19371612"
    address: string; // "N/A, Makala"
  };
  vehicle: {
    chassis: string;
    plate: string;
    category: VehicleCategory;
    fiscalPower: string;
    genre?: string;
    marque?: string;
    modele?: string;
    weight?: string;
    type?: string;
  };
  bankDetails: {
    reservedBox: boolean; // placeholder for UI
  };
  payment: {
    principalTaxUSD: number;
    totalAmountFC: number;
  };
  generatedAt: string;
}
