// src/components/PageTracker.js - TRACKING AUTOMATIQUE
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PageTracker({ pageType = 'page', elementId = null, elementType = null }) {
  const pathname = usePathname();

  useEffect(() => {
    // Fonction pour générer un ID visiteur unique
    const getVisitorId = () => {
      let visitorId = localStorage.getItem('visitor_id');
      
      if (!visitorId) {
        // Créer un ID unique basé sur plusieurs facteurs
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('visitor_id', visitorId);
      }
      
      return visitorId;
    };

    // Fonction pour obtenir des infos sur le visiteur
    const getVisitorInfo = () => {
      return {
        user_agent: navigator.userAgent,
        device_type: /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        navigateur: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                   navigator.userAgent.includes('Firefox') ? 'Firefox' :
                   navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
        referrer: document.referrer || 'direct'
      };
    };


    // Fonction pour obtenir la localisation
    const getLocation = async () => {
      try {
        // Ne pas géolocaliser en localhost
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          return { pays: 'Test Local', ville: 'Dev' };
        }
        
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return {
          pays: data.country_name,
          ville: data.city
        };
      } catch (error) {
        return { pays: null, ville: null };
      }
    };

    // Fonction pour enregistrer une visite de page
    const trackPageVisit = async () => {
      try {
        const visitorId = getVisitorId();
        const visitorInfo = getVisitorInfo();
        const location = await getLocation();


        // Enregistrer la visite de page
        const visitResult = await supabase
          .from('visites')
          .insert({
            page_url: pathname,
            page_titre: document.title,
            page_type: pageType,
            referrer: visitorInfo.referrer,
            pays: location.pays,
            ville: location.ville,
            user_agent: visitorInfo.user_agent,
            device_type: visitorInfo.device_type,
            navigateur: visitorInfo.navigateur,
            session_id: visitorId
          });

        if (visitResult.error) {
          console.error('❌ Erreur visite:', visitResult.error.message, visitResult.error.code);
          return;
        }

        // Enregistrer dans pages_vues
        const pageViewResult = await supabase
          .from('pages_vues')
          .insert({
            page_url: pathname,
            page_titre: document.title,
            page_type: pageType,
            element_id: elementId
          });

        if (pageViewResult.error) {
          console.error('❌ Erreur page vue:', pageViewResult.error.message);
        }

        // Si c'est un élément spécifique (structure/produit/annonce), tracker
        if (elementId && elementType) {
          await trackElementView(elementId, elementType);
        }

        console.log('✅ Visite enregistrée:', pathname);

      } catch (error) {
        console.error('❌ Erreur tracking complète:', error);
      }
    };

    // Fonction pour tracker la vue d'un élément spécifique
    const trackElementView = async (id, type) => {
      try {
        // Vérifier si déjà vu cette semaine
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { data: existingView } = await supabase
  .from('elements_populaires')
  .select('*')
  .eq('element_id', id)
  .eq('element_type', type)
  .single();

if (existingView) {
  // Incrémenter
  await supabase
    .from('elements_populaires')
    .update({
      vues_total: existingView.vues_total + 1,
      vues_semaine: existingView.vues_semaine + 1,
      vues_mois: existingView.vues_mois + 1,
      last_viewed: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', existingView.id);
        } else {
          // Créer une nouvelle entrée
          await supabase
            .from('elements_populaires')
            .insert({
              element_id: id,
              element_type: type,
              element_nom: document.title,
              vues_total: 1,
              vues_semaine: 1,
              vues_mois: 1,
              last_viewed: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error('Erreur tracking element:', error);
      }
    };

    // Exécuter le tracking
    trackPageVisit();

    // Cleanup
    return () => {};
  }, [pathname, pageType, elementId, elementType]);

  // Ce composant ne rend rien
  return null;
}