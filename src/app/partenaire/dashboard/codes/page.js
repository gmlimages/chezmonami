'use client';
// Dashboard partenaire — Mes codes (permanent + campagnes)
import { useEffect, useState } from 'react';
import PartenaireLayout, { getPartenaireToken } from '../../PartenaireLayout';
import { toast } from '@/lib/toast';
import { useT } from '@/lib/i18n/LangProvider';

export default function MesCodes() {
  const { t } = useT();
  const [codes, setCodes] = useState([]);
  const [partenaire, setPartenaire] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = getPartenaireToken();
      if (!token) { setLoading(false); return; }
      const r = await fetch('/api/partenaire/me', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        setCodes(d.codes || []);
        setPartenaire(d.partenaire);
      }
      setLoading(false);
    })();
  }, []);

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const copier = (txt) => { navigator.clipboard?.writeText(txt); toast.success(t('partenaire.copie')); };

  if (loading) {
    return <PartenaireLayout titre={t('partenaire.codes_titre')}><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></PartenaireLayout>;
  }

  return (
    <PartenaireLayout titre={t('partenaire.codes_titre')} sousTitre={t('partenaire.codes_sous_titre')}>
      <div className="space-y-3">
        {codes.length === 0 && <p className="text-sm text-gray-500 italic text-center py-12">{t('partenaire.codes_aucun')}</p>}
        {codes.map(c => {
          const expire = c.date_expiration && new Date(c.date_expiration) < new Date();
          return (
            <div key={c.id} className={`border rounded-xl p-4 ${
              !c.actif ? 'border-gray-200 bg-gray-50' :
              c.type === 'permanent' ? 'border-primary/30 bg-primary/5' :
              expire ? 'border-amber-200 bg-amber-50' : 'border-amber-200 bg-amber-50/50'
            }`}>
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono font-bold text-xl tracking-wider text-gray-900">{c.code}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      c.type === 'permanent' ? 'bg-primary/20 text-primary' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {c.type === 'permanent' ? t('partenaire.badge_permanent') : t('partenaire.badge_campagne')}
                    </span>
                    {!c.actif && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">{t('partenaire.badge_inactif')}</span>}
                    {expire && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">{t('partenaire.badge_expire')}</span>}
                  </div>
                  {c.nom_campagne && <p className="text-sm text-gray-700">📌 {c.nom_campagne}</p>}
                  <div className="text-xs text-gray-600 mt-1 space-x-2">
                    <span>{t('partenaire.commission_label')} : <strong>{c.pourcentage_override != null ? c.pourcentage_override : partenaire.pourcentage_commission}%</strong></span>
                    {c.mois_filleul > 0 && <span>• {t('partenaire.bonus_filleul').replace('{{n}}', c.mois_filleul)}</span>}
                    {Number(c.reduction_filleul_pct) > 0 && <span>• {t('partenaire.reduction_filleul').replace('{{p}}', c.reduction_filleul_pct)}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {c.date_expiration ? t('partenaire.expire_le').replace('{{date}}', new Date(c.date_expiration).toLocaleDateString('fr-FR')) : t('partenaire.sans_expiration')}
                  </p>
                </div>
                {c.actif && !expire && (
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => copier(c.code)} className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-semibold hover:bg-gray-50">{t('partenaire.bouton_code')}</button>
                    <button onClick={() => copier(`${siteUrl}/entreprise/inscription?part=${c.code}`)} className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90">{t('partenaire.bouton_lien')}</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <p className="text-xs text-gray-500 italic mt-4">{t('partenaire.codes_note_admin')}</p>
      </div>
    </PartenaireLayout>
  );
}
