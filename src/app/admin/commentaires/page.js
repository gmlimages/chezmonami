// src/app/admin/commentaires/page.js
'use client';
import { toast, confirmDialog } from '@/lib/toast';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { commentairesAPI, structuresAPI } from '@/lib/api';
import StarRating from '@/components/ui/StarRating';

export default function AdminCommentaires() {
  const [commentaires, setCommentaires] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreNote, setFiltreNote] = useState('tous');
  const [filtreStructure, setFiltreStructure] = useState('tous');
  const [filtreStatut, setFiltreStatut] = useState('tous'); // tous, actifs, inactifs

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const [commentairesData, structuresData] = await Promise.all([
        commentairesAPI.getAll(),
        structuresAPI.getAll()
      ]);
      
      setCommentaires(commentairesData);
      setStructures(structuresData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Valider (activer) un commentaire
  const validerCommentaire = async (id) => {
    if (!(await confirmDialog({ message: 'Voulez-vous valider ce commentaire ?\nIl sera visible publiquement.', danger: true }))) { return; }

    try {
      await commentairesAPI.toggleActif(id, true);
      toast.success('Commentaire validé !');
      await chargerDonnees();
    } catch (error) {
      console.error('Erreur validation:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  // Désactiver un commentaire
  const desactiverCommentaire = async (id) => {
    if (!(await confirmDialog({ message: 'Voulez-vous masquer ce commentaire ?\nIl ne sera plus visible publiquement.', danger: true }))) { return; }

    try {
      await commentairesAPI.toggleActif(id, false);
      toast.success('Commentaire masqué !');
      await chargerDonnees();
    } catch (error) {
      console.error('Erreur désactivation:', error);
      toast.error('Erreur lors de la désactivation');
    }
  };

  // Supprimer définitivement un commentaire
  const supprimerCommentaire = async (id) => {
    if (!(await confirmDialog({ message: '⚠️ ATTENTION !\n\nVoulez-vous SUPPRIMER DÉFINITIVEMENT ce commentaire ?\n\nCette action est IRRÉVERSIBLE.', danger: true }))) { return; }

    try {
      await commentairesAPI.delete(id);
      toast.success('Commentaire supprimé définitivement !');
      await chargerDonnees();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Filtrer les commentaires
  const commentairesFiltres = commentaires.filter(c => {
    const matchNote = filtreNote === 'tous' || 
                     (filtreNote === '5' && c.note === 5) ||
                     (filtreNote === '4' && c.note === 4) ||
                     (filtreNote === '3' && c.note <= 3);
    
    const matchStructure = filtreStructure === 'tous' || c.structure_id === filtreStructure;
    
    const matchStatut = filtreStatut === 'tous' ||
                       (filtreStatut === 'actifs' && c.actif) ||
                       (filtreStatut === 'inactifs' && !c.actif);
    
    return matchNote && matchStructure && matchStatut;
  });

  // Statistiques
  const statistiques = {
    total: commentaires.length,
    actifs: commentaires.filter(c => c.actif).length,
    inactifs: commentaires.filter(c => !c.actif).length,
    note5: commentaires.filter(c => c.note === 5).length,
    note4: commentaires.filter(c => c.note === 4).length,
    note3etMoins: commentaires.filter(c => c.note <= 3).length
  };

  if (loading) {
    return (
      <AdminLayout titre="Modération des Commentaires">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des commentaires...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titre="Modération des Commentaires" sousTitre={`${statistiques.total} avis au total`}>
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total</span>
            <span className="text-3xl">💬</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{statistiques.total}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Validés</span>
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{statistiques.actifs}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">En attente</span>
            <span className="text-3xl">⏳</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{statistiques.inactifs}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">5 étoiles</span>
            <span className="text-3xl">⭐</span>
          </div>
          <p className="text-3xl font-bold text-yellow-500">{statistiques.note5}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">≤ 3 étoiles</span>
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{statistiques.note3etMoins}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="tous">Tous les statuts</option>
              <option value="actifs">✅ Validés uniquement</option>
              <option value="inactifs">⏳ En attente uniquement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
            <select
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              value={filtreNote}
              onChange={(e) => setFiltreNote(e.target.value)}
            >
              <option value="tous">Toutes les notes</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 étoiles)</option>
              <option value="4">⭐⭐⭐⭐ (4 étoiles)</option>
              <option value="3">⭐⭐⭐ (≤ 3 étoiles)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Structure</label>
            <select
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              value={filtreStructure}
              onChange={(e) => setFiltreStructure(e.target.value)}
            >
              <option value="tous">Toutes les structures</option>
              {structures.map(s => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Résultats</label>
            <div className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50">
              <span className="font-semibold text-primary">{commentairesFiltres.length}</span> commentaire{commentairesFiltres.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Bouton reset filtres */}
        {(filtreNote !== 'tous' || filtreStructure !== 'tous' || filtreStatut !== 'tous') && (
          <div className="mt-4">
            <button
              onClick={() => {
                setFiltreNote('tous');
                setFiltreStructure('tous');
                setFiltreStatut('tous');
              }}
              className="text-sm text-primary hover:underline font-semibold"
            >
              🔄 Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Liste des commentaires */}
      {commentairesFiltres.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-xl text-gray-600 mb-2">Aucun commentaire trouvé</p>
          <p className="text-gray-500">Modifiez vos filtres pour voir plus de résultats</p>
        </div>
      ) : (
        <div className="space-y-4">
          {commentairesFiltres.map((commentaire) => (
            <div 
              key={commentaire.id} 
              className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                !commentaire.actif ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                    {commentaire.nom_visiteur.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    {/* En-tête */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-800">{commentaire.nom_visiteur}</h3>
                      <StarRating note={commentaire.note} taille={18} afficherNote={false} />
                      {!commentaire.actif && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                          ⏳ En attente de validation
                        </span>
                      )}
                      {commentaire.actif && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          ✅ Validé
                        </span>
                      )}
                    </div>
                    
                    {/* Infos structure et date */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        🏪 <span className="font-medium">{commentaire.structure?.nom || 'Structure inconnue'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        📅 {new Date(commentaire.date_creation).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Commentaire */}
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {commentaire.commentaire}
                    </p>

                    {/* Indicateurs de note */}
                    <div className="flex gap-2 mt-3">
                      {commentaire.note === 5 && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          ⭐ Excellent
                        </span>
                      )}
                      {commentaire.note === 4 && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          👍 Très bien
                        </span>
                      )}
                      {commentaire.note <= 3 && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                          ⚠️ À surveiller
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  {!commentaire.actif ? (
                    // Commentaire en attente → Bouton Valider
                    <button
                      onClick={() => validerCommentaire(commentaire.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold text-sm whitespace-nowrap flex items-center gap-2"
                      title="Valider ce commentaire"
                    >
                      <span>✅</span>
                      <span>Valider</span>
                    </button>
                  ) : (
                    // Commentaire validé → Bouton Masquer
                    <button
                      onClick={() => desactiverCommentaire(commentaire.id)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold text-sm whitespace-nowrap flex items-center gap-2"
                      title="Masquer ce commentaire"
                    >
                      <span>👁️‍🗨️</span>
                      <span>Masquer</span>
                    </button>
                  )}
                  
                  {/* Bouton Supprimer (toujours disponible) */}
                  <button
                    onClick={() => supprimerCommentaire(commentaire.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold text-sm whitespace-nowrap flex items-center gap-2"
                    title="Supprimer définitivement"
                  >
                    <span>🗑️</span>
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info modération */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-3">⚠️ Consignes de modération</h3>
        <ul className="text-sm text-yellow-800 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-lg">✅</span>
            <span><strong>Valider :</strong> Les commentaires constructifs, même s'ils sont critiques, doivent être validés</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">👁️‍🗨️</span>
            <span><strong>Masquer :</strong> Les commentaires validés par erreur peuvent être masqués (ils ne seront plus visibles publiquement)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">🗑️</span>
            <span><strong>Supprimer :</strong> Supprimez définitivement les insultes, spam, ou contenus inappropriés</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>Les commentaires ≤ 3 étoiles nécessitent une attention particulière mais doivent être validés s'ils sont légitimes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">📞</span>
            <span>Pour les avis négatifs légitimes, contactez la structure concernée pour résoudre le problème</span>
          </li>
        </ul>
      </div>
    </AdminLayout>
  );
}