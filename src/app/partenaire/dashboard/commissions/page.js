'use client';
// Dashboard partenaire — Mes commissions
import { useEffect, useState } from 'react';
import PartenaireLayout, { getPartenaireToken } from '../../PartenaireLayout';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { toast } from '@/lib/toast';
import { useT } from '@/lib/i18n/LangProvider';

export default function MesCommissions() {
  const { t } = useT();
  const [commissions, setCommissions] = useState([]);
  const [totaux, setTotaux] = useState({ a_payer: 0, en_paiement: 0, a_confirmer: 0, recue: 0, contestee: 0 });
  const [loading, setLoading] = useState(true);
  const [statut, setStatut] = useState('tous');
  const [submitting, setSubmitting] = useState(false);
  const [motifModal, setMotifModal] = useState(null);
  const [motif, setMotif] = useState('');
  const { userCurrency, convertPrice } = useCurrencyConverter();

  const charger = async () => {
    const token = getPartenaireToken();
    if (!token) { setLoading(false); return; }
    const r = await fetch('/api/partenaire/me', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) {
      const d = await r.json();
      setCommissions(d.commissions || []);
      setTotaux(d.totaux || { a_payer: 0, en_paiement: 0, a_confirmer: 0, recue: 0, contestee: 0 });
    }
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const confirmer = async (c) => {
    if (!confirm(t('partenaire.confirmer_reception_q').replace('{{amount}}', formatAmount(c.montant_commission_mad)))) return;
    setSubmitting(true);
    const r = await fetch(`/api/partenaire/commissions/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getPartenaireToken()}` },
      body: JSON.stringify({ action: 'confirmer' }),
    });
    setSubmitting(false);
    if (r.ok) { toast.success(t('partenaire.reception_confirmee')); charger(); }
    else toast.error(t('partenaire.erreur'));
  };

  const ouvrirContestation = (c) => { setMotifModal(c); setMotif(''); };

  const envoyerContestation = async () => {
    if (!motif.trim()) return toast.error(t('partenaire.motif_obligatoire'));
    setSubmitting(true);
    const r = await fetch(`/api/partenaire/commissions/${motifModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getPartenaireToken()}` },
      body: JSON.stringify({ action: 'contester', motif_contestation: motif }),
    });
    setSubmitting(false);
    if (r.ok) { toast.success(t('partenaire.contestation_enregistree')); setMotifModal(null); charger(); }
    else toast.error(t('partenaire.erreur'));
  };

  const formatAmount = (mad) => {
    const v = convertPrice ? convertPrice(Number(mad) || 0, 'MAD') : Number(mad) || 0;
    return `${v.toFixed(2)} ${userCurrency || 'MAD'}`;
  };

  const filtrees = statut === 'tous' ? commissions : commissions.filter(c => c.statut === statut);

  if (loading) {
    return <PartenaireLayout titre={t('partenaire.commissions_titre')}><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></PartenaireLayout>;
  }

  return (
    <PartenaireLayout titre={t('partenaire.commissions_titre')} sousTitre={t('partenaire.commissions_sous_titre')}>
      <div className="space-y-4">
        {/* Totaux */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatBox label={t('partenaire.stat_a_recevoir')} value={formatAmount(totaux.a_payer)} color="amber" />
          <StatBox label={t('partenaire.stat_en_paiement')} value={formatAmount(totaux.en_paiement)} color="blue" />
          <StatBox label={t('partenaire.stat_a_confirmer')} value={formatAmount(totaux.a_confirmer)} color="orange" />
          <StatBox label={t('partenaire.stat_recues')} value={formatAmount(totaux.recue)} color="green" />
          <StatBox label={t('partenaire.stat_contestees')} value={formatAmount(totaux.contestee)} color="red" />
        </div>

        {totaux.a_confirmer > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-900">
            ⏰ {t('partenaire.alerte_a_confirmer')}
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'tous', label: t('partenaire.filtre_toutes') },
            { key: 'a_payer', label: t('partenaire.filtre_a_recevoir') },
            { key: 'en_paiement', label: t('partenaire.filtre_en_paiement') },
            { key: 'payee_admin', label: t('partenaire.filtre_a_confirmer') },
            { key: 'validee', label: t('partenaire.filtre_validees') },
            { key: 'contestee', label: t('partenaire.filtre_contestees') },
            { key: 'annulee', label: t('partenaire.filtre_annulees') },
          ].map(s => (
            <button key={s.key} onClick={() => setStatut(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statut === s.key ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtrees.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-12">{t('partenaire.aucune_commission')}</p>
        ) : (
        <>
          {/* Vue cartes mobile */}
          <div className="sm:hidden space-y-3">
            {filtrees.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{c.filleul?.structures?.nom || c.filleul?.nom_contact}</p>
                    <p className="text-xs text-gray-500">{new Date(c.date_paiement_filleul).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <StatutBadge c={c} t={t} />
                </div>
                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                  <span className="font-mono text-gray-500">{c.code?.code || '—'}</span>
                  <span className="capitalize">{c.abonnement_type} • {c.pourcentage_applique}%</span>
                </div>
                <p className="font-bold text-base text-gray-800">{formatAmount(c.montant_commission_mad)}</p>
                {c.justificatif_url && <a href={c.justificatif_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{t('partenaire.justificatif')}</a>}
                {c.statut === 'payee_admin' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => confirmer(c)} disabled={submitting} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">{t('partenaire.btn_j_ai_recu')}</button>
                    <button onClick={() => ouvrirContestation(c)} disabled={submitting} className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold disabled:opacity-50">{t('partenaire.btn_non_recu')}</button>
                  </div>
                )}
                {c.statut === 'contestee' && c.motif_contestation && (
                  <p className="text-xs text-red-600 mt-2 italic">{t('partenaire.motif_label')} : « {c.motif_contestation} »</p>
                )}
              </div>
            ))}
          </div>

          <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="text-left py-2 px-3">{t('partenaire.th_date')}</th>
                    <th className="text-left py-2 px-3">{t('partenaire.th_filleul')}</th>
                    <th className="text-left py-2 px-3">{t('partenaire.th_code')}</th>
                    <th className="text-left py-2 px-3">{t('partenaire.th_abonnement')}</th>
                    <th className="text-left py-2 px-3">{t('partenaire.th_pct')}</th>
                    <th className="text-left py-2 px-3">{t('partenaire.th_commission')}</th>
                    <th className="text-left py-2 px-3">{t('partenaire.th_statut')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrees.map(c => (
                    <tr key={c.id} className="border-t border-gray-100">
                      <td className="py-2 px-3 text-xs">{new Date(c.date_paiement_filleul).toLocaleDateString('fr-FR')}</td>
                      <td className="py-2 px-3">{c.filleul?.structures?.nom || c.filleul?.nom_contact}</td>
                      <td className="py-2 px-3 font-mono text-xs">{c.code?.code || '—'}</td>
                      <td className="py-2 px-3 capitalize text-xs">{c.abonnement_type}</td>
                      <td className="py-2 px-3">{c.pourcentage_applique}%</td>
                      <td className="py-2 px-3 font-bold">{formatAmount(c.montant_commission_mad)}</td>
                      <td className="py-2 px-3">
                        <StatutBadge c={c} t={t} />
                        {c.justificatif_url && <a href={c.justificatif_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline ml-2">{t('partenaire.justificatif')}</a>}
                        {c.statut === 'payee_admin' && (
                          <div className="flex gap-1 mt-2">
                            <button onClick={() => confirmer(c)} disabled={submitting} className="text-xs px-2 py-1 bg-green-600 text-white rounded font-semibold disabled:opacity-50">{t('partenaire.btn_j_ai_recu')}</button>
                            <button onClick={() => ouvrirContestation(c)} disabled={submitting} className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded font-semibold disabled:opacity-50">{t('partenaire.btn_non_recu')}</button>
                          </div>
                        )}
                        {c.statut === 'contestee' && c.motif_contestation && (
                          <p className="text-xs text-red-600 mt-1 italic">« {c.motif_contestation} »</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
        )}

        <p className="text-xs text-gray-500 italic">{t('partenaire.footer_note_devise')}</p>
      </div>

      {/* Modal contestation */}
      {motifModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">{t('partenaire.contestation_titre')}</h3>
            <p className="text-sm text-gray-600 mb-3">
              {t('partenaire.contestation_intro')
                .replace('{{amount}}', formatAmount(motifModal.montant_commission_mad))
                .replace('{{filleul}}', motifModal.filleul?.structures?.nom || motifModal.filleul?.nom_contact)}
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('partenaire.motif_label')} <span className="text-red-500">*</span></label>
            <textarea
              rows={4}
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder={t('partenaire.motif_placeholder')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3"
            />
            <p className="text-xs text-gray-500 mb-4">{t('partenaire.contestation_note')}</p>
            <div className="flex gap-2">
              <button onClick={() => setMotifModal(null)} disabled={submitting} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm">{t('partenaire.annuler')}</button>
              <button onClick={envoyerContestation} disabled={submitting || !motif.trim()} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
                {submitting ? t('partenaire.envoi_en_cours') : t('partenaire.envoyer_contestation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PartenaireLayout>
  );
}

function StatBox({ label, value, color }) {
  const map = {
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className={`border rounded-xl p-3 text-center ${map[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-base sm:text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

function StatutBadge({ c, t }) {
  const map = {
    a_payer: { label: t('partenaire.statut_a_recevoir'), cls: 'bg-amber-100 text-amber-800' },
    en_paiement: { label: t('partenaire.statut_en_paiement'), cls: 'bg-blue-100 text-blue-800' },
    payee_admin: { label: t('partenaire.statut_a_confirmer'), cls: 'bg-orange-100 text-orange-800' },
    validee: { label: c.validation_auto ? t('partenaire.statut_validee_auto') : t('partenaire.statut_validee'), cls: 'bg-green-100 text-green-800' },
    contestee: { label: t('partenaire.statut_contestee'), cls: 'bg-red-100 text-red-800' },
    annulee: { label: t('partenaire.statut_annulee'), cls: 'bg-gray-100 text-gray-600' },
  };
  const info = map[c.statut] || map.annulee;
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${info.cls}`}>{info.label}</span>;
}
