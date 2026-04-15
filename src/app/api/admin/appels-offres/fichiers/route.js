import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

// GET /api/admin/appels-offres/fichiers?path=offres/123/file.pdf&nom=file.pdf
// Proxy de visualisation de fichier joint à un appel d'offres (masque l'URL Supabase)
export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
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
    console.error('GET appels-offres fichier error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
