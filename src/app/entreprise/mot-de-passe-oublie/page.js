'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statut, setStatut] = useState('idle'); // idle | sent | inconnu | suspendu | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/entreprise/mot-de-passe-oublie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (data.code === 'EMAIL_ENVOYE') {
        setStatut('sent');
        setMessage(data.message);
      } else if (data.code === 'EMAIL_INCONNU') {
        setStatut('inconnu');
        setMessage(data.error);
      } else if (data.code === 'COMPTE_SUSPENDU') {
        setStatut('suspendu');
        setMessage(data.error);
      } else {
        setStatut('error');
        setMessage(data.error || 'Erreur lors de la demande');
      }
    } catch {
      setStatut('error');
      setMessage('Erreur réseau. Veuillez réessayer.');
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
              🔐
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Mot de passe oublié</h1>
            <p className="text-gray-500 text-sm mt-2">
              Saisissez votre email — nous vous enverrons un lien de réinitialisation.
            </p>
          </div>

          {/* ✅ Email envoyé */}
          {statut === 'sent' && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <span className="text-xl">✅</span>
                <div>
                  <p className="font-semibold mb-1">Email envoyé !</p>
                  <p>{message}</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Link
                  href="/entreprise/connexion"
                  className="text-primary font-semibold hover:underline text-sm"
                >
                  ← Retour à la connexion
                </Link>
              </div>
            </div>
          )}

          {/* ❌ Email inconnu — proposer création de compte */}
          {statut === 'inconnu' && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Aucun compte trouvé</p>
                  <p>{message}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                <Link
                  href="/entreprise/inscription"
                  className="btn-primary text-center text-sm py-2 px-4"
                >
                  🏢 Créer un compte
                </Link>
                <button
                  onClick={() => {
                    setStatut('idle');
                    setMessage('');
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-semibold"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* ⛔ Compte suspendu */}
          {statut === 'suspendu' && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <span className="text-xl">⛔</span>
                <div>
                  <p className="font-semibold mb-1">Compte suspendu</p>
                  <p>{message}</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Link
                  href="/contact"
                  className="text-primary font-semibold hover:underline text-sm"
                >
                  Contacter l'administration →
                </Link>
              </div>
            </div>
          )}

          {/* Formulaire (idle ou erreur) */}
          {(statut === 'idle' || statut === 'error') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {statut === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {message}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 py-3 text-base font-semibold"
              >
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </button>
            </form>
          )}

          {statut !== 'sent' && (
            <div className="mt-6 text-center text-sm">
              <Link href="/entreprise/connexion" className="text-primary font-semibold hover:underline">
                ← Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
