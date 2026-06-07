# Rubrique "Scan" — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une rubrique `/scan` qui extrait par IA (Claude Vision) les informations d'un véhicule depuis des photos de documents, puis crée la déclaration après confirmation humaine.

**Architecture:** Le navigateur redimensionne les photos et les envoie à une route serveur Next.js (`/api/extract`) qui appelle Claude Vision (clé API jamais exposée). L'IA renvoie un JSON structuré (valeurs + champs incertains + qualité photo). L'utilisateur revoit/corrige une fiche, puis on réutilise le `saveDeclaration()` existant.

**Tech Stack:** Next.js 16 (App Router), TypeScript, `@anthropic-ai/sdk`, Tailwind v4, vitest (tests unitaires de la logique prix).

---

## Structure des fichiers

| Fichier | Responsabilité |
|---------|----------------|
| `lib/scan-types.ts` (créer) | Types partagés (données extraites, payload image, résultat) |
| `lib/scan-pricing.ts` (créer) | Règle de prix Personnel/défaut + conversion FC (pur, testé) |
| `lib/scan-pricing.test.ts` (créer) | Tests unitaires de la logique prix |
| `lib/extraction-prompt.ts` (créer) | Prompt vision + schéma d'outil Claude |
| `lib/image-resize.ts` (créer) | Redimensionnement photo → base64 (navigateur) |
| `app/api/extract/route.ts` (créer) | Route serveur : appelle Claude, renvoie JSON |
| `app/(dashboard)/scan/page.tsx` (créer) | UI : 3 zones, fiche de revue, validation |
| `app/components/sidebar.tsx` (modifier) | Entrée de menu "Scan" |
| `package.json` (modifier) | Dépendances `@anthropic-ai/sdk` + `vitest` |

---

## Task 1: Installer les dépendances

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Installer le SDK Anthropic et vitest**

Run:
```bash
npm install @anthropic-ai/sdk
npm install -D vitest
```
Expected: `package.json` contient `@anthropic-ai/sdk` (dependencies) et `vitest` (devDependencies), installation sans erreur.

- [ ] **Step 2: Ajouter le script de test**

Dans `package.json`, section `"scripts"`, ajouter la ligne `"test": "vitest run"` :
```json
"scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
}
```
(Garde les scripts existants tels quels, ajoute seulement `test`.)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: ajoute @anthropic-ai/sdk et vitest pour la rubrique scan"
```

---

## Task 2: Types partagés

**Files:**
- Create: `lib/scan-types.ts`

- [ ] **Step 1: Créer le fichier de types**

```typescript
// Données extraites d'un document véhicule (toutes en string, telles que lues)
export interface DonneesVehicule {
    nom: string;
    nif: string;
    adresse: string;
    plaque: string;
    chassis: string;
    marque_type: string;
    cv: string;
    usage: string;
    genre: string;
    annee: string;
    couleur: string;
    poids: string;
}

// Une image prête à envoyer à l'API (base64 sans le préfixe data:)
export interface ImagePayload {
    base64: string;
    mediaType: string;
}

// Réponse structurée renvoyée par /api/extract
export interface ResultatExtraction {
    donnees: DonneesVehicule;
    champs_a_verifier: string[]; // clés de DonneesVehicule dont l'IA n'est pas sûre
    qualite_photo: 'bonne' | 'moyenne' | 'faible';
}
```

- [ ] **Step 2: Vérifier la compilation des types**

Run: `npx tsc --noEmit`
Expected: Aucune erreur liée à `lib/scan-types.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/scan-types.ts
git commit -m "feat(scan): types partagés pour l'extraction"
```

---

## Task 3: Logique de prix (TDD)

**Files:**
- Create: `lib/scan-pricing.ts`
- Test: `lib/scan-pricing.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

```typescript
// lib/scan-pricing.test.ts
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
    it('multiplie le prix de base par 2355', () => {
        expect(TAUX_FC).toBe(2355);
        expect(montantFC(58.70)).toBe(138238.5);
        expect(montantFC(64.50)).toBe(151897.5);
    });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run lib/scan-pricing.test.ts`
Expected: FAIL — `Failed to resolve import "./scan-pricing"` (le fichier n'existe pas encore).

- [ ] **Step 3: Écrire l'implémentation minimale**

```typescript
// lib/scan-pricing.ts

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
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `npx vitest run lib/scan-pricing.test.ts`
Expected: PASS (3 suites, tous les cas verts).

- [ ] **Step 5: Commit**

```bash
git add lib/scan-pricing.ts lib/scan-pricing.test.ts
git commit -m "feat(scan): règle de prix Personnel/défaut avec tests unitaires"
```

---

## Task 4: Prompt d'extraction + schéma d'outil

**Files:**
- Create: `lib/extraction-prompt.ts`

- [ ] **Step 1: Créer le prompt et le schéma d'outil**

```typescript
// lib/extraction-prompt.ts

// Schéma d'outil forcé : garantit une sortie JSON structurée de Claude.
export const EXTRACTION_TOOL = {
    name: 'extraire_vehicule',
    description:
        "Enregistre les informations extraites d'un ou plusieurs documents véhicule de la RDC (carte rose/violette, volet jaune, demande d'immatriculation).",
    input_schema: {
        type: 'object' as const,
        properties: {
            donnees: {
                type: 'object',
                properties: {
                    nom: { type: 'string', description: 'Nom ou raison sociale du propriétaire/assujetti' },
                    nif: { type: 'string', description: 'Numéro impôt / NIF. Vide "" si absent.' },
                    adresse: { type: 'string', description: 'Adresse physique complète' },
                    plaque: { type: 'string', description: "Numéro de plaque d'immatriculation" },
                    chassis: { type: 'string', description: 'Numéro de châssis' },
                    marque_type: { type: 'string', description: 'Marque et type/modèle (ex: SUZUKI SWIFT)' },
                    cv: { type: 'string', description: 'Puissance fiscale en CV, chiffres uniquement (ex: "8")' },
                    usage: { type: 'string', description: 'Usage (Personnel, Transport, Marchandises, Taxi, ...)' },
                    genre: { type: 'string', description: 'Genre (Voiture, Jeep, Bus, Camion, Moto, ...)' },
                    annee: { type: 'string', description: 'Année de fabrication' },
                    couleur: { type: 'string', description: 'Couleur du véhicule' },
                    poids: { type: 'string', description: 'Poids si présent, sinon vide ""' },
                },
                required: ['nom', 'nif', 'adresse', 'plaque', 'chassis', 'marque_type', 'cv', 'usage', 'genre', 'annee', 'couleur', 'poids'],
            },
            champs_a_verifier: {
                type: 'array',
                items: { type: 'string' },
                description: "Noms des champs de 'donnees' dont la lecture est incertaine, illisible ou ambiguë.",
            },
            qualite_photo: {
                type: 'string',
                enum: ['bonne', 'moyenne', 'faible'],
                description: 'Qualité globale de lisibilité des photos fournies.',
            },
        },
        required: ['donnees', 'champs_a_verifier', 'qualite_photo'],
    },
};

// Construit le prompt selon le type de document soumis.
export function buildPrompt(typeDoc: 'page' | 'carte'): string {
    const contexte =
        typeDoc === 'carte'
            ? "Tu reçois 2 photos d'une carte: la FACE PROPRIÉTAIRE (recto: nom, adresse, NIF) puis la FACE VÉHICULE (verso: marque, plaque, châssis, CV, usage, année)."
            : "Tu reçois 1 photo d'un document complet (volet jaune / note de perception, demande d'immatriculation manuscrite, ou carte dont les 2 faces sont sur la même image).";

    return [
        "Tu es un assistant d'extraction de données pour la Direction Générale des Recettes de Kinshasa (RDC).",
        contexte,
        "Extrais les informations du propriétaire et du véhicule, puis appelle l'outil 'extraire_vehicule'.",
        'RÈGLES STRICTES:',
        "- N'invente JAMAIS une valeur. Si une information est absente ou illisible, mets une chaîne vide \"\".",
        "- Mets dans 'champs_a_verifier' le nom de CHAQUE champ dont tu n'es pas certain (manuscrit difficile, reflet, ambiguïté).",
        "- 'cv' = chiffres uniquement (ex: \"8\").",
        "- Pour 'usage' et 'genre', recopie le terme exact lu sur le document.",
        "- Évalue 'qualite_photo' honnêtement selon la lisibilité globale.",
    ].join('\n');
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: Aucune erreur liée à `lib/extraction-prompt.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/extraction-prompt.ts
git commit -m "feat(scan): prompt vision + schéma d'outil d'extraction"
```

---

## Task 5: Route serveur d'extraction

**Files:**
- Create: `app/api/extract/route.ts`

- [ ] **Step 1: Créer la route API**

```typescript
// app/api/extract/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { EXTRACTION_TOOL, buildPrompt } from '@/lib/extraction-prompt';
import { ImagePayload, ResultatExtraction } from '@/lib/scan-types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = 'claude-sonnet-4-6';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return Response.json(
                { error: "Service d'extraction non configuré (ANTHROPIC_API_KEY absente côté serveur)." },
                { status: 500 }
            );
        }

        const body = (await req.json()) as { images: ImagePayload[]; typeDoc: 'page' | 'carte' };
        if (!body?.images?.length) {
            return Response.json({ error: 'Aucune image fournie.' }, { status: 400 });
        }

        const client = new Anthropic({ apiKey });

        const content: Anthropic.MessageParam['content'] = [
            { type: 'text', text: buildPrompt(body.typeDoc) },
        ];
        for (const img of body.images) {
            content.push({
                type: 'image',
                source: { type: 'base64', media_type: img.mediaType as 'image/jpeg', data: img.base64 },
            });
        }

        const msg = await client.messages.create({
            model: MODEL,
            max_tokens: 1024,
            tools: [EXTRACTION_TOOL as Anthropic.Tool],
            tool_choice: { type: 'tool', name: 'extraire_vehicule' },
            messages: [{ role: 'user', content }],
        });

        const toolUse = msg.content.find((c) => c.type === 'tool_use');
        if (!toolUse || toolUse.type !== 'tool_use') {
            return Response.json({ error: "L'IA n'a pas pu structurer la réponse." }, { status: 502 });
        }

        return Response.json(toolUse.input as ResultatExtraction);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Erreur du service d'extraction.";
        console.error('Extract error:', e);
        return Response.json({ error: message }, { status: 500 });
    }
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: Aucune erreur liée à `app/api/extract/route.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/api/extract/route.ts
git commit -m "feat(scan): route serveur /api/extract (Claude Vision)"
```

---

## Task 6: Redimensionnement d'image (navigateur)

**Files:**
- Create: `lib/image-resize.ts`

- [ ] **Step 1: Créer l'utilitaire de redimensionnement**

```typescript
// lib/image-resize.ts
import { ImagePayload } from './scan-types';

// Charge un fichier image, le redimensionne (max maxDim px) et renvoie le base64 JPEG.
export async function resizeImageToBase64(
    file: File,
    maxDim = 1600,
    quality = 0.85
): Promise<ImagePayload> {
    const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
        reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image invalide'));
        image.src = dataUrl;
    });

    let width = img.width;
    let height = img.height;
    if (width > maxDim || height > maxDim) {
        if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
        } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
        }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas non supporté par le navigateur');
    ctx.drawImage(img, 0, 0, width, height);

    const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
    const base64 = jpegDataUrl.split(',')[1];
    return { base64, mediaType: 'image/jpeg' };
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: Aucune erreur liée à `lib/image-resize.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/image-resize.ts
git commit -m "feat(scan): redimensionnement des photos avant envoi"
```

---

## Task 7: Page Scan (UI)

**Files:**
- Create: `app/(dashboard)/scan/page.tsx`

- [ ] **Step 1: Créer la page complète**

```tsx
'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ScanLine, Loader2, CheckCircle2, AlertTriangle, RotateCcw, Save } from 'lucide-react';
import { resizeImageToBase64 } from '@/lib/image-resize';
import { proposerPrixBase, parseCv, montantFC } from '@/lib/scan-pricing';
import { saveDeclaration } from '@/lib/store';
import { generateDeclarationId, generateNoteId, getSecureSequence } from '@/lib/generator';
import { Declaration } from '@/types';
import { DonneesVehicule, ResultatExtraction } from '@/lib/scan-types';

type Mode = 'page' | 'carte';
type Statut = 'idle' | 'extracting' | 'review' | 'saving' | 'saved' | 'error';

const CHAMPS_VIDES: DonneesVehicule = {
    nom: '', nif: '', adresse: '', plaque: '', chassis: '',
    marque_type: '', cv: '', usage: '', genre: '', annee: '', couleur: '', poids: '',
};

export default function ScanPage() {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>('carte');
    const [filePage, setFilePage] = useState<File | null>(null);
    const [fileRecto, setFileRecto] = useState<File | null>(null);
    const [fileVerso, setFileVerso] = useState<File | null>(null);

    const [statut, setStatut] = useState<Statut>('idle');
    const [erreur, setErreur] = useState<string>('');
    const [donnees, setDonnees] = useState<DonneesVehicule>(CHAMPS_VIDES);
    const [aVerifier, setAVerifier] = useState<string[]>([]);
    const [qualite, setQualite] = useState<ResultatExtraction['qualite_photo']>('bonne');
    const [prixBase, setPrixBase] = useState<number>(64.50);
    const [savedId, setSavedId] = useState<string>('');

    const previews = {
        page: filePage ? URL.createObjectURL(filePage) : '',
        recto: fileRecto ? URL.createObjectURL(fileRecto) : '',
        verso: fileVerso ? URL.createObjectURL(fileVerso) : '',
    };

    const setField = (k: keyof DonneesVehicule, v: string) => {
        const next = { ...donnees, [k]: v };
        setDonnees(next);
        if (k === 'usage' || k === 'cv') {
            setPrixBase(proposerPrixBase(next.usage, parseCv(next.cv)));
        }
    };

    const handleExtract = async () => {
        setErreur('');
        const files: File[] = mode === 'page'
            ? (filePage ? [filePage] : [])
            : [fileRecto, fileVerso].filter(Boolean) as File[];

        if (mode === 'page' && !filePage) { setErreur('Ajoute la photo du document (Zone 1).'); return; }
        if (mode === 'carte' && (!fileRecto || !fileVerso)) { setErreur('Ajoute le recto ET le verso de la carte.'); return; }

        setStatut('extracting');
        try {
            const images = await Promise.all(files.map((f) => resizeImageToBase64(f)));
            const res = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images, typeDoc: mode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Échec de l\'extraction');

            const r = data as ResultatExtraction;
            setDonnees(r.donnees);
            setAVerifier(r.champs_a_verifier || []);
            setQualite(r.qualite_photo || 'bonne');
            setPrixBase(proposerPrixBase(r.donnees.usage, parseCv(r.donnees.cv)));
            setStatut('review');
        } catch (e) {
            setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
            setStatut('error');
        }
    };

    const handleValidate = async () => {
        if (!donnees.plaque.trim()) { setErreur('La plaque est obligatoire.'); return; }
        setErreur('');
        setStatut('saving');
        try {
            const sequence = getSecureSequence();
            const id = generateDeclarationId(sequence);
            const noteId = generateNoteId(sequence);
            const now = new Date().toISOString();
            const totalFC = montantFC(prixBase);

            const nom = (donnees.nom || 'INCONNU').toUpperCase();
            const nif = (donnees.nif || 'N/A').toUpperCase();
            const adresse = (donnees.adresse || 'KINSHASA').toUpperCase();

            const newDecl: Declaration = {
                id,
                status: 'Payée',
                createdAt: now,
                updatedAt: now,
                taxpayer: { name: nom, nif, address: adresse, type: 'N/A' },
                vehicle: {
                    plate: donnees.plaque.toUpperCase(),
                    chassis: donnees.chassis.toUpperCase(),
                    marque: donnees.marque_type.toUpperCase(),
                    modele: '',
                    fiscalPower: `${parseCv(donnees.cv)} CV`,
                    category: 'Vignette Automobile',
                    genre: 'N/A',
                    couleur: donnees.couleur || '',
                    annee: donnees.annee || '',
                    weight: donnees.poids || '-',
                    type: 'N/A',
                } as Declaration['vehicle'],
                tax: { baseRate: prixBase, currency: 'USD', totalAmountFC: totalFC },
                meta: {
                    systemId: id,
                    reference: noteId.replace('NDP - 2026-', ''),
                    ndpId: noteId,
                    manualBaseAmount: prixBase,
                    manualTaxpayer: { name: nom, nif, address: adresse },
                    manualPlate: donnees.plaque.toUpperCase(),
                    manualNIF: nif,
                    manualTaxpayerName: nom,
                    manualTaxpayerAddress: adresse,
                    source: 'scan',
                },
            };

            const result = await saveDeclaration(newDecl);
            if (!result.success) throw new Error(result.error || 'Échec de l\'enregistrement');
            setSavedId(id);
            setStatut('saved');
        } catch (e) {
            setErreur(e instanceof Error ? e.message : 'Erreur inconnue');
            setStatut('error');
        }
    };

    const handleReset = () => {
        setFilePage(null); setFileRecto(null); setFileVerso(null);
        setDonnees(CHAMPS_VIDES); setAVerifier([]); setQualite('bonne');
        setPrixBase(64.50); setSavedId(''); setErreur(''); setStatut('idle');
    };

    const champClass = (k: keyof DonneesVehicule) =>
        `w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500 ${
            aVerifier.includes(k) ? 'border-amber-400 bg-amber-50' : 'border-gray-300 bg-white'
        }`;

    // IMPORTANT : fonction (pas un composant interne) pour éviter la perte de focus
    // des inputs à chaque frappe (un composant redéfini à chaque render serait remonté).
    const renderChamp = (k: keyof DonneesVehicule, label: string) => (
        <div className="flex flex-col gap-1" key={k}>
            <label className="text-[11px] uppercase font-bold text-gray-500 tracking-wide flex items-center gap-1">
                {label}
                {aVerifier.includes(k) && <AlertTriangle className="h-3 w-3 text-amber-500" />}
            </label>
            <input className={champClass(k)} value={donnees[k]} onChange={(e) => setField(k, e.target.value)} />
        </div>
    );

    // --- Écran de succès ---
    if (statut === 'saved') {
        return (
            <div className="max-w-2xl mx-auto py-20 px-4 text-center">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900">Véhicule enregistré</h1>
                <p className="text-gray-500 mt-2 font-mono">{savedId}</p>
                <div className="flex gap-3 justify-center mt-8">
                    <button onClick={handleReset} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700">
                        <ScanLine className="h-4 w-4" /> Nouveau véhicule
                    </button>
                    <button onClick={() => router.push(`/declarations/${savedId}/receipt`)} className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                        Voir le récépissé
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Scan IA</h1>
                    <p className="text-gray-500 text-sm">Extraction automatique depuis les documents.</p>
                </div>
            </div>

            {erreur && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> {erreur}
                </div>
            )}

            {statut !== 'review' && (
                <>
                    {/* Choix du mode */}
                    <div className="flex gap-2 mb-6">
                        <button onClick={() => setMode('page')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${mode === 'page' ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-white border-gray-200 text-gray-600'}`}>Document 1 page</button>
                        <button onClick={() => setMode('carte')} className={`px-4 py-2 rounded-lg text-sm font-medium border ${mode === 'carte' ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-white border-gray-200 text-gray-600'}`}>Carte 2 faces</button>
                    </div>

                    {/* Zones d'upload */}
                    {mode === 'page' ? (
                        <ZoneUpload label="ZONE 1 — Document 1 page" hint="Volet jaune, demande d'immatriculation, ou carte (2 faces sur une photo)" preview={previews.page} onFile={setFilePage} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ZoneUpload label="ZONE 2 — Carte RECTO (Propriétaire)" hint="Nom, adresse, NIF" preview={previews.recto} onFile={setFileRecto} />
                            <ZoneUpload label="ZONE 3 — Carte VERSO (Véhicule)" hint="Marque, plaque, châssis, CV" preview={previews.verso} onFile={setFileVerso} />
                        </div>
                    )}

                    <button
                        onClick={handleExtract}
                        disabled={statut === 'extracting'}
                        className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50"
                    >
                        {statut === 'extracting' ? <><Loader2 className="h-5 w-5 animate-spin" /> Lecture en cours…</> : <><ScanLine className="h-5 w-5" /> Extraire avec l'IA</>}
                    </button>
                </>
            )}

            {statut === 'review' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Photos */}
                    <div className="space-y-3">
                        {qualite === 'faible' && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> Qualité photo faible — vérifie chaque champ attentivement.
                            </div>
                        )}
                        {mode === 'page' && previews.page && <img src={previews.page} alt="document" className="w-full rounded-lg border" />}
                        {mode === 'carte' && previews.recto && <img src={previews.recto} alt="recto" className="w-full rounded-lg border" />}
                        {mode === 'carte' && previews.verso && <img src={previews.verso} alt="verso" className="w-full rounded-lg border" />}
                    </div>

                    {/* Formulaire de revue */}
                    <div className="space-y-4">
                        <div className="border rounded-lg p-4 bg-white">
                            <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">Contribuable</h3>
                            <div className="space-y-3">
                                {renderChamp('nom', 'Nom / Raison Sociale')}
                                {renderChamp('nif', 'NIF')}
                                {renderChamp('adresse', 'Adresse')}
                            </div>
                        </div>
                        <div className="border rounded-lg p-4 bg-white">
                            <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">Véhicule</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {renderChamp('plaque', 'Plaque')}
                                {renderChamp('chassis', 'Chassis')}
                                {renderChamp('marque_type', 'Marque / Type')}
                                {renderChamp('cv', 'CV')}
                                {renderChamp('usage', 'Usage')}
                                {renderChamp('genre', 'Genre')}
                                {renderChamp('annee', 'Année')}
                                {renderChamp('couleur', 'Couleur')}
                                {renderChamp('poids', 'Poids')}
                            </div>
                        </div>
                        <div className="border rounded-lg p-4 bg-white">
                            <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">Taxation</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[11px] uppercase font-bold text-gray-500">Prix de base ($)</label>
                                    <select value={prixBase} onChange={(e) => setPrixBase(parseFloat(e.target.value))} className="px-3 py-2 text-sm border border-gray-300 rounded-md font-mono">
                                        <option value={58.70}>58.70</option>
                                        <option value={58.20}>58.20</option>
                                        <option value={63.10}>63.10</option>
                                        <option value={64.50}>64.50</option>
                                        <option value={68.20}>68.20</option>
                                        <option value={70.10}>70.10</option>
                                        <option value={70.30}>70.30</option>
                                    </select>
                                </div>
                                <div className="ml-auto text-right">
                                    <div className="text-[11px] uppercase font-bold text-gray-500">Montant total</div>
                                    <div className="text-xl font-extrabold text-[#D32F2F]">FC {montantFC(prixBase).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                                <RotateCcw className="h-4 w-4" /> Recommencer
                            </button>
                            <button onClick={handleValidate} disabled={statut === 'saving'} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
                                {statut === 'saving' ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</> : <><Save className="h-4 w-4" /> Valider & Enregistrer</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Zone d'upload réutilisable
function ZoneUpload({ label, hint, preview, onFile }: { label: string; hint: string; preview: string; onFile: (f: File) => void }) {
    return (
        <label className="block border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-violet-400 transition-colors bg-white">
            <div className="text-[11px] font-bold uppercase text-gray-500 tracking-wide">{label}</div>
            <div className="text-[11px] text-gray-400 mb-2">{hint}</div>
            {preview ? (
                <img src={preview} alt="aperçu" className="w-full h-48 object-contain rounded-md" />
            ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Cliquer pour ajouter une photo</div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </label>
    );
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: Aucune erreur liée à `app/(dashboard)/scan/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add "app/(dashboard)/scan/page.tsx"
git commit -m "feat(scan): page UI (3 zones, fiche de revue, validation)"
```

---

## Task 8: Entrée de menu "Scan"

**Files:**
- Modify: `app/components/sidebar.tsx`

- [ ] **Step 1: Ajouter l'icône et l'entrée de navigation**

Modifier la ligne d'import des icônes (ligne 6) pour ajouter `ScanLine` :
```tsx
import { LayoutDashboard, FileText, Settings, LogOut, Briefcase, ScanLine } from 'lucide-react';
```

Puis ajouter l'entrée dans le tableau `navigation` (après "Tableau de bord") :
```tsx
const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Scan IA', href: '/scan', icon: ScanLine },
    { name: 'Déclarations', href: '/declarations', icon: FileText },
    { name: 'Dossiers Entreprises', href: '/societes', icon: Briefcase },
    { name: 'Paramètres', href: '/settings', icon: Settings },
];
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: Aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add app/components/sidebar.tsx
git commit -m "feat(scan): entrée 'Scan IA' dans la sidebar"
```

---

## Task 9: Build, vérification & déploiement

**Files:** (aucun nouveau)

- [ ] **Step 1: Lancer tous les tests unitaires**

Run: `npm test`
Expected: PASS (suite `scan-pricing`).

- [ ] **Step 2: Build de production local**

Run: `npm run build`
Expected: `✓ Compiled successfully`, la route `/scan` et `/api/extract` apparaissent dans la liste des routes, aucune erreur TypeScript.

- [ ] **Step 3: Vérifier la variable d'environnement en local (optionnel)**

Créer un fichier `.env.local` (déjà dans `.gitignore`) avec :
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```
Run: `npm run dev`
Puis ouvrir `http://localhost:3000/scan` et tester avec une vraie photo de chaque type :
- Carte rose recto+verso (mode "Carte 2 faces")
- Volet jaune (mode "Document 1 page")
- Demande d'immatriculation manuscrite (mode "Document 1 page")

Vérifier : champs pré-remplis, champs incertains surlignés en jaune, prix proposé correct (Personnel ≤10 → 58.70), enregistrement → récépissé visible.

- [ ] **Step 4: Pousser sur GitHub (déploiement Vercel automatique)**

```bash
git push origin main
```
Expected: Vercel déclenche un build. ⚠️ **Prérequis Vercel** : `ANTHROPIC_API_KEY` doit être ajoutée dans Settings → Environment Variables (Production + Preview + Development) avant que `/scan` fonctionne en ligne.

- [ ] **Step 5: Vérifier en production**

Ouvrir `https://irms-dgrk-tax.vercel.app/scan`, tester avec une photo réelle, confirmer l'enregistrement et l'apparition de la déclaration sur le tableau de bord.

---

## Notes de couverture (auto-revue)

- **Sécurité (spec §3)** : clé API uniquement côté serveur (Task 5), jamais dans le bundle navigateur. ✅
- **3 zones + un véhicule à la fois (spec §4)** : Task 7 (modes page/carte). ✅
- **Confiance par champ + revue (spec §5)** : `champs_a_verifier` → surlignage jaune (Task 7). ✅
- **Règle de prix (spec §6)** : Task 3 (testée), appliquée en Task 7. ✅
- **Gestion d'erreurs (spec §7)** : photo faible (bandeau), API en panne (message + formulaire utilisable), plaque obligatoire (blocage). Task 5 + Task 7. ✅
- **Réutilisation de saveDeclaration (spec §8)** : Task 7 construit un `Declaration` identique à l'import Excel + `manualBaseAmount` pour cohérence récépissé/bordereau. ✅
- **Détection de doublon de plaque (spec §7)** : ⚠️ NON incluse dans cette v1 pour rester simple — à ajouter plus tard si besoin (nécessite un lookup avant save). Signalé ici pour transparence.
