'use client';
// Lot Partenaires — Section admin : liste/création/modification partenaires + codes
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import { toast, confirmDialog } from '@/lib/toast';

export default function SectionPartenaires() {
  const [filtre, setFiltre] = useState('actifs');
  const [partenaires, setPartenaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type, target }
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [details, setDetails] = useState(null); // partenaire complet déplié

  const charger = async () => {
    setLoading(true);
    const r = await adminFetch(`/api/admin/partenaires?filtre=${filtre}`);
    if (r.ok) setPartenaires((await r.json()).partenaires || []);
    setLoading(false);
  };

  useEffect(() => { charger(); }, [filtre]);

  const chargerDetails = async (id) => {
    const r = await adminFetch(`/api/admin/partenaires/${id}`);
    if (r.ok) setDetails(await r.json());
  };

  const creer = async () => {
    setSubmitting(true);
    const r = await adminFetch('/api/admin/partenaires', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      toast.success('Partenaire créé. Mot de passe et code envoyés par email.');
      setModal(null);
      setForm({});
      charger();
    } else {
      toast.error(d.error || 'Erreur');
    }
  };

  const modifier = async () => {
    if (!modal?.target) return;
    setSubmitting(true);
    const r = await adminFetch(`/api/admin/partenaires/${modal.target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('Modifié');
      setModal(null);
      setForm({});
      charger();
      if (details?.partenaire?.id === modal.target.id) chargerDetails(modal.target.id);
    } else toast.error('Erreur');
  };

  const supprimer = async (p) => {
    const ok = await confirmDialog({
      message: `Supprimer définitivement le partenaire ${p.nom_complet} ?\nLes codes seront désactivés et l'accès coupé.`,
      confirmLabel: 'Supprimer',
      destructive: true,
    });
    if (!ok) return;
    const r = await adminFetch(`/api/admin/partenaires/${p.id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Partenaire supprimé'); charger(); setDetails(null); }
    else toast.error('Erreur');
  };

  const resetMdp = async (p) => {
    const ok = await confirmDialog({
      message: `Réinitialiser le mot de passe de ${p.nom_complet} ?\nUn nouveau sera envoyé par email.`,
      confirmLabel: 'Réinitialiser',
    });
    if (!ok) return;
    const r = await adminFetch(`/api/admin/partenaires/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_mdp' }),
    });
    if (r.ok) toast.success('Nouveau mot de passe envoyé par email');
    else toast.error('Erreur');
  };

  const toggleCommissions = async (p) => {
    const r = await adminFetch(`/api/admin/partenaires/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commissions_actives: !p.commissions_actives }),
    });
    if (r.ok) { toast.success(p.commissions_actives ? 'Commissions coupées' : 'Commissions réactivées'); charger(); }
    else toast.error('Erreur');
  };

  const creerCodeCampagne = async () => {
    if (!details?.partenaire?.id) return;
    setSubmitting(true);
    const r = await adminFetch(`/api/admin/partenaires/${details.partenaire.id}/codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom_campagne: form.nom_campagne || null,
        pourcentage_override: form.pourcentage_override === '' ? null : Number(form.pourcentage_override),
        mois_filleul: Number(form.mois_filleul) || 0,
        reduction_filleul_pct: Number(form.reduction_filleul_pct) || 0,
        validite_jours: form.validite_jours === '' ? null : Number(form.validite_jours),
      }),
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('Code campagne créé et envoyé par email');
      setModal(null); setForm({});
      chargerDetails(details.partenaire.id);
    } else toast.error('Erreur');
  };

  const toggleCode = async (code, activer) => {
    const r = await adminFetch(`/api/admin/partenaires/codes/${code.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: activer ? 'activer' : 'desactiver' }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { toast.success('Code mis à jour'); chargerDetails(details.partenaire.id); }
    else toast.error(d.error || 'Erreur');
  };

  const supprimerCode = async (code) => {
    if (code.type === 'permanent') return toast.error('Le code permanent ne peut être supprimé');
    const ok = await confirmDialog({ message: `Supprimer le code ${code.code} ?`, confirmLabel: 'Supprimer', destructive: true });
    if (!ok) return;
    const r = await adminFetch(`/api/admin/partenaires/codes/${code.id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Supprimé'); chargerDetails(details.partenaire.id); }
    else toast.error('Erreur');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header + filtres + création */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {['actifs', 'inactifs', 'supprimes', 'tous'].map(f => (
            <button key={f}
              onClick={() => setFiltre(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filtre === f ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {f === 'actifs' ? 'Actifs' : f === 'inactifs' ? 'Inactifs' : f === 'supprimes' ? 'Supprimés' : 'Tous'}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setForm({ pourcentage_commission: 10, mois_filleul_permanent: 0 }); setModal({ type: 'creer' }); }}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90"
        >
          + Nouveau partenaire
        </button>
      </div>

      {/* Liste */}
      {partenaires.length === 0 ? (
        <p className="text-sm text-gray-500 italic text-center py-12">Aucun partenaire</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left py-2 px-3">Partenaire</th>
                  <th className="text-left py-2 px-3">%</th>
                  <th className="text-left py-2 px-3">Filleuls</th>
                  <th className="text-left py-2 px-3">À payer (MAD)</th>
                  <th className="text-left py-2 px-3">Statut</th>
                  <th className="text-right py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partenaires.map(p => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="py-2 px-3">
                      <button onClick={() => chargerDetails(p.id)} className="font-semibold text-gray-800 hover:text-primary text-left">
                        {p.nom_complet}
                      </button>
                      <p className="text-xs text-gray-500">{p.email}</p>
                    </td>
                    <td className="py-2 px-3 font-semibold">{p.pourcentage_commission}%</td>
                    <td className="py-2 px-3">{p.stats?.filleuls || 0}</td>
                    <td className="py-2 px-3 font-semibold text-amber-700">{Number(p.stats?.commissions_a_payer || 0).toFixed(2)}</td>
                    <td className="py-2 px-3">
                      {p.supprime ? <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Supprimé</span>
                       : !p.actif ? <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Désactivé</span>
                       : p.commissions_actives ? <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Actif</span>
                       : <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Commissions coupées</span>}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => chargerDetails(p.id)} className="text-xs text-primary hover:underline mr-2">Détails</button>
                      {!p.supprime && (
                        <>
                          <button onClick={() => { setForm({ nom_complet: p.nom_complet, telephone: p.telephone || '', pourcentage_commission: p.pourcentage_commission, commissions_actives: p.commissions_actives, actif: p.actif }); setModal({ type: 'modifier', target: p }); }} className="text-xs text-blue-600 hover:underline mr-2">Modifier</button>
                          <button onClick={() => toggleCommissions(p)} className="text-xs text-amber-600 hover:underline mr-2">{p.commissions_actives ? 'Couper %' : 'Réactiver %'}</button>
                          <button onClick={() => resetMdp(p)} className="text-xs text-gray-600 hover:underline mr-2">Reset MDP</button>
                          <button onClick={() => supprimer(p)} className="text-xs text-red-600 hover:underline">Supprimer</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Détails partenaire */}
      {details && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">📂 {details.partenaire.nom_complet}</h3>
            <button onClick={() => setDetails(null)} className="text-sm text-gray-400 hover:text-gray-600">✕ Fermer</button>
          </div>

          {/* Coordonnées paiement */}
          <div className="text-sm">
            <p className="font-semibold mb-1">Coordonnées de paiement</p>
            <pre className="text-xs bg-gray-50 p-2 rounded text-gray-700 overflow-x-auto">{JSON.stringify(details.partenaire.coordonnees_paiement || {}, null, 2)}</pre>
          </div>

          {/* Codes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-700">🎟️ Codes ({details.codes.length})</h4>
              <button onClick={() => { setForm({ mois_filleul: 0, reduction_filleul_pct: 0, validite_jours: '' }); setModal({ type: 'code_campagne' }); }}
                className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-semibold">+ Code campagne</button>
            </div>
            <div className="space-y-2">
              {details.codes.map(c => (
                <div key={c.id} className={`border rounded-lg p-3 flex flex-wrap items-center gap-3 ${c.type === 'permanent' ? 'border-primary/30 bg-primary/5' : 'border-amber-200 bg-amber-50/50'}`}>
                  <span className="font-mono font-bold tracking-wider">{c.code}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.type === 'permanent' ? 'bg-primary/20 text-primary' : 'bg-amber-200 text-amber-800'}`}>
                    {c.type === 'permanent' ? '🔒 Permanent' : '🎯 Campagne'}
                  </span>
                  {c.nom_campagne && <span className="text-xs text-gray-600">— {c.nom_campagne}</span>}
                  <span className="text-xs text-gray-500">
                    {c.pourcentage_override != null ? `${c.pourcentage_override}%` : `${details.partenaire.pourcentage_commission}% (défaut)`}
                  </span>
                  {(c.mois_filleul > 0 || Number(c.reduction_filleul_pct) > 0) && (
                    <span className="text-xs text-green-700">
                      🎁 {c.mois_filleul > 0 ? `+${c.mois_filleul} mois` : ''} {Number(c.reduction_filleul_pct) > 0 ? `-${c.reduction_filleul_pct}%` : ''}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {c.date_expiration ? `Exp. ${new Date(c.date_expiration).toLocaleDateString('fr-FR')}` : 'Illimité'}
                  </span>
                  <span className={`text-xs font-semibold ml-auto ${c.actif ? 'text-green-700' : 'text-gray-400'}`}>
                    {c.actif ? '● Actif' : '○ Inactif'}
                  </span>
                  {c.type === 'campagne' && (
                    <>
                      <button onClick={() => toggleCode(c, !c.actif)} className="text-xs text-blue-600 hover:underline">{c.actif ? 'Désactiver' : 'Activer'}</button>
                      <button onClick={() => supprimerCode(c)} className="text-xs text-red-600 hover:underline">Supprimer</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Filleuls */}
          <div>
            <h4 className="font-bold text-gray-700 mb-2">👥 Filleuls ({details.filleuls.length})</h4>
            {details.filleuls.length === 0 ? <p className="text-sm text-gray-400 italic">Aucun filleul</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500">
                    <tr>
                      <th className="text-left py-1">Société</th>
                      <th className="text-left py-1">Code</th>
                      <th className="text-left py-1">Abonnement</th>
                      <th className="text-left py-1">Fin</th>
                      <th className="text-left py-1">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.filleuls.map(f => (
                      <tr key={f.id} className="border-t border-gray-100">
                        <td className="py-1.5">{f.structures?.nom || f.nom_contact}</td>
                        <td className="py-1.5 font-mono text-xs">{f.code_partenaire_utilise || '—'}</td>
                        <td className="py-1.5 capitalize">{f.abonnement}</td>
                        <td className="py-1.5 text-xs">{f.date_fin_abonnement ? new Date(f.date_fin_abonnement).toLocaleDateString('fr-FR') : '—'}</td>
                        <td className="py-1.5 font-semibold">{f.montant_paiement ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALES ── */}
      {modal?.type === 'creer' && (
        <Modal titre="Nouveau partenaire" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Input label="Nom complet *" value={form.nom_complet || ''} onChange={v => setForm({ ...form, nom_complet: v })} />
            <Input label="Email *" type="email" value={form.email || ''} onChange={v => setForm({ ...form, email: v })} />
            <Input label="Téléphone" value={form.telephone || ''} onChange={v => setForm({ ...form, telephone: v })} />
            <Input label="Pourcentage de commission (%)" type="number" value={form.pourcentage_commission ?? 10} onChange={v => setForm({ ...form, pourcentage_commission: Number(v) })} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Mois offerts filleul (code permanent)" type="number" value={form.mois_filleul_permanent ?? 0} onChange={v => setForm({ ...form, mois_filleul_permanent: Number(v) })} />
              <Input label="Réduction filleul %" type="number" value={form.reduction_filleul_pct_permanent ?? 0} onChange={v => setForm({ ...form, reduction_filleul_pct_permanent: Number(v) })} />
            </div>
            <button onClick={creer} disabled={submitting} className="w-full py-2 bg-primary text-white rounded-lg font-semibold disabled:opacity-50">
              {submitting ? 'Création…' : 'Créer le partenaire'}
            </button>
            <p className="text-xs text-gray-500 italic">Le mot de passe initial et le code permanent (PART-XXXXXXXX) seront envoyés par email.</p>
          </div>
        </Modal>
      )}

      {modal?.type === 'modifier' && (
        <Modal titre={`Modifier ${modal.target.nom_complet}`} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Input label="Nom complet" value={form.nom_complet || ''} onChange={v => setForm({ ...form, nom_complet: v })} />
            <Input label="Téléphone" value={form.telephone || ''} onChange={v => setForm({ ...form, telephone: v })} />
            <Input label="% commission" type="number" value={form.pourcentage_commission ?? 10} onChange={v => setForm({ ...form, pourcentage_commission: Number(v) })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.actif} onChange={e => setForm({ ...form, actif: e.target.checked })} />
              Compte actif (peut se connecter)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.commissions_actives} onChange={e => setForm({ ...form, commissions_actives: e.target.checked })} />
              Commissions actives (futures commissions générées)
            </label>
            <button onClick={modifier} disabled={submitting} className="w-full py-2 bg-primary text-white rounded-lg font-semibold disabled:opacity-50">
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </Modal>
      )}

      {modal?.type === 'code_campagne' && (
        <Modal titre="Nouveau code campagne" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Input label="Nom de la campagne (optionnel)" value={form.nom_campagne || ''} onChange={v => setForm({ ...form, nom_campagne: v })} />
            <Input label="% override (vide = % du compte)" type="number" value={form.pourcentage_override ?? ''} onChange={v => setForm({ ...form, pourcentage_override: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Bonus mois filleul" type="number" value={form.mois_filleul ?? 0} onChange={v => setForm({ ...form, mois_filleul: Number(v) })} />
              <Input label="Réduction filleul %" type="number" value={form.reduction_filleul_pct ?? 0} onChange={v => setForm({ ...form, reduction_filleul_pct: Number(v) })} />
            </div>
            <Input label="Validité (jours, vide = illimité)" type="number" value={form.validite_jours ?? ''} onChange={v => setForm({ ...form, validite_jours: v })} />
            <button onClick={creerCodeCampagne} disabled={submitting} className="w-full py-2 bg-primary text-white rounded-lg font-semibold disabled:opacity-50">
              {submitting ? 'Création…' : 'Créer le code'}
            </button>
            <p className="text-xs text-gray-500 italic">Le code généré sera de la forme CAMP-XXXXXXXX et envoyé par email au partenaire.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ titre, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">{titre}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}
