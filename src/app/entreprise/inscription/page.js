'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useT } from '@/lib/i18n/LangProvider';

export default function EntrepriseInscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-accent" />}>
      <EntrepriseInscription />
    </Suspense>
  );
}

function EntrepriseInscription() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refFromUrl = searchParams?.get('ref') || '';
  const [form, setForm] = useState({
    email: '', mot_de_passe: '', confirmer_mdp: '', nom_contact: '',
    code_parrainage: refFromUrl.toUpperCase(),
  });
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [codeCheck, setCodeCheck] = useState(null); // { valid, parrain_nom?, raison? } | null

  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (auth) router.push('/entreprise/dashboard');
  }, [router]);

  // Vérification live du code de parrainage (debounced)
  useEffect(() => {
    const code = (form.code_parrainage || '').trim();
    if (!code) { setCodeCheck(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/parrainage/verifier-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const d = await res.json();
        setCodeCheck(d);
      } catch { setCodeCheck(null); }
    }, 400);
    return () => clearTimeout(t);
  }, [form.code_parrainage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    if (form.mot_de_passe !== form.confirmer_mdp) {
      setErreur(t('form.mdp_ne_correspondent'));
      return;
    }
    if (form.mot_de_passe.length < 8) {
      setErreur(t('form.mdp_min_8'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/entreprise/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          mot_de_passe: form.mot_de_passe,
          nom_contact: form.nom_contact,
          code_parrainage: (form.code_parrainage || '').trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErreur(data.error || t('form.erreur_inscription'));
        return;
      }

      setSucces(data.message || t('form.compte_cree'));

    } catch {
      setErreur(t('form.erreur_reseau'));
    } finally {
      setLoading(false);
    }
  };

  if (succes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            ✅
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('form.inscription_reussie')}</h2>
          <p className="text-gray-600 mb-6">{succes}</p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-left">
            <p className="text-sm font-semibold text-amber-800 mb-2">{t('form.prochaines_etapes')}</p>
            <ul className="text-sm text-amber-700 space-y-1.5">
              <li>{t('form.etape_1')}</li>
              <li>{t('form.etape_2')}</li>
              <li>{t('form.etape_3')}</li>
            </ul>
          </div>
          <Link href="/entreprise/connexion" className="btn-primary w-full block py-3 text-center font-semibold">
            {t('form.aller_connexion')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
              🏢
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t('form.creer_compte_titre')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('form.rejoindre_annuaire')}</p>
          </div>

          {erreur && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('form.nom_responsable')}
              </label>
              <input
                type="text"
                required
                placeholder={t('form.placeholder_nom_responsable')}
                className="input-field w-full"
                value={form.nom_contact}
                onChange={e => setForm({ ...form, nom_contact: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('form.email_pro')}
              </label>
              <input
                type="email"
                required
                placeholder={t('form.placeholder_email_pro')}
                className="input-field w-full"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('form.mot_de_passe_required')} <span className="text-xs text-gray-400">{t('form.min_8_car')}</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('form.password_placeholder')}
                  className="input-field w-full pr-10"
                  value={form.mot_de_passe}
                  onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('form.confirmer_mdp_required')}
              </label>
              <input
                type="password"
                required
                placeholder={t('form.password_placeholder')}
                className="input-field w-full"
                value={form.confirmer_mdp}
                onChange={e => setForm({ ...form, confirmer_mdp: e.target.value })}
                disabled={loading}
              />
            </div>

            {/* Code de parrainage (optionnel) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Code de parrainage <span className="text-xs text-gray-400">(optionnel)</span>
              </label>
              <input
                type="text"
                placeholder="ABCD1234"
                className="input-field w-full uppercase tracking-widest font-mono"
                value={form.code_parrainage}
                onChange={e => setForm({ ...form, code_parrainage: e.target.value.toUpperCase().replace(/\s/g, '') })}
                disabled={loading}
                maxLength={16}
              />
              {form.code_parrainage && codeCheck && (
                <p className={`text-xs mt-1 ${codeCheck.valid ? 'text-green-700' : 'text-red-600'}`}>
                  {codeCheck.valid
                    ? `✓ Code valide — parrainé par ${codeCheck.parrain_nom}. +1 mois offert dès votre premier abonnement payé.`
                    : `✗ ${codeCheck.raison || 'Code invalide'}`}
                </p>
              )}
            </div>

            {/* Info contacts par défaut */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-700">
                {t('form.info_coordonnees')}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('form.inscription_en_cours')}
                </span>
              ) : t('form.creer_mon_compte')}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-600">
              {t('form.deja_compte')}{' '}
              <Link href="/entreprise/connexion" className="text-primary font-semibold hover:underline">
                {t('form.se_connecter')}
              </Link>
            </p>
          </div>
        </div>
        <p className="text-center mt-4">
          <Link href="/" className="text-white/80 hover:text-white text-sm">
            {t('form.retour_site')}
          </Link>
        </p>
      </div>
    </div>
  );
}
