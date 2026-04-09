'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import EntrepriseLayout from '../../EntrepriseLayout';

export default function ProfilEntreprise() {
  const [compte, setCompte] = useState(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Formulaire profil
  const [form, setForm] = useState({ nom_contact: '', telephone: '', ancien_mdp: '', nouveau_mdp: '', confirmer_mdp: '' });
  const [photoProfil, setPhotoProfil] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef();

  // Suppression de compte
  const [modalSuppression, setModalSuppression] = useState(false);
  const [motifSuppression, setMotifSuppression] = useState('');
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (!auth) return;
    const { token: t } = JSON.parse(auth);
    setToken(t);
    chargerProfil(t);
  }, []);

  const chargerProfil = async (t) => {
    setLoading(true);
    try {
      const res = await fetch('/api/entreprise/profil', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const { compte: c } = await res.json();
        setCompte(c);
        setForm(f => ({ ...f, nom_contact: c.nom_contact || '', telephone: c.telephone || '' }));
        setPhotoPreview(c.photo_profil || null);
      }
    } catch {}
    setLoading(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'erreur', text: 'La photo ne doit pas dépasser 5 Mo' });
      return;
    }
    setPhotoProfil(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async () => {
    if (!photoProfil) return null;
    setUploadingPhoto(true);
    try {
      const ext = photoProfil.name.split('.').pop();
      const path = `profils/${compte.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('images').upload(path, photoProfil, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) {
      setMessage({ type: 'erreur', text: 'Erreur upload photo : ' + err.message });
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const sauvegarderProfil = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (form.nouveau_mdp && form.nouveau_mdp !== form.confirmer_mdp) {
      setMessage({ type: 'erreur', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    setSaving(true);
    try {
      let urlPhoto = undefined;
      if (photoProfil) {
        urlPhoto = await uploadPhoto();
        if (!urlPhoto) { setSaving(false); return; }
      }

      const body = { nom_contact: form.nom_contact, telephone: form.telephone };
      if (urlPhoto) body.photo_profil = urlPhoto;
      if (form.nouveau_mdp) {
        body.ancien_mdp = form.ancien_mdp;
        body.nouveau_mdp = form.nouveau_mdp;
      }

      const res = await fetch('/api/entreprise/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'succes', text: data.message });
        setForm(f => ({ ...f, ancien_mdp: '', nouveau_mdp: '', confirmer_mdp: '' }));
        setPhotoProfil(null);
        const auth = JSON.parse(localStorage.getItem('entrepriseAuth'));
        auth.compte.nom_contact = form.nom_contact;
        if (urlPhoto) auth.compte.photo_profil = urlPhoto;
        localStorage.setItem('entrepriseAuth', JSON.stringify(auth));
      } else {
        setMessage({ type: 'erreur', text: data.error });
      }
    } catch {
      setMessage({ type: 'erreur', text: 'Erreur réseau. Veuillez réessayer.' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <EntrepriseLayout titre="Mon profil">
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </EntrepriseLayout>
    );
  }

  return (
    <EntrepriseLayout titre="Mon profil">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Message global */}
        {message.text && (
          <div className={`p-4 rounded-xl text-sm font-medium border ${
            message.type === 'succes'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.type === 'succes' ? '✅ ' : '❌ '}{message.text}
          </div>
        )}

        <form onSubmit={sauvegarderProfil} className="space-y-5">

          {/* Photo de profil */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4">Photo de profil</h3>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Photo profil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-4xl">🏢</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-dark transition text-sm"
                  title="Changer la photo"
                >
                  ✏️
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-gray-600 mb-3">Formats acceptés : JPG, PNG, WEBP • Max 5 Mo</p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary hover:text-primary transition"
                >
                  {uploadingPhoto ? '⏳ Upload...' : '📷 Choisir une photo'}
                </button>
                {photoProfil && (
                  <p className="text-xs text-green-600 mt-2">✓ Photo prête à être sauvegardée</p>
                )}
              </div>

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
          </div>

          {/* Informations générales */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-bold text-gray-800">Informations générales</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du responsable</label>
              <input
                type="text"
                required
                className="input-field w-full"
                value={form.nom_contact}
                onChange={e => setForm({ ...form, nom_contact: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email de connexion</label>
              <input
                type="email"
                className="input-field w-full bg-gray-50 cursor-not-allowed"
                value={compte?.email || ''}
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">L&apos;email de connexion ne peut pas être modifié</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro de téléphone du responsable</label>
              <input
                type="tel"
                placeholder="+33 6 00 00 00 00"
                className="input-field w-full"
                value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Ce numéro est uniquement visible par l&apos;administration</p>
            </div>
          </div>

          {/* Changer mot de passe */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-bold text-gray-800">Changer le mot de passe</h3>
            <p className="text-xs text-gray-500">Laissez ces champs vides si vous ne souhaitez pas changer votre mot de passe</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe actuel</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field w-full"
                value={form.ancien_mdp}
                onChange={e => setForm({ ...form, ancien_mdp: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="Min. 8 caractères"
                  className="input-field w-full"
                  value={form.nouveau_mdp}
                  onChange={e => setForm({ ...form, nouveau_mdp: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmer</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-field w-full"
                  value={form.confirmer_mdp}
                  onChange={e => setForm({ ...form, confirmer_mdp: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full btn-primary py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sauvegarde...
              </span>
            ) : '💾 Sauvegarder les modifications'}
          </button>
        </form>

        {/* ── Zone de danger ── */}
        <div className="border border-red-200 rounded-2xl p-6 bg-red-50/40">
          <h3 className="text-base font-bold text-red-700 mb-1">Zone de danger</h3>
          <p className="text-sm text-red-600 mb-4">
            La suppression de votre compte est irréversible. Toutes vos données seront effacées après validation par l&apos;administration.
          </p>
          {compte?.demande_suppression ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 bg-orange-100 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800">
                ⏳ <strong>Demande de suppression en cours</strong> — L&apos;administration examinera votre demande prochainement.
              </div>
              <button
                onClick={async () => {
                  if (!confirm('Annuler la demande de suppression ?')) return;
                  const res = await fetch('/api/entreprise/suppression', {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (res.ok) {
                    setMessage({ type: 'succes', text: 'Demande annulée.' });
                    chargerProfil(token);
                  }
                }}
                className="px-4 py-2 text-sm bg-white border border-orange-300 text-orange-700 rounded-xl hover:bg-orange-50 font-medium transition"
              >
                Annuler la demande
              </button>
            </div>
          ) : (
            <button
              onClick={() => setModalSuppression(true)}
              className="px-5 py-2.5 text-sm bg-white border border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-medium transition"
            >
              🗑️ Demander la suppression du compte
            </button>
          )}
        </div>

      </div>

      {/* Modal confirmation suppression */}
      {modalSuppression && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🗑️</span>
              </div>
              <h2 className="text-lg font-bold text-gray-800">Supprimer mon compte</h2>
              <p className="text-sm text-gray-500 mt-1">
                Cette action est irréversible. Votre compte et toutes vos données seront définitivement supprimés après validation.
              </p>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Motif (optionnel)</label>
              <textarea
                rows={3}
                value={motifSuppression}
                onChange={e => setMotifSuppression(e.target.value)}
                placeholder="Dites-nous pourquoi vous souhaitez supprimer votre compte..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setModalSuppression(false); setMotifSuppression(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50 font-medium"
              >
                Annuler
              </button>
              <button
                disabled={suppressionEnCours}
                onClick={async () => {
                  setSuppressionEnCours(true);
                  try {
                    const res = await fetch('/api/entreprise/suppression', {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ motif: motifSuppression }),
                    });
                    if (res.ok) {
                      setModalSuppression(false);
                      setMotifSuppression('');
                      setMessage({ type: 'succes', text: "Demande de suppression envoyée. L'administration vous contactera." });
                      chargerProfil(token);
                    } else {
                      setMessage({ type: 'erreur', text: "Erreur lors de l'envoi de la demande." });
                    }
                  } finally {
                    setSuppressionEnCours(false);
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
              >
                {suppressionEnCours ? 'Envoi...' : '🗑️ Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </EntrepriseLayout>
  );
}
