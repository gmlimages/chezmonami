'use client';
// Lot Partenaires — Section admin : liste & paiement des commissions
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import { toast, confirmDialog } from '@/lib/toast';

export default function SectionCommissions() {
  const [statut, setStatut] = useState('a_payer');
  const [commissions, setCommissions] = useState([]);
  const [totaux, setTotaux] = useState({ a_payer: 0, en_paiement: 0, payee_admin: 0, validee: 0, contestee: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type, target }
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const STATUTS = [
    { key: 'a_payer', label: 'À payer', color: 'amber' },
    { key: 'en_paiement', label: 'En paiement', color: 'blue' },
    { key: 'payee_admin', label: 'En attente de confirmation', color: 'orange' },
    { key: 'contestee', label: 'Contestée', color: 'red' },
    { key: 'validee', label: 'Validée', color: 'green' },
    { key: 'annulee', label: 'Annulée', color: 'gray' },
    { key: 'tous', label: 'Toutes', color: 'primary' },
  ];

  const labelStatut = (s) => STATUTS.find(x => x.key === s)?.label || s;

  const charger = async () => {
    setLoading(true);
    const r = await adminFetch(`/api/admin/commissions?statut=${statut}`);
    if (r.ok) {
      const d = await r.json();
      setCommissions(d.commissions || []);
      setTotaux(d.totaux || { a_payer: 0, payee: 0, total: 0 });
    }
    setLoading(false);
  };

  useEffect(() => { charger(); }, [statut]);

  const callAction = async (target, payload, successMsg) => {
    setSubmitting(true);
    const r = await adminFetch(`/api/admin/commissions/${target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    const d = await r.json().catch(() => ({}));
    if (r.ok) { toast.success(successMsg); setModal(null); setForm({}); charger(); }
    else toast.error(d.error || 'Erreur');
  };

  const marquerEnPaiement = async (c) => {
    const ok = await confirmDialog({ message: `Lancer le paiement pour ${Number(c.montant_commission_mad).toFixed(2)} MAD ?`, confirmLabel: 'Lancer' });
    if (!ok) return;
    await callAction(c, { action: 'marquer_en_paiement' }, 'Paiement en cours');
  };

  const marquerPayee = async () => {
    if (!modal?.target) return;
    await callAction(modal.target, {
      action: 'marquer_payee_admin',
      justificatif_url: form.justificatif_url || null,
      notes: form.notes || null,
    }, 'Paiement enregistré, le partenaire doit confirmer');
  };

  const rouvrir = async (c) => {
    const ok = await confirmDialog({ message: `Rouvrir la contestation et remettre en paiement ?`, confirmLabel: 'Rouvrir' });
    if (!ok) return;
    await callAction(c, { action: 'rouvrir' }, 'Commission rouverte');
  };

  const annuler = async (c) => {
    const ok = await confirmDialog({ message: `Annuler la commission de ${Number(c.montant_commission_mad).toFixed(2)} MAD ?`, confirmLabel: 'Annuler', destructive: true });
    if (!ok) return;
    const r = await adminFetch(`/api/admin/commissions/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'annuler' }),
    });
    if (r.ok) { toast.success('Annulée'); charger(); }
    else toast.error('Erreur');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="À payer" value={`${totaux.a_payer.toFixed(2)} MAD`} color="amber" />
        <StatCard label="En paiement" value={`${totaux.en_paiement.toFixed(2)} MAD`} color="blue" />
        <StatCard label="À confirmer" value={`${totaux.payee_admin.toFixed(2)} MAD`} color="orange" />
        <StatCard label="Validées" value={`${totaux.validee.toFixed(2)} MAD`} color="green" />
        <StatCard label="Contestées" value={`${totaux.contestee.toFixed(2)} MAD`} color="red" />
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {STATUTS.map(s => (
          <button key={s.key}
            onClick={() => setStatut(s.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statut === s.key ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {commissions.length === 0 ? (
        <p className="text-sm text-gray-500 italic text-center py-12">Aucune commission</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left py-2 px-3">Date paiement filleul</th>
                  <th className="text-left py-2 px-3">Partenaire</th>
                  <th className="text-left py-2 px-3">Filleul</th>
                  <th className="text-left py-2 px-3">Code</th>
                  <th className="text-left py-2 px-3">Abonnement</th>
                  <th className="text-left py-2 px-3">%</th>
                  <th className="text-left py-2 px-3">Commission (MAD)</th>
                  <th className="text-left py-2 px-3">Statut</th>
                  <th className="text-right py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="py-2 px-3 text-xs">{new Date(c.date_paiement_filleul).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2 px-3">
                      <p className="font-semibold text-gray-800">{c.partenaire?.nom_complet}</p>
                      <p className="text-xs text-gray-500">{c.partenaire?.email}</p>
                    </td>
                    <td className="py-2 px-3">{c.filleul?.structures?.nom || c.filleul?.nom_contact}</td>
                    <td className="py-2 px-3">
                      <code className="text-xs">{c.code?.code}</code>
                      {c.code && <p className="text-xs text-gray-400">{c.code.type}{c.code.nom_campagne ? ` — ${c.code.nom_campagne}` : ''}</p>}
                    </td>
                    <td className="py-2 px-3 capitalize text-xs">{c.abonnement_type}</td>
                    <td className="py-2 px-3 font-semibold">{c.pourcentage_applique}%</td>
                    <td className="py-2 px-3 font-bold text-gray-800">{Number(c.montant_commission_mad).toFixed(2)}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        c.statut === 'a_payer' ? 'bg-amber-100 text-amber-800' :
                        c.statut === 'en_paiement' ? 'bg-blue-100 text-blue-800' :
                        c.statut === 'payee_admin' ? 'bg-orange-100 text-orange-800' :
                        c.statut === 'validee' ? 'bg-green-100 text-green-800' :
                        c.statut === 'contestee' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {labelStatut(c.statut)}
                        {c.validation_auto && c.statut === 'validee' ? ' (auto)' : ''}
                      </span>
                      {c.statut === 'contestee' && c.motif_contestation && (
                        <p className="text-xs text-red-600 mt-1 italic">« {c.motif_contestation} »</p>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {c.statut === 'a_payer' && (
                        <>
                          <button onClick={() => marquerEnPaiement(c)} className="text-xs text-blue-700 hover:underline mr-2">▶ En paiement</button>
                          <button onClick={() => { setForm({}); setModal({ type: 'payer', target: c }); }} className="text-xs text-green-700 hover:underline mr-2">Marquer payée</button>
                          <button onClick={() => annuler(c)} className="text-xs text-red-600 hover:underline">Annuler</button>
                        </>
                      )}
                      {c.statut === 'en_paiement' && (
                        <>
                          <button onClick={() => { setForm({}); setModal({ type: 'payer', target: c }); }} className="text-xs text-green-700 hover:underline mr-2">Marquer payée</button>
                          <button onClick={() => annuler(c)} className="text-xs text-red-600 hover:underline">Annuler</button>
                        </>
                      )}
                      {c.statut === 'contestee' && (
                        <button onClick={() => rouvrir(c)} className="text-xs text-amber-700 hover:underline">Rouvrir</button>
                      )}
                      {c.justificatif_url && <a href={c.justificatif_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline ml-2">📎</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal?.type === 'payer' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Marquer comme payée</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-sm">
                Commission de <strong>{Number(modal.target.montant_commission_mad).toFixed(2)} MAD</strong> pour {modal.target.partenaire?.nom_complet}.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">URL du justificatif (optionnel)</label>
                <input value={form.justificatif_url || ''} onChange={e => setForm({ ...form, justificatif_url: e.target.value })} placeholder="https://…" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Note (optionnel)</label>
                <textarea rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <button onClick={marquerPayee} disabled={submitting} className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {submitting ? 'Enregistrement…' : 'Confirmer le paiement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colorMap = {
    amber: 'text-amber-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    green: 'text-green-600',
    red: 'text-red-600',
    primary: 'text-primary',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
      <p className={`text-lg sm:text-xl font-bold ${colorMap[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
