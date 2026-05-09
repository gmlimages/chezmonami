'use client';
// Bouton "favori" en forme de cœur, avec animation et toast.
// Usage :
//   <BoutonFavori type="structures" id={structure.id} />
//   <BoutonFavori type="produits"   id={produit.id} variant="card" />
//
// variants :
//   - "card"     : pastille flottante (top-right d'une image)
//   - "inline"   : bouton plat dans le flux
//   - "default"  : pastille blanche, taille moyenne

import { useFavoris } from '@/hooks/useFavoris';
import { toast } from '@/lib/toast';

const STYLES = {
  card:
    'absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center hover:scale-110 transition-transform',
  inline:
    'inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition text-sm font-medium',
  default:
    'inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow hover:scale-110 transition-transform',
};

export default function BoutonFavori({
  type,
  id,
  variant = 'default',
  showLabel = false,
  className = '',
}) {
  const { isFavori, toggle } = useFavoris(type);
  const actif = isFavori(id);

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(id);
    if (actif) {
      toast.info('Retiré des favoris');
    } else {
      toast.success('Ajouté aux favoris');
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={actif ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={actif}
      title={actif ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`${STYLES[variant] || STYLES.default} ${className}`}
    >
      <svg
        className={`w-5 h-5 transition-colors ${
          actif ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
        }`}
        fill={actif ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
        />
      </svg>
      {showLabel && (
        <span className="text-sm">
          {actif ? 'Favori' : 'Ajouter aux favoris'}
        </span>
      )}
    </button>
  );
}
