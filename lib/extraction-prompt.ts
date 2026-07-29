import { SchemaType } from '@google/generative-ai';

// Schéma de réponse structuré pour Gemini
export const REPONSE_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        donnees: {
            type: SchemaType.OBJECT,
            properties: {
                nom: { type: SchemaType.STRING, description: 'Nom ou raison sociale du propriétaire/assujetti' },
                nif: { type: SchemaType.STRING, description: 'Numéro impôt / NIF. Chaîne vide "" si absent.' },
                adresse: { type: SchemaType.STRING, description: 'Adresse physique complète' },
                plaque: { type: SchemaType.STRING, description: "Numéro de plaque d'immatriculation" },
                chassis: { type: SchemaType.STRING, description: 'Numéro de châssis' },
                marque_type: { type: SchemaType.STRING, description: 'Marque et type/modèle (ex: SUZUKI SWIFT)' },
                cv: { type: SchemaType.STRING, description: 'Puissance fiscale en CV, chiffres uniquement (ex: "8")' },
                usage: { type: SchemaType.STRING, description: 'Usage (Personnel, Transport, Marchandises, Taxi, ...)' },
                genre: { type: SchemaType.STRING, description: 'Genre (Voiture, Jeep, Bus, Camion, Moto, ...)' },
                annee: { type: SchemaType.STRING, description: 'Année de fabrication' },
                couleur: { type: SchemaType.STRING, description: 'Couleur du véhicule' },
                poids: { type: SchemaType.STRING, description: 'Poids si présent, sinon chaîne vide ""' },
            },
            required: ['nom', 'nif', 'adresse', 'plaque', 'chassis', 'marque_type', 'cv', 'usage', 'genre', 'annee', 'couleur', 'poids'],
        },
        champs_a_verifier: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Noms des champs de 'donnees' dont la lecture est incertaine, illisible ou ambiguë.",
        },
        qualite_photo: {
            type: SchemaType.STRING,
            enum: ['bonne', 'moyenne', 'faible'],
            description: 'Qualité globale de lisibilité des photos fournies.',
        },
    },
    required: ['donnees', 'champs_a_verifier', 'qualite_photo'],
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
        'Extrais les informations du propriétaire et du véhicule, puis réponds UNIQUEMENT avec le JSON structuré.',
        'RÈGLES STRICTES:',
        "- N'invente JAMAIS une valeur. Si une information est absente ou illisible, mets une chaîne vide \"\".",
        "- Mets dans 'champs_a_verifier' le nom de CHAQUE champ dont tu n'es pas certain (manuscrit difficile, reflet, ambiguïté).",
        "- 'cv' = chiffres uniquement (ex: \"8\").",
        "- Pour 'usage' et 'genre', recopie le terme exact lu sur le document.",
        "- Évalue 'qualite_photo' honnêtement selon la lisibilité globale.",
        '- Ne retourne QUE le JSON, sans texte avant ni après.',
    ].join('\n');
}
