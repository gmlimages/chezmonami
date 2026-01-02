// src/components/layout/Footer.js
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState('2024');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="bg-gradient-to-r from-primary-dark via-primary to-primary-dark text-white">
      {/* Section principale du footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* À propos */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/images/logochezmonami.jpg" 
                alt="Chez Mon Ami Logo" 
                className="w-32 h-auto object-contain"
              />
            </div>
            <p className="text-green-100 text-sm leading-relaxed mb-4">
              Votre marketplace de proximité en Afrique. Découvrez les meilleurs partenaires, clients, 
              fournisseurs, prospects, services, annonces et opportunités d'affaires du continent.
            </p>
            <p className="text-green-200 text-xs italic">
              Connecter l'Afrique, une communauté à la fois.
            </p>
          </div>

          {/* Navigation rapide */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">
              Navigation
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/" 
                  className="text-green-100 hover:text-white hover:pl-2 transition-all flex items-center gap-2 text-sm"
                >
                  <span>🏠</span> Accueil
                </Link>
              </li>
              <li>
                <Link 
                  href="/structures" 
                  className="text-green-100 hover:text-white hover:pl-2 transition-all flex items-center gap-2 text-sm"
                >
                  <span>🏪</span> Entreprises
                </Link>
              </li>
              <li>
                <Link 
                  href="/boutique" 
                  className="text-green-100 hover:text-white hover:pl-2 transition-all flex items-center gap-2 text-sm"
                >
                  <span>🛍️</span> Boutique
                </Link>
              </li>
              <li>
                <Link 
                  href="/annonces" 
                  className="text-green-100 hover:text-white hover:pl-2 transition-all flex items-center gap-2 text-sm"
                >
                  <span>📢</span> Annonces
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-green-100 hover:text-white hover:pl-2 transition-all flex items-center gap-2 text-sm"
                >
                  <span>📧</span> Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Catégories populaires */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">
              Catégories
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="text-green-100 hover:text-white transition flex items-center gap-2">
                <span>🍽️</span> Restaurants
              </li>
              <li className="text-green-100 hover:text-white transition flex items-center gap-2">
                <span>💇</span> Salons de beauté
              </li>
              <li className="text-green-100 hover:text-white transition flex items-center gap-2">
                <span>🛒</span> Supermarchés
              </li>
              <li className="text-green-100 hover:text-white transition flex items-center gap-2">
                <span>🏥</span> Services de santé
              </li>
              <li className="text-green-100 hover:text-white transition flex items-center gap-2">
                <span>🎓</span> Formations
              </li>
              <li className="text-green-100 hover:text-white transition flex items-center gap-2">
                <span>💼</span> Emplois
              </li>
            </ul>
          </div>

          {/* Contact & Informations */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">
              Contact
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-lg">📧</span>
                <div>
                  <p className="text-green-200 text-xs">Email</p>
                  <a 
                    href="mailto:contact@chezmonami.com" 
                    className="text-white hover:text-green-200 transition"
                  >
                    contact@chezmonami.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lg">📱</span>
                <div>
                  <p className="text-green-200 text-xs">WhatsApp</p>
                  <a 
                    href="https://wa.me/212673623053" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-green-200 transition"
                  >
                    +212 673 623 053
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lg">📍</span>
                <div>
                  <p className="text-green-200 text-xs">Couverture</p>
                  <p className="text-white">Afrique entière</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lg">⏰</span>
                <div>
                  <p className="text-green-200 text-xs">Disponibilité</p>
                  <p className="text-white">24h/24, 7j/7</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barre inférieure */}
      <div className="border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-green-100 text-sm">
              &copy; {currentYear} <span className="font-semibold">Chez Mon Ami</span>. Tous droits réservés.
            </p>

            {/* Liens légaux */}
            <div className="flex items-center gap-6 text-sm">
              <Link 
                href="/mentions-legales" 
                className="text-green-100 hover:text-white transition"
              >
                Mentions légales
              </Link>
              <Link 
                href="/confidentialite" 
                className="text-green-100 hover:text-white transition"
              >
                Confidentialité
              </Link>
              <Link 
                href="/conditions" 
                className="text-green-100 hover:text-white transition"
              >
                Conditions d'utilisation
              </Link>
            </div>

            {/* Badge */}
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