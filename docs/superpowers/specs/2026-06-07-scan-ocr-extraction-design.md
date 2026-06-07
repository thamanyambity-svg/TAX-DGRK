# Design — Rubrique "Scan" : extraction automatique des déclarations par IA

**Date :** 2026-06-07
**Projet :** TAX-DGRK (`irms-dgrk-tax.vercel.app`)
**Auteur :** Alpha + Claude

---

## 1. Objectif

Permettre l'enregistrement rapide des déclarations de vignette en **extrayant
automatiquement** les informations depuis des photos de documents officiels,
au lieu de tout retaper à la main. Cible : pouvoir traiter de gros volumes
(1000+ contribuables) tout en gardant un **contrôle humain** sur chaque saisie.

Contrainte forte du métier : **la lecture IA peut être fausse** (qualité photo
variable, manuscrit). Donc rien n'est enregistré sans que l'utilisateur ait
**confirmé par écrit** les informations extraites.

---

## 2. Documents pris en charge (6 modèles)

| # | Type | Format | Infos clés |
|---|------|--------|------------|
| 1 | Carte rose (ancien certificat DGI) | Recto + verso (2 photos) | Recto = propriétaire · Verso = véhicule |
| 2 | Carte violette (nouveau certificat) | Recto + verso (souvent 1 photo des 2 faces) | Propriétaire en haut, véhicule en bas |
| 3 | Volet jaune (note de perception) | 1 page | Tout sur une page |
| 4 | Demande d'immatriculation (DGI) | 1 page, **manuscrite** | Cases entourées (Genre/Usage), écriture main |

> Les modèles "1 page" (volet jaune, demande d'immatriculation, carte 2-faces
> photographiée en une seule image) passent par **Zone 1**.
> La carte vraiment recto/verso en 2 photos passe par **Zones 2 + 3**.

### Champs à extraire (alignés sur le récépissé)

`Nom/Raison Sociale` · `NIF` · `Adresse` · `Plaque` · `Chassis` ·
`Marque/Type` · `CV (puissance fiscale)` · `Usage` · `Genre` · `Année` ·
`Couleur` · `Poids`

---

## 3. Architecture

Nouvelle route : **`/scan`** (ajoutée à la sidebar, à côté de "Importer Excel").

```
Navigateur (page /scan)                Serveur (API route)            Anthropic
─────────────────────                  ───────────────────            ─────────
3 zones d'upload  ── photo(s) ──►   /api/extract  ── image+prompt ──► Claude Vision
(redim. avant envoi)                     │                                 │
fiche de revue  ◄── JSON structuré ──────┘   ◄──── champs + confiance ────┘
 (✅/⚠️ par champ)
      │
 valider ──► saveDeclaration() ──► déclaration ──► récépissé + bordereau
```

### Sécurité

- L'appel à Claude se fait **exclusivement côté serveur** dans
  `app/api/extract/route.ts`.
- La clé API vit dans la variable d'environnement **`ANTHROPIC_API_KEY`**
  (Vercel), **jamais** exposée au navigateur.

### Modèle

- **Claude Sonnet** (`claude-sonnet-4-6`) pour la vision — meilleur sur le
  manuscrit et les photos avec reflets.
- Bascule possible vers Haiku en changeant une constante (coût ↓, précision ↓).
- Coût estimé : ~0,01–0,03 $/doc → ~10–30 $ pour 1000 véhicules.

### Prérequis (action utilisateur)

1. Créer une clé API sur **console.anthropic.com** (Pro ≠ API : crédits séparés).
2. Ajouter des crédits API (~20 $ pour démarrer).
3. Ajouter `ANTHROPIC_API_KEY` dans Vercel (Production + Preview + Development).

---

## 4. Flux utilisateur (un véhicule à la fois)

```
Étape 1 │ Choix du cas :
        │   • "Document 1 page"  → photo dans ZONE 1
        │   • "Carte 2 faces"    → recto ZONE 2 + verso ZONE 3
        ▼
Étape 2 │ [ Extraire avec l'IA ]  → "🔍 Lecture en cours…"
        ▼
Étape 3 │ FICHE DE REVUE (photo(s) à gauche, formulaire éditable à droite)
        ▼
Étape 4 │ Vérification/correction (champs ⚠️ surlignés) → [ Valider & Enregistrer ]
        ▼
Étape 5 │ "✅ Enregistré (DECL-2026-XXXX)"  →  [ Nouveau véhicule ]
```

Une photo par zone. On respecte cet ordre de procédure.

---

## 5. Fiche de revue

- **Gauche :** la/les photo(s), zoomables, côte à côte si 2 faces.
- **Droite :** formulaire éditable, organisé en sections :
  - **Contribuable** : Nom, NIF, Adresse
  - **Véhicule** : Plaque, Chassis, Marque/Type, CV, Usage, Genre, Année,
    Couleur, Poids
  - **Taxation** : Catégorie / Prix de base (pré-rempli, menu déroulant
    existant) + Montant FC calculé en direct
- Chaque champ porte un indicateur de confiance renvoyé par l'IA :
  - **✅ sûr** : affichage normal
  - **⚠️ à vérifier** : champ **surligné jaune** pour attirer l'œil
- L'IA ne renvoie **jamais** de valeur inventée : si une info est absente du
  document, le champ est **vide + ⚠️**.

---

## 6. Logique de prix (proposition automatique, toujours modifiable)

Règle métier **Personnel** (le `calculateTax` standard du code n'est PAS utilisé
ici car il contient l'ancienne valeur erronée 58.20) :

| Usage lu | CV | Prix de base proposé |
|----------|----|----|
| **Personnel** (tout genre) | 0 → 10 | **58.70 USD** |
| **Personnel** (tout genre) | 11 et + | **64.50 USD** |
| **Autre** (Transport, Marchandises, Taxi…) | — | **64.50 USD** par défaut (corrigeable) |

- Montant FC = prix de base × **2355** (taux fixe), recalculé en direct.
- Le prix reste **modifiable** via le menu déroulant déjà présent dans le
  système ; le panel admin du récépissé/bordereau reste la référence pour les
  ajustements fins.

---

## 7. Gestion des erreurs & cas limites

| Cas | Comportement |
|-----|--------------|
| Photo floue / illisible | Bandeau rouge "📸 Qualité faible — vérifie chaque champ" + bouton [Reprendre la photo] |
| Champ absent du document | Champ vide + ⚠️ (jamais de valeur inventée) |
| Panne API / clé manquante / crédit épuisé | Message clair ; **formulaire reste utilisable en saisie manuelle** (jamais de blocage du travail) |
| Plaque vide | **Blocage** de l'enregistrement (identifiant clé) |
| NIF vide | Avertissement seulement (certains docs n'en ont pas) |
| Doublon de plaque | "⚠️ Ce véhicule existe déjà (DECL-…)" → continuer ou annuler |
| Photo lourde (5–10 Mo) | Redimensionnement automatique côté navigateur avant envoi |

---

## 8. Enregistrement

À la validation, on réutilise le `saveDeclaration()` **existant** : la
déclaration est créée exactement comme via le formulaire manuel et génère
**récépissé + bordereau** avec toute la logique déjà en place (dates +1h,
panel admin, champs manuels, etc.). Aucune duplication de logique métier.

---

## 9. Hors périmètre (YAGNI)

- Pas de mode "paquet" (plusieurs photos par zone d'un coup) pour la v1 —
  on traite un véhicule à la fois. Pourra être ajouté plus tard.
- Pas d'appariement automatique recto/verso : l'association est explicite via
  les zones.
- Pas de modification du `calculateTax` existant (le reste du système n'est pas
  touché).

---

## 10. Découpage en unités

| Unité | Rôle | Dépend de |
|-------|------|-----------|
| `app/api/extract/route.ts` | Reçoit image(s), appelle Claude, renvoie JSON structuré + confiance | SDK Anthropic, `ANTHROPIC_API_KEY` |
| `lib/extraction-prompt.ts` | Construit le prompt vision + schéma de sortie attendu | — |
| `lib/scan-pricing.ts` | Applique la règle Personnel / défaut 64.50 | — |
| `lib/image-resize.ts` | Redimensionne les photos avant envoi | — |
| `app/(dashboard)/scan/page.tsx` | UI : 3 zones, fiche de revue, validation | les libs ci-dessus, `saveDeclaration`, sidebar |
| `app/components/sidebar.tsx` | Ajout de l'entrée "Scan" | — |
