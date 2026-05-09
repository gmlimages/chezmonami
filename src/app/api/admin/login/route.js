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

    // Récupérer l'admin (via service role — pas exposé au client)
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, nom, email, role, mot_de_passe, bloque_jusqu_a, tentatives_connexion, doit_changer_mdp, tfa_active')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (adminError || !admin) {
      // Même délai pour éviter l'énumération de comptes
      await new Promise(r => setTimeout(r, 300));
      return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 });
    }

    // Compte bloqué ?
    if (admin.bloque_jusqu_a && new Date(admin.bloque_jusqu_a) > new Date()) {
      const secondes = Math.ceil((new Date(admin.bloque_jusqu_a) - new Date()) / 1000);
      return NextResponse.json({
        error: `Compte bloqué. Réessayez dans ${Math.ceil(secondes / 60)} minute(s).`,
        bloque: true,
        secondes,
      }, { status: 403 });
    }

    // Vérifier le mot de passe avec bcrypt
    let isValid = false;
    if (admin.mot_de_passe?.startsWith('$2')) {
      // Hash bcrypt existant
      isValid = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
    } else {
      // Mot de passe en clair (legacy) — comparer et migrer vers bcrypt
      isValid = mot_de_passe === admin.mot_de_passe;
      if (isValid) {
        // Migrer vers bcrypt en arrière-plan
        const hash = await bcrypt.hash(mot_de_passe, 12);
        await supabaseAdmin.from('admins').update({ mot_de_passe: hash }).eq('id', admin.id);
      }
    }

    if (!isValid) {
      const nouvelles = (admin.tentatives_connexion || 0) + 1;
      const updateData = { tentatives_connexion: nouvelles };

      if (nouvelles >= 5) {
        const blocage = new Date();
        blocage.setMinutes(blocage.getMinutes() + 15);
        updateData.bloque_jusqu_a = blocage.toISOString();
      }

      await supabaseAdmin.from('admins').update(updateData).eq('id', admin.id);
      try {
        await supabaseAdmin.from('admin_login_attempts').insert({ email: email.toLowerCase(), success: false });
      } catch {}

      const restantes = Math.max(0, 5 - nouvelles);
      return NextResponse.json({
        error: restantes > 0
          ? `Mot de passe incorrect. ${restantes} tentative(s) restante(s).`
          : 'Trop de tentatives. Compte bloqué 15 minutes.',
      }, { status: 401 });
    }

    // Connexion réussie — réinitialiser compteur
    await supabaseAdmin.from('admins').update({
      tentatives_connexion: 0,
      bloque_jusqu_a: null,
      derniere_connexion: new Date().toISOString(),
    }).eq('id', admin.id);

    try {
      await supabaseAdmin.from('admin_login_attempts').insert({ email: email.toLowerCase(), success: true });
    } catch {}

    // Si 2FA actif → générer un code, l'envoyer par email, retourner un challenge.
    // Aucune session admin n'est créée à ce stade.
    if (admin.tfa_active) {
      const code = generateCode();
      const challenge = generateChallenge();
      const expiresAt = new Date(Date.now() + TFA_CODE_TTL_MS);
      const userAgent = request.headers.get('user-agent') || null;

      await supabaseAdmin.from('tfa_codes').insert({
        admin_id: admin.id,
        code_hash: hashCode(code),
        challenge,
        expires_at: expiresAt.toISOString(),
        ip,
        user_agent: userAgent,
      });

      const titre = 'Votre code de vérification';
      const contenu = `
        <p>Bonjour <strong>${admin.nom || 'Admin'}</strong>,</p>
        <p>Une connexion à l'espace administrateur ChezMonAmi a été initiée. Pour finaliser, saisissez le code suivant :</p>
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
        to: admin.email,
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
        tag: 'tfa_admin',
      }).catch(() => {}); // ne pas bloquer la réponse — log déjà fait dans sendEmail

      return NextResponse.json({
        success: true,
        tfa_required: true,
        challenge,
        // On ne renvoie PAS l'email pour éviter la confirmation d'existence côté client
      });
    }

    // 2FA désactivé → session immédiate (8h)
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);

    await supabaseAdmin.from('admin_sessions').insert({
      admin_id: admin.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        nom: admin.nom,
        email: admin.email,
        role: admin.role,
        doit_changer_mdp: admin.doit_changer_mdp || false,
      },
    });

  } catch (error) {
    console.error('Erreur connexion admin:', error);
    return NextResponse.json({ error: 'Erreur serveur. Veuillez réessayer.' }, { status: 500 });
  }
}
