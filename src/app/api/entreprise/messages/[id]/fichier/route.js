import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

// GET — proxyfie le fichier joint au message (l'URL Supabase n'est jamais exposée au client)
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401 });

    const { id } = await params;

    // Vérifier que le message appartient bien à ce compte
    const { data: msg } = await supabaseAdmin
      .from('messages_entreprises')
      .select('id, compte_id, fichier_url, fichier_nom')
      .eq('id', id)
      .single();

    if (!msg) return new Response(JSON.stringify({ error: 'Message introuvable' }), { status: 404 });
    if (msg.compte_id !== compte.id) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 403 });
    if (!msg.fichier_url) return new Response(JSON.stringify({ error: 'Aucun fichier attaché' }), { status: 404 });

    // Générer une URL signée côté serveur (valide 30 secondes — jamais exposée au client)
    const { data: signedData, error } = await supabaseAdmin.storage
      .from('messages')
      .createSignedUrl(msg.fichier_url, 30);

    if (error || !signedData?.signedUrl) {
      return new Response(JSON.stringify({ error: 'Fichier inaccessible' }), { status: 500 });
    }

    // Télécharger le fichier depuis Supabase (côté serveur) et le re-streamer au client
    const fileRes = await fetch(signedData.signedUrl);
    if (!fileRes.ok) {
      return new Response(JSON.stringify({ error: 'Fichier inaccessible' }), { status: 502 });
    }

    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    const nomSafe = encodeURIComponent(msg.fichier_nom || 'fichier');

    return new Response(fileRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${nomSafe}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('GET fichier message entreprise:', error);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
}
