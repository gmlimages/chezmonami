'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginSecure() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', motDePasse: '' });
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);
  const [bloque, setBloque] = useState(false);
  const [tempsRestant, setTempsRestant] = useState(0);
  // Flow 2FA
  const [challenge, setChallenge] = useState(null);
  const [code2fa, setCode2fa] = useState('');

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth) router.push('/admin/dashboard');
  }, [router]);

  useEffect(() => {
    if (tempsRestant > 0) {
      const timer = setTimeout(() => setTempsRestant(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (bloque && tempsRestant === 0) {
      setBloque(false);
      setErreur('');
    }
  }, [tempsRestant, bloque]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErreur('');
    setLoading(true);

    try {
      // Appel vers l'API serveur — le mot de passe ne transite jamais en clair côté client
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, mot_de_passe: formData.motDePasse }),
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

      // Étape 2FA — un code a été envoyé par email, on attend la saisie
      if (data.tfa_required) {
        setChallenge(data.challenge);
        return;
      }

      // Stocker le token + infos non-sensibles
      localStorage.setItem('adminAuth', JSON.stringify({
        id: data.admin.id,
        nom: data.admin.nom,
        email: data.admin.email,
        role: data.admin.role,
        sessionToken: data.token,
      }));
      localStorage.setItem('adminSessionStart', Date.now().toString());
      localStorage.setItem('adminLastActivity', Date.now().toString());

      if (data.admin.doit_changer_mdp) {
        router.push('/admin/changer-mot-de-passe');
      } else {
        router.push('/admin/dashboard');
      }

    } catch {
      setErreur('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setErreur('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge, code: code2fa.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || 'Code incorrect');
        return;
      }
      localStorage.setItem('adminAuth', JSON.stringify({
        id: data.admin.id,
        nom: data.admin.nom,
        email: data.admin.email,
        role: data.admin.role,
        sessionToken: data.token,
      }));
      localStorage.setItem('adminSessionStart', Date.now().toString());
      localStorage.setItem('adminLastActivity', Date.now().toString());

      if (data.admin.doit_changer_mdp) router.push('/admin/changer-mot-de-passe');
      else router.push('/admin/dashboard');
    } catch {
      setErreur('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            🔒
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Chez Mon Ami</p>
        </div>

        {challenge ? (
          <form onSubmit={handleVerify2FA} className="space-y-5">
            {erreur && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {erreur}
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              📧 Un code à 6 chiffres a été envoyé à votre adresse email. Il expire dans 10 minutes.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code de vérification</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                placeholder="000000"
                className="input-field tracking-[0.4em] text-center text-2xl font-mono"
                value={code2fa}
                onChange={(e) => setCode2fa(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                autoFocus
              />
            </div>
            <button type="submit" className="w-full btn-primary disabled:opacity-50" disabled={loading || code2fa.length !== 6}>
              {loading ? 'Vérification…' : 'Valider le code'}
            </button>
            <button
              type="button"
              onClick={() => { setChallenge(null); setCode2fa(''); setErreur(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
            >
              ← Recommencer la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
          {erreur && (
            <div className={`border px-4 py-3 rounded-lg text-sm ${
              bloque
                ? 'bg-orange-50 border-orange-200 text-orange-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {erreur}
              {bloque && tempsRestant > 0 && (
                <div className="mt-2 text-xs">
                  Déblocage dans : {Math.floor(tempsRestant / 60)}m {tempsRestant % 60}s
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              required
              placeholder="votre@email.com"
              className="input-field"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              disabled={loading || bloque}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="input-field"
              value={formData.motDePasse}
              onChange={e => setFormData({ ...formData, motDePasse: e.target.value })}
              disabled={loading || bloque}
            />
          </div>

          <button
            type="submit"
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || bloque}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 mb-2">🔐 Sécurité</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Maximum 5 tentatives de connexion</li>
            <li>• Blocage automatique pendant 15 minutes</li>
            <li>• Sessions expirées après 8 heures</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
