// src/components/layout/Header.js
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Header() {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { nom: 'Accueil', href: '/', icon: '🏠' },
    { nom: 'Entreprises', href: '/structures', icon: '🏪' },
    { nom: 'Boutiques', href: '/boutique', icon: '🛍️' },
    { nom: 'Annonces', href: '/annonces', icon: '📢' },
    { nom: 'Contact', href: '/contact', icon: '📞' }
  ];

  const estActif = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-gradient-to-r from-primary via-primary-dark to-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="w-12 h-12 bg-neutral-cream rounded-lg flex items-center justify-center shadow-md overflow-hidden">
              <Image 
                src="/images/chezmonami.jpg" 
                alt="Chez Mon Ami" 
                width={48}
                height={48}
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Chez Mon Ami</h1>
              <p className="text-xs text-green-200">Trouves ton partenaire panafricain en toute confiance</p>
            </div>
          </Link>
          
          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  estActif(item.href)
                    ? 'bg-white text-primary shadow-md'
                    : 'hover:bg-white/10'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.nom}</span>
              </Link>
            ))}
          </nav>

          {/* Bouton Menu Mobile */}
          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
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
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}