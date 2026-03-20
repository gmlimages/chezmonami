'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState('2024');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  const groupesCategories = [
    {
      titre: "Production & Industries",
      icon: "🏭",
      description: "Producteurs, usines, artisanat",
      categories: ['producteurs', 'usines', 'laboratoires', 'agriculture', 'mines', 'artisanat', 'bois', 'textile', 'conserves', 'miel', 'terroir']
    },
    {
      titre: "Commerce & Distribution",
      icon: "🛒",
      description: "Import-export, distribution, vente",
      categories: ['importateurs', 'exportateurs', 'distribution', 'grossistes', 'commercants', 'franchises', 'commercial', 'apporteurs']
    },
    {
      titre: "Bâtiment & Environnement",
      icon: "🏗️",
      description: "Construction, énergie, immobilier",
      categories: ['gros_oeuvre', 'batiment', 'immobilier', 'energies_renouvelables', 'eau', 'jardinage']
    },
    {
      titre: "Services aux Entreprises",
      icon: "💼",
      description: "Conseil, gestion, services pros",
      categories: ['prestataires', 'comptable', 'conseil', 'archivage', 'digitalisation', 'conciergerie', 'securite', 'transporteurs', 'main_oeuvre']
    },
    {
      titre: "Santé & Éducation",
      icon: "🎓",
      description: "Cliniques, écoles, formations",
      categories: ['clinique', 'paramedical', 'laboratoire_medical', 'ecole', 'lycee', 'formation']
    },
    {
      titre: "Finance & Tourisme",
      icon: "🏦",
      description: "Banques, hôtels, restaurants",
      categories: ['banques', 'assurances', 'location_voiture', 'hotel', 'restaurant']
    }
  ];

  // ✅ Réseaux sociaux 
  const reseauxSociaux = [
    {
      nom: 'Facebook',
      href: 'https://web.facebook.com/chezmonami2',  
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      bg: 'hover:bg-blue-600',
    },
    {
      nom: 'Instagram',
      href: 'https://www.instagram.com/chezmonami52/',  
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      ),
      bg: 'hover:bg-pink-600',
    },
    {
      nom: 'LinkedIn',
      href: 'https://www.linkedin.com/in/chez-mon-ami-168bb13b8/',  
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      bg: 'hover:bg-blue-700',
    },
    {
      nom: 'YouTube',
      href: 'https://www.youtube.com/channel/UCM-6a6wpbqNpkmGRvzPtM3w',  
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      bg: 'hover:bg-red-600',
    },
    {
      nom: 'TikTok',
      href: 'https://www.tiktok.com/@chezmonami0',  
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      ),
      bg: 'hover:bg-gray-800',
    },
  ];

  // ✅ Apps mobiles — lien null = pas cliquable, remplacez null par l'URL quand disponible
  const appsMobiles = [
    {
      nom: 'Google Play',
      sousTitre: 'Disponible sur',
      href: null,  // ← remplacer par : 'https://play.google.com/store/apps/details?id=com.chezmonami'
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3.18 23.76c.3.17.64.24.99.21l12.6-7.26-2.72-2.72-10.87 9.77zM.27 1.7C.1 2.03 0 2.43 0 2.89v18.22c0 .46.1.86.27 1.19l.06.06 10.2-10.2v-.24L.33 1.64l-.06.06zM20.13 10.3l-2.6-1.5-3.06 3.06 3.06 3.06 2.62-1.51c.75-.43.75-1.13-.02-1.61zM4.17.24l12.6 7.26-2.72 2.72L3.18.45C3.47.11 3.87.07 4.17.24z"/>
        </svg>
      ),
    },
    {
      nom: 'App Store',
      sousTitre: 'Télécharger sur l\'',
      href: null,  // ← remplacer par : 'https://apps.apple.com/app/chezmonami/idXXXXXXXXX'
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-gradient-to-r from-primary-dark via-primary to-primary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* À propos + réseaux sociaux */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/images/logochezmonami.jpg"
                alt="Chez Mon Ami Logo"
                className="w-32 h-auto object-contain"
              />
            </div>
            <p className="text-green-100 text-sm leading-relaxed mb-4">
              Votre marketplace de proximité en Afrique. Découvrez les meilleurs partenaires,
              clients, fournisseurs, prospects, services, annonces et opportunités d'affaires du continent.
            </p>
            <p className="text-green-200 text-xs italic mb-5">
              Connecter l'Afrique, une communauté à la fois.
            </p>

            {/* ✅ Réseaux sociaux */}
            <div>
              <p className="text-green-200 text-xs font-semibold uppercase tracking-wider mb-3">
                Suivez-nous
              </p>
              <div className="flex items-center gap-2">
                {reseauxSociaux.map((rs) => (
                  <a
                    key={rs.nom}
                    href={rs.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={rs.nom}
                    className={`w-9 h-9 rounded-full bg-white/10 flex items-center justify-center transition-all duration-200 ${rs.bg} hover:scale-110`}
                  >
                    {rs.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation rapide */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">
              Navigation
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/',              icon: '🏠', label: 'Accueil' },
                { href: '/structures',    icon: '🏪', label: 'Structures' },
                { href: '/boutique',      icon: '🛍️', label: 'Boutique' },
                { href: '/mes-commandes', icon: '📦', label: 'Mes Commandes' },
                { href: '/annonces',      icon: '📢', label: 'Annonces' },
                { href: '/contact',       icon: '📧', label: 'Contact' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-green-100 hover:text-white hover:pl-2 transition-all flex items-center gap-2 text-sm"
                  >
                    <span>{item.icon}</span> {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Secteurs 1/2 */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">
              Secteurs d'activités 1/2
            </h3>
            <ul className="space-y-2 text-sm">
              {groupesCategories.slice(0, 3).map((groupe, index) => (
                <li key={index}>
                  <Link
                    href={`/structures?groupe=${groupe.categories.join(',')}`}
                    className="text-green-100 hover:text-white transition flex items-start gap-2 group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">{groupe.icon}</span>
                    <div>
                      <p className="font-semibold group-hover:underline">{groupe.titre}</p>
                      <p className="text-xs text-green-200">{groupe.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Secteurs 2/2 */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">
              Secteurs d'activités 2/2
            </h3>
            <ul className="space-y-2 text-sm">
              {groupesCategories.slice(3, 6).map((groupe, index) => (
                <li key={index}>
                  <Link
                    href={`/structures?groupe=${groupe.categories.join(',')}`}
                    className="text-green-100 hover:text-white transition flex items-start gap-2 group"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">{groupe.icon}</span>
                    <div>
                      <p className="font-semibold group-hover:underline">{groupe.titre}</p>
                      <p className="text-xs text-green-200">{groupe.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 pt-8 border-t border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '📧', label: 'Email', content: <a href="mailto:contact@chezmonami.ma" className="text-white hover:text-green-200 transition text-sm">contact@chezmonami.ma</a> },
              { icon: '📱', label: 'WhatsApp', content: <a href="https://wa.me/212693908389" target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-200 transition text-sm">+212 693 908 389</a> },
              { icon: '📍', label: 'Couverture', content: <p className="text-white text-sm">Afrique entière</p> },
              { icon: '⏰', label: 'Disponibilité', content: <p className="text-white text-sm">24h/24, 7j/7</p> },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-green-200 text-xs mb-1">{item.label}</p>
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ Apps mobiles */}
        <div className="mt-8 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-white font-semibold mb-1">📲 Application mobile</p>
              <p className="text-green-200 text-sm">
                Bientôt disponible sur iOS et Android !
              </p>
            </div>

            <div className="flex items-center gap-4">
              {appsMobiles.map((app) => {
                const contenu = (
                  <div className={`flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 transition-all duration-200 ${
                    app.href
                      ? 'hover:bg-white/20 hover:scale-105 cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  }`}>
                    <div className="text-white">{app.icon}</div>
                    <div>
                      <p className="text-green-200 text-xs leading-none mb-0.5">
                        {app.sousTitre}
                      </p>
                      <p className="text-white font-bold text-sm leading-none">
                        {app.nom}
                      </p>
                      {!app.href && (
                        <p className="text-yellow-300 text-xs mt-0.5 leading-none">
                          Bientôt disponible
                        </p>
                      )}
                    </div>
                  </div>
                );

                // ✅ Si href est null → pas cliquable, sinon lien actif
                return app.href ? (
                  <a
                    key={app.nom}
                    href={app.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {contenu}
                  </a>
                ) : (
                  <div key={app.nom}>{contenu}</div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Barre inférieure */}
      <div className="border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-green-100 text-sm">
              &copy; {currentYear} <span className="font-semibold">Chez Mon Ami</span>. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6 text-sm">
              {[
                { href: '/mentions-legales', label: 'Mentions légales' },
                { href: '/confidentialite',  label: 'Confidentialité' },
                { href: '/conditions',       label: "Conditions d'utilisation" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-green-100 hover:text-white transition"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <span className="text-xl">🌍</span>
              <span className="text-green-100 text-xs font-medium">
                Fait avec ❤️ en Afrique
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}