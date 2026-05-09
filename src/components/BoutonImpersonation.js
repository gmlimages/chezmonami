'use client';
// Bouton admin pour démarrer une session d'impersonation sur un compte entreprise.
// Réservé aux super_admin (vérifié côté API).
//
// Usage :
//   <BoutonImpersonation compteId={compte.id} compteLabel={compte.nom_contact} />

import { useState } from 'react';
import { toast } from '@/lib/toast';

export default function BoutonImpersonation({ compteId, compteLabel = '', className = '' }) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);

  const lancer = async () => {
    if (motif.trim().length < 5) {
      toast.error('Motif obligatoire (min 5 caractères)');
      return;
    }
    setLoading(true);
    try {
      const auth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.sessionToken}`,
        },
        body: JSON.stringify({ compte_structure_id: compteId, motif }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur');
        setLoading(false);
        return;
      }
      // Stocker la session entreprise temporaire
      localStorage.setItem('entrepriseAuth', JSON.stringify({
        token: data.token,
        compte: data.compte,
        impersonation: { session_id: data.session_id, expires_at: data.expires_at },
      }));
      localStorage.setItem('entrepriseSessionStart', Date.now().toString());
      toast.success('Session lancée — redirection…');
      window.location.href = '/entreprise/dashboard';
    } catch {
      toast.error('Erreur réseau');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={
          className ||
          'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition'
        }
        title="Voir comme ce compte (mode impersonation)"
      >
        <span>👁</span>
        <span>Impersonner</span>
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !loading && setOuvert(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Démarrer une session d'impersonation</h2>
            <p className="text-sm text-gray-600">
              Vous allez voir l'espace entreprise comme <strong>{compteLabel || 'ce compte'}</strong>.
              La session expire dans <strong>30 minutes</strong> et toutes les actions sont
              tracées dans l'audit log.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motif <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="ex: support utilisateur — ticket #1234"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setOuvert(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={lancer}
                className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
              >
                {loading ? 'Lancement…' : 'Démarrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
