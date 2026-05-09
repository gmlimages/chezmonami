'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { confirmDialog } from '@/lib/toast';
import { useT } from '@/lib/i18n/LangProvider';

// Le header public (sticky top-0) fait ~80px (py-4 + logo h-12)
// La sidebar et le sous-header de l'espace entreprise démarrent donc à top-20 (5rem)

export default function EntrepriseLayout({ children, titre }) {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [compte, setCompte] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nbMessages, setNbMessages] = useState(0);
  const [nbB2b, setNbB2b] = useState(0);
  const [nbAppels, setNbAppels] = useState(0);

  const deconnecter = useCallback(async () => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (auth) {
      try {
        const { token } = JSON.parse(auth);
        await fetch('/api/entreprise/deconnexion', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    localStorage.removeItem('entrepriseAuth');
    localStorage.removeItem('entrepriseSessionStart');
    router.push('/entreprise/connexion');
  }, [router]);

  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (!auth) {
      router.push('/entreprise/connexion');
      return;
    }
    const data = JSON.parse(auth);
    fetch('/api/entreprise/me', {
      headers: { Authorization: `Bearer ${data.token}` },
    }).then(res => {
      if (!res.ok) {
        deconnecter();
      } else {
        res.json().then(({ compte: c }) => setCompte(c));
      }
    }).catch(() => deconnecter());

    // Charger les badges de notifications
    const chargerNotifs = () => {
      fetch('/api/entreprise/notifications', {
        headers: { Authorization: `Bearer ${data.token}` },
      }).then(r => r.ok ? r.json() : null).then(d => {
        if (d) {
          setNbMessages(d.nb_messages || 0);
          setNbB2b(d.nb_b2b || 0);
          setNbAppels(d.nb_appels || 0);
        }
      }).catch(() => {});
    };
    chargerNotifs();
    const intervalNotifs = setInterval(chargerNotifs, 60 * 1000);

    const interval = setInterval(async () => {
      const res = await fetch('/api/entreprise/me', {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (!res.ok) deconnecter();
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(intervalNotifs);
    };
  }, [router, deconnecter]);

  const handleLogout = async () => {
    const ok = await confirmDialog({ message: t('dashboard.confirm_deconnexion'), confirmLabel: t('dashboard.deconnecter_btn') });
    if (ok) {
      await deconnecter();
    }
  };

  const menuItems = [
    { href: '/entreprise/dashboard', label: t('dashboard.tableau_bord'), icon: '📊', exact: true },
    { href: '/entreprise/dashboard/appels-offres', label: t('dashboard.appels_offres'), icon: '📋', badge: nbAppels },
    { href: '/entreprise/dashboard/messages', label: t('dashboard.stat_messages'), icon: '💬', badge: nbMessages },
    { href: '/entreprise/dashboard/reseau', label: t('dashboard.reseau_label'), icon: '🤝', badge: nbB2b },
    { href: '/entreprise/dashboard/documents', label: t('dashboard.mes_documents'), icon: '📁' },
    { href: '/entreprise/dashboard/ma-structure', label: t('dashboard.ma_structure'), icon: '🏢' },
    { href: '/entreprise/dashboard/parrainage', label: 'Parrainage', icon: '🎁' },
    { href: '/entreprise/dashboard/profil', label: t('dashboard.mon_profil'), icon: '⚙️' },
  ];

  const isActive = (href, exact) =>
    exact ? pathname === href : pathname.startsWith(href);

  if (!compte) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('common.chargement')}</p>
        </div>
      </div>
    );
  }

  const enImpersonation = !!compte?._impersonation;

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── BANNIÈRE IMPERSONATION ── */}
      {enImpersonation && (
        <div className="sticky top-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">👁</span>
            <span className="truncate">
              <strong>Mode impersonation</strong> — Vous consultez le compte de <strong>{compte?.nom_contact}</strong> (
              {compte?.structures?.nom || compte?.email}). Les actions sensibles sont tracées.
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                const auth = JSON.parse(localStorage.getItem('entrepriseAuth') || '{}');
                await fetch('/api/admin/impersonate', {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${JSON.parse(localStorage.getItem('adminAuth') || '{}').sessionToken}`,
                  },
                  body: JSON.stringify({ session_id: compte._impersonation.session_id }),
                });
              } catch {}
              localStorage.removeItem('entrepriseAuth');
              localStorage.removeItem('entrepriseSessionStart');
              router.push('/admin/comptes-entreprises');
            }}
            className="bg-white text-amber-700 px-3 py-1 rounded-lg font-semibold hover:bg-amber-50 flex-shrink-0"
          >
            Quitter
          </button>
        </div>
      )}

      {/* ── OVERLAY MOBILE ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ──
          Démarre à top-20 (sous le header public ~80px).
          Mobile : top-0 + spacer interne h-20, le header public (z-50) couvre le haut.
          Desktop : top-20, hauteur calc(100vh - 5rem).
      ── */}
      <aside
        className={`fixed top-0 left-0 w-64 h-screen lg:top-20 lg:h-[calc(100vh-5rem)] bg-white border-r border-gray-200 shadow-xl z-40 flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Spacer mobile — zone couverte par le header public sticky */}
        <div className="h-20 flex-shrink-0 lg:hidden" />

        {/* Petit espace de respiration desktop entre le header public et le contenu sidebar */}
        <div className="hidden lg:block h-3 flex-shrink-0" />

        {/* En-tête sidebar */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <Link href="/entreprise/dashboard" className="flex items-center gap-3 group w-full">
            {/* Photo de profil ou initiale */}
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20 shadow-sm bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              {compte.photo_profil ? (
                <img src={compte.photo_profil} alt={compte.nom_contact} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-base">
                  {compte.nom_contact?.charAt(0)?.toUpperCase() || 'E'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">{compte.nom_contact || t('dashboard.espace_entreprise_label')}</p>
              <p className="text-xs text-gray-500 truncate">{t('dashboard.espace_entreprise_label')}</p>
            </div>
          </Link>
        </div>

        {/* Statut compte */}
        {compte.statut === 'en_attente' && (
          <div className="mx-3 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex-shrink-0">
            <p className="text-xs font-semibold text-amber-700">{t('dashboard.en_attente_validation')}</p>
            <p className="text-xs text-amber-600 mt-0.5">{t('dashboard.admin_validera')}</p>
          </div>
        )}
        {compte.badge_verifie && (
          <div className="mx-3 mt-3 p-2 bg-green-50 border border-green-200 rounded-lg flex-shrink-0">
            <p className="text-xs font-semibold text-green-700">{t('dashboard.compte_verifie')}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-0.5">
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                  isActive(item.href, item.exact)
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <span className={`font-medium text-sm whitespace-nowrap flex-1 ${isActive(item.href, item.exact) ? 'text-white' : 'text-gray-800'}`}>
                  {item.label}
                </span>
                {item.badge > 0 && (
                  <span className={`text-xs font-bold rounded-full min-w-[1.2rem] h-5 flex items-center justify-center px-1 flex-shrink-0 ${
                    isActive(item.href, item.exact) ? 'bg-white text-primary' : 'bg-primary text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer sidebar */}
        <div className="p-3 border-t border-gray-200 flex-shrink-0 space-y-1">
          <div className="px-3 py-2">
            <p className="text-xs text-gray-400 truncate">{compte.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition w-full"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium text-sm">{t('dashboard.deconnexion')}</span>
          </button>
        </div>
      </aside>

      {/* ── CONTENU PRINCIPAL ──
          lg:ml-64 pour laisser la place au sidebar desktop.
          Pas de pt supplémentaire : le header public est sticky et fait partie du flux.
      ── */}
      <div className="lg:ml-64 min-h-screen">

        {/* Sous-header entreprise : sticky juste sous le header public */}
        <div className="sticky top-20 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 px-4 h-12">
            {/* Bouton menu mobile */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-700 flex-shrink-0"
              aria-label={t('dashboard.menu_aria')}
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>

            {/* Titre de la page */}
            <h1 className="flex-1 text-base font-bold text-gray-800 truncate">{titre}</h1>

            {/* Badges statut */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {compte.badge_verifie && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  {t('dashboard.verifie_short')}
                </span>
              )}
              {compte.statut === 'en_attente' && (
                <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold whitespace-nowrap">
                  {t('dashboard.en_attente_short')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contenu de la page */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
