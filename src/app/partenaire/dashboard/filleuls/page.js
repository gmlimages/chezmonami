'use client';
// Dashboard partenaire — Mes filleuls
import { useEffect, useState } from 'react';
import PartenaireLayout, { getPartenaireToken } from '../../PartenaireLayout';
import { BoutonExportCSV } from '@/lib/csvExport';
import { useT } from '@/lib/i18n/LangProvider';

export default function MesFilleuls() {
  const { t } = useT();
  const [filleuls, setFilleuls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = getPartenaireToken();
      if (!token) { setLoading(false); return; }
      const r = await fetch('/api/partenaire/me', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setFilleuls((await r.json()).filleuls || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <PartenaireLayout titre={t('partenaire.filleuls_titre')}><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></PartenaireLayout>;
  }

  const statutAbo = (f) => {
    const payants = ['mensuel', 'trimestriel', 'semestriel', 'annuel'];
    if (!payants.includes(f.abonnement)) return { label: t('partenaire.abo_gratuit'), color: 'gray' };
    if (!f.date_fin_abonnement) return { label: f.abonnement, color: 'primary' };
    const exp = new Date(f.date_fin_abonnement) < new Date();
    if (exp) return { label: t('partenaire.abo_expire'), color: 'red' };
    return { label: f.abonnement, color: 'green' };
  };

  return (
    <PartenaireLayout titre={t('partenaire.filleuls_titre')} sousTitre={t('partenaire.filleuls_sous_titre').replace('{{n}}', filleuls.length)}>
      {filleuls.length > 0 && (
        <div className="flex justify-end mb-3">
          <BoutonExportCSV
            filename={`mes-filleuls-${new Date().toISOString().slice(0, 10)}.csv`}
            rows={filleuls}
            columns={[
              { key: 'structures.nom', label: t('partenaire.th_societe') },
              { key: 'nom_contact', label: t('partenaire.nom_complet_required').replace(' *', '') },
              { key: 'code_partenaire_utilise', label: t('partenaire.th_code_utilise') },
              { key: 'abonnement', label: t('partenaire.th_abonnement') },
              { key: 'date_paiement', label: t('partenaire.th_date_paiement'), format: (v) => v ? new Date(v).toLocaleDateString('fr-FR') : '' },
              { key: 'date_fin_abonnement', label: t('partenaire.th_date_fin'), format: (v) => v ? new Date(v).toLocaleDateString('fr-FR') : '' },
              { key: 'montant_paiement', label: 'MAD' },
            ]}
          />
        </div>
      )}
      {filleuls.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-5xl mb-3">👥</p>
          <p className="text-gray-700 font-semibold">{t('partenaire.filleuls_aucun_titre')}</p>
          <p className="text-sm text-gray-500 mt-1">{t('partenaire.filleuls_aucun_desc')}</p>
        </div>
      ) : (
        <>
        {/* Vue cartes mobile */}
        <div className="sm:hidden space-y-3">
          {filleuls.map(f => {
            const st = statutAbo(f);
            const colorClass = {
              gray: 'bg-gray-100 text-gray-600',
              primary: 'bg-primary/15 text-primary',
              green: 'bg-green-100 text-green-700',
              red: 'bg-red-100 text-red-700',
            }[st.color];
            return (
              <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-gray-800 text-sm">{f.structures?.nom || f.nom_contact}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize whitespace-nowrap ${colorClass}`}>{st.label}</span>
                </div>
                {f.code_partenaire_utilise && (
                  <p className="text-xs text-gray-500 font-mono">{f.code_partenaire_utilise}</p>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <p className="text-gray-400">{t('partenaire.label_paiement')}</p>
                    <p className="font-medium">{f.date_paiement ? new Date(f.date_paiement).toLocaleDateString('fr-FR') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">{t('partenaire.label_fin')}</p>
                    <p className="font-medium">{f.date_fin_abonnement ? new Date(f.date_fin_abonnement).toLocaleDateString('fr-FR') : '—'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Vue tableau desktop/tablette */}
        <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left py-2 px-3">{t('partenaire.th_societe')}</th>
                  <th className="text-left py-2 px-3">{t('partenaire.th_code_utilise')}</th>
                  <th className="text-left py-2 px-3">{t('partenaire.th_abonnement')}</th>
                  <th className="text-left py-2 px-3">{t('partenaire.th_date_paiement')}</th>
                  <th className="text-left py-2 px-3">{t('partenaire.th_date_fin')}</th>
                </tr>
              </thead>
              <tbody>
                {filleuls.map(f => {
                  const st = statutAbo(f);
                  const colorClass = {
                    gray: 'bg-gray-100 text-gray-600',
                    primary: 'bg-primary/15 text-primary',
                    green: 'bg-green-100 text-green-700',
                    red: 'bg-red-100 text-red-700',
                  }[st.color];
                  return (
                    <tr key={f.id} className="border-t border-gray-100">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-gray-800">{f.structures?.nom || f.nom_contact}</p>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">{f.code_partenaire_utilise || '—'}</td>
                      <td className="py-3 px-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${colorClass}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs">{f.date_paiement ? new Date(f.date_paiement).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="py-3 px-3 text-xs">{f.date_fin_abonnement ? new Date(f.date_fin_abonnement).toLocaleDateString('fr-FR') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </PartenaireLayout>
  );
}
