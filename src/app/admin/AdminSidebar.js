// src/components/admin/AdminSidebar.js
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { 
      href: '/admin/dashboard', 
      label: 'Dashboard', 
      icon: '📊',
      description: 'Vue d\'ensemble'
    },
    { 
      href: '/admin/commandes', 
      label: 'Commandes', 
      icon: '🛒',
      description: 'Gestion commandes'
    },
    { 
      href: '/admin/promotions', 
      label: 'Promotions', 
      icon: '🔥',
      description: 'Offres spéciales'
    },
    { 
      href: '/admin/mises-en-avant', 
      label: 'Mises en avant', 
      icon: '⭐',
      description: 'Featured items'
    },
    { 
      href: '/admin/structures', 
      label: 'Structures', 
      icon: '🏢',
      description: 'Entreprises'
    },
    { 
      href: '/admin/produits', 
      label: 'Produits', 
      icon: '📦',
      description: 'Catalogue'
    },
  ];

  return (
    <>
      {/* Toggle Button Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-primary text-white p-2 rounded-lg shadow-lg"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 shadow-xl transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-0 lg:w-20'
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <Link href="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-bold text-xl">
                A
              </div>
              {isOpen && (
                <div>
                  <h2 className="font-bold text-gray-800 group-hover:text-primary transition">
                    Admin
                  </h2>
                  <p className="text-xs text-gray-500">ChezMonAmi</p>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition group ${
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    {isOpen && (
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${
                          isActive ? 'text-white' : 'text-gray-800 group-hover:text-primary'
                        }`}>
                          {item.label}
                        </p>
                        <p className={`text-xs truncate ${
                          isActive ? 'text-white/80' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            {/* Bouton Retour Accueil */}
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition mb-2"
            >
              <span className="text-xl">🏠</span>
              {isOpen && <span className="font-medium text-sm">Retour Accueil</span>}
            </Link>

            {/* Toggle Sidebar Desktop */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="hidden lg:flex items-center justify-center w-full px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              <span className="text-xl">{isOpen ? '◀' : '▶'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}