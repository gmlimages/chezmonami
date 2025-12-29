// src/app/admin/dashboard/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  structuresAPI, 
  produitsAPI, 
  annoncesAPI, 
  categoriesAPI, 
  categoriesProduitsAPI,
  commentairesAPI  // ← AJOUTÉ
} from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({
    structures: 0,
    produits: 0,
    annonces: 0,
    categories: 0,
    categoriesProduits: 0,
    commentaires: 0  // ← AJOUTÉ
  });
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
      const [structures, produits, annonces, categories, categoriesProduits, statsCommentaires] = await Promise.all([
        structuresAPI.getAll(),
        produitsAPI.getAll(),
        annoncesAPI.getAll(),
        categoriesAPI.getAll(),
        categoriesProduitsAPI.getAll(),
        commentairesAPI.getStats()  // ← AJOUTÉ
      ]);

      setStats({
        structures: structures.length,
        produits: produits.length,
        annonces: annonces.length,
        categories: categories.length,
        categoriesProduits: categoriesProduits.length,
        commentaires: statsCommentaires.total  // ← AJOUTÉ
      });
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

  const menuItems = [
    { 
      nom: 'Structures', 
      href: '/admin/structures', 
      icon: '🏪', 
      count: stats.structures, 
      color: 'bg-blue-500',
      description: 'Gérer les restaurants, salons, boutiques et services'
    },
    { 
      nom: 'Produits', 
      href: '/admin/produits', 
      icon: '📦', 
      count: stats.produits, 
      color: 'bg-purple-500',
      description: 'Ajouter et gérer les produits de la boutique'
    },
    { 
      nom: 'Annonces', 
      href: '/admin/annonces', 
      icon: '📢', 
      count: stats.annonces, 
      color: 'bg-orange-500',
      description: 'Publier et gérer les annonces et appels d\'offres'
    },
    { 
      nom: 'Commentaires',  // ← AJOUTÉ
      href: '/admin/commentaires', 
      icon: '💬', 
      count: stats.commentaires, 
      color: 'bg-green-500',
      description: 'Modérer les avis et commentaires des visiteurs'
    },
    { 
      nom: 'Catégories Structures', 
      href: '/admin/categories', 
      icon: '📂', 
      count: stats.categories, 
      color: 'bg-pink-500',
      description: 'Gérer les catégories de structures'
    },
    { 
      nom: 'Catégories Produits', 
      href: '/admin/categories-produits', 
      icon: '🏷️', 
      count: stats.categoriesProduits,
      color: 'bg-emerald-500',
      description: 'Gérer les catégories de la boutique'
    },
    { 
      nom: 'Bannières', 
      href: '/admin/bannieres', 
      icon: '🎯', 
      count: 0, 
      color: 'bg-indigo-500',
      description: 'Gérer les bannières publicitaires'
    },
    { 
      nom: 'Pays & Villes', 
      href: '/admin/pays-villes', 
      icon: '🌍', 
      count: 0, 
      color: 'bg-teal-500',
      description: 'Gérer les pays et villes disponibles'
    },
    { 
      nom: 'Statistiques', 
      href: '/admin/statistiques', 
      icon: '📊', 
      count: 0, 
      color: 'bg-cyan-500',
      description: 'Consulter les statistiques des visiteurs'
    }
  ];

  if (admin.role === 'super_admin') {
    menuItems.push({ 
      nom: 'Comptes Admin', 
      href: '/admin/comptes', 
      icon: '👥', 
      count: 0, 
      color: 'bg-red-500',
      description: 'Gérer les comptes administrateurs'
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-xl">🏪</span>
                </div>
                <span className="font-bold text-gray-800">Chez Mon Ami</span>
              </Link>
              <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-semibold">
                Admin
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm text-gray-600">Connecté en tant que</p>
                <p className="font-semibold text-gray-800">{admin.nom}</p>
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            👋 Bienvenue, {admin.nom} !
          </h1>
          <p className="text-gray-600">Gérez votre plateforme depuis ce tableau de bord</p>
        </div>

        {/* Statistiques */}
        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Stats en grille 5 colonnes avec commentaires */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                    🏪
                  </div>
                  <span className="text-3xl font-bold text-blue-600">{stats.structures}</span>
                </div>
                <p className="text-gray-600 font-medium">Structures</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                    📦
                  </div>
                  <span className="text-3xl font-bold text-purple-600">{stats.produits}</span>
                </div>
                <p className="text-gray-600 font-medium">Produits</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                    📢
                  </div>
                  <span className="text-3xl font-bold text-orange-600">{stats.annonces}</span>
                </div>
                <p className="text-gray-600 font-medium">Annonces</p>
              </div>

              {/* NOUVEAU - Commentaires */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                    💬
                  </div>
                  <span className="text-3xl font-bold text-green-600">{stats.commentaires}</span>
                </div>
                <p className="text-gray-600 font-medium">Commentaires</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-2xl">
                    📂
                  </div>
                  <span className="text-3xl font-bold text-pink-600">{stats.categories}</span>
                </div>
                <p className="text-gray-600 font-medium">Catégories</p>
              </div>
            </div>

            {/* Menu principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-16 h-16 ${item.color} rounded-xl flex items-center justify-center text-3xl text-white shadow-lg group-hover:scale-110 transition`}>
                      {item.icon}
                    </div>
                    {item.count > 0 && (
                      <span className="px-4 py-2 bg-gray-100 rounded-full font-bold text-gray-700">
                        {item.count}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{item.nom}</h3>
                  <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                  <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all">
                    <span>Gérer</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            {/* Actions rapides */}
            <div className="mt-8 bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-4">⚡ Actions rapides</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link
                  href="/admin/structures"
                  className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition"
                >
                  <p className="font-semibold mb-1">➕ Ajouter une structure</p>
                  <p className="text-sm text-green-100">Restaurant, salon, boutique...</p>
                </Link>
                <Link
                  href="/admin/produits"
                  className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition"
                >
                  <p className="font-semibold mb-1">📦 Ajouter un produit</p>
                  <p className="text-sm text-green-100">Nouveau produit boutique</p>
                </Link>
                <Link
                  href="/admin/annonces"
                  className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition"
                >
                  <p className="font-semibold mb-1">📢 Publier une annonce</p>
                  <p className="text-sm text-green-100">Appel d'offres, emploi...</p>
                </Link>
                <Link
                  href="/admin/commentaires"
                  className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition"
                >
                  <p className="font-semibold mb-1">💬 Modérer commentaires</p>
                  <p className="text-sm text-green-100">Gérer les avis visiteurs</p>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Lien retour au site */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au site public
          </Link>
        </div>
      </div>
    </div>
  );
}