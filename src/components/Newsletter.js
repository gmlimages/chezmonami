// components/Newsletter.js
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: 'Veuillez entrer votre email' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Vérifier si email existe déjà
      const { data: existing } = await supabase
        .from('newsletter_abonnes')
        .select('id, actif')
        .eq('email', email)
        .single();

      if (existing) {
        if (existing.actif) {
          setMessage({ 
            type: 'info', 
            text: 'Vous êtes déjà abonné à notre newsletter !' 
          });
        } else {
          // Réactiver l'abonnement
          await supabase
            .from('newsletter_abonnes')
            .update({ actif: true })
            .eq('id', existing.id);
          
          setMessage({ 
            type: 'success', 
            text: 'Votre abonnement a été réactivé avec succès !' 
          });
        }
      } else {
        // Nouvel abonnement
        const { error } = await supabase
          .from('newsletter_abonnes')
          .insert({
            email,
            nom: nom || null,
            actif: true,
            date_confirmation: new Date().toISOString()
          });

        if (error) throw error;

        setMessage({ 
          type: 'success', 
          text: '🎉 Merci ! Vous êtes maintenant abonné à notre newsletter.' 
        });
        setEmail('');
        setNom('');
      }
    } catch (error) {
      console.error('Erreur inscription newsletter:', error);
      setMessage({ 
        type: 'error', 
        text: 'Une erreur est survenue. Veuillez réessayer.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gradient-to-r from-primary to-primary-dark py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Titre */}
          <div className="mb-8">
            <span className="text-5xl mb-4 block">📬</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Restez informé des nouveautés !
            </h2>
            <p className="text-lg text-green-100">
              Recevez les dernières entreprises, produits, promotions et annonces directement dans votre boîte mail.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Votre nom (optionnel)"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="flex-1 px-6 py-4 rounded-lg text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/50"
              />
              <input
                type="email"
                placeholder="Votre email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-6 py-4 rounded-lg text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/50"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Inscription...' : "S'abonner"}
              </button>
            </div>

            {/* Message de retour */}
            {message.text && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-100 text-green-800' :
                message.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {message.text}
              </div>
            )}

            {/* Options */}
            <div className="flex items-start gap-2 text-left text-sm text-green-100 max-w-2xl mx-auto">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>
                En vous abonnant, vous recevrez des emails sur les nouvelles entreprises, produits, promotions et annonces. 
                Vous pouvez vous désabonner à tout moment.
              </p>
            </div>
          </form>

          {/* Stats */}
          <div className="mt-8 flex items-center justify-center gap-8 text-white">
            <div>
              <div className="text-2xl font-bold">Gratuit</div>
              <div className="text-sm text-green-100">100% gratuit</div>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div>
              <div className="text-2xl font-bold">Sans spam</div>
              <div className="text-sm text-green-100">Uniquement des infos utiles</div>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div>
              <div className="text-2xl font-bold">Désabonnement</div>
              <div className="text-sm text-green-100">En un clic</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}