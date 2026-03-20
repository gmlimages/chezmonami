'use client';
import { useState, useEffect } from 'react';

export default function BanniereCarousel({ bannieres }) {
  const [index, setIndex] = useState(0);

  // Rotation automatique
  useEffect(() => {
    if (bannieres.length <= 1) return;
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % bannieres.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannieres.length]);

  if (!bannieres?.length) return null;

  return (
    <section className="mb-12">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden relative">
        {/* ✅ Hauteur fixe avec object-cover — s'adapte à tous les écrans */}
        <div className="relative w-full h-36 sm:h-52 md:h-64">
          {bannieres.map((banniere, i) => (
            <div
              key={banniere.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={banniere.image_url}
                alt={banniere.titre || 'Bannière publicitaire'}
                className="w-full h-full object-cover object-center"
                style={{ display: 'block' }}
                onClick={() => banniere.lien_externe && window.open(banniere.lien_externe, '_blank')}
              />
              {/* Overlay titre */}
              {(banniere.titre || banniere.sous_titre) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3 sm:p-4 pointer-events-none">
                  <div>
                    {banniere.titre && (
                      <p className="text-white font-bold text-sm sm:text-base line-clamp-1">
                        {banniere.titre}
                      </p>
                    )}
                    {banniere.sous_titre && (
                      <p className="text-white/80 text-xs sm:text-sm line-clamp-1">
                        {banniere.sous_titre}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Points de navigation */}
        {bannieres.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {bannieres.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? 'bg-white w-6' : 'bg-white/50 w-2'
                }`}
              />
            ))}
          </div>
        )}

        {/* Flèches sur tablette/desktop */}
        {bannieres.length > 1 && (
          <>
            <button
              onClick={() => setIndex(i => i === 0 ? bannieres.length - 1 : i - 1)}
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full items-center justify-center text-white text-lg transition z-10"
            >
              ‹
            </button>
            <button
              onClick={() => setIndex(i => i === bannieres.length - 1 ? 0 : i + 1)}
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full items-center justify-center text-white text-lg transition z-10"
            >
              ›
            </button>
          </>
        )}
      </div>
    </section>
  );
}