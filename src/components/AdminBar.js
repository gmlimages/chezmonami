'use client';
// Barre admin flottante — visible sur TOUTES les pages quand un admin est connecté.
// Permet de naviguer entre le site public et l'espace admin sans se déconnecter.
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminBar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [admin, setAdmin]       = useState(null);
  const [ouvert, setOuvert]     = useState(false);
  const [nbMessages, setNb]     = useState(0);
  const [nbAppels, setNbAppels] = useState(0);

  // Charger session admin
  useEffect(() => {
    try {
      const raw = localStorage.getItem('adminAuth');
      if (!raw) { setAdmin(null); return; }
      const parsed = JSON.parse(raw);
      // Ne montrer la barre que si le token nouveau système est présent
      if (!parsed.sessionToken) { setAdmin(null); return; }
      setAdmin(parsed);
    } catch {
      setAdmin(null);
    }
  }, [pathname]);

  // Charger badges notifications
  useEffect(() => {
    if (!admin?.sessionToken) return;
    const load = () => {
      fetch('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${admin.sessionToken}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d) { setNb(d.nb_messages || 0); setNbAppels(d.nb_appels || 0); }
        })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, [admin]);

  const deconnecter = () => {
    if (!confirm('Déconnexion admin ?')) return;
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminSessionStart');
    localStorage.removeItem('adminLastActivity');
    setAdmin(null);
    router.push('/');
  };

  // Ne rien afficher si pas d'admin connecté
  if (!admin) return null;

  const estSurAdmin = pathname.startsWith('/admin');

  return (
    <>
      {/* ── Barre fixe en haut ── */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-8 bg-gray-900 text-white flex items-center px-3 gap-2 text-xs shadow-lg">

        {/* Badge admin */}
        <span className="bg-primary/80 text-white px-2 py-0.5 rounded font-bold text-[10px] tracking-wide flex-shrink-0">
          ⚙️ ADMIN
        </span>

        {/* Nom */}
        <span className="text-gray-400 hidden sm:inline truncate max-w-[100px]">
          {admin.nom || admin.email}
        </span>

        <div className="w-px h-4 bg-gray-700 flex-shrink-0" />

        {/* Navigation rapide */}
        <div className="flex items-center gap-1 flex-1 overflow-hidden">
          {estSurAdmin ? (
            // Sur les pages admin → lien vers le site public
            <>
              <Link href="/" className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-700 transition whitespace-nowrap">
                🌐 Site public
              </Link>
              <Link href="/structures" className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-700 transition whitespace-nowrap hidden sm:flex">
                🏢 Structures
              </Link>
            </>
          ) : (
            // Sur le site public → liens vers l'admin
            <>
              <Link href="/admin/dashboard" className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-700 transition whitespace-nowrap">
                📊 Dashboard
              </Link>
              <Link href="/admin/structures" className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-700 transition whitespace-nowrap hidden sm:flex">
                🏢 Structures
              </Link>
              <Link href="/admin/comptes-entreprises" className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-700 transition whitespace-nowrap hidden md:flex">
                👤 Sociétés
              </Link>
              {nbMessages > 0 && (
                <Link href="/admin/messages" className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-700 hover:bg-red-600 transition whitespace-nowrap">
                  💬 {nbMessages}
                </Link>
              )}
              {nbAppels > 0 && (
                <Link href="/admin/appels-offres" className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-700 hover:bg-orange-600 transition whitespace-nowrap">
                  📋 {nbAppels}
                </Link>
              )}
            </>
          )}
        </div>

        {/* Toggle menu déroulant mobile */}
        <button
          onClick={() => setOuvert(v => !v)}
          className="sm:hidden p-1 rounded hover:bg-gray-700 transition flex-shrink-0"
        >
          {ouvert ? '✕' : '⋮'}
        </button>

        {/* Déconnexion */}
        <button
          onClick={deconnecter}
          className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-red-400 hover:bg-red-900/50 transition flex-shrink-0"
        >
          🚪 <span className="hidden md:inline">Déconnexion</span>
        </button>
      </div>

      {/* ── Menu déroulant mobile ── */}
      {ouvert && (
        <div className="fixed top-8 left-0 right-0 z-[59] bg-gray-900 border-t border-gray-700 shadow-xl p-3 flex flex-col gap-1 sm:hidden">
          <Link href="/admin/dashboard" onClick={() => setOuvert(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition">
            📊 Dashboard admin
          </Link>
          <Link href="/admin/structures" onClick={() => setOuvert(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition">
            🏢 Structures (admin)
          </Link>
          <Link href="/admin/comptes-entreprises" onClick={() => setOuvert(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition">
            👤 Sociétés (admin)
          </Link>
          <Link href="/admin/messages" onClick={() => setOuvert(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition">
            💬 Messages {nbMessages > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{nbMessages}</span>}
          </Link>
          <Link href="/structures" onClick={() => setOuvert(false)} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-700 transition">
            🌐 Voir les structures (site public)
          </Link>
          <button onClick={deconnecter} className="flex items-center gap-2 px-3 py-2 rounded text-red-400 hover:bg-red-900/40 transition text-left">
            🚪 Déconnexion admin
          </button>
        </div>
      )}

      {/* ── Décalage du contenu pour éviter que la barre cache le header ── */}
      <style jsx global>{`
        body { padding-top: 2rem; /* 32px = h-8 */ }
      `}</style>
    </>
  );
}
