'use client';
// Lot F — Liste publique des avis B2B reçus par une structure.
// Inclut un mini-formulaire si l'utilisateur connecté (entreprise) est différent de la cible.
//
// Usage : <AvisStructure structureId={s.id} />

import { useEffect, useState } from 'react';
import { toast } from '@/lib/toast';

function Etoiles({ note, taille = 'text-sm' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${taille}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= note ? 'text-amber-400' : 'text-gray-300'}>★</span>
      ))}
    </span>
  );
}

function EtoilesEditables({ note, onChange }) {
  return (
    <span className="inline-flex items-center gap-1 text-2xl">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`transition ${n <= note ? 'text-amber-400 hover:text-amber-500' : 'text-gray-300 hover:text-amber-300'}`}
          aria-label={`Note ${n}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export default function AvisStructure({ structureId }) {
  const [avis, setAvis] = useState([]);
  const [stats, setStats] = useState({ nombre: 0, moyenne: 0 });
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(null);

  // Form state
  const [formOuvert, setFormOuvert] = useState(false);
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem('entrepriseAuth') || 'null');
      setAuth(a);
    } catch {}
  }, []);

  const charger = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/structures/${structureId}/avis-b2b`);
      if (res.ok) {
        const data = await res.json();
        setAvis(data.avis || []);
        setStats(data.stats || { nombre: 0, moyenne: 0 });
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (structureId) charger();
  }, [structureId]);

  const peutLaisserAvis = auth?.token && auth?.compte?.structure_id !== structureId;

  const soumettre = async (e) => {
    e.preventDefault();
    if (note < 1) {
      toast.error('Veuillez sélectionner une note (1 à 5 étoiles)');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/entreprise/avis-b2b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ structure_id: structureId, note, commentaire }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de l\'envoi');
      } else {
        toast.success('Merci ! Votre avis sera publié après modération.');
        setFormOuvert(false);
        setNote(0);
        setCommentaire('');
        charger();
      }
    } catch {
      toast.error('Erreur réseau');
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Avis B2B</h3>
          {stats.nombre > 0 ? (
            <div className="flex items-center gap-2 mt-1">
              <Etoiles note={Math.round(stats.moyenne)} />
              <span className="text-sm text-gray-700 font-medium">
                {stats.moyenne}/5 — {stats.nombre} avis
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Aucun avis pour le moment.</p>
          )}
        </div>
        {peutLaisserAvis && !formOuvert && (
          <button
            type="button"
            onClick={() => setFormOuvert(true)}
            className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90"
          >
            + Laisser un avis
          </button>
        )}
      </div>

      {/* Formulaire */}
      {peutLaisserAvis && formOuvert && (
        <form onSubmit={soumettre} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Votre note</label>
            <EtoilesEditables note={note} onChange={setNote} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire <span className="text-gray-400">(optionnel)</span>
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Partagez votre expérience B2B avec cette structure"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">{commentaire.length}/2000</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormOuvert(false)}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || note < 1}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Votre avis sera visible après validation par un modérateur.
          </p>
        </form>
      )}

      {/* Liste */}
      {loading ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : avis.length === 0 ? (
        !formOuvert && (
          <p className="text-sm text-gray-400 italic">
            Soyez le premier à partager votre expérience.
          </p>
        )
      ) : (
        <ul className="space-y-3">
          {avis.map((a) => (
            <li key={a.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-sm text-gray-800 truncate">
                  {a.auteur_nom}
                </span>
                <Etoiles note={a.note} />
              </div>
              {a.commentaire && (
                <p className="text-sm text-gray-700 whitespace-pre-line">{a.commentaire}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(a.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
