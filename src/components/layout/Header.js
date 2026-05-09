// src/components/layout/Header.js
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useFavorisCount } from '@/hooks/useFavoris';
import { useT } from '@/lib/i18n/LangProvider';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [entrepriseConnecte, setEntrepriseConnecte] = useState(null);
  const pathname = usePathname();
  const nbFavoris = useFavorisCount();
  const { t } = useT();

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
    { nom: t('header.accueil'), href: '/', icon: '🏠' },
    { nom: t('header.entreprises'), href: '/structures', icon: '🏪' },
    { nom: t('header.boutiques'), href: '/boutique', icon: '🛍️' },
    { nom: t('header.mes_commandes'), href: '/mes-commandes', icon: '📦' },
    { nom: t('header.annonces'), href: '/annonces', icon: '📢' },
    { nom: t('header.favoris'), href: '/favoris', icon: '❤️' },
    { nom: t('header.contact'), href: '/contact', icon: '📞' }
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
            <div className="w-10 h-10 bg-neutral-cream rounded-lg flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
              <Image
                src="/images/chezmonami.jpg"
                alt="Chez Mon Ami"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <div className="hidden [@media(min-width:900px)]:block">
              <h1 className="text-xl font-bold leading-tight whitespace-nowrap">Chez Mon Ami</h1>
              <p className="text-xs text-green-200 whitespace-nowrap hidden lg:block">
                {t('header.slogan')}
              </p>
            </div>
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center overflow-hidden">
            {menuItems.filter(i => i.href !== '/favoris').map((item) => (
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

          {/* Bouton Favoris — Desktop */}
          <Link
            href="/favoris"
            aria-label={t('header.favoris')}
            className="hidden md:flex relative items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition shrink-0"
          >
            <svg className="w-5 h-5" fill={nbFavoris > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
            </svg>
            {nbFavoris > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-bold rounded-full min-w-[1.1rem] h-[1.1rem] flex items-center justify-center px-1 shadow">
                {nbFavoris > 99 ? '99+' : nbFavoris}
              </span>
            )}
          </Link>

          {/* Sélecteur de langue — Desktop */}
          <div className="hidden md:block shrink-0">
            <LanguageSwitcher variant="desktop" />
          </div>

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
                  {t('header.connexion')}
                </Link>
                <Link
                  href="/entreprise/inscription"
                  className="px-3 py-2 bg-white text-primary rounded-lg font-semibold shadow-md hover:bg-green-50 transition text-sm"
                >
                  {t('header.inscription')}
                </Link>
              </>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition shrink-0"
            aria-label="Menu"
            aria-expanded={menuOuvert}
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

              {/* Espace entreprise */}
              <div className="border-t border-white/20 pt-2 mt-1 flex flex-col gap-2">
                {entrepriseConnecte ? (
                  <Link
                    href="/entreprise/dashboard"
                    onClick={() => setMenuOuvert(false)}
                    className="px-4 py-3 bg-white text-primary rounded-lg font-semibold flex items-center gap-3 shadow-md"
                  >
                    <span className="text-xl">🏢</span>
                    <span className="truncate">{t('header.mon_espace')} — {entrepriseConnecte.nom_contact}</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/entreprise/connexion"
                      onClick={() => setMenuOuvert(false)}
                      className="px-4 py-3 border border-white/60 rounded-lg font-medium hover:bg-white/10 transition flex items-center gap-3"
                    >
                      <span className="text-xl">🔑</span>
                      <span>{t('header.connexion_entreprise')}</span>
                    </Link>
                    <Link
                      href="/entreprise/inscription"
                      onClick={() => setMenuOuvert(false)}
                      className="px-4 py-3 bg-white text-primary rounded-lg font-semibold flex items-center gap-3 shadow-md"
                    >
                      <span className="text-xl">🏢</span>
                      <span>{t('header.creer_espace')}</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Sélecteur de langue — Mobile */}
              <LanguageSwitcher variant="mobile" />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
