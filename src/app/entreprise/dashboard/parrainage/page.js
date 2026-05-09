'use client';
// Lot Parrainage — Page entreprise : voir/demander code, suivre filleuls
import { useEffect, useState } from 'react';
import EntrepriseLayout from '../../EntrepriseLayout';
import { toast } from '@/lib/toast';

function getToken() {
  try { return JSON.parse(localStorage.getItem('entrepriseAuth') || '{}').token || ''; }
  catch { return ''; }
}

export default function PageParrainageEntreprise() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demandeOpen, setDemandeOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const charger = async () => {
    setLoading(true);
    const res = await fetch('/api/entreprise/parrainage', {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const demanderCode = async () => {
    setSubmitting(true);
    const res = await fetch('/api/entreprise/parrainage/demande', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ message }),
    });
    const d = await res.json();
    if (res.ok) {
      toast.success('Demande envoyée. Vous recevrez le code par email après validation.');
      setDemandeOpen(false);
      setMessage('');
      charger();
    } else {
      toast.error(d.error || 'Erreur');
    }
    setSubmitting(false);
  };

  const supprimerCode = async (code) => {
    if (typeof window !== 'undefined' && !window.confirm(`Supprimer le code ${code.code} de votre liste ?`)) return;
    const res = await fetch(`/api/entreprise/parrainage/codes/${code.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) {
      toast.success('Code supprimé');
      charger();
    } else {
      toast.error('Erreur');
    }
  };

  const copier = (texte) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(texte);
      toast.success('Copié !');
    }
  };

  if (loading) {
    return (
      <EntrepriseLayout titre="Parrainage">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </EntrepriseLayout>
    );
  }

  if (!data?.parametres?.affichage_actif) {
    return (
      <EntrepriseLayout titre="Parrainage">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-3">🎁</div>
          <p className="text-gray-700 font-semibold">Le programme de parrainage n'est pas encore actif.</p>
          <p className="text-sm text-gray-500 mt-1">Revenez bientôt !</p>
        </div>
      </EntrepriseLayout>
    );
  }

  const { parametres, demande_en_cours, codes, filleuls, parraine_par, total_mois_gagnes, historique_demandes } = data;
  const siteUrl = (typeof window !== 'undefined' ? window.location.origin : '');
  const codesActifs = codes.filter(c => c.etat === 'actif');

  return (
    <EntrepriseLayout titre="Parrainage" sousTitre="Parrainez des entreprises et gagnez des mois d'abonnement">
      <div className="max-w-3xl space-y-6">

        {/* ── Bandeau promo admin ── */}
        {parametres.message_promo && (
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-5">
            <p className="text-sm text-gray-800 italic">🎁 {parametres.message_promo}</p>
          </div>
        )}

        {/* ── Si filleul ── */}
        {parraine_par && parraine_par.statut === 'en_attente' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
            🎁 <strong>+{parraine_par.mois_filleul} mois offert</strong> à débloquer dès que vous payez votre premier abonnement (parrainage par <strong>{parraine_par.parrain?.structures?.nom || parraine_par.parrain?.nom_contact}</strong>).
          </div>
        )}
        {parraine_par && parraine_par.statut === 'valide' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-900">
            ✓ <strong>+{parraine_par.mois_filleul} mois</strong> ont été ajoutés à votre abonnement grâce au parrainage de {parraine_par.parrain?.structures?.nom || parraine_par.parrain?.nom_contact}.
          </div>
        )}

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-primary">{filleuls.length}</p>
            <p className="text-xs text-gray-500">Filleuls inscrits</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{filleuls.filter(f => f.statut === 'valide').length}</p>
            <p className="text-xs text-gray-500">Validés</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{total_mois_gagnes}</p>
            <p className="text-xs text-gray-500">Mois gagnés</p>
          </div>
        </div>

        {/* ── Codes actifs ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">🎟️ Mes codes</h2>
            {!demande_en_cours && (
              <button
                onClick={() => setDemandeOpen(true)}
                className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90"
              >
                + Demander un code
              </button>
            )}
          </div>

          {demande_en_cours && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 mb-4">
              ⏳ Votre demande de code est en cours de traitement par l'administration. Vous recevrez le code par email après validation.
            </div>
          )}

          {codes.length === 0 && !demande_en_cours && (
            <p className="text-sm text-gray-500 italic">Aucun code pour le moment. Faites une demande pour en obtenir un.</p>
          )}

          {codes.length > 0 && (
            <div className="space-y-3">
              {codes.map(c => (
                <div key={c.id} className={`border rounded-lg p-4 ${
                  c.etat === 'actif' ? 'border-primary/30 bg-primary/5'
                  : c.etat === 'utilise' ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-lg tracking-wider text-gray-900">{c.code}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          c.etat === 'actif' ? 'bg-green-100 text-green-800' :
                          c.etat === 'utilise' ? 'bg-blue-100 text-blue-800' :
                          c.etat === 'expire' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>{c.etat}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {c.date_expiration
                          ? `Expire le ${new Date(c.date_expiration).toLocaleDateString('fr-FR')}`
                          : 'Sans date d\'expiration'}
                      </p>
                      {c.filleul && (
                        <p className="text-xs text-gray-600 mt-1">
                          Utilisé par <strong>{c.filleul.structures?.nom || c.filleul.nom_contact}</strong>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {c.etat === 'actif' && (
                        <>
                          <button
                            onClick={() => copier(c.code)}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50"
                          >
                            📋 Code
                          </button>
                          <button
                            onClick={() => copier(`${siteUrl}/entreprise/inscription?ref=${c.code}`)}
                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:opacity-90"
                          >
                            🔗 Copier le lien
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => supprimerCode(c)}
                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50"
                        title="Retirer de ma liste"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Filleuls ── */}
        {filleuls.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">👥 Mes filleuls</h2>
            <div className="space-y-2">
              {filleuls.map(f => (
                <div key={f.id} className="flex items-center justify-between gap-3 border-b last:border-0 py-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-800">
                      {f.filleul?.structures?.nom || f.filleul?.nom_contact}
                    </p>
                    <p className="text-xs text-gray-500">
                      Inscrit le {new Date(f.date_inscription_filleul).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    {f.statut === 'valide' ? (
                      <>
                        <p className="text-xs font-bold text-green-700">+{f.mois_parrain} mois validés</p>
                        <p className="text-xs text-gray-400">{new Date(f.recompense_parrain_appliquee_at).toLocaleDateString('fr-FR')}</p>
                      </>
                    ) : (
                      <p className="text-xs font-semibold text-amber-700">⏳ En attente du paiement</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Historique demandes ── */}
        {historique_demandes && historique_demandes.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-3">📜 Historique des demandes</h2>
            <div className="space-y-1 text-sm">
              {historique_demandes.map(d => (
                <div key={d.id} className="flex items-center justify-between py-1 border-b last:border-0">
                  <span className="text-gray-600 text-xs">{new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
                  <span className={`text-xs font-semibold ${
                    d.statut === 'approuvee' ? 'text-green-700' :
                    d.statut === 'refusee' ? 'text-red-700' : 'text-amber-700'
                  }`}>
                    {d.statut === 'approuvee' ? '✅ Approuvée' :
                     d.statut === 'refusee' ? `❌ Refusée${d.motif_refus ? ' — ' + d.motif_refus : ''}` :
                     '⏳ En attente'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Modal demande ── */}
      {demandeOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Demander un code de parrainage</h3>
            <p className="text-sm text-gray-600 mb-4">
              Votre demande sera examinée par l'administration. Vous recevrez le code par email une fois approuvée.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message à l'administration (optionnel)
            </label>
            <textarea
              rows={3}
              className="input-field w-full mb-4"
              placeholder="Quelques mots sur le contexte de votre demande…"
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setDemandeOpen(false)} disabled={submitting} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm">Annuler</button>
              <button onClick={demanderCode} disabled={submitting} className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {submitting ? 'Envoi…' : 'Envoyer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </EntrepriseLayout>
  );
}
