import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, mot_de_passe, nom_contact } = await request.json();

    if (!email || !mot_de_passe || !nom_contact) {
      return NextResponse.json({ error: 'Tous les champs sont obligatoires' }, { status: 400 });
    }
    if (mot_de_passe.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    }

    // Email déjà utilisé ?
    const { data: existing } = await supabaseAdmin
      .from('comptes_structures')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    // Contacts par défaut depuis config_coordination
    const { data: config } = await supabaseAdmin
      .from('config_coordination')
      .select('telephone, email')
      .single();

    // Hash du mot de passe
    const hash = await bcrypt.hash(mot_de_passe, 12);

    // Créer le compte
    const { data: compte, error } = await supabaseAdmin
      .from('comptes_structures')
      .insert({
        email: email.toLowerCase().trim(),
        mot_de_passe: hash,
        nom_contact: nom_contact.trim(),
        telephone_contact: config?.telephone || '',
        email_contact: config?.email || '',
        statut: 'en_attente',
      })
      .select('id, email, nom_contact, statut')
      .single();

    if (error) throw error;

    // Notifier tous les admins
    await supabaseAdmin.from('notifications_admin').insert({
      admin_id: null,
      type: 'nouveau_compte',
      titre: `Nouveau compte entreprise : ${nom_contact.trim()}`,
      contenu: `${email} vient de créer un compte et attend validation.`,
      lien: '/admin/comptes-entreprises',
      reference_type: 'compte',
      reference_id: compte.id,
    });

    return NextResponse.json({
      success: true,
      message: "Compte créé avec succès. Vous recevrez un email dès validation par l'administration.",
      compte: { id: compte.id, email: compte.email, nom_contact: compte.nom_contact },
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur inscription:', error);
    return NextResponse.json({ error: 'Erreur serveur. Veuillez réessayer.' }, { status: 500 });
  }
}
