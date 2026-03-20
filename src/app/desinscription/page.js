'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function DesinscriptionContenu() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam ? decodeURIComponent(emailParam) : '');
  const [statut, setStatut] = useState('idle'); // 'idle' | 'loading' | 'success' | 'already' | 'error' | 'not_found'

  const handleDesinscription = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return;

    setStatut('loading');

    const { data: abonne, error } = await supabase
      .from('newsletter_abonnes')
      .select('id, actif')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error) { setStatut('error'); return; }
    if (!abonne) { setStatut('not_found'); return; }
    if (!abonne.actif) { setStatut('already'); return; }

    const { error: updateError } = await supabase
      .from('newsletter_abonnes')
      .update({ actif: false })
      .eq('id', abonne.id);

    setStatut(updateError ? 'error' : 'success');
  };

  // Désinscription automatique si email fourni dans l'URL
  useEffect(() => {
    if (emailParam) handleDesinscription();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">

        {/* Idle / formulaire */}
        {statut === 'idle' && (
          <>
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Se désabonner</h1>
            <p className="text-gray-500 mb-6 text-sm">
              Entrez votre adresse email pour vous désabonner de notre newsletter.
            </p>
            <form onSubmit={handleDesinscription} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
              />
              <button
                type="submit"
                className="w-full py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
              >
                Se désabonner
              </button>
            </form>
          </>
        )}

        {/* Chargement */}
        {statut === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Traitement en cours...</p>
          </>
        )}

        {/* Succès */}
        {statut === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Désabonnement confirmé</h2>
            <p className="text-gray-500 mb-6 text-sm">
              L'adresse <strong>{email}</strong> a bien été retirée de notre newsletter.
              Vous ne recevrez plus d'emails de notre part.
            </p>
            <Link href="/" className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition">
              Retour à l'accueil
            </Link>
          </>
        )}

        {/* Déjà désabonné */}
        {statut === 'already' && (
          <>
            <div className="text-5xl mb-4">ℹ️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Déjà désabonné</h2>
            <p className="text-gray-500 mb-6 text-sm">
              <strong>{email}</strong> est déjà désabonné de notre newsletter.
            </p>
            <Link href="/" className="inline-block px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition">
              Retour à l'accueil
            </Link>
          </>
        )}

        {/* Email introuvable */}
        {statut === 'not_found' && (
          <>
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Email introuvable</h2>
            <p className="text-gray-500 mb-6 text-sm">
              <strong>{email}</strong> n'est pas dans notre liste d'abonnés.
            </p>
            <button
              onClick={() => setStatut('idle')}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Réessayer
            </button>
          </>
        )}

        {/* Erreur */}
        {statut === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Une erreur est survenue</h2>
            <p className="text-gray-500 mb-6 text-sm">Veuillez réessayer dans quelques instants.</p>
            <button
              onClick={() => setStatut('idle')}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Réessayer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PageDesinscription() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <DesinscriptionContenu />
    </Suspense>
  );
}