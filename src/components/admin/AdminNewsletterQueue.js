'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { envoyerNotificationNewsletter } from '@/services/newsletterService';

export default function AdminNewsletterQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [resultats, setResultats] = useState({});

  useEffect(() => {
    chargerQueue();
  }, []);

  const chargerQueue = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('newsletter_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error) setQueue(data || []);
    setLoading(false);
  };

  const handleEnvoyer = async (item) => {
    setLoadingId(item.id);
    setResultats(prev => ({ ...prev, [item.id]: null }));

    try {
      const res = await envoyerNotificationNewsletter(item);
      setResultats(prev => ({ ...prev, [item.id]: { success: true, ...res } }));
    } catch (err) {
      setResultats(prev => ({
        ...prev,
        [item.id]: { success: false, reason: err.message }
      }));
    } finally {
      await chargerQueue();
      setLoadingId(null);
    }
  };

  const styleStatut = (statut) => {
    const styles = {
      en_attente:    'bg-yellow-100 text-yellow-800',
      envoi_en_cours:'bg-blue-100 text-blue-800',
      envoye:        'bg-green-100 text-green-800',
      erreur:        'bg-red-100 text-red-800',
    };
    return styles[statut] || 'bg-gray-100 text-gray-800';
  };

  const labelStatut = (statut) => {
    const labels = {
      en_attente:    '⏳ En attente',
      envoi_en_cours:'🔄 En cours',
      envoye:        '✅ Envoyé',
      erreur:        '❌ Erreur',
    };
    return labels[statut] || statut;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📧 File d'attente Newsletter</h2>
          <p className="text-sm text-gray-500 mt-1">
            {queue.filter(i => i.statut === 'en_attente').length} notification(s) en attente
          </p>
        </div>
        <button
          onClick={chargerQueue}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 transition"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* Liste */}
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
              className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-300 transition"
            >
              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-lg">
                    {item.type === 'nouvelle_structure' ? '🏢' : '📦'}
                  </span>
                  <span className="font-semibold text-gray-800 truncate">
                    {item.element_nom}
                  </span>
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
                  {item.nb_destinataires > 0 && (
                    <span>👥 {item.nb_destinataires} envoi(s)</span>
                  )}
                  <span>📅 {new Date(item.created_at).toLocaleString('fr-FR')}</span>
                  {item.envoye_at && (
                    <span>✉️ Envoyé le {new Date(item.envoye_at).toLocaleString('fr-FR')}</span>
                  )}
                </div>

                {/* Erreur détail */}
                {item.statut === 'erreur' && item.erreur_detail && (
                  <p className="text-xs text-red-500 mt-2 bg-red-50 px-3 py-1 rounded">
                    {item.erreur_detail}
                  </p>
                )}

                {/* Résultat après action */}
                {resultats[item.id] && (
                  <p className={`text-xs mt-2 font-medium ${
                    resultats[item.id].success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {resultats[item.id].success
                      ? `✅ ${resultats[item.id].envoyes} email(s) envoyé(s)${resultats[item.id].echecs > 0 ? `, ${resultats[item.id].echecs} échec(s)` : ''}`
                      : `❌ ${resultats[item.id].reason}`}
                  </p>
                )}
              </div>

              {/* Bouton action */}
              <div className="flex-shrink-0">
                {item.statut === 'en_attente' && (
                  <button
                    onClick={() => handleEnvoyer(item)}
                    disabled={loadingId === item.id}
                    className="w-full md:w-auto px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {loadingId === item.id ? '⏳ Envoi...' : '📤 Envoyer'}
                  </button>
                )}
                {item.statut === 'erreur' && (
                  <button
                    onClick={() => handleEnvoyer(item)}
                    disabled={loadingId === item.id}
                    className="w-full md:w-auto px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {loadingId === item.id ? '⏳ Envoi...' : '🔁 Réessayer'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}