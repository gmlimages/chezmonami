// src/components/CommentairesList.js
'use client';
import { useState, useEffect } from 'react';
import { commentairesAPI } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';

export default function CommentairesList({ structureId, refresh }) {
  const [commentaires, setCommentaires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommentaires();
  }, [structureId, refresh]);

  const loadCommentaires = async () => {
    try {
      setLoading(true);
      const data = await commentairesAPI.getByStructure(structureId);
      setCommentaires(data);
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des avis...</p>
        </div>
      </div>
    );
  }

  if (commentaires.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Aucun avis pour le moment
          </h3>
          <p className="text-gray-600">
            Soyez le premier à laisser un avis sur cette structure !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>💬</span>
        <span>{commentaires.length} Avis client{commentaires.length > 1 ? 's' : ''}</span>
      </h3>

      <div className="space-y-4">
        {commentaires.map((commentaire) => (
          <div
            key={commentaire.id}
            className="border-2 border-gray-100 rounded-lg p-4 hover:border-primary/30 transition"
          >
            {/* En-tête */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-lg">
                  {commentaire.nom_visiteur.charAt(0).toUpperCase()}
                </div>
                
                {/* Nom et date */}
                <div>
                  <h4 className="font-bold text-gray-800">
                    {commentaire.nom_visiteur}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {new Date(commentaire.date_creation).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Note */}
              <div className="flex-shrink-0">
                <StarRating note={commentaire.note} taille={18} />
              </div>
            </div>

            {/* Commentaire */}
            <p className="text-gray-700 leading-relaxed">
              {commentaire.commentaire}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}