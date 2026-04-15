import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

// GET — proxy de téléchargement de document (masque l'URL Supabase)
export async function GET(request, { params }) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { id } = await params;

    // Récupérer le document
    const { data: doc, error } = await supabaseAdmin
      .from('documents_entreprises')
      .select('url_fichier, nom_fichier')
      .eq('id', id)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
    }

    // Extraire le chemin depuis l'URL publique Supabase
    // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
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
      // Fallback : streamer le fichier directement
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
    console.error('GET document download error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
