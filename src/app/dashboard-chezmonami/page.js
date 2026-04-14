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
