// src/lib/api/featured.js - VERSION CORRIGÉE
import { supabase } from '@/lib/supabase';
import { structuresAPI } from './structures';
import { produitsAPI } from './produits';

export const featuredAPI = {
  // Récupérer mises en avant (SANS RELATION)
  getAll: async () => {
    const { data, error } = await supabase
      .from('mises_en_avant')
      .select('*')
      .order('ordre', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Récupérer structures featured avec enrichissement manuel
  getStructuresFeatured: async (position = null, limit = null) => {
    try {
      const now = new Date().toISOString();
      
      // Requête sans relation
      let query = supabase
        .from('mises_en_avant')
        .select('*')
        .eq('element_type', 'structure')
        .eq('actif', true)
        .lte('date_debut', now)
        .or(`date_fin.is.null,date_fin.gte.${now}`)
        .order('ordre', { ascending: true });

      if (position) {
        query = query.or(`position.eq.${position},position.eq.tous`);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: misesData, error } = await query;
      if (error) throw error;

      // Charger structures séparément
      const structures = await structuresAPI.getAll();

      // Enrichir avec les structures
      const featured = (misesData || [])
        .map(mise => {
          const structure = structures.find(s => s.id === mise.element_id);
          return structure ? {
            ...structure,
            featured: true,
            featured_ordre: mise.ordre,
            featured_titre: mise.titre
          } : null;
        })
        .filter(Boolean);

      return featured;
    } catch (error) {
      console.error('❌ Erreur featured structures:', error);
      return [];
    }
  },

  // Récupérer produits featured
  getProduitsFeatured: async (position = null, limit = null) => {
    try {
      const now = new Date().toISOString();
      
      let query = supabase
        .from('mises_en_avant')
        .select('*')
        .eq('element_type', 'produit')
        .eq('actif', true)
        .lte('date_debut', now)
        .or(`date_fin.is.null,date_fin.gte.${now}`)
        .order('ordre', { ascending: true });

      if (position) {
        query = query.or(`position.eq.${position},position.eq.tous`);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: misesData, error } = await query;
      if (error) throw error;

      // Charger produits séparément
      const produits = await produitsAPI.getAll();

      // Enrichir
      const featured = (misesData || [])
        .map(mise => {
          const produit = produits.find(p => p.id === mise.element_id);
          return produit ? {
            ...produit,
            featured: true,
            featured_ordre: mise.ordre,
            featured_titre: mise.titre
          } : null;
        })
        .filter(Boolean);

      return featured;
    } catch (error) {
      console.error('❌ Erreur featured produits:', error);
      return [];
    }
  },

  // Créer mise en avant
  create: async (miseEnAvant) => {
    const { data, error } = await supabase
      .from('mises_en_avant')
      .insert(miseEnAvant)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mettre à jour
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('mises_en_avant')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Supprimer
  delete: async (id) => {
    const { error } = await supabase
      .from('mises_en_avant')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Incrémenter stats
  incrementStats: async (id, statType) => {
    try {
      const field = statType === 'vue' ? 'vues' : 
                    statType === 'clic' ? 'clics' : null;
      
      if (!field) return;

      const { error } = await supabase.rpc('increment', {
        table_name: 'mises_en_avant',
        row_id: id,
        field_name: field
      });

      if (error) throw error;
    } catch (error) {
      console.error('❌ Erreur increment stats:', error);
    }
  }
};