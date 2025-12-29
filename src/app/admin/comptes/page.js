// src/app/admin/comptes/page.js - PARTIE 1/2
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/app/admin/AdminLayout';
import { supabase } from '@/lib/supabase';

export default function AdminComptes() {
  const router = useRouter();
  const [adminConnecte, setAdminConnecte] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('liste');
  const [adminEnCours, setAdminEnCours] = useState(null);
  
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    role: 'admin'
  });

  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (!adminAuth) {
      router.push('/dashboard-gml-secure');
      return;
    }
    
    const admin = JSON.parse(adminAuth);
    if (admin.role !== 'super_admin') {
      alert('⛔ Accès refusé. Seul le Super Admin peut gérer les comptes.');
      router.push('/admin/dashboard');
      return;
    }
    
    setAdminConnecte(admin);
    chargerAdmins();
  }, [router]);

  const chargerAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('date_creation', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Erreur chargement admins:', error);
      alert('❌ Erreur lors du chargement des comptes');
    } finally {
      setLoading(false);
    }
  };

  const genererMotDePasseTemporaire = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
    let mdp = '';
    for (let i = 0; i < 12; i++) {
      mdp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return mdp;
  };

  const ajouterAdmin = () => {
    setAdminEnCours(null);
    const mdpTemp = genererMotDePasseTemporaire();
    setFormData({
      nom: '',
      email: '',
      motDePasse: mdpTemp,
      role: 'admin'
    });
    setMode('formulaire');
  };

  const modifierAdmin = (admin) => {
    setAdminEnCours(admin);
    setFormData({
      nom: admin.nom,
      email: admin.email,
      motDePasse: '',
      role: admin.role
    });
    setMode('formulaire');
  };

  const supprimerAdmin = async (id) => {
    if (id === adminConnecte?.id) {
      alert('⛔ Vous ne pouvez pas supprimer votre propre compte !');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte admin ?')) return;

    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('✅ Compte supprimé avec succès !');
      chargerAdmins();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const reinitialiserMotDePasse = async (admin) => {
    const nouveauMdp = genererMotDePasseTemporaire();
    
    if (!confirm(`Réinitialiser le mot de passe de ${admin.nom} ?\n\nUn nouveau mot de passe temporaire sera généré.`)) return;

    try {
      // ⚠️ EN PRODUCTION: Hash avec bcrypt
      const { error } = await supabase
        .from('admins')
        .update({
          mot_de_passe: nouveauMdp,
          doit_changer_mdp: true,
          tentatives_connexion: 0,
          bloque_jusqu_a: null
        })
        .eq('id', admin.id);

      if (error) throw error;

      alert(`✅ Mot de passe réinitialisé pour ${admin.nom} !\n\nNouveau mot de passe temporaire : ${nouveauMdp}\n\n⚠️ Communiquez-le de manière sécurisée.\nL'admin devra le changer à la prochaine connexion.`);
      chargerAdmins();
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      alert('❌ Erreur lors de la réinitialisation');
    }
  };

  const sauvegarderAdmin = async () => {
    if (!formData.nom || !formData.email) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!adminEnCours && !formData.motDePasse) {
      alert('⚠️ Le mot de passe est obligatoire pour créer un compte');
      return;
    }

    try {
      if (adminEnCours) {
        // Modification
        const updateData = {
          nom: formData.nom,
          email: formData.email,
          role: formData.role
        };

        // Si nouveau mot de passe fourni
        if (formData.motDePasse) {
          updateData.mot_de_passe = formData.motDePasse;
          updateData.doit_changer_mdp = true;
        }

        const { error } = await supabase
          .from('admins')
          .update(updateData)
          .eq('id', adminEnCours.id);

        if (error) throw error;
        alert('✅ Compte admin modifié avec succès !');
      } else {
        // Création
        // ⚠️ EN PRODUCTION: Hash avec bcrypt
        const { error } = await supabase
          .from('admins')
          .insert({
            nom: formData.nom,
            email: formData.email,
            mot_de_passe: formData.motDePasse,
            role: formData.role,
            doit_changer_mdp: true
          });

        if (error) throw error;
        
        alert(`✅ Compte admin créé avec succès !\n\nEmail : ${formData.email}\nMot de passe temporaire : ${formData.motDePasse}\n\n⚠️ Communiquez ces identifiants de manière sécurisée.\nL'admin devra changer son mot de passe à la première connexion.`);
      }
      
      setMode('liste');
      chargerAdmins();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  if (!adminConnecte || loading) {
    return (
      <AdminLayout titre="Gestion des Comptes Admin">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  if (mode === 'formulaire') {
    return (
      <AdminLayout titre={adminEnCours ? 'Modifier le compte' : 'Créer un compte admin'}>
        <div className="max-w-2xl">
          <button onClick={() => setMode('liste')} className="mb-6 flex items-center gap-2 text-primary hover:text-primary-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la liste
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
              <input
                type="text"
                placeholder="Ex: Jean Dupont"
                className="input-field"
                value={formData.nom}
                onChange={(e) => setFormData({...formData, nom: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                placeholder="ex: jean@chezmonami.com"
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe {adminEnCours ? '(laisser vide pour ne pas changer)' : 'temporaire *'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Minimum 8 caractères"
                  className="input-field flex-1"
                  value={formData.motDePasse}
                  onChange={(e) => setFormData({...formData, motDePasse: e.target.value})}
                />
                {!adminEnCours && (
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, motDePasse: genererMotDePasseTemporaire()})}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Générer
                  </button>
                )}
              </div>
              {!adminEnCours && (
                <p className="text-xs text-gray-500 mt-1">
                  Ce mot de passe sera temporaire. L'admin devra le changer à la première connexion.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rôle *</label>
              <select
                className="input-field"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ Le Super Admin peut gérer les comptes et a tous les droits
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-900 mb-2">
                🔒 Sécurité
              </p>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>• Le mot de passe doit contenir au moins 8 caractères</li>
                <li>• L'admin devra changer son mot de passe à la première connexion</li>
                <li>• Communiquez les identifiants de manière sécurisée (pas par email non chiffré)</li>
              </ul>
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={sauvegarderAdmin} className="btn-primary flex-1">
                {adminEnCours ? 'Modifier' : 'Créer'} le compte
              </button>
              <button onClick={() => setMode('liste')} className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titre="Gestion des Comptes Admin" sousTitre={`${admins.length} compte(s) administrateur(s)`}>
      <div className="mb-6 flex items-center justify-between">
        <button onClick={ajouterAdmin} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Créer un compte admin
        </button>

        <div className="text-sm text-gray-600">
          <span className="font-semibold">Connecté en tant que :</span> {adminConnecte.nom} (Super Admin)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.map((admin) => {
          const estConnecte = admin.id === adminConnecte.id;
          const estBloque = admin.bloque_jusqu_a && new Date(admin.bloque_jusqu_a) > new Date();
          
          return (
            <div key={admin.id} className={`bg-white rounded-xl shadow-lg p-6 ${estConnecte ? 'ring-2 ring-primary' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {admin.nom.charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  {estConnecte && (
                    <span className="px-3 py-1 bg-primary text-white rounded-full text-xs font-bold block mb-2">
                      C'est vous
                    </span>
                  )}
                  {admin.doit_changer_mdp && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold block">
                      Doit changer MDP
                    </span>
                  )}
                  {estBloque && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold block mt-2">
                      🔒 Bloqué
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1">{admin.nom}</h3>
              <p className="text-sm text-gray-600 mb-3">{admin.email}</p>

              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  admin.role === 'super_admin' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {admin.role === 'super_admin' ? '⭐ Super Admin' : '👤 Admin'}
                </span>
              </div>

              <div className="text-xs text-gray-500 mb-4 space-y-1">
                <p>Créé le {new Date(admin.date_creation).toLocaleDateString('fr-FR')}</p>
                {admin.derniere_connexion && (
                  <p>Dernière connexion: {new Date(admin.derniere_connexion).toLocaleDateString('fr-FR')}</p>
                )}
                {admin.tentatives_connexion > 0 && (
                  <p className="text-orange-600 font-semibold">
                    ⚠️ {admin.tentatives_connexion} tentative(s) échouée(s)
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => modifierAdmin(admin)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
                >
                  Modifier
                </button>
                <button
                  onClick={() => reinitialiserMotDePasse(admin)}
                  className="flex-1 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition font-medium text-sm"
                  title="Générer un nouveau mot de passe temporaire"
                >
                  Reset MDP
                </button>
                {!estConnecte && (
                  <button
                    onClick={() => supprimerAdmin(admin.id)}
                    className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-red-900 mb-3">⚠️ Sécurité des comptes</h3>
        <ul className="text-sm text-red-800 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-lg">🔐</span>
            <span>Seul le Super Admin peut créer, modifier ou supprimer des comptes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">🔑</span>
            <span>Les mots de passe temporaires doivent être changés à la première connexion</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">🚫</span>
            <span>Comptes bloqués automatiquement après 3 tentatives échouées (15 min)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg">⏱️</span>
            <span>Sessions expirées après 8 heures d'inactivité</span>
          </li>
        </ul>
      </div>
    </AdminLayout>
  );
}