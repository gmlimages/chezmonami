'use client';
// Lot Parrainage — Page admin avec onglets : Sociétés / Partenaires / Commissions
import { useEffect, useState } from 'react';
import AdminLayout from '../AdminLayout';
import { adminFetch } from '@/lib/adminFetch';
import { toast, confirmDialog } from '@/lib/toast';
import SectionPartenaires from '@/components/admin/parrainage/SectionPartenaires';
import SectionCommissions from '@/components/admin/parrainage/SectionCommissions';

export default function PageAdminParrainage() {
  const [ongletActif, setOngletActif] = useState('societes'); // societes | partenaires | commissions
  const [parametres, setParametres] = useState(null);
  const [savingParams, setSavingParams] = useState(false);

  const [demandes, setDemandes] = useState([]);
  const [codes, setCodes] = useState([]);
  const [filtreDemandes, setFiltreDemandes] = useState('en_attente');
  const [filtreCodes, setFiltreCodes] = useState('tous');
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null); // { type:'approuver'|'refuser'|'prolonger', target }
  const [valid, setValid] = useState({ jours: 30 });
  const [motif, setMotif] = useState('');

  const charger = async () => {
    setLoading(true);
    const [p, d, c] = await Promise.all([
      adminFetch('/api/admin/parrainage/parametres'),
      adminFetch(`/api/admin/parrainage/demandes?statut=${filtreDemandes}`),
      adminFetch(`/api/admin/parrainage/codes?statut=${filtreCodes}`),
    ]);
    if (p.ok) setParametres((await p.json()).parametres);
    if (d.ok) setDemandes((await d.json()).demandes || []);
    if (c.ok) setCodes((await c.json()).codes || []);
    setLoading(false);
  };

  useEffect(() => { charger(); }, [filtreDemandes, filtreCodes]);

  const sauverParametres = async () => {
    setSavingParams(true);
    const res = await adminFetch('/api/admin/parrainage/parametres', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parametres),
    });
    if (res.ok) toast.success('Paramètres enregistrés');
    else toast.error('Erreur');
    setSavingParams(false);
  };

  const approuverDemande = async () => {
    if (!modal?.target) return;
    const res = await adminFetch(`/api/admin/parrainage/demandes/${modal.target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approuver', validite_jours: valid.jours }),
    });
    if (res.ok) {
      toast.success('Code généré et envoyé par email');
      setModal(null);
      charger();
    } else {
      const d = await res.json();
      toast.error(d.error || 'Erreur');
    }
  };

  const refuserDemande = async () => {
    if (!modal?.target) return;
    const res = await adminFetch(`/api/admin/parrainage/demandes/${modal.target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refuser', motif }),
    });
    if (res.ok) {
      toast.success('Demande refusée');
      setModal(null);
      setMotif('');
      charger();
    } else toast.error('Erreur');
  };

  const revoquerCode = async (code) => {
    const ok = await confirmDialog({
      message: `Révoquer le code ${code.code} ?`,
      confirmLabel: 'Révoquer',
    });
    if (!ok) return;
    const res = await adminFetch(`/api/admin/parrainage/codes/${code.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revoquer' }),
    });
    if (res.ok) { toast.success('Code révoqué'); charger(); }
    else toast.error('Erreur');
  };

  const supprimerCode = async (code) => {
    const ok = await confirmDialog({
      message: `Supprimer le code ${code.code} de votre liste ?\n\nLe code restera visible pour l'entreprise tant qu'elle ne l'a pas supprimé de son côté.`,
      confirmLabel: 'Supprimer',
      destructive: true,
    });
    if (!ok) return;
    const res = await adminFetch(`/api/admin/parrainage/codes/${code.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.success(d.hard_delete ? 'Code supprimé définitivement' : 'Code retiré de votre liste');
      charger();
    } else toast.error('Erreur');
  };

  const prolongerCode = async () => {
    if (!modal?.target) return;
    const res = await adminFetch(`/api/admin/parrainage/codes/${modal.target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'prolonger', validite_jours: valid.jours }),
    });
    if (res.ok) { toast.success('Code prolongé'); setModal(null); charger(); }
    else toast.error('Erreur');
  };

  return (
    <AdminLayout titre="Parrainage" sousTitre="Programme de parrainage & partenaires commerciaux">
      <div className="space-y-6 max-w-6xl">

        {/* ── Onglets ── */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {[
            { key: 'societes', label: '🏢 Sociétés', desc: 'Parrainage entre entreprises' },
            { key: 'partenaires', label: '🤝 Partenaires', desc: 'Apporteurs d\'affaires (commissions)' },
            { key: 'commissions', label: '💰 Commissions', desc: 'Suivi des paiements' },
          ].map(o => (
            <button
              key={o.key}
              onClick={() => setOngletActif(o.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                ongletActif === o.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              title={o.desc}
            >
              {o.label}
            </button>
          ))}
        </div>

        {ongletActif === 'partenaires' && <SectionPartenaires />}
        {ongletActif === 'commissions' && <SectionCommissions />}

        {/* ── Onglet SOCIÉTÉS (parrainage entreprise existant) ── */}
        {ongletActif === 'societes' && (
        <>
        {/* ── Paramètres ── */}
        {parametres && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-800 mb-4">⚙️ Paramètres du programme</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={parametres.affichage_actif}
                  onChange={e => setParametres({ ...parametres, affichage_actif: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-800">
                  Afficher le programme dans les dashboards entreprise
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message promotionnel (optionnel)
                </label>
                <textarea
                  rows={2}
                  className="input-field w-full"
                  placeholder="Parrainez une entreprise et gagnez 2 mois !"
                  value={parametres.message_promo || ''}
                  onChange={e => setParametres({ ...parametres, message_promo: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mois offerts au parrain
                  </label>
                  <input
                    type="number" min="0" max="24"
                    className="input-field w-full"
                    value={parametres.mois_parrain}
                    onChange={e => setParametres({ ...parametres, mois_parrain: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mois offerts au filleul
                  </label>
                  <input
                    type="number" min="0" max="24"
                    className="input-field w-full"
                    value={parametres.mois_filleul}
                    onChange={e => setParametres({ ...parametres, mois_filleul: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <button
                onClick={sauverParametres}
                disabled={savingParams}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {savingParams ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </section>
        )}

        {/* ── Demandes ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">📥 Demandes de code</h2>
            <select
              value={filtreDemandes}
              onChange={e => setFiltreDemandes(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
            >
              <option value="en_attente">En attente</option>
              <option value="approuvee">Approuvées</option>
              <option value="refusee">Refusées</option>
              <option value="tous">Toutes</option>
            </select>
          </div>
          {loading ? <p className="text-sm text-gray-500">Chargement…</p>
          : demandes.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Aucune demande {filtreDemandes !== 'tous' ? `(${filtreDemandes})` : ''}.</p>
          ) : (
            <div className="space-y-2">
              {demandes.map(d => (
                <div key={d.id} className="border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 text-sm">
                      {d.comptes_structures?.structures?.nom || d.comptes_structures?.nom_contact}
                    </p>
                    <p className="text-xs text-gray-500">{d.comptes_structures?.email}</p>
                    {d.message_demandeur && (
                      <p className="text-xs text-gray-600 mt-1 italic">« {d.message_demandeur} »</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(d.created_at).toLocaleString('fr-FR')}
                    </p>
                    {d.statut !== 'en_attente' && (
                      <p className={`text-xs mt-1 font-semibold ${
                        d.statut === 'approuvee' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {d.statut === 'approuvee' ? '✅ Approuvée' : `❌ Refusée${d.motif_refus ? ' — ' + d.motif_refus : ''}`}
                      </p>
                    )}
                  </div>
                  {d.statut === 'en_attente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setModal({ type: 'approuver', target: d }); setValid({ jours: 30 }); }}
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                      >
                        ✅ Approuver
                      </button>
                      <button
                        onClick={() => { setModal({ type: 'refuser', target: d }); setMotif(''); }}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg font-semibold hover:bg-red-100"
                      >
                        ❌ Refuser
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Codes ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">🎟️ Codes émis</h2>
            <select
              value={filtreCodes}
              onChange={e => setFiltreCodes(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
            >
              <option value="tous">Tous</option>
              <option value="actif">Actifs</option>
              <option value="utilise">Utilisés</option>
              <option value="expire">Expirés</option>
              <option value="revoque">Révoqués</option>
            </select>
          </div>
          {codes.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Aucun code.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 border-b">
                  <tr>
                    <th className="text-left py-2 px-2">Code</th>
                    <th className="text-left py-2 px-2">Parrain</th>
                    <th className="text-left py-2 px-2">Expiration</th>
                    <th className="text-left py-2 px-2">État</th>
                    <th className="text-left py-2 px-2">Filleul</th>
                    <th className="text-right py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map(c => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 px-2 font-mono font-bold">{c.code}</td>
                      <td className="py-2 px-2">
                        <p className="font-medium">{c.parrain?.structures?.nom || c.parrain?.nom_contact}</p>
                        <p className="text-xs text-gray-500">{c.parrain?.email}</p>
                      </td>
                      <td className="py-2 px-2 text-xs">
                        {c.date_expiration
                          ? new Date(c.date_expiration).toLocaleDateString('fr-FR')
                          : <span className="text-gray-400 italic">illimité</span>}
                      </td>
                      <td className="py-2 px-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          c.etat === 'actif' ? 'bg-green-100 text-green-800' :
                          c.etat === 'utilise' ? 'bg-blue-100 text-blue-800' :
                          c.etat === 'expire' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>{c.etat}</span>
                      </td>
                      <td className="py-2 px-2 text-xs">
                        {c.filleul ? (
                          <>
                            <p>{c.filleul.structures?.nom || c.filleul.nom_contact}</p>
                            <p className="text-gray-400">{new Date(c.utilise_at).toLocaleDateString('fr-FR')}</p>
                          </>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {c.etat === 'actif' && (
                          <button
                            onClick={() => revoquerCode(c)}
                            className="text-xs text-red-600 hover:underline mr-2"
                          >
                            Révoquer
                          </button>
                        )}
                        {(c.etat === 'expire' || c.etat === 'actif') && !c.utilise_par_compte_id && (
                          <button
                            onClick={() => { setModal({ type: 'prolonger', target: c }); setValid({ jours: 30 }); }}
                            className="text-xs text-primary hover:underline mr-2"
                          >
                            Prolonger
                          </button>
                        )}
                        <button
                          onClick={() => supprimerCode(c)}
                          className="text-xs text-red-600 hover:underline"
                          title="Supprimer de votre liste"
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      {/* ── Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            {modal.type === 'approuver' && (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Approuver la demande</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Un code va être généré pour <strong>{modal.target?.comptes_structures?.structures?.nom || modal.target?.comptes_structures?.nom_contact}</strong>.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Durée de validité
                </label>
                <select
                  value={valid.jours}
                  onChange={e => setValid({ jours: parseInt(e.target.value) })}
                  className="input-field w-full mb-4"
                >
                  <option value={7}>7 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                  <option value={180}>180 jours</option>
                  <option value={0}>Illimité</option>
                </select>
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm">Annuler</button>
                  <button onClick={approuverDemande} className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold">Générer le code</button>
                </div>
              </>
            )}
            {modal.type === 'refuser' && (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Refuser la demande</h3>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Motif (optionnel)</label>
                <textarea
                  rows={3}
                  className="input-field w-full mb-4"
                  value={motif}
                  onChange={e => setMotif(e.target.value)}
                />
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm">Annuler</button>
                  <button onClick={refuserDemande} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold">Refuser</button>
                </div>
              </>
            )}
            {modal.type === 'prolonger' && (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Prolonger le code {modal.target?.code}</h3>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouvelle validité (à partir d'aujourd'hui)</label>
                <select
                  value={valid.jours}
                  onChange={e => setValid({ jours: parseInt(e.target.value) })}
                  className="input-field w-full mb-4"
                >
                  <option value={7}>7 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                  <option value={180}>180 jours</option>
                  <option value={0}>Illimité</option>
                </select>
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm">Annuler</button>
                  <button onClick={prolongerCode} className="flex-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold">Prolonger</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
        </>
        )}
      </div>
    </AdminLayout>
  );
}
