import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin instanceof Response) return admin;
  try {
    const { ancienMdp, nouveauMdp } = await request.json();

    if (!ancienMdp || !nouveauMdp) {
      return NextResponse.json({ error: 'Ancien et nouveau mot de passe requis' }, { status: 400 });
    }

    // Validation force du nouveau mot de passe (côté serveur)
    const erreurs = [];
    if (nouveauMdp.length < 8) erreurs.push('Au moins 8 caractères');
    if (!/[A-Z]/.test(nouveauMdp)) erreurs.push('Au moins une majuscule');
    if (!/[a-z]/.test(nouveauMdp)) erreurs.push('Au moins une minuscule');
    if (!/[0-9]/.test(nouveauMdp)) erreurs.push('Au moins un chiffre');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(nouveauMdp)) erreurs.push('Au moins un caractère spécial');
    if (erreurs.length > 0) {
      return NextResponse.json({ error: erreurs.join(', ') }, { status: 400 });
    }

    // Récupérer l'ancien mot de passe (hash ou clair legacy)
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('mot_de_passe')
      .eq('id', admin.id)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    // Vérifier l'ancien mot de passe
    let isValid = false;
    if (adminData.mot_de_passe?.startsWith('$2')) {
      isValid = await bcrypt.compare(ancienMdp, adminData.mot_de_passe);
    } else {
      // Legacy plaintext
      isValid = ancienMdp === adminData.mot_de_passe;
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
    }

    // Hasher le nouveau mot de passe avec bcrypt (cost 12)
    const hash = await bcrypt.hash(nouveauMdp, 12);

    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({ mot_de_passe: hash, doit_changer_mdp: false })
      .eq('id', admin.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur changer-mot-de-passe:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
