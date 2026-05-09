'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReinitialiserPage() {
  const { token } = useParams();
  const router = useRouter();
  const [mdp, setMdp] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statut, setStatut] = useState('idle'); // idle | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (mdp.length < 8) {
      setStatut('error');
      setMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (mdp !== confirm) {
      setStatut('error');
      setMessage('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/entreprise/reinitialiser-mot-de-passe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, mot_de_passe: mdp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatut('error');
        setMessage(data.error || 'Erreur lors de la réinitialisation');
      } else {
        setStatut('success');
        setMessage(data.message);
        setTimeout(() => router.push('/entreprise/connexion'), 2500);
      }
    } catch {
      setStatut('error');
      setMessage('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
              🔑
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Nouveau mot de passe</h1>
            <p className="text-gray-500 text-sm mt-2">
              Choisissez un mot de passe d'au moins 8 caractères.
            </p>
          </div>

          {statut === 'success' ? (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg text-sm text-center">
              ✅ {message}
              <p className="mt-2 text-xs">Redirection vers la connexion…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {statut === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {message}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="input-field w-full pr-10"
                    value={mdp}
                    onChange={(e) => setMdp(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
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
                  Confirmer le mot de passe
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="input-field w-full"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 py-3 text-base font-semibold"
              >
                {loading ? 'Mise à jour…' : 'Réinitialiser'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <Link href="/entreprise/connexion" className="text-primary font-semibold hover:underline">
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
