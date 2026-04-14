// src/app/admin/AdminLayout.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AdminSidebarContent from './AdminSidebarContent';

const POLLING_INTERVAL = 60 * 1000; // 1 minute

export default function AdminLayout({ children, titre, sousTitre }) {
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
    alert('⏰ Session expirée. Veuillez vous reconnecter.');
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

    if (!sessionStart) localStorage.setItem('adminSessionStart', Date.now().toString());
    if (!lastActivity) localStorage.setItem('adminLastActivity', Date.now().toString());

    setAdmin(JSON.parse(adminAuth));

    // Charger les badges notifications
    const chargerBadge = () => {
      fetch('/api/admin/notifications').then(r => r.ok ? r.json() : null).then(d => {
        if (d) {
          setNbNouveauxMessages(d.nb_messages || 0);
          setNbAppelsOffres(d.nb_appels || 0);
          // nb_docs est géré séparément par le dashboard
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

  const handleLogout = () => {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
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
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen lg:top-20 lg:h-[calc(100vh-5rem)] bg-white border-r border-gray-200 shadow-xl transition-all duration-300 z-40 overflow-hidden ${
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
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-20 z-20 border-b border-gray-100">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden bg-primary text-white p-2 rounded-lg shadow"
              >
                {sidebarOpen ? '✕' : '☰'}
              </button>
              <Link href="/admin/dashboard" className="text-primary hover:text-primary-dark font-medium">
                Dashboard
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-700 font-semibold">{titre}</span>
            </div>
            {tempsRestant && (
              <div className="hidden lg:flex px-3 py-1 bg-gray-100 rounded-lg">
                <span className="text-xs text-gray-500">⏱️ {formatTemps(tempsRestant)}</span>
              </div>
            )}
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
