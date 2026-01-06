// src/lib/api/statistiques.js - API COMPLÈTE
import { supabase } from '@/lib/supabase';

export const statistiquesAPI = {
  // Mettre à jour les stats quotidiennes
  majStatsQuotidiennes: async () => {
    try {
      await supabase.rpc('maj_stats_quotidiennes');
    } catch (error) {
      console.error('Erreur MAJ stats:', error);
    }
  },

  // Stats globales (aujourd'hui, hier, total)
  getStatsGlobales: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Stats aujourd'hui
      const { data: statsToday } = await supabase
        .from('stats_quotidiennes')
        .select('visiteurs_uniques, total_visites')
        .eq('date', today)
        .single();

      // Stats hier
      const { data: statsYesterday } = await supabase
        .from('stats_quotidiennes')
        .select('visiteurs_uniques, total_visites')
        .eq('date', yesterday)
        .single();

      // Total historique
      const { data: totalVisites } = await supabase
        .from('visites')
        .select('id', { count: 'exact', head: true });

      return {
        aujourd_hui: statsToday || { visiteurs_uniques: 0, total_visites: 0 },
        hier: statsYesterday || { visiteurs_uniques: 0, total_visites: 0 },
        total_visites_historique: totalVisites || 0
      };
    } catch (error) {
      console.error('Erreur stats globales:', error);
      return {
        aujourd_hui: { visiteurs_uniques: 0, total_visites: 0 },
        hier: { visiteurs_uniques: 0, total_visites: 0 },
        total_visites_historique: 0
      };
    }
  },

  // Stats quotidiennes sur X jours
  getStatsQuotidiennes: async (jours = 30) => {
    try {
      const dateDebut = new Date();
      dateDebut.setDate(dateDebut.getDate() - jours);

      const { data, error } = await supabase
        .from('stats_quotidiennes')
        .select('*')
        .gte('date', dateDebut.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur stats quotidiennes:', error);
      return [];
    }
  },

  // Pages les plus visitées
  getPagesPopulaires: async (jours = 30) => {
    try {
      const dateDebut = new Date();
      dateDebut.setDate(dateDebut.getDate() - jours);

      const { data, error } = await supabase
        .from('pages_vues')
        .select('page_url, page_titre, page_type, element_id')
        .gte('created_at', dateDebut.toISOString())
        .order('vues_count', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Grouper et compter
      const pageMap = {};
      (data || []).forEach(page => {
        const key = page.page_url;
        if (!pageMap[key]) {
          pageMap[key] = {
            page_url: page.page_url,
            page_titre: page.page_titre,
            page_type: page.page_type,
            vues: 0
          };
        }
        pageMap[key].vues++;
      });

      return Object.values(pageMap)
        .sort((a, b) => b.vues - a.vues)
        .slice(0, 20);
    } catch (error) {
      console.error('Erreur pages populaires:', error);
      return [];
    }
  },

  // Éléments populaires (structures, produits, annonces)
  getElementsPopulaires: async (type, limit = 10, tri = 'semaine') => {
    try {
      const colonnesTri = {
        'total': 'vues_total',
        'semaine': 'vues_semaine',
        'mois': 'vues_mois'
      };

      const { data, error } = await supabase
        .from('elements_populaires')
        .select('*')
        .eq('element_type', type)
        .order(colonnesTri[tri] || 'vues_total', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur éléments populaires:', error);
      return [];
    }
  },

  // Stats par appareil
  getStatsPar: async (colonne, jours = 30) => {
    try {
      const dateDebut = new Date();
      dateDebut.setDate(dateDebut.getDate() - jours);

      const { data, error } = await supabase
        .from('visites')
        .select(colonne)
        .gte('created_at', dateDebut.toISOString());

      if (error) throw error;

      // Compter les occurrences
      const stats = {};
      (data || []).forEach(item => {
        const valeur = item[colonne] || 'Non défini';
        stats[valeur] = (stats[valeur] || 0) + 1;
      });

      return Object.entries(stats)
        .map(([nom, valeur]) => ({ nom, valeur }))
        .sort((a, b) => b.valeur - a.valeur);
    } catch (error) {
      console.error('Erreur stats par:', error);
      return [];
    }
  },

  // Incrémenter manuellement les vues d'un élément
  incrementerVues: async (elementId, elementType, elementNom) => {
    try {
      const { data: existing } = await supabase
        .from('elements_populaires')
        .select('id')
        .eq('element_id', elementId)
        .eq('element_type', elementType)
        .single();

      if (existing) {
        await supabase.rpc('increment_element_vues', {
          p_element_id: elementId,
          p_element_type: elementType
        });
      } else {
        await supabase
          .from('elements_populaires')
          .insert({
            element_id: elementId,
            element_type: elementType,
            element_nom: elementNom,
            vues_total: 1,
            vues_semaine: 1,
            vues_mois: 1
          });
      }
    } catch (error) {
      console.error('Erreur increment vues:', error);
    }
  }
};