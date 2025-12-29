// src/components/VisitorTracker.js
// Composant pour tracker automatiquement les visites
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { statistiquesAPI } from '@/lib/api';

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Ne pas tracker les pages admin
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard-gml-secure')) {
      return;
    }

    trackVisit();
  }, [pathname]);

  const trackVisit = async () => {
    try {
      // Générer ou récupérer un ID de session
      let sessionId = sessionStorage.getItem('visitor_session_id');
      if (!sessionId) {
        sessionId = generateSessionId();
        sessionStorage.setItem('visitor_session_id', sessionId);
      }

      // Détecter le type d'appareil
      const deviceType = getDeviceType();
      const navigateur = getBrowser();

      // Données de la visite
      const visitData = {
        page_url: pathname,
        page_titre: document.title,
        referrer: document.referrer || null,
        device_type: deviceType,
        navigateur: navigateur,
        session_id: sessionId,
        user_agent: navigator.userAgent
      };

      // Enregistrer la visite
      await statistiquesAPI.enregistrerVisite(visitData);

      // Incrémenter le compteur de vues de la page
      const pageType = detectPageType(pathname);
      await statistiquesAPI.incrementerVuePage(
        pathname,
        document.title,
        pageType.type,
        pageType.id
      );

      // Si c'est une page de structure/produit/annonce, l'enregistrer comme populaire
      if (pageType.type && pageType.id) {
        const elementNom = document.title.split('|')[0].trim(); // Extrait le nom depuis le title
        await statistiquesAPI.enregistrerElementPopulaire(
          pageType.type,
          pageType.id,
          elementNom
        );
      }

    } catch (error) {
      console.error('Erreur tracking visite:', error);
    }
  };

  const generateSessionId = () => {
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  };

  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  };

  const getBrowser = () => {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    return 'Autre';
  };

  const detectPageType = (path) => {
    // Détecte le type de page et l'ID si applicable
    if (path === '/') {
      return { type: 'accueil', id: null };
    }
    
    // Structure : /structure/[id]
    const structureMatch = path.match(/^\/structure\/([a-f0-9-]+)$/);
    if (structureMatch) {
      return { type: 'structure', id: structureMatch[1] };
    }

    // Produit : /produit/[id]
    const produitMatch = path.match(/^\/produit\/([a-f0-9-]+)$/);
    if (produitMatch) {
      return { type: 'produit', id: produitMatch[1] };
    }

    // Annonce : /annonce/[id]
    const annonceMatch = path.match(/^\/annonce\/([a-f0-9-]+)$/);
    if (annonceMatch) {
      return { type: 'annonce', id: annonceMatch[1] };
    }

    return { type: null, id: null };
  };

  // Ce composant ne rend rien, il track juste en arrière-plan
  return null;
}