// src/components/layout/Header.js
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Header() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [entrepriseConnecte, setEntrepriseConnecte] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (auth) {
      try {
        const { compte } = JSON.parse(auth);
        setEntrepriseConnecte(compte || null);
      } catch {
        setEntrepriseConnecte(null);
      }
    } else {
      setEntrepriseConnecte(null);
    }
  }, [pathname]);

  const menuItems = [
    { nom: 'Accueil', href: '/', icon: '🏠' },
    { nom: 'Entreprises', href: '/structures', icon: '🏪' },
    { nom: 'Boutiques', href: '/boutique', icon: '🛍️' },
    { nom: 'Mes Commandes', href: '/mes-commandes', icon: '📦' },
    { nom: 'Annonces', href: '/annonces', icon: '📢' },
    { nom: 'Contact', href: '/contact', icon: '📞' }
  ];

  const estActif = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-gradient-to-r from-primary via-primary-dark to-primary text-white shadow-lg sticky top-0 z-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-4">
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition shrink-0">

            {/* Image : toujours visible */}
            <div className="w-10 h-10 bg-neutral-cream rounded-lg flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
              <Image
                src="/images/chezmonami.jpg"
                alt="Chez Mon Ami"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>

            {/* Texte + slogan : masqués en dessous de 900px */}
            <div className="hidden [@media(min-width:900px)]:block">
              <h1 className="text-xl font-bold leading-tight whitespace-nowrap">Chez Mon Ami</h1>
              {/* Slogan : masqué en dessous de 1024px */}
              <p className="text-xs text-green-200 whitespace-nowrap hidden lg:block">
                Trouves ton partenaire panafricain en toute confiance
              </p>
            </div>
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center overflow-hidden">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2 py-1.5 rounded-lg font-medium transition flex items-center gap-1 text-sm whitespace-nowrap flex-shrink-0 ${
                  estActif(item.href)
                    ? 'bg-white text-primary shadow-md'
                    : 'hover:bg-white/10'
                }`}
              >
                <span className="hidden lg:inline">{item.icon}</span>
                <span>{item.nom}</span>
              </Link>
            ))}
          </nav>

          {/* Boutons Espace Entreprise — Desktop */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {entrepriseConnecte ? (
              <Link
                href="/entreprise/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg font-semibold shadow-md hover:bg-green-50 transition text-sm"
              >
                <span>🏢</span>
                <span className="max-w-[120px] truncate">{entrepriseConnecte.nom_contact}</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/entreprise/connexion"
                  className="px-3 py-2 border border-white/60 text-white rounded-lg font-medium hover:bg-white/10 transition text-sm"
                >
                  Connexion
                </Link>
                <Link
                  href="/entreprise/inscription"
                  className="px-3 py-2 bg-white text-primary rounded-lg font-semibold shadow-md hover:bg-green-50 transition text-sm"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOuvert ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Menu Mobile */}
        {menuOuvert && (
          <nav className="md:hidden mt-4 pb-4 border-t border-white/20 pt-4">
            <div className="flex flex-col gap-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOuvert(false)}
                  className={`px-4 py-3 rounded-lg font-medium transition flex items-center gap-3 ${
                    estActif(item.href)
                      ? 'bg-white text-primary shadow-md'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.nom}</span>
                </Link>
              ))}

              {/* Séparateur */}
              <div className="border-t border-white/20 pt-2 mt-1 flex flex-col gap-2">
                {entrepriseConnecte ? (
                  <Link
                    href="/entreprise/dashboard"
                    onClick={() => setMenuOuvert(false)}
                    className="px-4 py-3 bg-white text-primary rounded-lg font-semibold flex items-center gap-3 shadow-md"
                  >
                    <span className="text-xl">🏢</span>
                    <span className="truncate">Mon espace — {entrepriseConnecte.nom_contact}</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/entreprise/connexion"
                      onClick={() => setMenuOuvert(false)}
                      className="px-4 py-3 border border-white/60 rounded-lg font-medium hover:bg-white/10 transition flex items-center gap-3"
                    >
                      <span className="text-xl">🔑</span>
                      <span>Connexion entreprise</span>
                    </Link>
                    <Link
                      href="/entreprise/inscription"
                      onClick={() => setMenuOuvert(false)}
                      className="px-4 py-3 bg-white text-primary rounded-lg font-semibold flex items-center gap-3 shadow-md"
                    >
                      <span className="text-xl">🏢</span>
                      <span>Créer mon espace</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}