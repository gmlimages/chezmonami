import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken, hasFullAccess } from '@/lib/supabaseAdmin';

// GET /api/entreprise/appels-offres/fichiers?path=offres/123/file.pdf&nom=file.pdf
// Proxy de visualisation de fichier joint à un appel d'offres (réservé abonnés)
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    if (!hasFullAccess(compte)) return NextResponse.json({ error: 'Abonnement requis' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const nom = searchParams.get('nom') || 'fichier';

    if (!path || !path.startsWith('offres/')) {
      return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 });
    }

    // URL signée 60 secondes
    const { data: signed, error: signError } = await supabaseAdmin
      .storage.from('images').createSignedUrl(path, 60);

    if (signError || !signed?.signedUrl) {
      return NextResponse.json({ error: 'Fichier inaccessible' }, { status: 502 });
    }

    const fileRes = await fetch(signed.signedUrl);
    if (!fileRes.ok) return NextResponse.json({ error: 'Fichier inaccessible' }, { status: 502 });

    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    const buffer = await fileRes.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${nom}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('GET entreprise appels-offres fichier error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
