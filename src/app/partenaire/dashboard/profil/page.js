'use client';
// Dashboard partenaire — Mon profil + coordonnées paiement + changement mdp
import { useEffect, useState } from 'react';
import PartenaireLayout, { getPartenaireToken } from '../../PartenaireLayout';
import { toast } from '@/lib/toast';
import { useT } from '@/lib/i18n/LangProvider';

export default function ProfilPartenaire() {
  const { t } = useT();
  const [partenaire, setPartenaire] = useState(null);
  const [form, setForm] = useState({ nom_complet: '', telephone: '', coordonnees_paiement: {} });
  const [mdp, setMdp] = useState({ ancien_mdp: '', nouveau_mdp: '', confirmer_mdp: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = getPartenaireToken();
      if (!token) { setLoading(false); return; }
      const r = await fetch('/api/partenaire/me', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        setPartenaire(d.partenaire);
        setForm({
          nom_complet: d.partenaire.nom_complet || '',
          telephone: d.partenaire.telephone || '',
          coordonnees_paiement: d.partenaire.coordonnees_paiement || {},
        });
      }
      setLoading(false);
    })();
  }, []);

  const sauver = async () => {
    setSaving(true);
    const r = await fetch('/api/partenaire/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getPartenaireToken()}` },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (r.ok) toast.success(t('partenaire.profil_maj'));
    else toast.error(t('partenaire.erreur'));
  };

  const changerMdp = async () => {
    if (mdp.nouveau_mdp !== mdp.confirmer_mdp) return toast.error(t('partenaire.mdp_ne_correspondent'));
    if (mdp.nouveau_mdp.length < 8) return toast.error(t('partenaire.min_8_caracteres'));
    const r = await fetch('/api/partenaire/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getPartenaireToken()}` },
      body: JSON.stringify(mdp),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      toast.success(t('partenaire.mdp_modifie'));
      setMdp({ ancien_mdp: '', nouveau_mdp: '', confirmer_mdp: '' });
    } else toast.error(d.error || t('partenaire.erreur'));
  };

  if (loading) {
    return <PartenaireLayout titre={t('partenaire.profil_titre')}><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></PartenaireLayout>;
  }

  const coord = form.coordonnees_paiement || {};

  return (
    <PartenaireLayout titre={t('partenaire.profil_titre')} sousTitre={t('partenaire.profil_sous_titre')}>
      <div className="space-y-6 max-w-2xl">
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-800 mb-2">{t('partenaire.profil_infos')}</h2>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('partenaire.email_non_modifiable')}</label>
            <input value={partenaire.email} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('partenaire.nom_complet_required')}</label>
            <input value={form.nom_complet} onChange={e => setForm({ ...form, nom_complet: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('partenaire.telephone')}</label>
            <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-800 mb-2">{t('partenaire.coordonnees_paiement')}</h2>
          <p className="text-xs text-gray-500 mb-3">{t('partenaire.coordonnees_intro')}</p>
          <Champ label={t('partenaire.coord_methode')} value={coord.methode || ''} onChange={v => setForm({ ...form, coordonnees_paiement: { ...coord, methode: v } })} placeholder={t('partenaire.coord_methode_ph')} />
          <Champ label={t('partenaire.coord_numero')} value={coord.numero || ''} onChange={v => setForm({ ...form, coordonnees_paiement: { ...coord, numero: v } })} />
          <Champ label={t('partenaire.coord_banque')} value={coord.banque || ''} onChange={v => setForm({ ...form, coordonnees_paiement: { ...coord, banque: v } })} />
          <Champ label={t('partenaire.coord_beneficiaire')} value={coord.beneficiaire || ''} onChange={v => setForm({ ...form, coordonnees_paiement: { ...coord, beneficiaire: v } })} />
          <Champ label={t('partenaire.coord_agence')} value={coord.agence || ''} onChange={v => setForm({ ...form, coordonnees_paiement: { ...coord, agence: v } })} />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('partenaire.coord_notes')}</label>
            <textarea rows={3} value={coord.notes || ''} onChange={e => setForm({ ...form, coordonnees_paiement: { ...coord, notes: e.target.value } })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </section>

        <button onClick={sauver} disabled={saving} className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold disabled:opacity-50">
          {saving ? t('partenaire.enregistrement') : t('partenaire.btn_enregistrer_profil')}
        </button>

        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-lg font-bold text-gray-800 mb-2">{t('partenaire.changer_mdp')}</h2>
          <Champ label={t('partenaire.ancien_mdp')} type="password" value={mdp.ancien_mdp} onChange={v => setMdp({ ...mdp, ancien_mdp: v })} />
          <Champ label={t('partenaire.nouveau_mdp')} type="password" value={mdp.nouveau_mdp} onChange={v => setMdp({ ...mdp, nouveau_mdp: v })} />
          <Champ label={t('partenaire.confirmer_mdp')} type="password" value={mdp.confirmer_mdp} onChange={v => setMdp({ ...mdp, confirmer_mdp: v })} />
          <button onClick={changerMdp} className="w-full py-2 bg-gray-700 text-white rounded-lg font-semibold">{t('partenaire.btn_modifier_mdp')}</button>
        </section>
      </div>
    </PartenaireLayout>
  );
}

function Champ({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:outline-none"
      />
    </div>
  );
}
