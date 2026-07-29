import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { buildPrompt } from '@/lib/extraction-prompt';
import { ImagePayload, ResultatExtraction } from '@/lib/scan-types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = 'gemini-2.5-flash';

const REPONSE_SCHEMA = {
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

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return Response.json(
                { error: "Service d'extraction non configuré (GEMINI_API_KEY absente côté serveur)." },
                { status: 500 }
            );
        }

        const body = (await req.json()) as { images: ImagePayload[]; typeDoc: 'page' | 'carte' };
        if (!body?.images?.length) {
            return Response.json({ error: 'Aucune image fournie.' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: REPONSE_SCHEMA as any,
            },
        });

        const parts: any[] = [{ text: buildPrompt(body.typeDoc) }];
        for (const img of body.images) {
            parts.push({
                inlineData: {
                    mimeType: img.mediaType,
                    data: img.base64,
                },
            });
        }

        const result = await model.generateContent(parts);
        const text = result.response.text();

        if (!text) {
            return Response.json({ error: "L'IA n'a pas pu structurer la réponse." }, { status: 502 });
        }

        const parsed = JSON.parse(text) as ResultatExtraction;
        return Response.json(parsed);
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Erreur du service d'extraction.";
        console.error('Extract error:', e);
        return Response.json({ error: message }, { status: 500 });
    }
}
