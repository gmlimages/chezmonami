// src/components/ui/StarRating.js
'use client';
import React from 'react';

export default function StarRating({ note, taille = 20, afficherNote = true, editable = false, onNoteChange = null }) {
  const etoiles = [1, 2, 3, 4, 5];
  const noteArrondie = Math.round(note * 2) / 2; // Arrondir à 0.5

  const handleClick = (valeur) => {
    if (editable && onNoteChange) {
      onNoteChange(valeur);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {etoiles.map((etoile) => {
          let contenu;
          
          if (noteArrondie >= etoile) {
            // Étoile pleine
            contenu = (
              <svg width={taille} height={taille} viewBox="0 0 24 24" fill="#FFA500" stroke="#FFA500" strokeWidth="1">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            );
          } else if (noteArrondie === etoile - 0.5) {
            // Demi-étoile
            contenu = (
              <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="#FFA500" strokeWidth="1">
                <defs>
                  <linearGradient id={`half-${etoile}`}>
                    <stop offset="50%" stopColor="#FFA500" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path 
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                  fill={`url(#half-${etoile})`}
                  stroke="#FFA500"
                />
              </svg>
            );
          } else {
            // Étoile vide
            contenu = (
              <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            );
          }

          return (
            <button
              key={etoile}
              onClick={() => handleClick(etoile)}
              disabled={!editable}
              className={editable ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default'}
            >
              {contenu}
            </button>
          );
        })}
      </div>
      {afficherNote && (
        <span className="text-sm font-semibold text-gray-700">
          {note.toFixed(1)}
        </span>
      )}
    </div>
  );
}