'use client';
// Bouton "Voir comme cette entreprise" — réservé aux super_admin.
// Utilise l'API existante /api/admin/impersonate (motif obligatoire ≥ 5 caractères).
//
// Usage : <BoutonImpersonation compteId={c.id} compteEmail={c.email} />

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

export default function BoutonImpersonation({ compteId, compteEmail, className = '' }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);

  const lancer = async (e) => {
    e?.preventDefault();
    if (motif.trim().length < 5) {
      toast.error('Motif obligatoire (min 5 caractères)');
      return;
    }
    setLoading(true);
    try {
      const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminAuth.sessionToken}` },
        body: JSON.stringify({ compte_structure_id: compteId, motif }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur impersonation');
        setLoading(false);
        return;
      }

      // Installer la session entreprise. La session admin reste intacte
      // (l'admin peut quitter via la bannière dans EntrepriseLayout).
      localStorage.setItem('entrepriseAuth', JSON.stringify({
        token: data.token,
        compte: data.compte,
      }));
      localStorage.setItem('entrepriseSessionStart', Date.now().toString());

      toast.success(`Impersonation activée — ${compteEmail}`);
      router.push('/entreprise/dashboard');
    } catch {
      toast.error('Erreur réseau');
    }
    setLoading(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={className || 'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'}
      >
        👁️ Voir comme cette entreprise
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !loading && setOuvert(false)} />
          <form onSubmit={lancer} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
            <h2 className="text-lg font-bold">Démarrer une session d'impersonation</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              Vous allez voir l'interface en tant que <strong>{compteEmail}</strong>. Toutes vos
              actions seront tracées dans les <em>audit logs</em> sous votre identité admin.
              La session expire automatiquement dans 30 minutes. Réservé aux super-admins.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motif <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={2}
                required
                minLength={5}
                placeholder="Ex : assistance utilisateur ticket #1234"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 5 caractères. Ce motif est tracé.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" disabled={loading} onClick={() => setOuvert(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" disabled={loading || motif.trim().length < 5} className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50">
                {loading ? 'Démarrage…' : 'Démarrer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
