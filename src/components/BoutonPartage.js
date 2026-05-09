'use client';
// Bouton "Partager" universel : WhatsApp, Email, Copier le lien.
// Utilisable sur toute page (structure, produit, annonce, appel d'offres…).
//
// Usage minimal :
//   <BoutonPartage titre={structure.nom} />
//
// Usage complet :
//   <BoutonPartage
//     titre={produit.nom}
//     description={produit.description}
//     url="https://chezmonami.com/produit/123"  // optionnel, sinon URL courante
//     variant="default" | "compact" | "icon"
//   />

import { useState, useRef, useEffect } from 'react';
import { useT } from '@/lib/i18n/LangProvider';
import { toast } from '@/lib/toast';

export default function BoutonPartage({
  titre = '',
  description = '',
  url,
  variant = 'default',
  className = '',
}) {
  const { t } = useT();
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef(null);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!ouvert) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOuvert(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [ouvert]);

  // Calcul de l'URL au moment du clic (côté client uniquement)
  const getUrl = () => {
    if (url) return url;
    if (typeof window !== 'undefined') return window.location.href;
    return '';
  };

  const fillTpl = (tpl) =>
    tpl.replace('{{titre}}', titre || '').replace('{{url}}', getUrl());

  const onWhatsApp = () => {
    const message = fillTpl(t('partage.message_whatsapp'));
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
    setOuvert(false);
  };

  const onEmail = () => {
    const sujet = t('partage.sujet_email').replace('{{titre}}', titre || '');
    const corps = fillTpl(t('partage.corps_email'));
    window.location.href = `mailto:?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
    setOuvert(false);
  };

  const onCopier = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      toast.success(t('partage.lien_copie'));
    } catch {
      toast.error(t('partage.erreur_copie'));
    }
    setOuvert(false);
  };

  // Si Web Share API native dispo (mobile surtout), proposer en priorité
  const onPartageNatif = async () => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      setOuvert((v) => !v);
      return;
    }
    try {
      await navigator.share({
        title: titre || 'ChezMonAmi',
        text: description || titre || '',
        url: getUrl(),
      });
    } catch {
      // utilisateur annule → on ouvre le menu manuel
      setOuvert(true);
    }
  };

  // Détecte si Web Share existe (en effet pour éviter mismatch SSR)
  const [aShareNatif, setAShareNatif] = useState(false);
  useEffect(() => {
    setAShareNatif(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  // Styles
  const baseBtn =
    variant === 'compact'
      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 transition'
      : variant === 'icon'
      ? 'inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow hover:scale-110 transition-transform'
      : 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50 transition shadow-sm';

  const labelPartager = t('partage.partager');

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <button
        type="button"
        onClick={aShareNatif ? onPartageNatif : () => setOuvert((v) => !v)}
        aria-label={t('partage.partager_aria')}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        title={labelPartager}
        className={baseBtn}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4m0 0L8 6m4-4v13"
          />
        </svg>
        {variant !== 'icon' && <span>{labelPartager}</span>}
      </button>

      {ouvert && !aShareNatif && (
        <div
          role="menu"
          className="absolute z-50 mt-2 right-0 w-56 rounded-xl bg-white shadow-xl border border-gray-100 py-2"
        >
          <div className="px-3 pb-2 pt-1 text-xs uppercase tracking-wide text-gray-400">
            {t('partage.partager_via')}
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={onWhatsApp}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left text-sm"
          >
            <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M20.52 3.48A11.78 11.78 0 0012.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.36-1.67a11.83 11.83 0 005.68 1.45h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.47-8.46zM12.05 21.5h-.01a9.7 9.7 0 01-4.95-1.36l-.36-.21-3.78.99 1.01-3.69-.23-.38a9.7 9.7 0 01-1.49-5.21c0-5.36 4.36-9.72 9.72-9.72 2.6 0 5.04 1.01 6.88 2.85a9.66 9.66 0 012.85 6.88c0 5.36-4.36 9.85-9.64 9.85zm5.32-7.27c-.29-.15-1.72-.85-1.99-.95-.27-.1-.46-.15-.66.15-.19.29-.76.95-.93 1.15-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.43-.86-.77-1.44-1.71-1.6-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.5.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.66-1.59-.91-2.18-.24-.57-.49-.49-.66-.5-.17-.01-.36-.01-.55-.01-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.39 0 1.41 1.02 2.77 1.16 2.96.15.19 2 3.05 4.84 4.27.68.29 1.2.46 1.61.59.68.21 1.29.18 1.78.11.54-.08 1.72-.7 1.96-1.38.24-.68.24-1.27.17-1.39-.07-.12-.26-.19-.55-.34z"/>
              </svg>
            </span>
            <span>{t('partage.whatsapp')}</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={onEmail}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left text-sm"
          >
            <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <span>{t('partage.email')}</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={onCopier}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left text-sm"
          >
            <span className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 015.656 5.656l-3 3a4 4 0 01-5.656-5.656m-1.656-3.656a4 4 0 00-5.656 5.656l3 3a4 4 0 005.656-5.656" />
              </svg>
            </span>
            <span>{t('partage.copier_lien')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
