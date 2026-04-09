'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─────────────────────────────────────────────
// Définition des groupes de menu
// ─────────────────────────────────────────────
const MENU_GROUPS = [
  {
    key: 'general',
    label: null, // pas de titre de groupe = item direct
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: '📊', description: 'Vue d\'ensemble' },
    ],
  },
  {
    key: 'boutique',
    label: 'Boutique',
    icon: '🛍️',
    items: [
      { href: '/admin/commandes',      label: 'Commandes',      icon: '🛒', description: 'Gestion commandes' },
      { href: '/admin/promotions',     label: 'Promotions',     icon: '🔥', description: 'Offres spéciales' },
      { href: '/admin/produits',       label: 'Produits',       icon: '📦', description: 'Catalogue' },
      { href: '/admin/chambres',       label: 'Chambres',       icon: '🛏️', description: 'Hôtels & chambres' },
      { href: '/admin/mises-en-avant', label: 'Mises en avant', icon: '⭐', description: 'Featured items' },
    ],
  },
  {
    key: 'annuaire',
    label: 'Annuaire',
    icon: '🗺️',
    items: [
      { href: '/admin/structures',          label: 'Structures',          icon: '🏢', description: 'Fiches structures' },
      { href: '/admin/categories',          label: 'Catégories',          icon: '🏷️', description: 'Catégories structures' },
      { href: '/admin/categories-produits', label: 'Catégories produits', icon: '📂', description: 'Catégories boutique' },
      { href: '/admin/pays-villes',         label: 'Pays & Villes',       icon: '📍', description: 'Géographie' },
    ],
  },
  {
    key: 'societes',
    label: 'Sociétés',
    icon: '🏭',
    items: [
      { href: '/admin/comptes-entreprises',   label: 'Comptes',         icon: '👤', description: 'Gestion des comptes' },
      { href: '/admin/appels-offres',        label: "Appels d'offres", icon: '📋', description: 'Créer & suivre' },
      { href: '/admin/messages',             label: 'Messages',        icon: '💬', description: 'Messages des sociétés' },
      { href: '/admin/contacts-entreprises', label: 'Contacts B2B',    icon: '🤝', description: 'Mise en relation' },
      { href: '/admin/statistiques',         label: 'Statistiques',    icon: '📈', description: 'Tableau de bord' },
    ],
  },
  {
    key: 'contenu',
    label: 'Contenu',
    icon: '📝',
    items: [
      { href: '/admin/commentaires', label: 'Commentaires', icon: '💬', description: 'Avis & modération' },
      { href: '/admin/annonces',     label: 'Annonces',     icon: '📣', description: 'Annonces publiées' },
      { href: '/admin/bannieres',    label: 'Bannières',    icon: '🖼️', description: 'Bannières accueil' },
      { href: '/admin/newsletter',   label: 'Newsletter',   icon: '📧', description: 'Emails & abonnés' },
    ],
  },
];

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────
export default function AdminSidebarContent({ isOpen, admin, tempsRestant, formatTemps, onLogout, nbNouveauxMessages = 0 }) {
  const pathname = usePathname();

  // Calculer quels groupes contiennent la page active
  const groupesAvecActif = MENU_GROUPS
    .filter(g => g.items.some(item => pathname.startsWith(item.href) && item.href !== '/admin/dashboard'))
    .map(g => g.key);

  const [groupesOuverts, setGroupesOuverts] = useState(() => {
    // Ouvrir par défaut les groupes actifs + Boutique et Sociétés
    return new Set(['boutique', 'societes', ...groupesAvecActif]);
  });

  // Quand la route change, ouvrir le groupe qui contient la page active
  useEffect(() => {
    const actif = MENU_GROUPS
      .filter(g => g.items.some(item => pathname.startsWith(item.href) && item.href !== '/admin/dashboard'))
      .map(g => g.key);
    if (actif.length > 0) {
      setGroupesOuverts(prev => {
        const next = new Set(prev);
        actif.forEach(k => next.add(k));
        return next;
      });
    }
  }, [pathname]);

  const toggleGroupe = (key) => {
    setGroupesOuverts(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isItemActive = (href) =>
    href === '/admin/dashboard'
      ? pathname === href
      : pathname.startsWith(href);

  const formatTempsDisplay = (ms) => {
    if (!ms || !formatTemps) return '';
    return formatTemps(ms);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Spacer mobile — zone couverte par le header public sticky */}
      <div className="h-20 flex-shrink-0 lg:hidden" />
      {/* ── Header ── */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            A
          </div>
          {isOpen && (
            <div className="min-w-0">
              <h2 className="font-bold text-gray-800 group-hover:text-primary transition truncate">
                Admin
              </h2>
              <p className="text-xs text-gray-500">ChezMonAmi</p>
            </div>
          )}
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {MENU_GROUPS.map((group) => {
            const estOuvert = groupesOuverts.has(group.key);
            const groupActif = group.items.some(item => isItemActive(item.href));

            // Groupe sans label = items directs (ex: Dashboard)
            if (!group.label) {
              return group.items.map((item) => {
                const actif = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                      actif
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    {isOpen && (
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${
                          actif ? 'text-white' : 'text-gray-800 group-hover:text-primary'
                        }`}>
                          {item.label}
                        </p>
                        <p className={`text-xs truncate ${
                          actif ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    )}
                  </Link>
                );
              });
            }

            return (
              <div key={group.key}>
                {/* En-tête du groupe — cliquable */}
                <button
                  onClick={() => toggleGroupe(group.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                    groupActif && !estOuvert
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{group.icon}</span>
                  {isOpen && (
                    <>
                      <span className={`flex-1 text-left font-semibold text-sm ${
                        groupActif && !estOuvert ? 'text-primary' : 'text-gray-700 group-hover:text-primary'
                      }`}>
                        {group.label}
                      </span>
                      <span className={`text-xs transition-transform duration-200 flex-shrink-0 ${
                        estOuvert ? 'rotate-90' : ''
                      } ${groupActif && !estOuvert ? 'text-primary' : 'text-gray-400'}`}>
                        ▶
                      </span>
                    </>
                  )}
                  {/* Sidebar réduite : point actif */}
                  {!isOpen && groupActif && (
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>

                {/* Items du groupe */}
                {isOpen && estOuvert && (
                  <div className="mt-1 ml-3 pl-3 border-l-2 border-gray-100 space-y-1">
                    {group.items.map((item) => {
                      const actif = isItemActive(item.href);
                      const badge = item.href === '/admin/messages' ? nbNouveauxMessages : 0;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
                            actif
                              ? 'bg-primary text-white shadow-md'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-lg flex-shrink-0">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm truncate ${
                              actif ? 'text-white' : 'text-gray-800 group-hover:text-primary'
                            }`}>
                              {item.label}
                            </p>
                            <p className={`text-xs truncate ${
                              actif ? 'text-white/80' : 'text-gray-500'
                            }`}>
                              {item.description}
                            </p>
                          </div>
                          {badge > 0 && (
                            <span className={`text-xs font-bold rounded-full min-w-[1.2rem] h-5 flex items-center justify-center px-1 flex-shrink-0 ${
                              actif ? 'bg-white text-primary' : 'bg-red-500 text-white'
                            }`}>
                              {badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Sidebar réduite : afficher les icônes directement */}
                {!isOpen && (
                  <div className="space-y-1 mt-1">
                    {group.items.map((item) => {
                      const actif = isItemActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={item.label}
                          className={`flex items-center justify-center px-3 py-2 rounded-lg transition-all ${
                            actif ? 'bg-primary shadow-md' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-xl">{item.icon}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        {/* Info admin */}
        {isOpen && admin && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-800 truncate">{admin.nom || 'Admin'}</p>
            {admin.role === 'super_admin' && (
              <span className="text-xs text-primary font-bold">Super Admin</span>
            )}
            {tempsRestant && (
              <p className="text-xs text-gray-500 mt-1">
                ⏱️ {formatTempsDisplay(tempsRestant)}
              </p>
            )}
          </div>
        )}

        {/* Retour accueil */}
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition mb-1"
        >
          <span className="text-xl flex-shrink-0">🏠</span>
          {isOpen && <span className="font-medium text-sm">Retour Accueil</span>}
        </Link>

        {/* Déconnexion */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition w-full"
          >
            <span className="text-xl flex-shrink-0">🚪</span>
            {isOpen && <span className="font-medium text-sm">Déconnexion</span>}
          </button>
        )}
      </div>
    </div>
  );
}
