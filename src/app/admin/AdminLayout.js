// src/app/admin/AdminLayout.js - AVEC SIDEBAR INTÉGRÉE
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children, titre, sousTitre }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [tempsRestant, setTempsRestant] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Durées en millisecondes
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

    // Vérifier si la session a dépassé 2h
    if (sessionDuration > SESSION_MAX) {
      deconnecter();
      return false;
    }

    // Vérifier si l'inactivité a dépassé 30min
    if (inactiveDuration > INACTIVITE_MAX) {
      deconnecter();
      return false;
    }

    // Calculer le temps restant (le plus court entre les deux limites)
    const tempsRestantInactivite = INACTIVITE_MAX - inactiveDuration;
    const tempsRestantSession = SESSION_MAX - sessionDuration;
    setTempsRestant(Math.min(tempsRestantInactivite, tempsRestantSession));

    return true;
  }, [deconnecter, INACTIVITE_MAX, SESSION_MAX]);

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    
    if (!adminAuth) {
      router.push('/dashboard-chezmonami');
      return;
    }

    // Initialiser la session si nécessaire
    if (!localStorage.getItem('adminSessionStart')) {
      localStorage.setItem('adminSessionStart', Date.now().toString());
    }
    if (!localStorage.getItem('adminLastActivity')) {
      localStorage.setItem('adminLastActivity', Date.now().toString());
    }

    setAdmin(JSON.parse(adminAuth));

    // Vérifier immédiatement
    if (!verifierSession()) {
      return;
    }

    // Vérifier toutes les 30 secondes
    const intervalVerification = setInterval(() => {
      verifierSession();
    }, 30000); // 30 secondes

    // Écouter les événements d'activité
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, mettreAJourActivite);
    });

    // Nettoyage
    return () => {
      clearInterval(intervalVerification);
      events.forEach(event => {
        window.removeEventListener(event, mettreAJourActivite);
      });
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

  // Menu items
  const menuItems = [
    { 
      href: '/admin/dashboard', 
      label: 'Dashboard', 
      icon: '📊',
      description: 'Vue d\'ensemble'
    },
    { 
      href: '/admin/commandes', 
      label: 'Commandes', 
      icon: '🛒',
      description: 'Gestion commandes'
    },
    { 
      href: '/admin/promotions', 
      label: 'Promotions', 
      icon: '🔥',
      description: 'Offres spéciales'
    },
    { 
      href: '/admin/mises-en-avant', 
      label: 'Mises en avant', 
      icon: '⭐',
      description: 'Featured items'
    },
    { 
      href: '/admin/structures', 
      label: 'Structures', 
      icon: '🏢',
      description: 'Entreprises'
    },
    { 
      href: '/admin/produits', 
      label: 'Produits', 
      icon: '📦',
      description: 'Catalogue'
    },
  ];

  if (!admin) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Toggle Button Mobile */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary text-white p-2 rounded-lg shadow-lg"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 shadow-xl transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-0 lg:w-20'
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Header Sidebar */}
          <div className="p-6 border-b border-gray-200">
            <Link href="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold text-xl">
                A
              </div>
              {sidebarOpen && (
                <div>
                  <h2 className="font-bold text-gray-800 group-hover:text-primary transition">
                    Admin
                  </h2>
                  <p className="text-xs text-gray-500">ChezMonAmi</p>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition group ${
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    {sidebarOpen && (
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${
                          isActive ? 'text-white' : 'text-gray-800 group-hover:text-primary'
                        }`}>
                          {item.label}
                        </p>
                        <p className={`text-xs truncate ${
                          isActive ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-gray-200">
            {/* Admin Info */}
            {sidebarOpen && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-800 truncate">{admin.nom}</p>
                {admin.role === 'super_admin' && (
                  <span className="text-xs text-primary font-bold">Super Admin</span>
                )}
                {tempsRestant && (
                  <p className="text-xs text-gray-500 mt-1">
                    ⏱️ {formatTemps(tempsRestant)}
                  </p>
                )}
              </div>
            )}

            {/* Bouton Retour Accueil */}
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition mb-2"
            >
              <span className="text-xl">🏠</span>
              {sidebarOpen && <span className="font-medium text-sm">Retour Accueil</span>}
            </Link>

            {/* Bouton Déconnexion */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition w-full"
            >
              <span className="text-xl">🚪</span>
              {sidebarOpen && <span className="font-medium text-sm">Déconnexion</span>}
            </button>

            {/* Toggle Sidebar Desktop */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex items-center justify-center w-full px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition mt-2"
            >
              <span className="text-xl">{sidebarOpen ? '◀' : '▶'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenu Principal */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Header avec breadcrumb et session */}
        <header className="bg-white shadow-md sticky top-0 z-20">
          <div className="px-4 lg:px-8 py-4">
            {/* Session Timer (desktop uniquement) */}
            {tempsRestant && (
              <div className="hidden lg:flex justify-end mb-2">
                <div className="px-3 py-1 bg-gray-100 rounded-lg">
                  <span className="text-xs text-gray-600">
                    ⏱️ Session: {formatTemps(tempsRestant)}
                  </span>
                </div>
              </div>
            )}

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link href="/admin/dashboard" className="text-primary hover:text-primary-dark">
                Dashboard
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-gray-700 font-semibold">{titre}</span>
            </div>
          </div>
        </header>

        {/* Contenu Page */}
        <div className="p-4 lg:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{titre}</h1>
            {sousTitre && <p className="text-gray-600">{sousTitre}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}