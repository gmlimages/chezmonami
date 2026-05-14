'use client';
// Layout dashboard partenaire — sidebar simple inspirée de EntrepriseLayout
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n/LangProvider';

export default function PartenaireLayout({ children, titre, sousTitre }) {
  const { t, lang } = useT();
  const isRtl = lang === 'ar';
  const MENU = [
    { href: '/partenaire/dashboard', label: t('partenaire.menu_tableau_bord'), icon: '🏠' },
    { href: '/partenaire/dashboard/codes', label: t('partenaire.menu_mes_codes'), icon: '🎟️' },
    { href: '/partenaire/dashboard/filleuls', label: t('partenaire.menu_mes_filleuls'), icon: '👥' },
    { href: '/partenaire/dashboard/commissions', label: t('partenaire.menu_mes_commissions'), icon: '💰' },
    { href: '/partenaire/dashboard/profil', label: t('partenaire.menu_mon_profil'), icon: '👤' },
  ];
  const pathname = usePathname();
  const router = useRouter();
  const [compte, setCompte] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const deconnexionForcee = () => {
    localStorage.removeItem('partenaireAuth');
    localStorage.removeItem('partenaireSessionStart');
    router.push('/entreprise/connexion?expired=1');
  };

  useEffect(() => {
    let auth;
    try {
      auth = JSON.parse(localStorage.getItem('partenaireAuth') || '{}');
    } catch {
      router.push('/entreprise/connexion');
      return;
    }
    if (!auth?.token) {
      router.push('/entreprise/connexion');
      return;
    }

    const ping = async () => {
      try {
        const r = await fetch('/api/partenaire/me', {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (r.status === 401) { deconnexionForcee(); return; }
        if (r.ok) {
          const d = await r.json();
          setCompte(d.partenaire || auth.compte);
          try {
            localStorage.setItem('partenaireAuth', JSON.stringify({ token: auth.token, compte: d.partenaire || auth.compte }));
          } catch {}
          return;
        }
      } catch {}
      // erreur réseau temporaire → on affiche le compte local (pas de déco)
      if (!compte) setCompte(auth.compte);
    };

    ping();
    // Ping toutes les 5 minutes pour détecter l'expiration de session
    const interval = setInterval(ping, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const deconnexion = () => {
    localStorage.removeItem('partenaireAuth');
    localStorage.removeItem('partenaireSessionStart');
    router.push('/entreprise/connexion');
  };

  if (!compte) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className={`hidden lg:flex flex-col w-64 bg-white fixed top-0 h-screen ${isRtl ? 'right-0 border-l border-gray-200' : 'left-0 border-r border-gray-200'}`}>
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="block">
            <h1 className="font-bold text-gray-800">Chez Mon Ami</h1>
            <p className="text-xs text-gray-500">{t('partenaire.espace_partenaire')}</p>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {MENU.map(m => {
            const active = pathname === m.href;
            return (
              <Link
                key={m.href}
                href={m.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{m.icon}</span>
                <span>{m.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2 truncate">{compte.nom_complet}</p>
          <button onClick={deconnexion} className="w-full text-left text-sm text-red-600 hover:underline">↩ {t('partenaire.deconnexion')}</button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 px-4 py-3 flex items-center justify-between">
        <Link href="/partenaire/dashboard" className="font-bold text-gray-800">Chez Mon Ami</Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-2xl">☰</button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)}>
          <aside className={`bg-white w-72 h-full p-4 space-y-1 shadow-2xl ${isRtl ? 'ml-auto' : ''}`} onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold mb-3">{compte.nom_complet}</p>
            {MENU.map(m => (
              <Link key={m.href} href={m.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${pathname === m.href ? 'bg-primary text-white' : 'text-gray-700'}`}>
                <span>{m.icon}</span> {m.label}
              </Link>
            ))}
            <button onClick={deconnexion} className="w-full text-left text-sm text-red-600 px-3 py-2">↩ Déconnexion</button>
          </aside>
        </div>
      )}

      {/* Contenu */}
      <main className={`flex-1 pt-16 lg:pt-0 ${isRtl ? 'lg:mr-64' : 'lg:ml-64'}`}>
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
          {titre && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">{titre}</h1>
              {sousTitre && <p className="text-sm text-gray-500 mt-1">{sousTitre}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

// Helper token pour les fetch
export function getPartenaireToken() {
  try { return JSON.parse(localStorage.getItem('partenaireAuth') || '{}').token || ''; }
  catch { return ''; }
}
