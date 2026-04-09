'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EntrepriseInscription() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', mot_de_passe: '', confirmer_mdp: '', nom_contact: '' });
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (auth) router.push('/entreprise/dashboard');
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');

    if (form.mot_de_passe !== form.confirmer_mdp) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.mot_de_passe.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères');
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErreur(data.error || "Erreur lors de l'inscription");
        return;
      }

      setSucces(data.message || 'Compte créé avec succès !');

    } catch {
      setErreur('Erreur réseau. Vérifiez votre connexion.');
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
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Inscription réussie !</h2>
          <p className="text-gray-600 mb-6">{succes}</p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-left">
            <p className="text-sm font-semibold text-amber-800 mb-2">📋 Prochaines étapes</p>
            <ul className="text-sm text-amber-700 space-y-1.5">
              <li>1. L&apos;équipe ChezMonAmi examine votre dossier</li>
              <li>2. Vous recevrez un email de confirmation</li>
              <li>3. Une fois validé, accédez à votre espace</li>
            </ul>
          </div>
          <Link href="/entreprise/connexion" className="btn-primary w-full block py-3 text-center font-semibold">
            Aller à la connexion
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
            <h1 className="text-2xl font-bold text-gray-800">Créer un compte</h1>
            <p className="text-gray-500 text-sm mt-1">Rejoignez l&apos;annuaire ChezMonAmi</p>
          </div>

          {erreur && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom du responsable *
              </label>
              <input
                type="text"
                required
                placeholder="Jean Dupont"
                className="input-field w-full"
                value={form.nom_contact}
                onChange={e => setForm({ ...form, nom_contact: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email professionnel *
              </label>
              <input
                type="email"
                required
                placeholder="contact@monentreprise.com"
                className="input-field w-full"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe * <span className="text-xs text-gray-400">(min. 8 caractères)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
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
                Confirmer le mot de passe *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input-field w-full"
                value={form.confirmer_mdp}
                onChange={e => setForm({ ...form, confirmer_mdp: e.target.value })}
                disabled={loading}
              />
            </div>

            {/* Info contacts par défaut */}
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-700">
                ℹ️ Les coordonnées de contact (téléphone, email) seront automatiquement renseignées avec celles de la coordination ChezMonAmi. L&apos;administrateur peut les personnaliser pour votre entreprise.
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
                  Inscription...
                </span>
              ) : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link href="/entreprise/connexion" className="text-primary font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
        <p className="text-center mt-4">
          <Link href="/" className="text-white/80 hover:text-white text-sm">
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}
