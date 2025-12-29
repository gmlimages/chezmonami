// src/app/dashboard-chezmonami/page.js

// Exemples: admin-2024-secret, gestion-privee-xyz, etc.

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLoginSecure() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    motDePasse: ''
  });
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);
  const [bloque, setBloque] = useState(false);
  const [tempsRestant, setTempsRestant] = useState(0);

  useEffect(() => {
    // Vérifier si déjà connecté
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  useEffect(() => {
    // Compte à rebours pour le déblocage
    if (tempsRestant > 0) {
      const timer = setTimeout(() => setTempsRestant(tempsRestant - 1), 1000);
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
      // 1. Vérifier si l'admin existe et récupérer ses infos
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', formData.email)
        .single();

      if (adminError || !admin) {
        // Enregistrer tentative échouée
        await supabase.from('admin_login_attempts').insert({
          email: formData.email,
          success: false
        });

        setErreur('Email ou mot de passe incorrect');
        setLoading(false);
        return;
      }

      // 2. Vérifier si le compte est bloqué
      if (admin.bloque_jusqu_a && new Date(admin.bloque_jusqu_a) > new Date()) {
        const secondes = Math.ceil((new Date(admin.bloque_jusqu_a) - new Date()) / 1000);
        setTempsRestant(secondes);
        setBloque(true);
        setErreur(`Compte temporairement bloqué. Réessayez dans ${Math.ceil(secondes / 60)} minute(s).`);
        setLoading(false);
        return;
      }

      // 3. Vérifier le mot de passe
      // ⚠️ EN PRODUCTION: Utilisez bcrypt pour comparer les hash
      // const isValid = await bcrypt.compare(formData.motDePasse, admin.mot_de_passe);
      const isValid = formData.motDePasse === admin.mot_de_passe;

      if (!isValid) {
        // Incrémenter les tentatives
        const nouvellesToentatives = (admin.tentatives_connexion || 0) + 1;
        const updateData = { tentatives_connexion: nouvellesToentatives };

        // Bloquer après 3 tentatives
        if (nouvellesToentatives >= 3) {
          const blocageJusqua = new Date();
          blocageJusqua.setMinutes(blocageJusqua.getMinutes() + 15);
          updateData.bloque_jusqu_a = blocageJusqua.toISOString();
          
          setBloque(true);
          setTempsRestant(15 * 60);
          setErreur('Trop de tentatives échouées. Compte bloqué pendant 15 minutes.');
        } else {
          setErreur(`Mot de passe incorrect. ${3 - nouvellesToentatives} tentative(s) restante(s).`);
        }

        await supabase.from('admins').update(updateData).eq('id', admin.id);
        await supabase.from('admin_login_attempts').insert({
          email: formData.email,
          success: false
        });

        setLoading(false);
        return;
      }

      // 4. Connexion réussie
      // Réinitialiser les tentatives
      await supabase.from('admins').update({
        tentatives_connexion: 0,
        bloque_jusqu_a: null,
        derniere_connexion: new Date().toISOString()
      }).eq('id', admin.id);

      // Enregistrer tentative réussie
      await supabase.from('admin_login_attempts').insert({
        email: formData.email,
        success: true
      });

      // Créer une session
      const sessionToken = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8); // Session de 8h

      await supabase.from('admin_sessions').insert({
        admin_id: admin.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString()
      });

      // Stocker les infos localement
      localStorage.setItem('adminAuth', JSON.stringify({
        id: admin.id,
        nom: admin.nom,
        email: admin.email,
        role: admin.role,
        sessionToken: sessionToken
      }));

      // Vérifier si doit changer le mot de passe
      if (admin.doit_changer_mdp) {
        router.push('/admin/changer-mot-de-passe');
      } else {
        router.push('/admin/dashboard');
      }

    } catch (error) {
      console.error('Erreur connexion:', error);
      setErreur('Erreur lors de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Générer un token de session sécurisé
  const generateToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-light flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            🔒
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Chez Mon Ami</p>
        </div>

        {/* Formulaire */}
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
                  Déblocage dans: {Math.floor(tempsRestant / 60)}m {tempsRestant % 60}s
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="votre@email.com"
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={loading || bloque}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="input-field"
              value={formData.motDePasse}
              onChange={(e) => setFormData({...formData, motDePasse: e.target.value})}
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

        {/* Infos sécurité */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 mb-2">
            🔐 Sécurité
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Maximum 3 tentatives de connexion</li>
            <li>• Blocage automatique pendant 15 minutes</li>
            <li>• Sessions expirées après 8 heures</li>
          </ul>
        </div>
      </div>
    </div>
  );
}