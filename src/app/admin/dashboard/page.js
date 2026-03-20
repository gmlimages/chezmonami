// src/app/admin/dashboard/page.js - DASHBOARD MODERNE
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  structuresAPI, 
  produitsAPI, 
  annoncesAPI, 
  categoriesAPI, 
  categoriesProduitsAPI,
  commentairesAPI,
  chambresAPI
} from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    structures: 0,
    produits: 0,
    annonces: 0,
    categories: 0,
    categoriesProduits: 0,
    chambres: 0,  //  Chambres hôtel
    commentaires: 0,
    // Commandes détaillées
    commandes: {
      total: 0,
      nouvelles: 0,
      confirmees: 0,
      en_preparation: 0,
      expediees: 0,
      livrees: 0,
      annulees: 0,
      ca_total: 0,
      ca_mois: 0
    },
    // Featured
    featured: {
      total: 0,
      actives: 0,
      accueil: 0,
      listing: 0
    },
    // Promotions
    promotions: {
      total: 0,
      actives: 0,
      enAttente: 0,
      expirees: 0,
      economieTotal: 0
    }
  });
  const [commandesRecentes, setCommandesRecentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (!adminAuth) {
      router.push('/dashboard-chezmonami');
    } else {
      setAdmin(JSON.parse(adminAuth));
      chargerStats();
    }
  }, [router]);

  const chargerStats = async () => {
    try {
      // Stats basiques
      const [
        structures, 
        produits, 
        annonces, 
        categories, 
        categoriesProduits, 
        statsCommentaires,
        chambres  // AJout
      ] = await Promise.all([
        structuresAPI.getAll(),
        produitsAPI.getAll(),
        annoncesAPI.getAll(),
        categoriesAPI.getAll(),
        categoriesProduitsAPI.getAll(),
        commentairesAPI.getStats(),
        chambresAPI.getAll()  // API Chambres
      ]);

      // Stats commandes détaillées
      const { data: commandes } = await supabase
        .from('commandes')
        .select('*');

      const now = new Date();
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const commandesStats = {
        total: commandes?.length || 0,
        nouvelles: commandes?.filter(c => c.statut === 'nouvelle').length || 0,
        confirmees: commandes?.filter(c => c.statut === 'confirmee').length || 0,
        en_preparation: commandes?.filter(c => c.statut === 'en_preparation').length || 0,
        expediees: commandes?.filter(c => c.statut === 'expediee').length || 0,
        livrees: commandes?.filter(c => c.statut === 'livree').length || 0,
        annulees: commandes?.filter(c => c.statut === 'annulee').length || 0,
        ca_total: commandes?.reduce((sum, c) => sum + c.montant_total, 0) || 0,
        ca_mois: commandes?.filter(c => new Date(c.created_at) >= debutMois)
          .reduce((sum, c) => sum + c.montant_total, 0) || 0
      };

      // Stats featured
      const { data: featured } = await supabase
        .from('mises_en_avant')
        .select('*');

      const estActive = (item) => {
        if (!item.actif) return false;
        const now = new Date();
        const debut = new Date(item.date_debut);
        const fin = item.date_fin ? new Date(item.date_fin) : null;
        return now >= debut && (!fin || now <= fin);
      };

      const featuredStats = {
        total: featured?.length || 0,
        actives: featured?.filter(f => estActive(f)).length || 0,
        accueil: featured?.filter(f => f.position === 'accueil').length || 0,
        listing: featured?.filter(f => f.position === 'listing').length || 0
      };

      // Stats promotions
      const { data: promotions } = await supabase
        .from('promotions')
        .select('*');

      const estPromoActive = (promo) => {
        if (!promo.actif) return false;
        const now = new Date();
        const debut = new Date(promo.date_debut);
        const fin = new Date(promo.date_fin);
        return now >= debut && now <= fin;
      };

      const promosStats = {
        total: promotions?.length || 0,
        actives: promotions?.filter(p => estPromoActive(p)).length || 0,
        enAttente: promotions?.filter(p => new Date(p.date_debut) > now).length || 0,
        expirees: promotions?.filter(p => new Date(p.date_fin) < now).length || 0,
        economieTotal: promotions?.reduce((sum, p) => sum + p.economie, 0) || 0
      };

      // Commandes récentes
      const { data: recentCommandes } = await supabase
        .from('commandes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        structures: structures.length,
        produits: produits.length,
        annonces: annonces.length,
        categories: categories.length,
        chambres: chambres.length,
        categoriesProduits: categoriesProduits.length,
        commentaires: statsCommentaires.total,
        commandes: commandesStats,
        featured: featuredStats,
        promotions: promosStats,
        
      });

      setCommandesRecentes(recentCommandes || []);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    router.push('/dashboard-chezmonami');
  };

  if (!admin) return null;

  const navigationItems = [
    {
      section: 'Contenu',
      items: [
        { nom: 'Structures', href: '/admin/structures', icon: '🏪', count: stats.structures },
        { nom: 'Produits', href: '/admin/produits', icon: '📦', count: stats.produits },
        { nom: 'Chambres', href: '/admin/chambres', icon: '🏨', count: stats.chambres },
        { nom: 'Annonces', href: '/admin/annonces', icon: '📢', count: stats.annonces },
      ]
    },
    {
      section: 'Commerce',
      items: [
        { nom: 'Commandes', href: '/admin/commandes', icon: '🛒', count: stats.commandes.total },
        { nom: 'Promotions', href: '/admin/promotions', icon: '🎁', count: stats.promotions.total },
        { nom: 'Mises en avant', href: '/admin/mises-en-avant', icon: '⭐', count: stats.featured.total },
      ]
    },
    {
      section: 'Interaction',
      items: [
        { nom: 'Newsletter', href: '/admin/newsletter', icon: '📧', count: 0 },
        { nom: 'Commentaires', href: '/admin/commentaires', icon: '💬', count: stats.commentaires },
      ]
    },
    {
      section: 'Configuration',
      items: [
        { nom: 'Catégories Structures', href: '/admin/categories', icon: '📂', count: stats.categories },
        { nom: 'Catégories Produits', href: '/admin/categories-produits', icon: '🏷️', count: stats.categoriesProduits },
        { nom: 'Bannières', href: '/admin/bannieres', icon: '🎯', count: 0 },
        { nom: 'Pays & Villes', href: '/admin/pays-villes', icon: '🌍', count: 0 },
      ]
    },
    {
      section: 'Analyses',
      items: [
        { nom: 'Statistiques', href: '/admin/statistiques', icon: '📊', count: 0 },
      ]
    }
  ];

  if (admin.role === 'super_admin') {
    navigationItems.push({
      section: 'Administration',
      items: [
        { nom: 'Comptes Admin', href: '/admin/comptes', icon: '👥', count: 0 },
      ]
    });
  }

  const STATUTS_COMMANDE = {
    'nouvelle': { label: 'Nouvelle', couleur: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
    'confirmee': { label: 'Confirmée', couleur: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50' },
    'en_preparation': { label: 'En préparation', couleur: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-50' },
    'expediee': { label: 'Expédiée', couleur: 'bg-purple-500', textColor: 'text-purple-600', bgLight: 'bg-purple-50' },
    'livree': { label: 'Livrée', couleur: 'bg-green-600', textColor: 'text-green-700', bgLight: 'bg-green-100' },
    'annulee': { label: 'Annulée', couleur: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50' }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl">🏪</span>
                </div>
                <div>
                  <div className="font-bold text-gray-800">Chez Mon Ami</div>
                  <div className="text-xs text-primary font-semibold">Admin Panel</div>
                </div>
              </Link>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg mx-auto">
                <span className="text-xl">🏪</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navigationItems.map((section, idx) => (
            <div key={idx}>
              {sidebarOpen && (
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">
                  {section.section}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition group"
                  >
                    <span className="text-xl">{item.icon}</span>
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 font-medium text-gray-700 group-hover:text-gray-900">
                          {item.nom}
                        </span>
                        {item.count > 0 && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                            {item.count}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-2"
          >
            <span>{sidebarOpen ? '◀' : '▶'}</span>
            {sidebarOpen && <span className="text-sm font-medium">Réduire</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  👋 Bienvenue, {admin.nom} !
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-medium text-gray-800">{admin.nom}</div>
                  <div className="text-xs text-gray-500">
                    {admin.role === 'super_admin' ? 'Super Administrateur' : 'Administrateur'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium text-sm flex items-center gap-2"
                >
                  <span>🚪</span>
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 mb-1">Structures</p>
                      <p className="text-3xl font-bold text-gray-800">{stats.structures}</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                      🏪
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 mb-1">Produits</p>
                      <p className="text-3xl font-bold text-gray-800">{stats.produits}</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                      📦
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Commandes</p>
                      <p className="text-3xl font-bold text-gray-800">{stats.commandes.total}</p>
                      <p className="text-xs text-green-600 mt-1">{stats.commandes.nouvelles} nouvelles</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                      🛒
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 mb-1">CA Total</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.commandes.ca_total.toLocaleString()} F</p>
                      <p className="text-xs text-orange-600 mt-1">
                        {stats.commandes.ca_mois.toLocaleString()} F ce mois
                      </p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                      💰
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Commerce - 3 colonnes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Commandes détaillées */}
                <Link href="/admin/commandes" className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-800">📦 Commandes</h2>
                    <span className="text-2xl font-bold text-green-600">{stats.commandes.total}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">🆕 Nouvelles</span>
                      <span className="font-bold text-blue-600">{stats.commandes.nouvelles}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">✅ Confirmées</span>
                      <span className="font-bold text-green-600">{stats.commandes.confirmees}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">📦 En préparation</span>
                      <span className="font-bold text-yellow-600">{stats.commandes.en_preparation}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">🚚 Expédiées</span>
                      <span className="font-bold text-purple-600">{stats.commandes.expediees}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-600">✨ Livrées</span>
                      <span className="font-bold text-green-700">{stats.commandes.livrees}</span>
                    </div>
                  </div>
                </Link>

                {/* Promotions */}
                <Link href="/admin/promotions" className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-800">🔥 Promotions</h2>
                    <span className="text-2xl font-bold text-red-600">{stats.promotions.total}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">✅ Actives</span>
                      <span className="font-bold text-green-600">{stats.promotions.actives}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">⏰ En attente</span>
                      <span className="font-bold text-yellow-600">{stats.promotions.enAttente}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">⏸️ Expirées</span>
                      <span className="font-bold text-gray-600">{stats.promotions.expirees}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 bg-red-50 rounded-lg px-3">
                      <span className="text-sm font-semibold text-red-700">Économie totale</span>
                      <span className="font-bold text-red-600">
                        {stats.promotions.economieTotal.toLocaleString()} F
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Mises en avant */}
                <Link href="/admin/mises-en-avant" className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-800">⭐ Mises en Avant</h2>
                    <span className="text-2xl font-bold text-yellow-600">{stats.featured.total}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">✅ Actives</span>
                      <span className="font-bold text-green-600">{stats.featured.actives}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">🏠 Page d'accueil</span>
                      <span className="font-bold text-purple-600">{stats.featured.accueil}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">📋 Page listing</span>
                      <span className="font-bold text-blue-600">{stats.featured.listing}</span>
                    </div>
                    <div className="pt-2">
                      <div className="text-xs text-gray-500 text-center">
                        Structures sponsorisées
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Commandes récentes */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">📋 Commandes récentes</h2>
                  <Link href="/admin/commandes" className="text-primary hover:underline text-sm font-medium">
                    Voir tout →
                  </Link>
                </div>
                {commandesRecentes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucune commande pour le moment</p>
                ) : (
                  <div className="space-y-3">
                    {commandesRecentes.map((cmd) => {
                      const statut = STATUTS_COMMANDE[cmd.statut];
                      return (
                        <Link
                          key={cmd.id}
                          href={`/admin/commandes`}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition border border-gray-100"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-2 h-2 rounded-full ${statut.couleur}`}></div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-800">{cmd.numero_commande}</p>
                              <p className="text-sm text-gray-600">{cmd.client_nom}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-accent">{cmd.montant_total.toLocaleString()} F</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${statut.bgLight} ${statut.textColor} font-semibold`}>
                                {statut.label}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}