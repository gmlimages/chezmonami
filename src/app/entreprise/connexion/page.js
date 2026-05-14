'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useT } from '@/lib/i18n/LangProvider';

// Sécurise un retour : doit commencer par "/" (chemin interne) et pas "//" (protocol-relative)
function sanitizeRetour(r) {
  if (!r || typeof r !== 'string') return null;
  if (!r.startsWith('/') || r.startsWith('//')) return null;
  return r;
}

export default function EntrepriseConnexionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-accent" />}>
      <EntrepriseConnexion />
    </Suspense>
  );
}

function EntrepriseConnexion() {
  const { t } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const retour = sanitizeRetour(searchParams?.get('retour'));
  const cible = retour || '/entreprise/dashboard';
  const expired = searchParams?.get('expired') === '1';
  const [form, setForm] = useState({ email: '', mot_de_passe: '' });
  const [erreur, setErreur] = useState(expired ? 'Votre session a expiré. Veuillez vous reconnecter.' : '');
  const [loading, setLoading] = useState(false);
  const [bloque, setBloque] = useState(false);
  const [tempsRestant, setTempsRestant] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // 2FA
  const [challenge, setChallenge] = useState(null);
  const [code2fa, setCode2fa] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const authPart = localStorage.getItem('partenaireAuth');
    if (authPart) { router.push('/partenaire/dashboard'); return; }
    const auth = localStorage.getItem('entrepriseAuth');
    if (auth) router.push(cible);
  }, [router, cible]);

  useEffect(() => {
    if (tempsRestant > 0) {
      const t = setTimeout(() => setTempsRestant(s => s - 1), 1000);
      return () => clearTimeout(t);
    } else if (bloque && tempsRestant === 0) {
      setBloque(false);
      setErreur('');
    }
  }, [tempsRestant, bloque]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    setLoading(true);

    try {
      const res = await fetch('/api/entreprise/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.bloque && data.secondes) {
          setBloque(true);
          setTempsRestant(data.secondes);
        }
        setErreur(data.error || t('form.erreur_connexion'));
        return;
      }

      // Si 2FA requis, on bascule sur l'écran de saisie du code
      if (data.tfa_required && data.challenge) {
        setChallenge(data.challenge);
        setLoading(false);
        return;
      }

      // Stocker session — routage selon le rôle
      if (data.role === 'partenaire') {
        localStorage.setItem('partenaireAuth', JSON.stringify({
          token: data.token,
          compte: data.compte,
        }));
        localStorage.setItem('partenaireSessionStart', Date.now().toString());
        router.push('/partenaire/dashboard');
      } else {
        localStorage.setItem('entrepriseAuth', JSON.stringify({
          token: data.token,
          compte: data.compte,
        }));
        localStorage.setItem('entrepriseSessionStart', Date.now().toString());
        router.push(cible);
      }

    } catch {
      setErreur(t('form.erreur_reseau'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setErreur('');
    setVerifying(true);
    try {
      const res = await fetch('/api/entreprise/connexion/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, code: code2fa }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || 'Code incorrect');
        return;
      }
      localStorage.setItem('entrepriseAuth', JSON.stringify({
        token: data.token,
        compte: data.compte,
      }));
      localStorage.setItem('entrepriseSessionStart', Date.now().toString());
      router.push(cible);
    } catch {
      setErreur(t('form.erreur_reseau'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
              🏢
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t('form.espace_entreprise')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('form.connectez_vous')}</p>
          </div>

          {/* Écran 2FA */}
          {challenge ? (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              {erreur && (
                <div className="px-4 py-3 rounded-lg text-sm border bg-red-50 border-red-200 text-red-700">
                  {erreur}
                </div>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                📧 Un code à 6 chiffres vient d'être envoyé sur votre adresse email. Il expire dans 10 minutes.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Code de vérification
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  placeholder="123456"
                  className="input-field w-full text-center text-2xl tracking-widest font-mono"
                  value={code2fa}
                  onChange={e => setCode2fa(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={verifying || code2fa.length !== 6}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 text-base font-semibold"
              >
                {verifying ? 'Vérification…' : 'Valider le code'}
              </button>
              <button
                type="button"
                onClick={() => { setChallenge(null); setCode2fa(''); setErreur(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
              >
                ← Annuler et revenir à la connexion
              </button>
            </form>
          ) : (
          /* Formulaire */
          <form onSubmit={handleSubmit} className="space-y-4">
            {erreur && (
              <div className={`px-4 py-3 rounded-lg text-sm border ${
                bloque
                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {erreur}
                {bloque && tempsRestant > 0 && (
                  <p className="mt-1 text-xs font-mono">
                    {t('form.deblocage_dans')} {Math.floor(tempsRestant / 60)}m {tempsRestant % 60}s
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('form.email')}
              </label>
              <input
                type="email"
                required
                placeholder={t('form.placeholder_email')}
                className="input-field w-full"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={loading || bloque}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('form.mot_de_passe')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('form.password_placeholder')}
                  className="input-field w-full pr-10"
                  value={form.mot_de_passe}
                  onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
                  disabled={loading || bloque}
                  autoComplete="current-password"
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

            <div className="text-right">
              <Link
                href="/entreprise/mot-de-passe-oublie"
                className="text-xs text-primary hover:underline font-medium"
              >
                {t('form.mot_de_passe_oublie')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || bloque}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 text-base font-semibold mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('form.connexion_en_cours')}
                </span>
              ) : t('form.se_connecter')}
            </button>
          </form>
          )}

          {/* Lien inscription */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('form.pas_de_compte')}{' '}
              <Link href="/entreprise/inscription" className="text-primary font-semibold hover:underline">
                {t('form.creer_compte')}
              </Link>
            </p>
          </div>

          {/* Info sécurité */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <ul className="text-xs text-blue-700 space-y-1">
              <li>{t('form.info_max_tentatives')}</li>
              <li>{t('form.info_session_8h')}</li>
              <li>{t('form.info_securisee')}</li>
            </ul>
          </div>
        </div>

        {/* Retour site */}
        <p className="text-center mt-4">
          <Link href="/" className="text-white/80 hover:text-white text-sm transition">
            {t('form.retour_site')}
          </Link>
        </p>
      </div>
    </div>
  );
}
