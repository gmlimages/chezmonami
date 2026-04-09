import { NextResponse } from 'next/server';
import { getCompteFromToken } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const compte = await getCompteFromToken(token);

    if (!compte) {
      return NextResponse.json({ error: 'Session expirée ou invalide' }, { status: 401 });
    }

    return NextResponse.json({ compte });
  } catch (error) {
    console.error('Erreur /me:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
