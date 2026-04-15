import { NextResponse } from 'next/server';

// Routes admin qui ne nécessitent PAS d'authentification
const ADMIN_PUBLIC_ROUTES = ['/api/admin/login'];

// Routes publiques entreprise (pas de token requis)
const ENTREPRISE_PUBLIC_ROUTES = [
  '/api/entreprise/connexion',
  '/api/entreprise/inscription',
  '/api/public',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ── 1. Ajouter le pathname dans les headers (usage interne Next.js)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // ── 2. Enrichissement des routes /api/admin/ (non bloquant) ────────
  // Le middleware ne bloque plus — chaque route handler fait sa propre
  // vérification via requireAdmin(). Le middleware enrichit juste les
  // headers pour passer l'admin_id si le token est valide.
  if (pathname.startsWith('/api/admin/')) {
    if (!ADMIN_PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '').trim();

      if (token) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && serviceKey) {
          try {
            const res = await fetch(
              `${supabaseUrl}/rest/v1/admin_sessions?token=eq.${encodeURIComponent(token)}&select=id,expires_at,admin_id`,
              {
                headers: {
                  apikey: serviceKey,
                  Authorization: `Bearer ${serviceKey}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (res.ok) {
              const sessions = await res.json();
              const session = sessions?.[0];
              if (session && new Date(session.expires_at) >= new Date()) {
                requestHeaders.set('x-admin-id', session.admin_id);
              }
            }
          } catch {
            // Erreur réseau — le handler de la route valide lui-même
          }
        }
      }
    }
  }

  // ── 3. Headers de sécurité HTTP sur toutes les réponses ──────────
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Empêcher le clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  // Empêcher le sniffing de type MIME
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Forcer HTTPS en production
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Contrôle du referrer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions API
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval requis par Next.js dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `img-src 'self' data: blob: https:`,
      `connect-src 'self' https: wss://*.supabase.co`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  return response;
}

export const config = {
  matcher: [
    // Appliquer à tout sauf les assets statiques
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
};
