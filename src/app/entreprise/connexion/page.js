'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EntrepriseConnexion() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', mot_de_passe: '' });
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);
  const [bloque, setBloque] = useState(false);
  const [tempsRestant, setTempsRestant] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (auth) router.push('/entreprise/dashboard');
  }, [router]);

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
        setErreur(data.error || 'Erreur de connexion');
        return;
      }

      // Stocker session
      localStorage.setItem('entrepriseAuth', JSON.stringify({
        token: data.token,
        compte: data.compte,
      }));
      localStorage.setItem('entrepriseSessionStart', Date.now().toString());

      router.push('/entreprise/dashboard');

    } catch {
      setErreur('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-gray-800">Espace Entreprise</h1>
            <p className="text-gray-500 text-sm mt-1">Connectez-vous à votre compte</p>
          </div>

          {/* Formulaire */}
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
                    Déblocage dans : {Math.floor(tempsRestant / 60)}m {tempsRestant % 60}s
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                required
                placeholder="entreprise@exemple.com"
                className="input-field w-full"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={loading || bloque}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
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

            <button
              type="submit"
              disabled={loading || bloque}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 text-base font-semibold mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : 'Se connecter'}
            </button>
          </form>

          {/* Lien inscription */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <Link href="/entreprise/inscription" className="text-primary font-semibold hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>

          {/* Info sécurité */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Maximum 5 tentatives avant blocage temporaire</li>
              <li>• Session active pendant 8 heures</li>
              <li>• Connexion sécurisée et chiffrée</li>
            </ul>
          </div>
        </div>

        {/* Retour site */}
        <p className="text-center mt-4">
          <Link href="/" className="text-white/80 hover:text-white text-sm transition">
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}
