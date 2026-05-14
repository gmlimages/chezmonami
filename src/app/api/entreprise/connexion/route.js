import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rateLimit';
import { sendEmail, baseTemplate, baseText } from '@/lib/email';
import { generateCode, hashCode, generateChallenge, TFA_CODE_TTL_MS } from '@/lib/tfa';

function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request) {
  try {
    // Rate limiting : 10 tentatives par IP par minute
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rl = rateLimit(ip, { limit: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Trop de tentatives. Réessayez dans ${rl.retryAfter} secondes.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const { email, mot_de_passe } = await request.json();

    if (!email || !mot_de_passe) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const emailNorm = email.toLowerCase().trim();

    // ── Tentative login PARTENAIRE en priorité ────────────────────────────────
    const { data: partenaire } = await supabaseAdmin
      .from('comptes_partenaires')
      .select('id, email, mot_de_passe_hash, nom_complet, actif, supprime')
      .eq('email', emailNorm)
      .eq('supprime', false)
      .maybeSingle();

    if (partenaire) {
      if (!partenaire.actif) {
        return NextResponse.json({ error: 'Compte partenaire désactivé. Contactez l\'administration.' }, { status: 403 });
      }
      const okPart = await bcrypt.compare(mot_de_passe, partenaire.mot_de_passe_hash);
      if (!okPart) {
        return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
      }
      // Crée session partenaire (8h)
      const tokenP = generateToken();
      const expP = new Date(); expP.setHours(expP.getHours() + 8);
      await supabaseAdmin.from('comptes_partenaires_sessions').insert({
        partenaire_id: partenaire.id,
        token: tokenP,
        expires_at: expP.toISOString(),
        user_agent: request.headers.get('user-agent') || null,
        ip,
      });
      await supabaseAdmin.from('comptes_partenaires')
        .update({ derniere_connexion: new Date().toISOString() })
        .eq('id', partenaire.id);
      return NextResponse.json({
        success: true,
        role: 'partenaire',
        token: tokenP,
        compte: { id: partenaire.id, email: partenaire.email, nom_complet: partenaire.nom_complet },
      });
    }

    const { data: compte, error: compteError } = await supabaseAdmin
      .from('comptes_structures')
      .select(`
        id, email, mot_de_passe, nom_contact, statut, abonnement,
        badge_verifie, structure_id, telephone_contact, email_contact,
        tentatives_connexion, bloque_jusqu_a, tfa_active,
        structures (id, nom, categorie_id, verifie)
      `)
      .eq('email', emailNorm)
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

    // Vérifier mot de passe (bcrypt avec migration legacy plaintext)
    let isValid = false;
    if (compte.mot_de_passe?.startsWith('$2')) {
      isValid = await bcrypt.compare(mot_de_passe, compte.mot_de_passe);
    } else {
      isValid = mot_de_passe === compte.mot_de_passe;
      if (isValid) {
        const hash = await bcrypt.hash(mot_de_passe, 12);
        await supabaseAdmin.from('comptes_structures').update({ mot_de_passe: hash }).eq('id', compte.id);
      }
    }

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

    // Si 2FA actif → générer un code, l'envoyer par email, retourner un challenge.
    if (compte.tfa_active) {
      const code = generateCode();
      const challenge = generateChallenge();
      const expiresAt2 = new Date(Date.now() + TFA_CODE_TTL_MS);
      const userAgent = request.headers.get('user-agent') || null;

      await supabaseAdmin.from('tfa_codes').insert({
        compte_id: compte.id,
        code_hash: hashCode(code),
        challenge,
        expires_at: expiresAt2.toISOString(),
        ip,
        user_agent: userAgent,
      });

      const titre = 'Votre code de vérification';
      const contenu = `
        <p>Bonjour <strong>${compte.nom_contact || ''}</strong>,</p>
        <p>Une connexion à votre espace entreprise ChezMonAmi a été initiée. Pour finaliser, saisissez le code suivant :</p>
      `;
      const highlight = `
        <div style="text-align:center; font-family: 'Courier New', monospace; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #2e7d32;">
          ${code}
        </div>
        <p style="text-align:center; color:#666; font-size:13px; margin-top:8px;">
          Ce code expire dans 10 minutes.
        </p>
      `;
      sendEmail({
        to: compte.email,
        subject: `🔐 Code de vérification ChezMonAmi : ${code}`,
        html: baseTemplate({
          titre,
          emoji: '🔐',
          preheader: `Votre code : ${code}`,
          contenu: contenu + `<p style="font-size:12px;color:#888;">Si vous n'êtes pas à l'origine de cette tentative, ignorez ce message et changez immédiatement votre mot de passe.</p>`,
          highlight,
        }),
        text: baseText({
          titre,
          contenu: `Votre code de vérification : ${code}\nIl expire dans 10 minutes.\n\nSi vous n'êtes pas à l'origine de cette tentative, ignorez ce message.`,
        }),
        tag: 'tfa_entreprise',
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        tfa_required: true,
        challenge,
      });
    }

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
      role: 'entreprise',
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
