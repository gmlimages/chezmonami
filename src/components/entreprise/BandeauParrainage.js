'use client';
// Lot Parrainage — Petit bandeau dans le dashboard entreprise.
// Affiché seulement si :
//   - le programme est actif (toggle admin)
//   - le compte n'a pas de demande en cours et aucun code actif
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BandeauParrainage() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const auth = JSON.parse(localStorage.getItem('entrepriseAuth') || '{}');
        if (!auth.token) return;
        const res = await fetch('/api/entreprise/parrainage', {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (!res.ok) return;
        const d = await res.json();
        if (canceled) return;
        if (!d?.parametres?.affichage_actif) return;
        // Le bandeau reste affiché tant que l'admin n'a pas désactivé le programme
        setMessage(d.parametres.message_promo || '');
        setShow(true);
      } catch {}
    })();
    return () => { canceled = true; };
  }, []);

  if (!show) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 flex-wrap">
      <div className="text-2xl flex-shrink-0">🎁</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm">
          Programme de parrainage
        </p>
        <p className="text-xs text-gray-600 mt-0.5">
          {message || 'Parrainez une entreprise et gagnez 2 mois d\'abonnement.'}
        </p>
      </div>
      <Link
        href="/entreprise/dashboard/parrainage"
        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 flex-shrink-0"
      >
        Demander mon code
      </Link>
    </div>
  );
}
