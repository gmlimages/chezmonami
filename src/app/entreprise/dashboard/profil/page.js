'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import EntrepriseLayout from '../../EntrepriseLayout';
import { confirmDialog } from '@/lib/toast';
import { useT } from '@/lib/i18n/LangProvider';

export default function ProfilEntreprise() {
  const { t } = useT();
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

  // 2FA
  const [tfaActive, setTfaActive] = useState(null);
  const [tfaSaving, setTfaSaving] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (!auth) return;
    const { token: t } = JSON.parse(auth);
    setToken(t);
    chargerProfil(t);
    chargerTfa(t);
  }, []);

  const chargerTfa = async (tk) => {
    try {
      const res = await fetch('/api/entreprise/tfa', {
        headers: { Authorization: `Bearer ${tk}` },
      });
      if (res.ok) {
        const d = await res.json();
        setTfaActive(!!d.tfa_active);
      }
    } catch {}
  };

  const basculerTfa = async () => {
    if (tfaSaving) return;
    setTfaSaving(true);
    try {
      const res = await fetch('/api/entreprise/tfa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !tfaActive }),
      });
      const d = await res.json();
      if (res.ok) {
        setTfaActive(d.tfa_active);
        setMessage({
          type: 'succes',
          text: d.tfa_active
            ? 'Authentification à 2 facteurs activée'
            : 'Authentification à 2 facteurs désactivée',
        });
      } else {
        setMessage({ type: 'erreur', text: d.error || 'Erreur' });
      }
    } catch {
      setMessage({ type: 'erreur', text: 'Erreur réseau' });
    }
    setTfaSaving(false);
  };

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
      setMessage({ type: 'erreur', text: t('profil_page.photo_max') });
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
      setMessage({ type: 'erreur', text: t('profil_page.erreur_upload') + err.message });
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const sauvegarderProfil = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (form.nouveau_mdp && form.nouveau_mdp !== form.confirmer_mdp) {
      setMessage({ type: 'erreur', text: t('profil_page.mdp_ne_correspondent') });
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
      setMessage({ type: 'erreur', text: t('profil_page.erreur_reseau') });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <EntrepriseLayout titre={t('profil_page.titre')}>
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
            <h3 className="font-bold text-gray-800 mb-4">{t('profil_page.photo_titre')}</h3>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                  {photoPreview ? (
                    <img src={photoPreview} alt={t('profil_page.photo_alt')} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-4xl">🏢</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-dark transition text-sm"
                  title={t('profil_page.changer_photo')}
                >
                  ✏️
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-gray-600 mb-3">{t('profil_page.formats_acceptes')}</p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary hover:text-primary transition"
                >
                  {uploadingPhoto ? t('profil_page.upload_en_cours') : t('profil_page.choisir_photo')}
                </button>
                {photoProfil && (
                  <p className="text-xs text-green-600 mt-2">{t('profil_page.photo_prete')}</p>
                )}
              </div>

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
          </div>

          {/* Informations générales */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-bold text-gray-800">{t('profil_page.infos_generales')}</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profil_page.nom_responsable')}</label>
              <input
                type="text"
                required
                className="input-field w-full"
                value={form.nom_contact}
                onChange={e => setForm({ ...form, nom_contact: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profil_page.email_connexion')}</label>
              <input
                type="email"
                className="input-field w-full bg-gray-50 cursor-not-allowed"
                value={compte?.email || ''}
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">{t('profil_page.email_non_modifiable')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profil_page.tel_responsable')}</label>
              <input
                type="tel"
                placeholder={t('profil_page.tel_placeholder')}
                className="input-field w-full"
                value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">{t('profil_page.tel_visible_admin')}</p>
            </div>
          </div>

          {/* Changer mot de passe */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-bold text-gray-800">{t('profil_page.changer_mdp')}</h3>
            <p className="text-xs text-gray-500">{t('profil_page.mdp_vide')}</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profil_page.mdp_actuel')}</label>
              <input
                type="password"
                placeholder={t('profil_page.mdp_placeholder')}
                className="input-field w-full"
                value={form.ancien_mdp}
                onChange={e => setForm({ ...form, ancien_mdp: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profil_page.nouveau_mdp')}</label>
                <input
                  type="password"
                  placeholder={t('profil_page.nouveau_mdp_placeholder')}
                  className="input-field w-full"
                  value={form.nouveau_mdp}
                  onChange={e => setForm({ ...form, nouveau_mdp: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('profil_page.confirmer')}</label>
                <input
                  type="password"
                  placeholder={t('profil_page.mdp_placeholder')}
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
                {t('profil_page.sauvegarde_en_cours')}
              </span>
            ) : t('profil_page.sauvegarder')}
          </button>
        </form>

        {/* ── Sécurité — 2FA ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                🔐 Authentification à 2 facteurs
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                À chaque connexion, un code à 6 chiffres sera envoyé sur votre adresse email
                {compte?.email && (<> (<strong>{compte.email}</strong>)</>)}. Ce code est valable 10 minutes.
              </p>
            </div>
            <div className="flex-shrink-0">
              {tfaActive === null ? (
                <span className="text-xs text-gray-400">…</span>
              ) : (
                <button
                  type="button"
                  onClick={basculerTfa}
                  disabled={tfaSaving}
                  role="switch"
                  aria-checked={tfaActive}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                    tfaActive ? 'bg-green-500' : 'bg-gray-300'
                  } ${tfaSaving ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      tfaActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}
            </div>
          </div>
          {tfaActive && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              ✓ La 2FA est <strong>active</strong>. À votre prochaine connexion, un code de vérification vous sera envoyé par email.
            </div>
          )}
          {tfaActive === false && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              ⚠️ La 2FA est <strong>désactivée</strong>. Nous recommandons fortement de l'activer pour protéger votre compte.
            </div>
          )}
        </section>

        {/* ── Zone de danger ── */}
        <div className="border border-red-200 rounded-2xl p-6 bg-red-50/40">
          <h3 className="text-base font-bold text-red-700 mb-1">{t('profil_page.zone_danger')}</h3>
          <p className="text-sm text-red-600 mb-4">
            {t('profil_page.suppression_irreversible')}
          </p>
          {compte?.demande_suppression ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 bg-orange-100 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800">
                ⏳ <strong>{t('profil_page.demande_en_cours_titre')}</strong> — {t('profil_page.demande_en_cours_desc')}
              </div>
              <button
                onClick={async () => {
                  const ok = await confirmDialog({ message: t('profil_page.confirm_annuler_demande'), confirmLabel: t('profil_page.oui_annuler') });
                  if (!ok) return;
                  const res = await fetch('/api/entreprise/suppression', {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (res.ok) {
                    setMessage({ type: 'succes', text: t('profil_page.demande_annulee') });
                    chargerProfil(token);
                  }
                }}
                className="px-4 py-2 text-sm bg-white border border-orange-300 text-orange-700 rounded-xl hover:bg-orange-50 font-medium transition"
              >
                {t('profil_page.annuler_demande_btn')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setModalSuppression(true)}
              className="px-5 py-2.5 text-sm bg-white border border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-medium transition"
            >
              {t('profil_page.demander_suppression')}
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
              <h2 className="text-lg font-bold text-gray-800">{t('profil_page.modal_supprimer_titre')}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('profil_page.modal_supprimer_desc')}
              </p>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('profil_page.motif_label')}</label>
              <textarea
                rows={3}
                value={motifSuppression}
                onChange={e => setMotifSuppression(e.target.value)}
                placeholder={t('profil_page.motif_placeholder')}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setModalSuppression(false); setMotifSuppression(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50 font-medium"
              >
                {t('profil_page.annuler_btn')}
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
                      setMessage({ type: 'succes', text: t('profil_page.demande_envoyee') });
                      chargerProfil(token);
                    } else {
                      setMessage({ type: 'erreur', text: t('profil_page.erreur_envoi_demande') });
                    }
                  } finally {
                    setSuppressionEnCours(false);
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
              >
                {suppressionEnCours ? t('profil_page.envoi_en_cours') : t('profil_page.confirmer_suppression')}
              </button>
            </div>
          </div>
        </div>
      )}
    </EntrepriseLayout>
  );
}
