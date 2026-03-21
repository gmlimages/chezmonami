'use client';
import { useState, useEffect } from 'react';

export default function BanniereCarousel({ bannieres }) {
  const [index, setIndex] = useState(0);
  const [largeur, setLargeur] = useState(0);

  useEffect(() => {
    const maj = () => setLargeur(window.innerWidth);
    maj();
    window.addEventListener('resize', maj);
    return () => window.removeEventListener('resize', maj);
  }, []);

  useEffect(() => {
    if (bannieres.length <= 1) return;
    const interval = setInterval(() => {
      setIndex(i => (i + 1) % bannieres.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannieres.length]);

  if (!bannieres?.length || largeur < 300) return null;

  return (
    <section className="mb-12">
      <div className="rounded-xl shadow-lg overflow-hidden relative">
        {bannieres.map((banniere, i) => (
          <div
            key={banniere.id}
            className={`transition-opacity duration-1000 ${
              i === index ? 'opacity-100' : 'opacity-0 absolute inset-0'
            }`}
          >
            <img
              src={banniere.image_url}
              alt={banniere.titre || 'Bannière publicitaire'}
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                cursor: banniere.lien_externe ? 'pointer' : 'default',
              }}
              onClick={() =>
                banniere.lien_externe &&
                window.open(banniere.lien_externe, '_blank')
              }
            />
          </div>
        ))}

        {/* Points de navigation */}
        {bannieres.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {bannieres.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'bg-white w-5' : 'bg-white/50 w-1.5'
                }`}
              />
            ))}
          </div>
        )}

        {/* Flèches */}
        {bannieres.length > 1 && largeur >= 480 && (
          <>
            <button
              onClick={() =>
                setIndex(i => (i === 0 ? bannieres.length - 1 : i - 1))
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white text-base transition z-10"
            >
              ‹
            </button>
            <button
              onClick={() =>
                setIndex(i => (i === bannieres.length - 1 ? 0 : i + 1))
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white text-base transition z-10"
            >
              ›
            </button>
          </>
        )}
      </div>
    </section>
  );
}