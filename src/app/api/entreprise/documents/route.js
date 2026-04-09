import { NextResponse } from 'next/server';
import { supabaseAdmin, getCompteFromToken } from '@/lib/supabaseAdmin';

// Types de documents acceptés
export const TYPES_DOCUMENTS = [
  { value: 'registre_commerce', label: 'Registre de commerce' },
  { value: 'statuts_societe', label: 'Statuts de la société' },
  { value: 'identite_dirigeant', label: "Pièce d'identité du dirigeant" },
  { value: 'justificatif_adresse', label: "Justificatif d'adresse professionnelle" },
  { value: 'autre', label: 'Autre document' },
];

// GET — liste des documents du compte
export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: documents, error } = await supabaseAdmin
      .from('documents_entreprises')
      .select('*')
      .eq('compte_id', compte.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ documents: documents || [] });
  } catch (error) {
    console.error('GET documents error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST — enregistrer un document (après upload côté client)
export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);
    if (!compte) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { type_document, nom_fichier, url_fichier } = await request.json();

    if (!type_document || !url_fichier) {
      return NextResponse.json({ error: 'Type et URL du document requis' }, { status: 400 });
    }

    const typesValides = TYPES_DOCUMENTS.map((t) => t.value);
    if (!typesValides.includes(type_document)) {
      return NextResponse.json({ error: 'Type de document invalide' }, { status: 400 });
    }

    // Si un document de ce type existe déjà, le remplacer (upsert via suppression + insert)
    await supabaseAdmin
      .from('documents_entreprises')
      .delete()
      .eq('compte_id', compte.id)
      .eq('type_document', type_document);

    const { data: doc, error } = await supabaseAdmin
      .from('documents_entreprises')
      .insert({
        compte_id: compte.id,
        type_document,
        nom_fichier: nom_fichier || url_fichier.split('/').pop(),
        url_fichier,
        statut: 'en_attente',
        commentaire_admin: null,
      })
      .select()
      .single();

    if (error) throw error;

    // Notifier les admins du nouveau document
    await supabaseAdmin.from('notifications_admin').insert({
      admin_id: null,
      type: 'nouveau_document',
      titre: `Document : ${compte.nom_contact}`,
      contenu: `${compte.nom_contact} a soumis un document (${type_document}) pour vérification`,
      lien: '/admin/comptes-entreprises',
      reference_type: 'document',
      reference_id: doc.id,
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error) {
    console.error('POST document error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
