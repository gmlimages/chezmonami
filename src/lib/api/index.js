// src/lib/api/index.js
// Fichier centralisé pour exporter toutes les APIs

// Imports depuis les fichiers individuels
import { supabase } from '../supabase';

// ============================================
// STRUCTURES API
// ============================================
export const structuresAPI = {
  async getAll(filters = {}) {
    let query = supabase
      .from('structures')
      .select(`
        *,
        pays:pays_id(id, nom, devise),
        ville:ville_id(id, nom),
        categorie:categorie_id(id, nom, icon, color)
      `)
      .order('created_at', { ascending: false });

    if (filters.categorie && filters.categorie !== 'tous') {
      query = query.eq('categorie_id', filters.categorie);
    }

    if (filters.ville_id) {
      query = query.eq('ville_id', filters.ville_id);
    }

    if (filters.pays_id) {
      query = query.eq('pays_id', filters.pays_id);
    }

    if (filters.recherche) {
      query = query.or(`nom.ilike.%${filters.recherche}%,description.ilike.%${filters.recherche}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('structures')
      .select(`
        *,
        pays:pays_id(id, nom, devise),
        ville:ville_id(id, nom),
        categorie:categorie_id(id, nom, icon, color)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(structureData) {
    const { data, error } = await supabase
      .from('structures')
      .insert([structureData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, structureData) {
    const { data, error } = await supabase
      .from('structures')
      .update(structureData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('structures')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },



  // AJOUT DE FONCTIONS:

  async getRecentes(limit = 6) {
    const { data, error } = await supabase
      .from('structures')
      .select(`
        *,
        categorie:categories(id, nom, icon, color),
        pays:pays(id, nom, devise),
        ville:villes(id, nom)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getPopulaires(limit = 6) {
    // Récupérer les structures les plus vues depuis elements_populaires
    const { data: populaires, error: errorPop } = await supabase
      .from('elements_populaires')
      .select('element_id, vues_total')
      .eq('element_type', 'structure')
      .order('vues_total', { ascending: false })
      .limit(limit);

    if (errorPop) {
      // Si pas de données populaires, retourner les plus récentes
      return this.getRecentes(limit);
    }

    if (!populaires || populaires.length === 0) {
      return this.getRecentes(limit);
    }

    // Récupérer les détails des structures populaires
    const ids = populaires.map(p => p.element_id);
    const { data, error } = await supabase
      .from('structures')
      .select(`
        *,
        categorie:categories(id, nom, icon, color),
        pays:pays(id, nom, devise),
        ville:villes(id, nom)
      `)
      .in('id', ids);

    if (error) throw error;

    // Trier selon l'ordre de popularité
    const sorted = data.sort((a, b) => {
      const indexA = ids.indexOf(a.id);
      const indexB = ids.indexOf(b.id);
      return indexA - indexB;
    });

    return sorted || [];
  }
};

// ============================================
// PRODUITS API
// ============================================
export const produitsAPI = {
  async getAll(filters = {}) {
    let query = supabase
      .from('produits')
      .select(`
        *,
        pays:pays_id(id, nom, devise),
        ville:ville_id(id, nom),
        categorie_info:categorie(id, nom, icon, color),
        structure:structure_id(id, nom, telephone)
      `)
      .order('created_at', { ascending: false });

    if (filters.categorie && filters.categorie !== 'toutes') {
      query = query.eq('categorie', filters.categorie);
    }

    if (filters.ville_id) {
      query = query.eq('ville_id', filters.ville_id);
    }

    if (filters.pays_id) {
      query = query.eq('pays_id', filters.pays_id);
    }

    if (filters.structure_id) {
      query = query.eq('structure_id', filters.structure_id);
    }

    if (filters.recherche) {
      query = query.or(`nom.ilike.%${filters.recherche}%,description.ilike.%${filters.recherche}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getPopulaires(limit = 8) {
    const { data, error } = await supabase
      .from('produits')
      .select(`
        *,
        pays:pays_id(id, nom, devise),
        ville:ville_id(id, nom),
        categorie_info:categorie(id, nom, icon, color),
        structure:structure_id(id, nom)
      `)
      .order('vues_total', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getRecents(limit = 8) {
    const { data, error } = await supabase
      .from('produits')
      .select(`
        *,
        pays:pays_id(id, nom, devise),
        ville:ville_id(id, nom),
        categorie_info:categorie(id, nom, icon, color),
        structure:structure_id(id, nom)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('produits')
      .select(`
        *,
        pays:pays_id(id, nom, devise),
        ville:ville_id(id, nom),
        categorie_info:categorie(id, nom, icon, color),
        structure:structure_id(id, nom, telephone, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(produitData) {
    const { data, error } = await supabase
      .from('produits')
      .insert([produitData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, produitData) {
    const { data, error } = await supabase
      .from('produits')
      .update(produitData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { data, error } = await supabase
      .from('produits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return data;
  },



  // AJOUT DE FONCTIONS:

  async getRecents(limit = 8) {
    const { data, error } = await supabase
      .from('produits')
      .select(`
        *,
        categorie_info:categorie(id, nom, icon, color),
        pays:pays(id, nom, devise),
        ville:villes(id, nom),
        structure:structures(id, nom)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getPopulaires(limit = 8) {
    // Récupérer les produits les plus vus
    const { data: populaires, error: errorPop } = await supabase
      .from('elements_populaires')
      .select('element_id, vues_total')
      .eq('element_type', 'produit')
      .order('vues_total', { ascending: false })
      .limit(limit);

    if (errorPop || !populaires || populaires.length === 0) {
      return this.getRecents(limit);
    }

    const ids = populaires.map(p => p.element_id);
    const { data, error } = await supabase
      .from('produits')
      .select(`
        *,
        categorie_info:categorie(id, nom, icon, color),
        pays:pays(id, nom, devise),
        ville:villes(id, nom),
        structure:structures(id, nom)
      `)
      .in('id', ids);

    if (error) throw error;

    const sorted = data.sort((a, b) => {
      const indexA = ids.indexOf(a.id);
      const indexB = ids.indexOf(b.id);
      return indexA - indexB;
    });

    return sorted || [];
  }
};


// ============================================
// CATÉGORIES PRODUITS API
// ============================================
// À AJOUTER dans votre fichier src/lib/api/index.js
// (après les autres exports)

export const categoriesProduitsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('categories_produits')
      .select('*')
      .eq('actif', true)
      .order('nom', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('categories_produits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(categorieData) {
    const { data, error } = await supabase
      .from('categories_produits')
      .insert([categorieData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, categorieData) {
    const { data, error } = await supabase
      .from('categories_produits')
      .update({ ...categorieData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    // Soft delete - on désactive au lieu de supprimer
    const { data, error } = await supabase
      .from('categories_produits')
      .update({ actif: false })
      .eq('id', id);

    if (error) throw error;
    return data;
  },

  // Supprimer définitivement (à utiliser avec précaution)
  async hardDelete(id) {
    const { data, error } = await supabase
      .from('categories_produits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return data;
  }
};




// ============================================
// ANNONCES API
// ============================================
export const annoncesAPI = {
  async getAll(filters = {}) {
    let query = supabase
      .from('annonces')
      .select(`
        *,
        pays:pays_id(id, nom)
      `)
      .order('date_publication', { ascending: false });

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.pays_id) {
      query = query.eq('pays_id', filters.pays_id);
    }

    if (filters.recherche) {
      query = query.or(`titre.ilike.%${filters.recherche}%,organisme.ilike.%${filters.recherche}%,description.ilike.%${filters.recherche}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async create(annonceData) {
    const { data, error } = await supabase
      .from('annonces')
      .insert([annonceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, annonceData) {
    const { data, error } = await supabase
      .from('annonces')
      .update(annonceData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('annonces')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};


// ============================================
// ANNONCES ÉPINGLÉES API (pour page d'accueil)
// ============================================
export const annoncesEpingleesAPI = {
  // Récupérer les annonces épinglées actives
  async getActives() {
    const { data, error } = await supabase
      .from('annonces_epinglees')
      .select('*')
      .eq('actif', true)
      .order('position') // position: 'haut' ou 'bas'
      .limit(2);

    if (error) throw error;
    return data || [];
  },

  // Récupérer toutes les annonces épinglées (pour admin)
  async getAll() {
    const { data, error } = await supabase
      .from('annonces_epinglees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Créer une nouvelle annonce épinglée
  async create(annonceData) {
    const { data, error } = await supabase
      .from('annonces_epinglees')
      .insert([annonceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour une annonce épinglée
  async update(id, annonceData) {
    const { data, error } = await supabase
      .from('annonces_epinglees')
      .update(annonceData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Supprimer une annonce épinglée
  async delete(id) {
    const { error } = await supabase
      .from('annonces_epinglees')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Activer/désactiver une annonce épinglée
  async toggleActif(id, actif) {
    const { data, error } = await supabase
      .from('annonces_epinglees')
      .update({ actif })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};


// ============================================
// CATÉGORIES API
// ============================================
export const categoriesAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('nom');

    if (error) throw error;
    return data || [];
  },

  async create(categorieData) {
    const { data, error } = await supabase
      .from('categories')
      .insert([categorieData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, categorieData) {
    const { data, error } = await supabase
      .from('categories')
      .update(categorieData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

// ============================================
// PAYS API
// ============================================
export const paysAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('pays')
      .select('*')
      .order('nom');

    if (error) throw error;
    return data || [];
  },

  async create(paysData) {
    const { data, error } = await supabase
      .from('pays')
      .insert([paysData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('pays')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

// ============================================
// VILLES API
// ============================================
export const villesAPI = {
  async getByPays(paysId) {
    const { data, error } = await supabase
      .from('villes')
      .select('*')
      .eq('pays_id', paysId)
      .order('nom');

    if (error) throw error;
    return data || [];
  },

  async getAll() {
    const { data, error } = await supabase
      .from('villes')
      .select('*, pays:pays_id(id, nom)')
      .order('nom');

    if (error) throw error;
    return data || [];
  },

  async create(villeData) {
    const { data, error } = await supabase
      .from('villes')
      .insert([villeData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('villes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

// ============================================
// BANNIÈRES API
// ============================================
export const bannieresAPI = {
  async getActives() {
    const { data, error } = await supabase
      .from('bannieres')
      .select(`
        *,
        structure:structure_id(id, nom)
      `)
      .eq('actif', true)
      .order('ordre');

    if (error) throw error;
    return data || [];
  },

  async getAll() {
    const { data, error } = await supabase
      .from('bannieres')
      .select(`
        *,
        structure:structure_id(id, nom)
      `)
      .order('ordre');

    if (error) throw error;
    return data || [];
  },

  async create(banniereData) {
    const { data, error } = await supabase
      .from('bannieres')
      .insert([banniereData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, banniereData) {
    const { data, error } = await supabase
      .from('bannieres')
      .update(banniereData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('bannieres')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },


  // AJOUT DE FONCTION:
  async getActives() {
    const { data, error } = await supabase
      .from('bannieres')
      .select('*')
      .eq('actif', true)
      .order('ordre', { ascending: true });

    if (error) {
      console.error('Erreur bannières:', error);
      return [];
    }
    return data || [];
  }
  
};

// ============================================
// STATISTIQUES API
// ============================================
export const statistiquesAPI = {
  // Enregistrer une visite
  async enregistrerVisite(visitData) {
    const { error } = await supabase
      .from('visites')
      .insert([visitData]);

    if (error) console.error('Erreur enregistrement visite:', error);
  },

  // Incrémenter vue d'une page
  async incrementerVuePage(pageUrl, pageTitre, pageType = null, elementId = null) {
    const { error } = await supabase.rpc('incrementer_vue_page', {
      p_page_url: pageUrl,
      p_page_titre: pageTitre,
      p_page_type: pageType,
      p_element_id: elementId
    });

    if (error) console.error('Erreur incrémentation vue:', error);
  },

  // Enregistrer élément populaire
  async enregistrerElementPopulaire(elementType, elementId, elementNom) {
    const { error } = await supabase.rpc('enregistrer_element_populaire', {
      p_element_type: elementType,
      p_element_id: elementId,
      p_element_nom: elementNom
    });

    if (error) console.error('Erreur élément populaire:', error);
  },

  // Obtenir les stats quotidiennes
  async getStatsQuotidiennes(jours = 30) {
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - jours);

    const { data, error } = await supabase
      .from('stats_quotidiennes')
      .select('*')
      .gte('date', dateDebut.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Obtenir les éléments les plus populaires
  async getElementsPopulaires(type = null, limit = 10, periode = 'total') {
    let query = supabase
      .from('elements_populaires')
      .select('*');

    if (type) {
      query = query.eq('element_type', type);
    }

    const orderColumn = periode === 'semaine' ? 'vues_semaine' : 
                       periode === 'mois' ? 'vues_mois' : 'vues_total';

    query = query.order(orderColumn, { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  // Obtenir les pages les plus vues
  async getPagesPopulaires(jours = 7, limit = 10) {
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - jours);

    const { data, error } = await supabase
      .from('pages_vues')
      .select('page_url, page_titre, SUM(vues_count)::int as total_vues')
      .gte('date', dateDebut.toISOString().split('T')[0])
      .group('page_url, page_titre')
      .order('total_vues', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Obtenir stats globales
  async getStatsGlobales() {
    const aujourd_hui = new Date().toISOString().split('T')[0];
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    const hierDate = hier.toISOString().split('T')[0];

    const [statsAujourdhui, statsHier, totalVisites] = await Promise.all([
      supabase.from('stats_quotidiennes').select('*').eq('date', aujourd_hui).single(),
      supabase.from('stats_quotidiennes').select('*').eq('date', hierDate).single(),
      supabase.from('visites').select('id', { count: 'exact', head: true })
    ]);

    return {
      aujourd_hui: statsAujourdhui.data || { visiteurs_uniques: 0, total_visites: 0 },
      hier: statsHier.data || { visiteurs_uniques: 0, total_visites: 0 },
      total_visites_historique: totalVisites.count || 0
    };
  },

  // Mettre à jour les stats quotidiennes
  async majStatsQuotidiennes() {
    const { error } = await supabase.rpc('maj_stats_quotidiennes');
    if (error) console.error('Erreur MAJ stats:', error);
  }
};


// ============================================
// API COMMENTAIRES
// ============================================

export const commentairesAPI = {
  // Récupérer tous les commentaires (admin)
  getAll: async () => {
    const { data, error } = await supabase
      .from('commentaires')
      .select(`
        *,
        structure:structures(id, nom, categorie_id)
      `)
      .order('date_creation', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Récupérer les commentaires actifs d'une structure (public)
  getByStructure: async (structureId) => {
    const { data, error } = await supabase
      .from('commentaires')
      .select('*')
      .eq('structure_id', structureId)
      .eq('actif', true)
      .order('date_creation', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Récupérer tous les commentaires d'une structure (admin - avec inactifs)
  getAllByStructure: async (structureId) => {
    const { data, error } = await supabase
      .from('commentaires')
      .select('*')
      .eq('structure_id', structureId)
      .order('date_creation', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Créer un commentaire (public)
  create: async (commentaire) => {
    const { data, error } = await supabase
      .from('commentaires')
      .insert([{
        structure_id: commentaire.structure_id,
        nom_visiteur: commentaire.nom_visiteur,
        commentaire: commentaire.commentaire,
        note: commentaire.note,
        actif: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Recalculer la note de la structure
    await supabase.rpc('recalculer_note_structure', {
      p_structure_id: commentaire.structure_id
    });
    
    return data;
  },

  // Activer/désactiver un commentaire (admin)
  toggleActif: async (id, actif) => {
    const { data, error } = await supabase
      .from('commentaires')
      .update({ actif })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Supprimer un commentaire (admin)
  delete: async (id) => {
    const { error } = await supabase
      .from('commentaires')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Rechercher des commentaires (admin)
  search: async (query) => {
    const { data, error } = await supabase
      .from('commentaires')
      .select(`
        *,
        structure:structures(id, nom, categorie_id)
      `)
      .or(`nom_visiteur.ilike.%${query}%,commentaire.ilike.%${query}%`)
      .order('date_creation', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Statistiques des commentaires
  getStats: async () => {
    const { data, error } = await supabase
      .from('commentaires')
      .select('actif');
    
    if (error) throw error;
    
    return {
      total: data.length,
      actifs: data.filter(c => c.actif).length,
      inactifs: data.filter(c => !c.actif).length
    };
  }
};

export { statistiquesAPI } from './statistiques';


// ============================================
// API CHAMBRES
// ============================================

export const chambresAPI = {
  // Récupérer toutes les chambres
  async getAll() {
    const { data, error } = await supabase
      .from('chambres')
      .select(`
        *,
        structure:structures(id, nom, ville:villes(nom))
      `)
      .order('ordre_affichage', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Récupérer toutes les chambres d'une structure
  async getByStructure(structureId) {
    const { data, error } = await supabase
      .from('chambres')
      .select('*')
      .eq('structure_id', structureId)
      .order('ordre_affichage', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Récupérer uniquement les chambres disponibles d'une structure
  async getDisponiblesByStructure(structureId) {
    const { data, error } = await supabase
      .from('chambres')
      .select('*')
      .eq('structure_id', structureId)
      .eq('disponible', true)
      .order('ordre_affichage', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Récupérer une chambre par ID
  async getById(id) {
    const { data, error } = await supabase
      .from('chambres')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Créer une nouvelle chambre
  async create(chambreData) {
    const { data, error } = await supabase
      .from('chambres')
      .insert([chambreData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mettre à jour une chambre
  async update(id, chambreData) {
    const { data, error } = await supabase
      .from('chambres')
      .update(chambreData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Supprimer une chambre
  async delete(id) {
    const { error } = await supabase
      .from('chambres')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Changer rapidement le statut disponible/occupé
  async toggleDisponibilite(id, disponible) {
    const { data, error } = await supabase
      .from('chambres')
      .update({ disponible })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Statistiques des chambres d'une structure
  async getStats(structureId) {
    const chambres = await this.getByStructure(structureId);
    
    const disponibles = chambres.filter(c => c.disponible);
    const occupees = chambres.filter(c => !c.disponible);
    
    return {
      total: chambres.length,
      disponibles: disponibles.length,
      occupees: occupees.length,
      prix_min: chambres.length > 0 ? Math.min(...chambres.map(c => c.prix_standard)) : 0,
      prix_max: chambres.length > 0 ? Math.max(...chambres.map(c => c.prix_standard)) : 0,
    };
  }
};