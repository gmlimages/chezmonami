// src/app/admin/AdminLayout.js
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children, titre, sousTitre }) {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [tempsRestant, setTempsRestant] = useState(null);

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

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-xl">🏪</span>
                </div>
                <span className="font-bold text-gray-800">Admin Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Indicateur de session */}
              {tempsRestant && (
                <div className="hidden md:block">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <span className="text-xs text-gray-600">
                      ⏱️ Session: {formatTemps(tempsRestant)}
                    </span>
                  </div>
                </div>
              )}

              <div className="text-right hidden md:block">
                <p className="text-sm text-gray-600">{admin.nom}</p>
                {admin.role === 'super_admin' && (
                  <span className="text-xs text-primary font-bold">Super Admin</span>
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold text-sm"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin/dashboard" className="text-primary hover:text-primary-dark">
              Dashboard
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700 font-semibold">{titre}</span>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{titre}</h1>
          {sousTitre && <p className="text-gray-600">{sousTitre}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}