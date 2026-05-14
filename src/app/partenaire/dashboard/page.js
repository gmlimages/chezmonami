'use client';
// Dashboard partenaire — vue d'ensemble
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PartenaireLayout, { getPartenaireToken } from '../PartenaireLayout';
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter';
import { useT } from '@/lib/i18n/LangProvider';

export default function PartenaireDashboard() {
  const { t } = useT();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userCurrency, convertPrice } = useCurrencyConverter();

  useEffect(() => {
    (async () => {
      const token = getPartenaireToken();
      if (!token) { setLoading(false); return; }
      const r = await fetch('/api/partenaire/me', { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setData(await r.json());
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <PartenaireLayout titre={t('partenaire.menu_tableau_bord')}>
        <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      </PartenaireLayout>
    );
  }

  if (!data) {
    return (
      <PartenaireLayout titre={t('partenaire.menu_tableau_bord')}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-semibold mb-2">Impossible de charger vos données.</p>
          <p className="text-sm text-red-600 mb-4">Veuillez vous reconnecter ou réessayer plus tard.</p>
          <button onClick={() => { localStorage.removeItem('partenaireAuth'); localStorage.removeItem('partenaireSessionStart'); window.location.href = '/entreprise/connexion'; }} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">Se reconnecter</button>
        </div>
      </PartenaireLayout>
    );
  }

  const { partenaire, codes, filleuls, totaux } = data;
  const codePermanent = codes.find(c => c.type === 'permanent');
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const filleulsPayants = filleuls.filter(f => ['mensuel', 'trimestriel', 'semestriel', 'annuel'].includes(f.abonnement));

  const formatAmount = (mad) => {
    const v = convertPrice ? convertPrice(Number(mad) || 0, 'MAD') : Number(mad) || 0;
    return `${v.toFixed(2)} ${userCurrency || 'MAD'}`;
  };

  return (
    <PartenaireLayout titre={t('partenaire.bonjour_nom').replace('{{nom}}', partenaire.nom_complet)} sousTitre={t('partenaire.sous_titre_dashboard')}>
      <div className="space-y-6">
        {!partenaire.commissions_actives && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
            ⚠️ {t('partenaire.alerte_commissions_coupees')}
          </div>
        )}

        {codePermanent && (
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">{t('partenaire.votre_code_permanent')}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono font-bold text-2xl tracking-wider text-gray-900">{codePermanent.code}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(codePermanent.code); }}
                className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-semibold hover:bg-gray-50"
              >📋 {t('partenaire.copier')}</button>
              <button
                onClick={() => { navigator.clipboard.writeText(`${siteUrl}/entreprise/inscription?part=${codePermanent.code}`); }}
                className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
              >🔗 {t('partenaire.copier_lien_inscription')}</button>
            </div>
            <p className="text-xs text-gray-600 mt-2">{t('partenaire.commission_taux').replace('{{p}}', partenaire.pourcentage_commission)}</p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label={t('partenaire.stat_filleuls_inscrits')} value={filleuls.length} icon="👥" color="primary" />
          <Stat label={t('partenaire.stat_paiement_actif')} value={filleulsPayants.length} icon="✅" color="green" />
          <Stat label={t('partenaire.stat_a_recevoir')} value={formatAmount(totaux.a_payer)} icon="⏳" color="amber" />
          <Stat label={t('partenaire.stat_total_recu')} value={formatAmount(totaux.recue)} icon="💰" color="green" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/partenaire/dashboard/codes" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary/30 hover:shadow-sm transition">
            <p className="text-2xl mb-1">🎟️</p>
            <p className="font-semibold text-gray-800 text-sm">{t('partenaire.card_mes_codes_titre').replace('{{n}}', codes.length)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('partenaire.card_mes_codes_desc')}</p>
          </Link>
          <Link href="/partenaire/dashboard/filleuls" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary/30 hover:shadow-sm transition">
            <p className="text-2xl mb-1">👥</p>
            <p className="font-semibold text-gray-800 text-sm">{t('partenaire.card_mes_filleuls_titre').replace('{{n}}', filleuls.length)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('partenaire.card_mes_filleuls_desc')}</p>
          </Link>
          <Link href="/partenaire/dashboard/commissions" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary/30 hover:shadow-sm transition">
            <p className="text-2xl mb-1">💰</p>
            <p className="font-semibold text-gray-800 text-sm">{t('partenaire.card_mes_commissions_titre')}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('partenaire.card_mes_commissions_desc')}</p>
          </Link>
        </div>
      </div>
    </PartenaireLayout>
  );
}

function Stat({ label, value, icon, color }) {
  const colorMap = { primary: 'text-primary', green: 'text-green-600', amber: 'text-amber-600' };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-lg sm:text-xl font-bold ${colorMap[color]}`}>{value}</span>
      </div>
      <p className="text-xs text-gray-600 font-medium">{label}</p>
    </div>
  );
}
