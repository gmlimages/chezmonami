import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

// GET — proxy de visualisation de document (masque l'URL Supabase côté société)
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { id } = await params;

    // Vérifier que le document appartient à cette société
    const { data: doc, error } = await supabaseAdmin
      .from('documents_entreprises')
      .select('url_fichier, nom_fichier, compte_id')
      .eq('id', id)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
    }

    if (doc.compte_id !== compte.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Extraire le chemin depuis l'URL publique Supabase
    const urlObj = new URL(doc.url_fichier);
    const pathParts = urlObj.pathname.split('/object/public/');
    if (pathParts.length < 2) {
      return NextResponse.json({ error: 'URL de fichier invalide' }, { status: 400 });
    }

    const [bucket, ...fileParts] = pathParts[1].split('/');
    const filePath = fileParts.join('/');

    // Générer une URL signée valable 60 secondes
    const { data: signed, error: signError } = await supabaseAdmin
      .storage
      .from(bucket)
      .createSignedUrl(filePath, 60);

    if (signError || !signed?.signedUrl) {
      // Fallback : streamer directement
      const fileRes = await fetch(doc.url_fichier);
      if (!fileRes.ok) return NextResponse.json({ error: 'Fichier inaccessible' }, { status: 502 });
      const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
      const buffer = await fileRes.arrayBuffer();
      return new Response(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${doc.nom_fichier || 'document'}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // Streamer via l'URL signée
    const fileRes = await fetch(signed.signedUrl);
    if (!fileRes.ok) return NextResponse.json({ error: 'Fichier inaccessible' }, { status: 502 });
    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    const buffer = await fileRes.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${doc.nom_fichier || 'document'}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('GET document view error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
