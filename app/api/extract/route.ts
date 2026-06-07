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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const content: any[] = [
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
