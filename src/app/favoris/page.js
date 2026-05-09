'use client';
// Page Mes Favoris : liste les structures et produits favorisés (localStorage).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useFavoris } from '@/hooks/useFavoris';
import BoutonFavori from '@/components/BoutonFavori';
import StarRating from '@/components/ui/StarRating';
import { toast, confirmDialog } from '@/lib/toast';
import { useT } from '@/lib/i18n/LangProvider';

export default function FavorisPage() {
  const { t } = useT();
  const { favoris: favStructures, vider: viderStructures } =
    useFavoris('structures');
  const { favoris: favProduits, vider: viderProduits } = useFavoris('produits');

  const [structures, setStructures] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState('tous'); // tous | structures | produits

  useEffect(() => {
    let annule = false;
    async function charger() {
      setLoading(true);
      const tasks = [];

      if (favStructures.length > 0) {
        tasks.push(
          supabase
            .from('structures')
            .select(
              `id, nom, description, images, note, nombre_avis,
              ville:ville_id(nom), pays:pays_id(nom), categorie:categorie_id(id, nom, icon)`,
            )
            .in('id', favStructures)
            .eq('statut', 'publie'),
        );
      } else {
        tasks.push(Promise.resolve({ data: [] }));
      }

      if (favProduits.length > 0) {
        tasks.push(
          supabase
            .from('produits')
            .select(
              `id, nom, description, images, prix,
              pays:pays_id(nom, devise), ville:ville_id(nom)`,
            )
            .in('id', favProduits),
        );
      } else {
        tasks.push(Promise.resolve({ data: [] }));
      }

      const [resS, resP] = await Promise.all(tasks);
      if (annule) return;
      setStructures(resS.data || []);
      setProduits(resP.data || []);
      setLoading(false);
    }
    charger();
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favStructures.join(','), favProduits.join(',')]);

  const total = structures.length + produits.length;

  const viderTout = async () => {
    const ok = await confirmDialog({
      message: t('favoris.confirmer_vider'),
      danger: true,
      confirmLabel: t('favoris.tout_vider'),
    });
    if (!ok) return;
    viderStructures();
    viderProduits();
    toast.success(t('favoris.favoris_vides'));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-primary via-primary-dark to-primary text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('favoris.titre_page')}</h1>
          <p className="text-green-100">
            {total === 0
              ? t('favoris.aucun')
              : `${total} ${total > 1 ? t('favoris.total_pluriel') : t('favoris.total_singulier')}`}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {total === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Onglets + actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex gap-2 flex-wrap">
                <Onglet
                  actif={onglet === 'tous'}
                  onClick={() => setOnglet('tous')}
                >
                  {t('favoris.tous')} ({total})
                </Onglet>
                <Onglet
                  actif={onglet === 'structures'}
                  onClick={() => setOnglet('structures')}
                >
                  {t('favoris.structures_label')} ({structures.length})
                </Onglet>
                <Onglet
                  actif={onglet === 'produits'}
                  onClick={() => setOnglet('produits')}
                >
                  {t('favoris.produits_label')} ({produits.length})
                </Onglet>
              </div>
              <button
                onClick={viderTout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                {t('favoris.tout_vider_btn')}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                {t('common.chargement')}
              </div>
            ) : (
              <>
                {(onglet === 'tous' || onglet === 'structures') &&
                  structures.length > 0 && (
                    <Section titre={t('favoris.structures_label')}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {structures.map((s) => (
                          <StructureCard key={s.id} structure={s} />
                        ))}
                      </div>
                    </Section>
                  )}

                {(onglet === 'tous' || onglet === 'produits') &&
                  produits.length > 0 && (
                    <Section titre={t('favoris.produits_label')}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {produits.map((p) => (
                          <ProduitCard key={p.id} produit={p} />
                        ))}
                      </div>
                    </Section>
                  )}

                {/* Items supprimés (id présent mais introuvable en base) */}
                {!loading &&
                  (favStructures.length > structures.length ||
                    favProduits.length > produits.length) && (
                    <p className="text-xs text-gray-500 italic text-center mt-6">
                      {t('favoris.items_supprimes')}
                    </p>
                  )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Onglet({ actif, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        actif
          ? 'bg-primary text-white shadow'
          : 'bg-white text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function Section({ titre, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{titre}</h2>
      {children}
    </section>
  );
}

function StructureCard({ structure }) {
  return (
    <div className="card overflow-hidden hover:shadow-2xl transition relative">
      <BoutonFavori type="structures" id={structure.id} variant="card" />
      <Link href={`/structure/${structure.slug || structure.id}`} className="block">
        <div className="relative w-full h-40 bg-gray-100">
          <Image
            src={structure.images?.[0] || '/placeholder-structure.jpg'}
            alt={structure.nom}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="text-sm font-bold mb-1 text-gray-800 line-clamp-1">
            {structure.nom}
          </h3>
          <div className="flex items-center justify-between mb-2">
            <StarRating note={structure.note || 0} taille={14} />
            <span className="text-xs text-gray-500">
              ({structure.nombre_avis || 0})
            </span>
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span>📍</span>
            <span className="truncate">
              {structure.ville?.nom}
              {structure.pays?.nom ? `, ${structure.pays.nom}` : ''}
            </span>
          </p>
        </div>
      </Link>
    </div>
  );
}

function ProduitCard({ produit }) {
  const devise = produit.pays?.devise || '';
  return (
    <div className="card overflow-hidden hover:shadow-2xl transition relative">
      <BoutonFavori type="produits" id={produit.id} variant="card" />
      <Link href={`/produit/${produit.id}`} className="block">
        <div className="relative w-full h-32 bg-gray-100">
          <Image
            src={produit.images?.[0] || '/placeholder-produit.jpg'}
            alt={produit.nom}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover"
          />
        </div>
        <div className="p-3">
          <h3 className="text-sm font-bold mb-1 text-gray-800 line-clamp-1">
            {produit.nom}
          </h3>
          <p className="text-primary font-bold text-sm">
            {produit.prix} {devise}
          </p>
        </div>
      </Link>
    </div>
  );
}

function EmptyState() {
  const { t } = useT();
  return (
    <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
      <div className="text-6xl mb-4">💔</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        {t('favoris.vide_titre')}
      </h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {t('favoris.vide_sous')}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/structures" className="btn-primary">
          {t('favoris.decouvrir_structures')}
        </Link>
        <Link href="/boutique" className="btn-secondary">
          {t('favoris.parcourir_boutique')}
        </Link>
      </div>
    </div>
  );
}
