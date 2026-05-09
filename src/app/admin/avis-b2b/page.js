'use client';
// Lot F admin — Modération des avis B2B.
import { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { toast, confirmDialog } from '@/lib/toast';

const STATUTS = [
  { value: 'en_attente', label: 'En attente', color: 'bg-amber-100 text-amber-800' },
  { value: 'publie',     label: 'Publié',     color: 'bg-green-100 text-green-800' },
  { value: 'rejete',     label: 'Rejeté',     color: 'bg-red-100 text-red-800' },
];

function Etoiles({ note }) {
  return (
    <span className="inline-flex items-center text-sm">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= note ? 'text-amber-400' : 'text-gray-300'}>★</span>
      ))}
    </span>
  );
}

export default function PageAdminAvisB2B() {
  const [filtre, setFiltre] = useState('en_attente');
  const [avis, setAvis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [motifEdit, setMotifEdit] = useState({ id: null, valeur: '' });

  const charger = async () => {
    setLoading(true);
    try {
      const auth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      const res = await fetch(`/api/admin/avis-b2b?statut=${filtre}`, {
        headers: { Authorization: `Bearer ${auth.sessionToken}` },
      });
      if (res.ok) {
        const d = await res.json();
        setAvis(d.avis || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, [filtre]);

  const moderer = async (id, statut, motif_rejet) => {
    try {
      const auth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      const res = await fetch(`/api/admin/avis-b2b/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.sessionToken}` },
        body: JSON.stringify({ statut, motif_rejet }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.error || 'Erreur');
        return;
      }
      toast.success(`Avis ${statut === 'publie' ? 'publié' : statut === 'rejete' ? 'rejeté' : 'mis en attente'}`);
      setMotifEdit({ id: null, valeur: '' });
      charger();
    } catch {
      toast.error('Erreur réseau');
    }
  };

  const supprimer = async (id) => {
    const ok = await confirmDialog({
      titre: 'Supprimer cet avis ?',
      message: 'Cette action est définitive.',
      confirmer: 'Supprimer',
    });
    if (!ok) return;
    try {
      const auth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      const res = await fetch(`/api/admin/avis-b2b/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.sessionToken}` },
      });
      if (res.ok) {
        toast.success('Avis supprimé');
        charger();
      } else {
        toast.error('Erreur');
      }
    } catch {
      toast.error('Erreur réseau');
    }
  };

  return (
    <AdminLayout titre="Avis B2B" sousTitre="Modération des avis entre entreprises">
      <div className="space-y-4">
        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {STATUTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFiltre(s.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtre === s.value
                  ? 'bg-primary text-white shadow'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">Chargement…</p>
        ) : avis.length === 0 ? (
          <p className="text-gray-400 italic">Aucun avis dans cette catégorie.</p>
        ) : (
          <ul className="space-y-3">
            {avis.map((a) => {
              const auteurStruct = a.auteur?.structures?.[0]?.nom || a.auteur?.nom_contact || 'Anonyme';
              const cible = a.structures?.nom || a.structure_id;
              const enRejet = motifEdit.id === a.id;
              return (
                <li key={a.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">
                        <strong className="text-gray-800">{auteurStruct}</strong> → <strong className="text-gray-800">{cible}</strong>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Etoiles note={a.note} />
                        <span className="text-sm text-gray-600">{a.note}/5</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          STATUTS.find(s => s.value === a.statut)?.color || 'bg-gray-100 text-gray-700'
                        }`}>
                          {STATUTS.find(s => s.value === a.statut)?.label || a.statut}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {a.commentaire && (
                    <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3 mb-3">
                      {a.commentaire}
                    </p>
                  )}

                  {a.motif_rejet && a.statut === 'rejete' && (
                    <p className="text-xs text-red-600 mb-2">
                      <strong>Motif de rejet :</strong> {a.motif_rejet}
                    </p>
                  )}

                  {/* Saisie motif rejet */}
                  {enRejet && (
                    <div className="mb-2">
                      <input
                        type="text"
                        value={motifEdit.valeur}
                        onChange={(e) => setMotifEdit({ ...motifEdit, valeur: e.target.value })}
                        placeholder="Motif du rejet (optionnel)"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {a.statut !== 'publie' && (
                      <button
                        onClick={() => moderer(a.id, 'publie')}
                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600"
                      >
                        ✓ Publier
                      </button>
                    )}
                    {a.statut !== 'rejete' && !enRejet && (
                      <button
                        onClick={() => setMotifEdit({ id: a.id, valeur: '' })}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600"
                      >
                        ✗ Rejeter
                      </button>
                    )}
                    {enRejet && (
                      <>
                        <button
                          onClick={() => moderer(a.id, 'rejete', motifEdit.valeur)}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600"
                        >
                          Confirmer le rejet
                        </button>
                        <button
                          onClick={() => setMotifEdit({ id: null, valeur: '' })}
                          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                      </>
                    )}
                    {a.statut !== 'en_attente' && !enRejet && (
                      <button
                        onClick={() => moderer(a.id, 'en_attente')}
                        className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-200"
                      >
                        ↺ Remettre en attente
                      </button>
                    )}
                    <button
                      onClick={() => supprimer(a.id)}
                      className="ml-auto px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
