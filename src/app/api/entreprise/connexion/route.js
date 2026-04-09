import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request) {
  try {
    const { email, mot_de_passe } = await request.json();

    if (!email || !mot_de_passe) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const { data: compte, error: compteError } = await supabaseAdmin
      .from('comptes_structures')
      .select(`
        id, email, mot_de_passe, nom_contact, statut, abonnement,
        badge_verifie, structure_id, telephone_contact, email_contact,
        tentatives_connexion, bloque_jusqu_a,
        structures (id, nom, categorie_id, verifie)
      `)
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (compteError || !compte) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    // Compte bloqué ?
    if (compte.bloque_jusqu_a && new Date(compte.bloque_jusqu_a) > new Date()) {
      const secondes = Math.ceil((new Date(compte.bloque_jusqu_a) - new Date()) / 1000);
      return NextResponse.json({
        error: `Compte bloqué. Réessayez dans ${Math.ceil(secondes / 60)} minute(s).`,
        bloque: true,
        secondes,
      }, { status: 403 });
    }

    // Vérifier mot de passe
    const isValid = await bcrypt.compare(mot_de_passe, compte.mot_de_passe);

    if (!isValid) {
      const nouvelles = (compte.tentatives_connexion || 0) + 1;
      const updateData = { tentatives_connexion: nouvelles };

      if (nouvelles >= 5) {
        const blocage = new Date();
        blocage.setMinutes(blocage.getMinutes() + 15);
        updateData.bloque_jusqu_a = blocage.toISOString();
      }

      await supabaseAdmin.from('comptes_structures').update(updateData).eq('id', compte.id);

      const restantes = Math.max(0, 5 - nouvelles);
      return NextResponse.json({
        error: restantes > 0
          ? `Mot de passe incorrect. ${restantes} tentative(s) restante(s).`
          : 'Trop de tentatives. Compte bloqué 15 minutes.',
      }, { status: 401 });
    }

    // Statut du compte
    if (compte.statut === 'suspendu') {
      return NextResponse.json({ error: 'Votre compte a été suspendu. Contactez l\'administration.' }, { status: 403 });
    }
    if (compte.statut === 'refuse') {
      return NextResponse.json({ error: 'Votre inscription a été refusée. Contactez l\'administration.' }, { status: 403 });
    }

    // Connexion réussie — réinitialiser tentatives
    await supabaseAdmin.from('comptes_structures').update({
      tentatives_connexion: 0,
      bloque_jusqu_a: null,
      derniere_connexion: new Date().toISOString(),
    }).eq('id', compte.id);

    // Créer session (8h)
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);

    await supabaseAdmin.from('comptes_sessions').insert({
      compte_id: compte.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    // Retourner sans le hash du mot de passe
    return NextResponse.json({
      success: true,
      token,
      compte: {
        id: compte.id,
        email: compte.email,
        nom_contact: compte.nom_contact,
        statut: compte.statut,
        abonnement: compte.abonnement,
        badge_verifie: compte.badge_verifie,
        structure_id: compte.structure_id,
        telephone_contact: compte.telephone_contact,
        email_contact: compte.email_contact,
        structure: compte.structures,
      },
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    return NextResponse.json({ error: 'Erreur serveur. Veuillez réessayer.' }, { status: 500 });
  }
}
