// src/app/admin/changer-mot-de-passe/page.js
'use client';
import { toast, confirmDialog } from '@/lib/toast';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/adminFetch';

export default function ChangerMotDePasse() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ancienMdp: '',
    nouveauMdp: '',
    confirmationMdp: ''
  });
  const [erreurs, setErreurs] = useState({});

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (!adminAuth) {
      router.push('/dashboard-gml-secure'); // URL de connexion cachée
      return;
    }
    setAdmin(JSON.parse(adminAuth));
  }, [router]);

  const validerMotDePasse = (mdp) => {
    const erreurs = [];
    
    if (mdp.length < 8) {
      erreurs.push('Au moins 8 caractères');
    }
    if (!/[A-Z]/.test(mdp)) {
      erreurs.push('Au moins une majuscule');
    }
    if (!/[a-z]/.test(mdp)) {
      erreurs.push('Au moins une minuscule');
    }
    if (!/[0-9]/.test(mdp)) {
      erreurs.push('Au moins un chiffre');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(mdp)) {
      erreurs.push('Au moins un caractère spécial (!@#$%^&*...)');
    }
    
    return erreurs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreurs({});
    setLoading(true);

    try {
      // Validations
      if (formData.nouveauMdp !== formData.confirmationMdp) {
        setErreurs({ confirmation: 'Les mots de passe ne correspondent pas' });
        setLoading(false);
        return;
      }

      const erreursValidation = validerMotDePasse(formData.nouveauMdp);
      if (erreursValidation.length > 0) {
        setErreurs({ nouveau: erreursValidation.join(', ') });
        setLoading(false);
        return;
      }

      const res = await adminFetch('/api/admin/changer-mot-de-passe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ancienMdp: formData.ancienMdp, nouveauMdp: formData.nouveauMdp }),
      });
      const result = await res.json();

      if (!res.ok) {
        if (result.error?.includes('actuel')) {
          setErreurs({ ancien: result.error });
        } else {
          setErreurs({ general: result.error || 'Erreur lors de la mise à jour' });
        }
        setLoading(false);
        return;
      }

      toast.success('Mot de passe modifié avec succès !');
      
      // Mettre à jour le localStorage
      const updatedAdmin = { ...admin, doit_changer_mdp: false };
      localStorage.setItem('adminAuth', JSON.stringify(updatedAdmin));
      
      router.push('/admin/dashboard');

    } catch (error) {
      console.error('Erreur:', error);
      setErreurs({ general: 'Une erreur est survenue' });
    } finally {
      setLoading(false);
    }
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            🔑
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Changement de mot de passe</h1>
          <p className="text-gray-600">Obligatoire pour continuer</p>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Première connexion :</strong> Vous devez créer un nouveau mot de passe sécurisé.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {erreurs.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {erreurs.general}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe actuel *
            </label>
            <input
              type="password"
              required
              className="input-field"
              value={formData.ancienMdp}
              onChange={(e) => setFormData({...formData, ancienMdp: e.target.value})}
            />
            {erreurs.ancien && (
              <p className="text-xs text-red-600 mt-1">{erreurs.ancien}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe *
            </label>
            <input
              type="password"
              required
              className="input-field"
              value={formData.nouveauMdp}
              onChange={(e) => setFormData({...formData, nouveauMdp: e.target.value})}
            />
            {erreurs.nouveau && (
              <p className="text-xs text-red-600 mt-1">{erreurs.nouveau}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le nouveau mot de passe *
            </label>
            <input
              type="password"
              required
              className="input-field"
              value={formData.confirmationMdp}
              onChange={(e) => setFormData({...formData, confirmationMdp: e.target.value})}
            />
            {erreurs.confirmation && (
              <p className="text-xs text-red-600 mt-1">{erreurs.confirmation}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              🔒 Critères de sécurité :
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>✓ Minimum 8 caractères</li>
              <li>✓ Au moins une majuscule (A-Z)</li>
              <li>✓ Au moins une minuscule (a-z)</li>
              <li>✓ Au moins un chiffre (0-9)</li>
              <li>✓ Au moins un caractère spécial (!@#$%^&*...)</li>
            </ul>
          </div>

          <button 
            type="submit" 
            className="w-full btn-primary disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}