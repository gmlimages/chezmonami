// API Promotions
export const promotionsAPI = {
  // Récupérer toutes
  getAll: async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*, produit:produits(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Récupérer actives
  getActive: async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('promotions')
      .select('*, produit:produits(*)')
      .eq('actif', true)
      .lte('date_debut', now)
      .gte('date_fin', now);
    
    if (error) throw error;
    return data;
  },

  // Créer
  create: async (promo) => {
    const { data, error } = await supabase
      .from('promotions')
      .insert(promo)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Mettre à jour
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('promotions')
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
      .from('promotions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};