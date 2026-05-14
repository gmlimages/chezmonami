// Inscription publique à la newsletter (passe par le service_role pour bypass RLS).
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit } from '@/lib/rateLimit';

const PREFS_DEFAUT = {
  fictif: true,
  bons_plans: true,
  alertes: true,
};

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rl = rateLimit(`newsletter:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });
    }

    const { email, preferences } = await request.json();
    const emailNorm = (email || '').toLowerCase().trim();
    if (!emailNorm || !emailNorm.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('newsletter_abonnes')
      .select('id, actif')
      .eq('email', emailNorm)
      .maybeSingle();

    if (existing) {
      if (existing.actif) {
        return NextResponse.json({ id: existing.id, deja_abonne: true });
      }
      // Réactivation
      await supabaseAdmin
        .from('newsletter_abonnes')
        .update({ actif: true, date_confirmation: new Date().toISOString() })
        .eq('id', existing.id);
      return NextResponse.json({ id: existing.id, reactive: true });
    }

    const { data: nouveau, error } = await supabaseAdmin
      .from('newsletter_abonnes')
      .insert({
        email: emailNorm,
        actif: true,
        date_confirmation: new Date().toISOString(),
        preferences: preferences || PREFS_DEFAUT,
      })
      .select('id')
      .single();
    if (error) throw error;

    return NextResponse.json({ id: nouveau.id, cree: true });
  } catch (err) {
    console.error('Newsletter inscription:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
