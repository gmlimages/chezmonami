'use client';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { adminFetch } from '@/lib/adminFetch';

const STATUT_BADGE = {
  en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-700' },
  approuvee: { label: 'Approuvée', color: 'bg-green-100 text-green-700' },
  refusee: { label: 'Refusée', color: 'bg-red-100 text-red-700' },
};

export default function ContactsEntreprisesAdmin() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('tous'); // tous | en_attente | approuvee | refusee
  const [modalDemande, setModalDemande] = useState(null);
  const [noteAdmin, setNoteAdmin] = useState('');
  const [traitant, setTraitant] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const afficherToast = (texte, type = 'succes') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ texte, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    charger();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const charger = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/contacts-entreprises');
      if (res.ok) {
        const { demandes: d } = await res.json();
        setDemandes(d);
      }
    } catch {}
    setLoading(false);
  };

  const traiter = async (action) => {
    setTraitant(true);
    try {
      const res = await adminFetch(`/api/admin/contacts-entreprises/${modalDemande.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note_admin: noteAdmin }),
      });
      const data = await res.json();
      if (res.ok) {
        const labels = {
          approuver: '✅ Demande approuvée ! La conversation a été créée.',
          refuser: '❌ Demande refusée.',
          suspendre: '⏸ Conversation suspendue.',
          reactiver: '▶ Conversation réactivée.',
        };
        afficherToast(labels[action] || 'Action effectuée avec succès.');
        // Mise à jour optimiste locale
        const demandeId = modalDemande.id;
        if (action === 'approuver') {
          setDemandes(prev => prev.map(d => d.id === demandeId ? { ...d, statut: 'approuvee' } : d));
        } else if (action === 'refuser') {
          setDemandes(prev => prev.map(d => d.id === demandeId ? { ...d, statut: 'refusee' } : d));
        } else if (action === 'suspendre') {
          setDemandes(prev => prev.map(d => d.id === demandeId && d.conversation ? { ...d, conversation: { ...d.conversation, active: false } } : d));
        } else if (action === 'reactiver') {
          setDemandes(prev => prev.map(d => d.id === demandeId && d.conversation ? { ...d, conversation: { ...d.conversation, active: true } } : d));
        }
        setModalDemande(null);
        setNoteAdmin('');
        // Recharger en arrière-plan pour sync complète
        charger();
      } else {
        afficherToast(data.error || 'Erreur lors du traitement', 'erreur');
      }
    } catch {
      afficherToast('Erreur réseau', 'erreur');
    }
    setTraitant(false);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const filtrees = filtre === 'tous' ? demandes : demandes.filter(d => d.statut === filtre);
  const enAttente = demandes.filter(d => d.statut === 'en_attente').length;

  return (
    <AdminLayout titre="Contacts inter-entreprises">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-3 ${
          toast.type === 'succes' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.texte}
          <button onClick={() => setToast(null)} className="ml-2 opacity-80 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Contacts inter-entreprises</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gérez les demandes de mise en relation entre sociétés</p>
          </div>
          {enAttente > 0 && (
            <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
              {enAttente} en attente
            </span>
          )}
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'tous', label: 'Toutes' },
            { key: 'en_attente', label: '⏳ En attente' },
            { key: 'approuvee', label: '✅ Approuvées' },
            { key: 'refusee', label: '❌ Refusées' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFiltre(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filtre === f.key ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-75">
                ({f.key === 'tous' ? demandes.length : demandes.filter(d => d.statut === f.key).length})
              </span>
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtrees.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🤝</div>
            <p className="font-medium">Aucune demande de contact</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrees.map(d => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Sociétés */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-bold text-gray-800 text-sm">
                        {d.demandeur?.nom_contact}
                      </span>
                      {d.demandeur?.structures?.nom && (
                        <span className="text-xs text-gray-500">({d.demandeur.structures.nom})</span>
                      )}
                      <span className="text-gray-400 text-sm">→</span>
                      <span className="font-bold text-gray-800 text-sm">
                        {d.destinataire?.nom_contact}
                      </span>
                      {d.destinataire?.structures?.nom && (
                        <span className="text-xs text-gray-500">({d.destinataire.structures.nom})</span>
                      )}
                    </div>

                    {/* Statut + date */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUT_BADGE[d.statut]?.color}`}>
                        {STATUT_BADGE[d.statut]?.label}
                      </span>
                      {d.conversation?.id && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          d.conversation.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          💬 Conversation {d.conversation.active ? 'active' : 'suspendue'}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(d.created_at)}</span>
                    </div>

                    {/* Message de la demande */}
                    {d.message_demande && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-1 italic">
                        &ldquo;{d.message_demande}&rdquo;
                      </p>
                    )}

                    {/* Note admin */}
                    {d.note_admin && (
                      <p className="text-xs text-blue-600 mt-1">💬 Note : {d.note_admin}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {d.statut === 'en_attente' && (
                      <>
                        <button
                          onClick={() => { setModalDemande(d); setNoteAdmin(''); }}
                          className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition"
                        >
                          Traiter
                        </button>
                      </>
                    )}
                    {d.statut === 'approuvee' && d.conversation?.id && (
                      <button
                        onClick={() => { setModalDemande(d); setNoteAdmin(''); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          d.conversation.active
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {d.conversation.active ? '⏸ Suspendre' : '▶ Réactiver'}
                      </button>
                    )}
                    {d.statut === 'refusee' && (
                      <button
                        onClick={() => { setModalDemande(d); setNoteAdmin(''); }}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition"
                      >
                        Reconsidérer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal traitement */}
      {modalDemande && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 text-lg">Traitement de la demande</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {modalDemande.demandeur?.nom_contact} → {modalDemande.destinataire?.nom_contact}
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* Message de la demande */}
              {modalDemande.message_demande && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Message du demandeur</p>
                  <p className="text-sm text-gray-700 italic">&ldquo;{modalDemande.message_demande}&rdquo;</p>
                </div>
              )}

              {/* Note admin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Note interne (optionnelle)</label>
                <textarea
                  rows={2}
                  placeholder="Raison du refus, remarque..."
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  value={noteAdmin}
                  onChange={e => setNoteAdmin(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                {modalDemande.statut === 'en_attente' && (
                  <>
                    <button
                      onClick={() => traiter('approuver')}
                      disabled={traitant}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                    >
                      ✅ Approuver — créer la conversation
                    </button>
                    <button
                      onClick={() => traiter('refuser')}
                      disabled={traitant}
                      className="w-full py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                    >
                      ❌ Refuser la demande
                    </button>
                  </>
                )}
                {modalDemande.statut === 'approuvee' && modalDemande.conversation?.id && (
                  <>
                    {modalDemande.conversation.active ? (
                      <button
                        onClick={() => traiter('suspendre')}
                        disabled={traitant}
                        className="w-full py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                      >
                        ⏸ Suspendre la conversation
                      </button>
                    ) : (
                      <button
                        onClick={() => traiter('reactiver')}
                        disabled={traitant}
                        className="w-full py-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                      >
                        ▶ Réactiver la conversation
                      </button>
                    )}
                  </>
                )}
                {modalDemande.statut === 'refusee' && (
                  <button
                    onClick={() => traiter('approuver')}
                    disabled={traitant}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  >
                    ✅ Approuver quand même
                  </button>
                )}
                <button
                  onClick={() => { setModalDemande(null); setNoteAdmin(''); }}
                  disabled={traitant}
                  className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
