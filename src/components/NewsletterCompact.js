'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const PREFERENCES_OPTIONS = [
  {
    key: 'tout',
    emoji: '⭐',
    titre: 'Tout recevoir',
    description: 'Entreprises, produits, promos et annonces',
    special: true,
  },
  {
    key: 'nouvelles_structures',
    emoji: '🏢',
    titre: 'Nouvelles entreprises',
    description: 'Alertes à chaque nouvelle entreprise inscrite',
  },
  {
    key: 'nouveaux_produits',
    emoji: '📦',
    titre: 'Nouveaux produits',
    description: 'Découvrez les derniers produits disponibles',
  },
  {
    key: 'promotions_annonces',
    emoji: '🔥📢',
    titre: 'Promotions & Annonces',
    description: 'Offres, réductions, emplois et événements',
    groupe: ['promotions', 'annonces'],
  },
];

const PREFS_DEFAUT = {
  nouvelles_structures: true,
  nouveaux_produits: true,
  promotions: true,
  annonces: true,
};

export default function NewsletterCompact() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [abonneId, setAbonneId] = useState(null);
  const [preferences, setPreferences] = useState(PREFS_DEFAUT);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // ── Abonnement ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/newsletter/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, preferences: PREFS_DEFAUT }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      if (data.deja_abonne) {
        setMessage({ type: 'info', text: '📩 Vous êtes déjà abonné(e) à notre newsletter !' });
      } else {
        setAbonneId(data.id);
        setEmail('');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Newsletter error:', error);
      setMessage({ type: 'error', text: '❌ Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  // ── Préférences ─────────────────────────────────────────────────────────────

  const isChecked = (option) => {
    if (option.key === 'tout') {
      return Object.values(preferences).every(v => v === true);
    }
    if (option.groupe) {
      return option.groupe.every(k => preferences[k]);
    }
    return preferences[option.key];
  };

  const toggleOption = (option) => {
    if (option.key === 'tout') {
      const toutActif = Object.values(preferences).every(v => v === true);
      const nouvelleValeur = !toutActif;
      setPreferences({
        nouvelles_structures: nouvelleValeur,
        nouveaux_produits: nouvelleValeur,
        promotions: nouvelleValeur,
        annonces: nouvelleValeur,
      });
      return;
    }

    if (option.groupe) {
      const actif = option.groupe.every(k => preferences[k]);
      const update = {};
      option.groupe.forEach(k => { update[k] = !actif; });
      setPreferences(prev => ({ ...prev, ...update }));
      return;
    }

    setPreferences(prev => ({ ...prev, [option.key]: !prev[option.key] }));
  };

  const handleSavePreferences = async () => {
    if (!abonneId) return;
    setSavingPrefs(true);
    try {
      const { error } = await supabase
        .from('newsletter_abonnes')
        .update({ preferences })
        .eq('id', abonneId);
      if (error) throw error;
      setPrefsSaved(true);
    } catch (err) {
      console.error('Erreur préférences:', err);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPrefsSaved(false);
    setAbonneId(null);
    setPreferences(PREFS_DEFAUT);
  };

  const prefsActives = PREFERENCES_OPTIONS.filter(
    p => p.key !== 'tout' && isChecked(p)
  );

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Bandeau newsletter ── */}
      <section className="bg-gradient-to-r from-primary to-primary-dark py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-6">

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <span className="text-3xl">📬</span>
                  <h3 className="text-2xl font-bold text-white">Newsletter</h3>
                </div>
                <p className="text-green-100 text-sm">
                  Recevez les nouveautés : entreprises, produits, promos et annonces
                </p>
              </div>

              <div className="flex-1 w-full">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    {loading ? '⏳' : "S'abonner"}
                  </button>
                </form>

                {message.text && (
                  <div className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${
                    message.type === 'success' ? 'bg-green-500/20 text-green-100 border border-green-400/30'
                    : message.type === 'error' ? 'bg-red-500/20 text-red-100 border border-red-400/30'
                    : 'bg-blue-500/20 text-blue-100 border border-blue-400/30'
                  }`}>
                    {message.text}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── Modale de bienvenue ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={prefsSaved ? handleCloseModal : undefined}
          />

          {/* Carte */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 z-10">

            {!prefsSaved ? (
              <>
                {/* En-tête */}
                <div className="text-center mb-5">
                  <div className="text-5xl mb-3">🎉</div>
                  <h2 className="text-xl font-bold text-gray-800">Bienvenue !</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Que souhaitez-vous recevoir ?
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-2 mb-5">
                  {PREFERENCES_OPTIONS.map((option) => {
                    const actif = isChecked(option);
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => toggleOption(option)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          option.special
                            ? actif
                              ? 'border-yellow-400 bg-yellow-50'
                              : 'border-gray-200 bg-gray-50 opacity-70'
                            : actif
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                          option.special
                            ? actif ? 'border-yellow-400 bg-yellow-400' : 'border-gray-300 bg-white'
                            : actif ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
                        }`}>
                          {actif && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        <span className="text-xl">{option.emoji}</span>

                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${actif ? 'text-gray-800' : 'text-gray-400'}`}>
                            {option.titre}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {option.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Boutons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-500 text-sm font-semibold rounded-xl hover:bg-gray-50 transition"
                  >
                    Passer
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    disabled={savingPrefs || Object.values(preferences).every(v => !v)}
                    className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {savingPrefs ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : 'Confirmer ✓'}
                  </button>
                </div>
              </>
            ) : (
              /* ── Écran confirmation ── */
              <div className="text-center py-2">
                <div className="text-5xl mb-3">✅</div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">C'est noté !</h2>
                <p className="text-gray-500 text-sm mb-4">Vous recevrez :</p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {prefsActives.length > 0 ? (
                    prefsActives.map(p => (
                      <span key={p.key} className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                        {p.emoji} {p.titre}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">Aucune notification</span>
                  )}
                </div>
                <button
                  onClick={handleCloseModal}
                  className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition"
                >
                  Parfait, merci ! 👋
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}