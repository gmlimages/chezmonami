// src/app/admin/AdminLayout.js
'use client';
import { toast, confirmDialog } from '@/lib/toast';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AdminSidebarContent from './AdminSidebarContent';

const POLLING_INTERVAL = 60 * 1000; // 1 minute

export default function AdminLayout({ children, titre, sousTitre, breadcrumb }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [tempsRestant, setTempsRestant] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [nbNouveauxMessages, setNbNouveauxMessages] = useState(0);
  const [nbAppelsOffres, setNbAppelsOffres] = useState(0);

  const INACTIVITE_MAX = 30 * 60 * 1000; // 30 minutes
  const SESSION_MAX = 2 * 60 * 60 * 1000; // 2 heures

  const deconnecter = useCallback(() => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminSessionStart');
    localStorage.removeItem('adminLastActivity');
    toast.warning('Session expirée. Veuillez vous reconnecter.');
    router.push('/dashboard-chezmonami');
  }, [router]);

  const mettreAJourActivite = useCallback(() => {
    localStorage.setItem('adminLastActivity', Date.now().toString());
  }, []);

  const verifierSession = useCallback(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    const sessionStart = localStorage.getItem('adminSessionStart');
    const lastActivity = localStorage.getItem('adminLastActivity');

    if (!adminAuth || !sessionStart || !lastActivity) {
      deconnecter();
      return false;
    }

    const now = Date.now();
    const sessionDuration = now - parseInt(sessionStart);
    const inactiveDuration = now - parseInt(lastActivity);

    if (sessionDuration > SESSION_MAX) { deconnecter(); return false; }
    if (inactiveDuration > INACTIVITE_MAX) { deconnecter(); return false; }

    const tempsRestantInactivite = INACTIVITE_MAX - inactiveDuration;
    const tempsRestantSession = SESSION_MAX - sessionDuration;
    setTempsRestant(Math.min(tempsRestantInactivite, tempsRestantSession));
    return true;
  }, [deconnecter, INACTIVITE_MAX, SESSION_MAX]);

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    const sessionStart = localStorage.getItem('adminSessionStart');
    const lastActivity = localStorage.getItem('adminLastActivity');

    if (adminAuth && sessionStart && lastActivity) {
      const now = Date.now();
      if (
        now - parseInt(sessionStart) > SESSION_MAX ||
        now - parseInt(lastActivity) > INACTIVITE_MAX
      ) {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminSessionStart');
        localStorage.removeItem('adminLastActivity');
        router.push('/dashboard-chezmonami');
        return;
      }
    } else if (!adminAuth) {
      localStorage.removeItem('adminSessionStart');
      localStorage.removeItem('adminLastActivity');
      router.push('/dashboard-chezmonami');
      return;
    }

    // ── Vérifier que la session a un token valide (nouveau système) ──
    // Les anciennes sessions (avant sécurisation) n'ont pas de sessionToken.
    // Dans ce cas on force la reconnexion proprement.
    try {
      const parsed = JSON.parse(adminAuth);
      if (!parsed.sessionToken) {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminSessionStart');
        localStorage.removeItem('adminLastActivity');
        router.push('/dashboard-chezmonami');
        return;
      }
    } catch {
      localStorage.removeItem('adminAuth');
      router.push('/dashboard-chezmonami');
      return;
    }

    if (!sessionStart) localStorage.setItem('adminSessionStart', Date.now().toString());
    if (!lastActivity) localStorage.setItem('adminLastActivity', Date.now().toString());

    const parsedAdmin = JSON.parse(adminAuth);
    setAdmin(parsedAdmin);
    const token = parsedAdmin.sessionToken || '';

    // Charger les badges notifications
    const chargerBadge = () => {
      fetch('/api/admin/notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then(r => r.ok ? r.json() : null).then(d => {
        if (d) {
          setNbNouveauxMessages(d.nb_messages || 0);
          setNbAppelsOffres(d.nb_appels || 0);
        }
      }).catch(() => {});
    };
    chargerBadge();
    const intervalBadge = setInterval(chargerBadge, POLLING_INTERVAL);

    const intervalVerification = setInterval(verifierSession, 30000);
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, mettreAJourActivite));

    return () => {
      clearInterval(intervalVerification);
      clearInterval(intervalBadge);
      events.forEach(e => window.removeEventListener(e, mettreAJourActivite));
    };
  }, [router, verifierSession, mettreAJourActivite]);

  const handleLogout = async () => {
    if (await confirmDialog({ message: 'Voulez-vous vraiment vous déconnecter ?' })) {
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('adminSessionStart');
      localStorage.removeItem('adminLastActivity');
      router.push('/dashboard-chezmonami');
    }
  };

  const formatTemps = (ms) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const secondes = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${secondes}s`;
  };

  if (!admin) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar — démarre sous le header public (top-20 = 5rem) */}
      <aside
        className={`fixed top-20 left-0 h-[calc(100vh-5rem)] bg-white border-r border-gray-200 shadow-xl transition-all duration-300 z-40 overflow-hidden ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 w-64 lg:w-20'
        }`}
      >
        <AdminSidebarContent
          isOpen={sidebarOpen}
          admin={admin}
          tempsRestant={tempsRestant}
          formatTemps={formatTemps}
          onLogout={handleLogout}
          nbNouveauxMessages={nbNouveauxMessages}
          nbAppelsOffres={nbAppelsOffres}
        />
      </aside>

      {/* Toggle Desktop */}
      <div className={`fixed bottom-6 z-50 hidden lg:flex transition-all duration-300 ${sidebarOpen ? 'left-[232px]' : 'left-[56px]'}`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white border border-gray-200 shadow-md rounded-full w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
        >
          <span className="text-sm">{sidebarOpen ? '◀' : '▶'}</span>
        </button>
      </div>

      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenu Principal */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Sous-header breadcrumb */}
        <header className="bg-white shadow-sm sticky top-20 z-20 border-b border-gray-100">
          <div className="px-4 lg:px-8 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
              {/* Bouton menu mobile */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden bg-primary text-white p-2 rounded-lg shadow flex-shrink-0"
              >
                {sidebarOpen ? '✕' : '☰'}
              </button>

              {/* Breadcrumb */}
              <nav className="flex items-center gap-1 flex-wrap">
                <Link href="/admin/dashboard" className="text-primary hover:text-primary-dark font-medium flex-shrink-0">
                  🏠 Dashboard
                </Link>
                {/* Breadcrumb custom passé en prop */}
                {breadcrumb ? breadcrumb.map((item, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span className="text-gray-300">›</span>
                    {item.href ? (
                      <Link href={item.href} className="text-primary hover:text-primary-dark font-medium flex-shrink-0">
                        {item.label}
                      </Link>
                    ) : item.onClick ? (
                      <button onClick={item.onClick} className="text-primary hover:text-primary-dark font-medium flex-shrink-0">
                        {item.label}
                      </button>
                    ) : (
                      <span className="text-gray-700 font-semibold truncate">{item.label}</span>
                    )}
                  </span>
                )) : (
                  <>
                    <span className="text-gray-300">›</span>
                    <span className="text-gray-700 font-semibold truncate">{titre}</span>
                  </>
                )}
              </nav>
            </div>

            {/* Temps restant + bouton retour rapide */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {tempsRestant && (
                <div className="hidden lg:flex px-3 py-1 bg-gray-100 rounded-lg">
                  <span className="text-xs text-gray-500">⏱️ {formatTemps(tempsRestant)}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Contenu Page */}
        <div className="p-4 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">{titre}</h1>
            {sousTitre && <p className="text-gray-500 text-sm">{sousTitre}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
