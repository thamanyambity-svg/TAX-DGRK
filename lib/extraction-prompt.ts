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
