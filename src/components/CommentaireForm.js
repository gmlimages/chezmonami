// src/components/CommentaireForm.js
'use client';
import { useState } from 'react';
import { commentairesAPI } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';

export default function CommentaireForm({ structureId, onCommentaireAdded }) {
  const [formData, setFormData] = useState({
    nom_visiteur: '',
    commentaire: '',
    note: 5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nom_visiteur.trim()) {
      setError('Veuillez entrer votre nom');
      return;
    }
    if (!formData.commentaire.trim()) {
      setError('Veuillez entrer votre commentaire');
      return;
    }
    if (formData.commentaire.trim().length < 10) {
      setError('Le commentaire doit contenir au moins 10 caractères');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await commentairesAPI.create({
        structure_id: structureId,
        nom_visiteur: formData.nom_visiteur.trim(),
        commentaire: formData.commentaire.trim(),
        note: formData.note
      });

      // Réinitialiser le formulaire
      setFormData({
        nom_visiteur: '',
        commentaire: '',
        note: 5
      });
      
      setSuccess(true);
      
      // Notifier le parent
      if (onCommentaireAdded) {
        onCommentaireAdded();
      }
      
      // Cacher le message de succès après 5 secondes
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (err) {
      console.error('Erreur ajout commentaire:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">
        ✍️ Laissez votre avis
      </h3>

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-xl">✅</span>
            <p className="text-green-800 font-semibold">
              Merci pour votre avis !
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-xl">⚠️</span>
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Votre nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nom_visiteur}
            onChange={(e) => setFormData({ ...formData, nom_visiteur: e.target.value })}
            placeholder="Ex: Jean Dupont"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition"
            maxLength={255}
            disabled={loading}
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Votre note <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, note: star })}
                  className="transition hover:scale-110"
                  disabled={loading}
                >
                  <svg
                    className={`w-8 h-8 ${
                      star <= formData.note
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
              ))}
            </div>
            <span className="text-gray-600 font-semibold">
              {formData.note} / 5
            </span>
          </div>
        </div>

        {/* Commentaire */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Votre commentaire <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.commentaire}
            onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
            placeholder="Partagez votre expérience avec cette structure..."
            rows={5}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition resize-none"
            maxLength={1000}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.commentaire.length} / 1000 caractères
            {formData.commentaire.length > 0 && formData.commentaire.length < 10 && (
              <span className="text-red-500 ml-2">
                (minimum 10 caractères)
              </span>
            )}
          </p>
        </div>

        {/* Bouton soumettre */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Envoi en cours...</span>
            </>
          ) : (
            <>
              <span>📝</span>
              <span>Publier mon avis</span>
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Votre avis compte beaucoup pour la structure.
        </p>
      </form>
    </div>
  );
}