import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification épuisée</title>
    <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6; color: #1f2937; }
        .card { background: white; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.1); max-width: 400px; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        p { color: #6b7280; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🔒 Limite atteinte</h1>
        <p>Cette vignette a déjà été vérifiée le nombre maximum de fois autorisé.<br>Merci de contacter la DGRK pour toute assistance.</p>
    </div>
</body>
</html>`;
    return new NextResponse(html, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
    });
}
