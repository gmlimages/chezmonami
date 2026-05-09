'use client';
// Lot E — Panneau de quêtes de complétion de profil.
// Affiche une barre de progression + liste des quêtes (faites / à faire) avec liens directs.
//
// Usage : <PanneauQuetes compte={compte} structure={structure} extras={{ nbDocsValides }} />

import Link from 'next/link';
import { calculerProgression } from '@/lib/quetesProfil';

export default function PanneauQuetes({ compte, structure, extras }) {
  if (!compte) return null;

  const { pourcentage, quetes, complet } = calculerProgression(compte, structure, extras);
  const restantes = quetes.filter((q) => !q.fait);

  // Couleur barre selon avancement
  const couleurBarre = complet
    ? 'bg-green-500'
    : pourcentage >= 70
    ? 'bg-emerald-500'
    : pourcentage >= 40
    ? 'bg-amber-500'
    : 'bg-orange-500';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <h2 className="text-lg font-bold text-gray-800">Progression du profil</h2>
        </div>
        <div className="flex items-center gap-2">
          {complet && (
            <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
              ✓ Profil complet
            </span>
          )}
          <span className={`text-2xl font-bold ${complet ? 'text-green-600' : 'text-gray-700'}`}>
            {pourcentage}%
          </span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-4">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${couleurBarre}`}
          style={{ width: `${pourcentage}%` }}
        />
      </div>

      {/* Message d'incitation */}
      {!complet && (
        <p className="text-sm text-gray-600 mb-4">
          {restantes.length === 1
            ? 'Plus qu\'une étape pour compléter votre profil !'
            : `${restantes.length} étapes restantes pour débloquer le badge "Profil complet".`}
        </p>
      )}

      {/* Liste des quêtes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {quetes.map((q) => {
          const Wrapper = q.lien ? Link : 'div';
          const wrapperProps = q.lien ? { href: q.lien } : {};
          return (
            <Wrapper
              key={q.key}
              {...wrapperProps}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                q.fait
                  ? 'bg-green-50/50 text-gray-500'
                  : q.lien
                  ? 'hover:bg-gray-50 cursor-pointer'
                  : 'bg-gray-50/50'
              }`}
            >
              <span
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  q.fait
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {q.fait ? '✓' : '·'}
              </span>
              <span className="text-base flex-shrink-0">{q.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${q.fait ? 'line-through' : 'text-gray-800'}`}>
                  {q.label}
                </p>
                {!q.fait && q.description && (
                  <p className="text-xs text-gray-500 truncate">{q.description}</p>
                )}
              </div>
              {!q.fait && q.lien && (
                <span className="text-xs text-primary font-medium flex-shrink-0">→</span>
              )}
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
