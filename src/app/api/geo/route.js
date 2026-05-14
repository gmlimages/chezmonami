// Géolocalisation IP côté serveur (proxy ipapi pour éviter CORS).
// Utilise d'abord les headers de Vercel/Cloudflare si présents, sinon fallback ipapi.
import { NextResponse } from 'next/server';

export async function GET(request) {
  // 1) Headers Vercel/Cloudflare (gratuits, pas de rate-limit)
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    null;
  const city =
    request.headers.get('x-vercel-ip-city') ||
    request.headers.get('cf-ipcity') ||
    null;
  const region =
    request.headers.get('x-vercel-ip-country-region') ||
    request.headers.get('cf-region') ||
    null;

  if (country) {
    return NextResponse.json({
      country_code: country,
      pays: country,
      ville: city ? decodeURIComponent(city) : null,
      region,
      source: 'edge_header',
    });
  }

  // 2) Fallback : ipapi.co côté serveur (pas de CORS car server-to-server)
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '';
    const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        country_code: data.country_code || null,
        pays: data.country_name || null,
        ville: data.city || null,
        region: data.region || null,
        source: 'ipapi',
      });
    }
  } catch {}

  return NextResponse.json({ pays: null, ville: null, source: 'unknown' });
}
