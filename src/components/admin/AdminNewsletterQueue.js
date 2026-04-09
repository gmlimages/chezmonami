'use client';
import { useState, useEffect } from 'react';

export default function AdminNewsletterQueue({ onStatChange }) {
  const [queue, setQueue]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingId, setLoadingId]   = useState(null);
  const [resultats, setResultats]   = useState({});
  const [selected, setSelected]     = useState(new Set());
  const [deleting, setDeleting]     = useState(false);
  const [confirmation, setConfirmation] = useState(null); // { ids, label }

  useEffect(() => {
    chargerQueue();
  }, []);

  const chargerQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/newsletter/queue');
      if (res.ok) {
        const { queue: data } = await res.json();
        setQueue(data || []);
      }
    } catch (err) {
      console.error('Erreur chargement queue:', err);
    }
    setLoading(false);
  };

  const handleEnvoyer = async (item) => {
    setLoadingId(item.id);
    setResultats(prev => ({ ...prev, [item.id]: null }));

    try {
      const res = await fetch('/api/admin/newsletter/envoyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = await res.json();

      if (data.success) {
        setResultats(prev => ({ ...prev, [item.id]: { success: true, envoyes: data.envoyes, echecs: data.echecs } }));
        onStatChange?.();
      } else {
        setResultats(prev => ({ ...prev, [item.id]: { success: false, reason: data.error } }));
      }
    } catch (err) {
      setResultats(prev => ({ ...prev, [item.id]: { success: false, reason: err.message } }));
    } finally {
      await chargerQueue();
      setLoadingId(null);
    }
  };

  // ── Sélection ──────────────────────────────────────────────────
  const toggleOne = (id) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(selected.size === queue.length ? new Set() : new Set(queue.map(q => q.id)));

  // ── Suppression ────────────────────────────────────────────────
  const supprimerIds = async (ids) => {
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/newsletter/queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (data.success) {
        setSelected(prev => {
          const next = new Set(prev);
          ids.forEach(id => next.delete(id));
          return next;
        });
        await chargerQueue();
        onStatChange?.();
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
    setDeleting(false);
    setConfirmation(null);
  };

  // ── Statut helpers ─────────────────────────────────────────────
  const styleStatut = (statut) => {
    const styles = {
      en_attente:     'bg-yellow-100 text-yellow-800',
      envoi_en_cours: 'bg-blue-100 text-blue-800',
      envoye:         'bg-green-100 text-green-800',
      erreur:         'bg-red-100 text-red-800',
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const labelStatut = (statut) => {
    const labels = {
      en_attente:     '⏳ En attente',
      envoi_en_cours: '🔄 En cours',
      envoye:         '✅ Envoyé',
      erreur:         '❌ Erreur',
    };
    return labels[statut] || statut;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📧 File d'attente Newsletter</h2>
          <p className="text-sm text-gray-500 mt-1">
            {queue.filter(i => i.statut === 'en_attente').length} notification(s) en attente
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bouton suppression multiple — visible uniquement si sélection active */}
          {selected.size > 0 && (
            <button
              onClick={() => setConfirmation({ ids: [...selected], label: `${selected.size} élément(s) sélectionné(s)` })}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer ({selected.size})
            </button>
          )}
          <button
            onClick={chargerQueue}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition"
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* ── Checkbox tout sélectionner — visible uniquement si liste non vide ── */}
      {queue.length > 0 && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          <input
            type="checkbox"
            id="selectAll"
            checked={queue.length > 0 && selected.size === queue.length}
            ref={el => { if (el) el.indeterminate = selected.size > 0 && selected.size < queue.length; }}
            onChange={toggleAll}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
          <label htmlFor="selectAll" className="text-sm text-gray-500 cursor-pointer select-none">
            {selected.size === 0
              ? 'Tout sélectionner'
              : `${selected.size} / ${queue.length} sélectionné(s)`}
          </label>
        </div>
      )}

      {/* ── Liste ── */}
      <div className="space-y-3">
        {queue.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>Aucune notification pour le moment</p>
          </div>
        ) : (
          queue.map(item => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                selected.has(item.id)
                  ? 'border-red-200 bg-red-50/40'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Checkbox individuelle */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleOne(item.id)}
                  className="w-4 h-4 mt-1 accent-primary cursor-pointer flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-lg">
                      {item.type === 'nouvelle_structure' ? '🏢' : '📦'}
                    </span>
                    <span className="font-semibold text-gray-800 truncate">{item.element_nom}</span>
                    {item.secteur_activite && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {item.secteur_activite}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${styleStatut(item.statut)}`}>
                      {labelStatut(item.statut)}
                    </span>
                    {item.nb_destinataires > 0 && <span>👥 {item.nb_destinataires} envoi(s)</span>}
                    <span>📅 {new Date(item.created_at).toLocaleString('fr-FR')}</span>
                    {item.envoye_at && (
                      <span>✉️ Envoyé le {new Date(item.envoye_at).toLocaleString('fr-FR')}</span>
                    )}
                  </div>

                  {item.statut === 'erreur' && item.erreur_detail && (
                    <p className="text-xs text-red-500 mt-2 bg-red-50 px-3 py-1 rounded">
                      {item.erreur_detail}
                    </p>
                  )}

                  {resultats[item.id] && (
                    <p className={`text-xs mt-2 font-medium ${resultats[item.id].success ? 'text-green-600' : 'text-red-600'}`}>
                      {resultats[item.id].success
                        ? `✅ ${resultats[item.id].envoyes} email(s) envoyé(s)${resultats[item.id].echecs > 0 ? `, ${resultats[item.id].echecs} échec(s)` : ''}`
                        : `❌ ${resultats[item.id].reason}`}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Actions droite ── */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.statut === 'en_attente' && (
                  <button
                    onClick={() => handleEnvoyer(item)}
                    disabled={loadingId === item.id}
                    className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {loadingId === item.id ? '⏳ Envoi...' : '📤 Envoyer'}
                  </button>
                )}
                {item.statut === 'erreur' && (
                  <button
                    onClick={() => handleEnvoyer(item)}
                    disabled={loadingId === item.id}
                    className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {loadingId === item.id ? '⏳ Envoi...' : '🔁 Réessayer'}
                  </button>
                )}

                {/* Bouton corbeille individuel */}
                <button
                  onClick={() => setConfirmation({ ids: [item.id], label: `"${item.element_nom || item.id}"` })}
                  disabled={deleting || loadingId === item.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                  title="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Modal de confirmation ── */}
      {confirmation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="text-4xl mb-3 text-center">🗑️</div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Supprimer définitivement {confirmation.label} ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmation(null)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition"
              >
                Annuler
              </button>
              <button
                onClick={() => supprimerIds(confirmation.ids)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}