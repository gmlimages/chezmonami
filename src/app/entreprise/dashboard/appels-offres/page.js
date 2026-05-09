'use client';
import { useState, useEffect } from 'react';
import EntrepriseLayout from '../../EntrepriseLayout';
import { useT } from '@/lib/i18n/LangProvider';

export default function AppelsOffresEntreprise() {
  const { t, lang } = useT();
  const localeDate = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-GB' : 'fr-FR';
  const [appels, setAppels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reponseForm, setReponseForm] = useState('');
  const [reponseFichiers, setReponseFichiers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filtre, setFiltre] = useState('tous');
  const [token, setToken] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (!auth) return;
    const { token: tk } = JSON.parse(auth);
    setToken(tk);
    chargerAppels(tk);
  }, []);

  const chargerAppels = async (tk) => {
    setLoading(true);
    try {
      const res = await fetch('/api/entreprise/appels-offres', {
        headers: { Authorization: `Bearer ${tk}` },
      });
      if (res.status === 403) {
        setAccesRefuse(true);
      } else if (res.ok) {
        const { appels: data } = await res.json();
        setAppels(data || []);
      }
    } catch {}
    setLoading(false);
  };

  const ouvrirReponse = (appel) => {
    setSelected(appel);
    setReponseForm(appel.ma_reponse?.contenu || '');
    setReponseFichiers([]);
    setMessage({ type: '', text: '' });
  };

  const soumettreReponse = async (e) => {
    e.preventDefault();
    if (!reponseForm.trim()) return;
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const fd = new FormData();
      fd.append('contenu', reponseForm);
      reponseFichiers.forEach(f => fd.append('fichiers', f));

      const res = await fetch(`/api/entreprise/appels-offres/${selected.id}/reponse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'succes', text: t('appels_offres_page.reponse_soumise') });
        setReponseFichiers([]);
        chargerAppels(token);
        setTimeout(() => setSelected(null), 2000);
      } else {
        setMessage({ type: 'erreur', text: data.error || t('appels_offres_page.erreur_soumission') });
      }
    } catch {
      setMessage({ type: 'erreur', text: t('appels_offres_page.erreur_reseau') });
    }
    setSubmitting(false);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString(localeDate, { day: '2-digit', month: 'long', year: 'numeric' });
  const isExpire = (d) => new Date(d) < new Date();
  const isExpireBientot = (d) => {
    const diff = new Date(d) - new Date();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  };

  const appelsFiltres = appels.filter(a => {
    if (filtre === 'non_repondus') return !a.ma_reponse;
    if (filtre === 'repondus') return !!a.ma_reponse;
    if (filtre === 'international') return a.international;
    return true;
  });

  return (
    <EntrepriseLayout titre={t('appels_offres_page.titre')}>

      {/* Modal réponse */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header modal */}
            <div className="p-5 border-b border-gray-200 flex items-start justify-between gap-3 flex-shrink-0">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-800 text-lg leading-tight">{selected.titre}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {selected.international && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{t('appels_offres_page.international')}</span>
                  )}
                  {selected.categories && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{selected.categories.icon} {selected.categories.nom}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isExpire(selected.date_limite) ? 'bg-red-100 text-red-700' :
                    isExpireBientot(selected.date_limite) ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    📅 {formatDate(selected.date_limite)}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-xl leading-none">✕</button>
            </div>

            {/* Corps scrollable */}
            <div className="overflow-y-auto flex-1 p-5">
              {/* Description */}
              <div className="mb-5">
                <p className="text-gray-700 text-sm leading-relaxed">{selected.description}</p>
                {selected.description_longue && (
                  <p className="text-gray-600 text-sm leading-relaxed mt-3 whitespace-pre-wrap">{selected.description_longue}</p>
                )}
              </div>

              {/* Fichiers joints à l'appel */}
              {selected.fichiers?.length > 0 && (
                <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t('appels_offres_page.docs_appel')}</p>
                  <div className="space-y-1.5">
                    {selected.fichiers.map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/entreprise/appels-offres/fichiers?path=${encodeURIComponent(f.path)}&nom=${encodeURIComponent(f.nom)}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (!res.ok) return;
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url; a.target = '_blank'; a.download = f.nom; a.click();
                          setTimeout(() => URL.revokeObjectURL(url), 5000);
                        }}
                        className="w-full flex items-center gap-2 text-left px-3 py-1.5 bg-white rounded-lg border border-gray-200 hover:bg-blue-50 transition text-sm"
                      >
                        <span>📄</span>
                        <span className="flex-1 truncate text-gray-700">{f.nom}</span>
                        <span className="text-gray-400 text-xs flex-shrink-0">{(f.taille / 1024).toFixed(0)} Ko</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Réponse existante */}
              {selected.ma_reponse && (
                <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm font-semibold text-green-800 mb-2">{t('appels_offres_page.votre_reponse')}</p>
                  <p className="text-sm text-green-700 whitespace-pre-wrap">{selected.ma_reponse.contenu}</p>
                  {selected.ma_reponse.fichiers?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-green-600 font-medium">{t('appels_offres_page.pieces_jointes_label')}</p>
                      {selected.ma_reponse.fichiers.map((f, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={async () => {
                            const res = await fetch(`/api/entreprise/appels-offres/fichiers?path=${encodeURIComponent(f.path)}&nom=${encodeURIComponent(f.nom)}`, {
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            if (!res.ok) return;
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.target = '_blank'; a.download = f.nom; a.click();
                            setTimeout(() => URL.revokeObjectURL(url), 5000);
                          }}
                          className="flex items-center gap-2 text-xs text-green-700 hover:text-green-900"
                        >
                          <span>📄</span><span className="truncate">{f.nom}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-green-600 mt-2">
                    {t('appels_offres_page.statut_label')} <span className="font-semibold capitalize">{selected.ma_reponse.statut}</span>
                  </p>
                </div>
              )}

              {/* Formulaire réponse */}
              {!isExpire(selected.date_limite) && (
                <form onSubmit={soumettreReponse}>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {selected.ma_reponse ? t('appels_offres_page.modifier_reponse') : t('appels_offres_page.votre_reponse_label')}
                  </label>
                  <textarea
                    value={reponseForm}
                    onChange={e => setReponseForm(e.target.value)}
                    rows={5}
                    placeholder={t('appels_offres_page.placeholder_reponse')}
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    required
                  />

                  {/* Pièces jointes */}
                  <div className="mt-3">
                    <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition text-sm text-gray-500">
                      <span>📎</span>
                      <span>{t('appels_offres_page.joindre_fichiers')}</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const nouveaux = Array.from(e.target.files || []);
                          const total = reponseFichiers.length + nouveaux.length;
                          if (total > 5) { setMessage({ type: 'erreur', text: t('appels_offres_page.max_5_fichiers') }); return; }
                          const tropLourds = nouveaux.filter(f => f.size > 5 * 1024 * 1024);
                          if (tropLourds.length > 0) { setMessage({ type: 'erreur', text: t('appels_offres_page.fichier_trop_lourd').replace('{{nom}}', tropLourds[0].name) }); return; }
                          setReponseFichiers(prev => [...prev, ...nouveaux]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {reponseFichiers.length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {reponseFichiers.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1">
                            <span>📄</span>
                            <span className="flex-1 truncate text-gray-600">{f.name}</span>
                            <button type="button" onClick={() => setReponseFichiers(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">✕</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {message.text && (
                    <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${
                      message.type === 'succes'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {message.text}
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button type="button" onClick={() => setSelected(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition text-sm">
                      {t('appels_offres_page.annuler')}
                    </button>
                    <button type="submit" disabled={submitting || !reponseForm.trim()} className="flex-1 btn-primary disabled:opacity-50 py-2.5 text-sm font-semibold">
                      {submitting ? t('appels_offres_page.envoi') : selected.ma_reponse ? t('appels_offres_page.mettre_a_jour') : t('appels_offres_page.soumettre')}
                    </button>
                  </div>
                </form>
              )}

              {isExpire(selected.date_limite) && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <p className="text-sm text-gray-500">{t('appels_offres_page.cloture')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mur abonnement */}
      {accesRefuse && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-8">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('appels_offres_page.acces_titre')}</h2>
          <p className="text-gray-500 text-sm mb-6">
            {t('appels_offres_page.acces_desc')}
          </p>
          <a
            href="/entreprise/dashboard/messages"
            className="inline-block px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition"
          >
            {t('appels_offres_page.contacter_admin')}
          </a>
        </div>
      )}

      {/* Filtres + liste */}
      {!accesRefuse && (<>
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { key: 'tous', label: t('appels_offres_page.tous') },
          { key: 'non_repondus', label: t('appels_offres_page.sans_reponse') },
          { key: 'repondus', label: t('appels_offres_page.repondus') },
          { key: 'international', label: t('appels_offres_page.international') },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filtre === f.key
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/40'
            }`}
          >
            {f.label}
            {f.key === 'tous' && !loading && <span className="ml-1.5 text-xs opacity-75">({appels.length})</span>}
          </button>
        ))}
      </div>

      {/* Liste des appels */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-gray-100" />)}
        </div>
      ) : appelsFiltres.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-gray-500 font-medium">{t('appels_offres_page.aucun_appel')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appelsFiltres.map(appel => (
            <div key={appel.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {appel.international && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{t('appels_offres_page.international')}</span>
                      )}
                      {appel.categories && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{appel.categories.icon} {appel.categories.nom}</span>
                      )}
                      {appel.pays && !appel.international && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">📍 {appel.pays.nom}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-800 text-base mb-1">{appel.titre}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{appel.description}</p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                    {appel.ma_reponse ? (
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        {t('appels_offres_page.repondu')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                        {t('appels_offres_page.en_attente')}
                      </span>
                    )}
                    <span className={`text-xs font-medium ${
                      isExpire(appel.date_limite) ? 'text-red-500' :
                      isExpireBientot(appel.date_limite) ? 'text-orange-500' : 'text-gray-500'
                    }`}>
                      📅 {formatDate(appel.date_limite)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => ouvrirReponse(appel)}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition ${
                      isExpire(appel.date_limite)
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : appel.ma_reponse
                        ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        : 'btn-primary'
                    }`}
                    disabled={isExpire(appel.date_limite)}
                  >
                    {isExpire(appel.date_limite) ? t('appels_offres_page.cloture_short') :
                     appel.ma_reponse ? t('appels_offres_page.voir_modifier') : t('appels_offres_page.repondre')}
                  </button>
                  {isExpireBientot(appel.date_limite) && !appel.ma_reponse && (
                    <span className="text-xs text-orange-600 font-medium flex items-center">
                      {t('appels_offres_page.expire_bientot')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>)}
    </EntrepriseLayout>
  );
}
