'use client';
// CTA "Contacter via mon espace" — redirige vers le drawer de demande pré-rempli.
//
// Usage :
//   <BoutonContacterEspace structureId={produit.structure.id} type="produit" nom={produit.nom} />
//
// Si l'utilisateur n'est pas connecté en tant qu'entreprise → propose la connexion
// avec un retour vers le lien contextuel après login.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n/LangProvider';
import { buildLienContact } from '@/lib/messagesContextuels';

export default function BoutonContacterEspace({
  structureId,
  type = 'structure',
  nom = '',
  variant = 'primary', // 'primary' | 'outline'
  label,
  className = '',
}) {
  const { t } = useT();
  const [connecte, setConnecte] = useState(false);
  const [verifie, setVerifie] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('entrepriseAuth');
      setConnecte(!!raw);
    } catch {}
    setVerifie(true);
  }, []);

  if (!structureId) return null;

  const lienContact = buildLienContact({ structureId, type, nom });

  const styles =
    variant === 'outline'
      ? 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-primary text-primary hover:bg-primary/5 transition'
      : 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition shadow-sm';

  if (!verifie) return null;

  if (!connecte) {
    const retour = encodeURIComponent(lienContact);
    return (
      <Link
        href={`/entreprise/connexion?retour=${retour}`}
        className={`${styles} ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>{label || t('messages_contextuels.cta_se_connecter_pour_contacter')}</span>
      </Link>
    );
  }

  return (
    <Link href={lienContact} className={`${styles} ${className}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 21l1.8-4.2A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span>
        {label ||
          (type === 'produit'
            ? t('messages_contextuels.cta_contacter_vendeur')
            : t('messages_contextuels.cta_contacter_espace'))}
      </span>
    </Link>
  );
}
