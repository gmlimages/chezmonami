// src/components/layout/Footer.js
'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState('2024');

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  // Groupes de catégories avec leurs sous-catégories
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
              Votre plateforme de proximité en Afrique. Découvrez les meilleurs restaurants, 
              salons de beauté, boutiques, services et opportunités professionnelles près de chez vous.
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
                  <span>🏪</span> Structures
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

          {/* Catégories populaires - Partie 1 */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">
              Secteurs d’activités 1/2 :
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

          {/* Catégories populaires - Partie 2 */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">
              Secteurs d’activités 2/2 :
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

        {/* Section Contact déplacée en bas */}
        <div className="mt-8 pt-8 border-t border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <p className="text-green-200 text-xs mb-1">Email</p>
                <a 
                  href="mailto:contact@chezmonami.com" 
                  className="text-white hover:text-green-200 transition text-sm"
                >
                  contact@chezmonami.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-green-200 text-xs mb-1">WhatsApp</p>
                <a 
                  href="https://wa.me/212673623053" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-green-200 transition text-sm"
                >
                  +212 673 623 053
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-green-200 text-xs mb-1">Couverture</p>
                <p className="text-white text-sm">Afrique entière</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="text-green-200 text-xs mb-1">Disponibilité</p>
                <p className="text-white text-sm">24h/24, 7j/7</p>
              </div>
            </div>
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