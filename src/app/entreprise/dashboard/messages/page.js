'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import EntrepriseLayout from '@/app/entreprise/EntrepriseLayout';
import { toast, confirmDialog } from '@/lib/toast';
import { useT } from '@/lib/i18n/LangProvider';

const MAX_FICHIER = 5 * 1024 * 1024;

export default function MessagesPage() {
  const { t, lang } = useT();
  const localeDate = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-GB' : 'fr-FR';

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return t('messages_page.a_l_instant');
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${t('messages_page.min_suffix')}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('messages_page.heure_suffix')}`;
    return date.toLocaleDateString(localeDate, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const tokenRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [envoyant, setEnvoyant] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [texte, setTexte] = useState('');
  const [fichier, setFichier] = useState(null);
  const [fichierErreur, setFichierErreur] = useState('');
  const fichierRef = useRef(null);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Aplatir les messages en bulles chronologiques
  const chatItems = useMemo(() => {
    const items = [];
    (messages || []).forEach(msg => {
      if (!msg.de_admin) {
        // Message envoyé par la société
        items.push({
          id: msg.id,
          side: 'right',
          contenu: msg.contenu,
          date: msg.created_at,
          fichier_nom: msg.fichier_nom,
          fichier_taille: msg.fichier_taille,
          canDelete: true,
          msgId: msg.id,
        });
        // Réponse de l'admin sur ce message
        if (msg.reponse_admin) {
          items.push({
            id: msg.id + '_r',
            side: 'left',
            contenu: msg.reponse_admin,
            date: msg.date_reponse,
            traite_par: msg.traite_par,
            canDelete: false,
          });
        }
      } else {
        // Message initié par l'admin
        items.push({
          id: msg.id,
          side: 'left',
          contenu: msg.contenu,
          date: msg.created_at,
          traite_par: msg.traite_par,
          fichier_nom: msg.fichier_nom,
          fichier_taille: msg.fichier_taille,
          canDelete: false,
        });
      }
    });
    return items.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [messages]);

  const afficherToast = (texte, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ texte, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (!auth) return;
    tokenRef.current = JSON.parse(auth).token;
    chargerMessages();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatItems]);

  const chargerMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/entreprise/messages', {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (res.ok) {
        const { messages: data } = await res.json();
        setMessages(data || []);
        fetch('/api/entreprise/notifications', {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${tokenRef.current}` },
        }).catch(() => {});
      }
    } catch {}
    setLoading(false);
  };

  const choisirFichier = (e) => {
    const f = e.target.files?.[0];
    setFichierErreur('');
    if (!f) { setFichier(null); return; }
    if (f.size > MAX_FICHIER) {
      setFichierErreur(t('messages_page.fichier_trop_volumineux'));
      e.target.value = '';
      setFichier(null);
      return;
    }
    setFichier(f);
  };

  const envoyerMessage = async () => {
    if (!texte.trim()) return;
    setEnvoyant(true);
    try {
      const sujetAuto = texte.trim().slice(0, 80);
      let res;
      if (fichier) {
        const fd = new FormData();
        fd.append('sujet', sujetAuto);
        fd.append('contenu', texte.trim());
        fd.append('fichier', fichier);
        res = await fetch('/api/entreprise/messages', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenRef.current}` },
          body: fd,
        });
      } else {
        res = await fetch('/api/entreprise/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
          body: JSON.stringify({ sujet: sujetAuto, contenu: texte.trim() }),
        });
      }
      const data = await res.json();
      if (res.ok) {
        setTexte('');
        setFichier(null);
        if (fichierRef.current) fichierRef.current.value = '';
        chargerMessages();
      } else {
        afficherToast(data.error || t('messages_page.erreur_envoi'), 'error');
      }
    } catch { afficherToast(t('messages_page.erreur_reseau'), 'error'); }
    setEnvoyant(false);
  };

  const supprimerMessage = async (id) => {
    const ok = await confirmDialog({ message: t('messages_page.confirm_supprimer_msg'), danger: true, confirmLabel: t('messages_page.supprimer_btn') });
    if (!ok) return;
    try {
      const res = await fetch(`/api/entreprise/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
      } else {
        afficherToast(t('messages_page.erreur_suppression'), 'error');
      }
    } catch { afficherToast(t('messages_page.erreur_reseau'), 'error'); }
  };

  const telechargerFichier = async (msgId, nom) => {
    try {
      const res = await fetch(`/api/entreprise/messages/${msgId}/fichier`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      if (!res.ok) { afficherToast(t('messages_page.impossible_ouvrir_fichier'), 'error'); return; }
      // Créer une URL blob locale — l'URL Supabase n'est jamais exposée au navigateur
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const estVisualisable = blob.type.startsWith('image/') || blob.type === 'application/pdf';
      const a = document.createElement('a');
      a.href = blobUrl;
      if (estVisualisable) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      } else {
        a.download = nom || 'fichier';
      }
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    } catch { afficherToast(t('messages_page.erreur_ouverture_fichier'), 'error'); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      envoyerMessage();
    }
  };

  return (
    <EntrepriseLayout titre={t('messages_page.titre')}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.texte}
          <button onClick={() => setToast(null)} className="ml-2 opacity-80 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Conteneur chat */}
      <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 13rem)' }}>

        {/* Header de la conversation */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
            🏢
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm">{t('messages_page.admin_chezmonami')}</p>
            <p className="text-xs text-gray-500">{t('messages_page.reponse_24_48h')}</p>
          </div>
        </div>

        {/* Zone de messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chatItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center select-none">
              <span className="text-5xl mb-4">💬</span>
              <p className="text-base font-semibold text-gray-600">{t('messages_page.commencez_conversation')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('messages_page.commencez_desc')}</p>
            </div>
          ) : (
            chatItems.map(item => (
              <div key={item.id} className={`flex ${item.side === 'right' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%] sm:max-w-[65%] group">
                  {/* Méta : nom + heure + bouton supprimer */}
                  <div className={`flex items-center gap-1.5 mb-1 ${item.side === 'right' ? 'justify-end' : 'justify-start'}`}>
                    {item.side === 'left' && (
                      <span className="text-xs font-semibold text-gray-600">
                        {item.traite_par || t('messages_page.administration')}
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">{formatDate(item.date)}</span>
                    {item.canDelete && (
                      <button
                        onClick={() => supprimerMessage(item.msgId)}
                        className="text-base text-gray-300 hover:text-red-500 transition opacity-50 hover:opacity-100"
                        title={t('messages_page.supprimer_message_title')}
                      >
                        🗑
                      </button>
                    )}
                  </div>

                  {/* Bulle */}
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    item.side === 'right'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{item.contenu}</p>
                    {item.fichier_nom && (
                      <button
                        onClick={() => telechargerFichier(item.id, item.fichier_nom)}
                        className={`mt-2 flex items-center gap-1.5 text-xs border rounded-lg px-2 py-1 w-fit transition hover:opacity-80 cursor-pointer ${
                          item.side === 'right'
                            ? 'border-white/30 bg-white/10 text-white'
                            : 'border-gray-300 bg-white text-gray-600'
                        }`}
                        title={t('messages_page.telecharger_fichier')}
                      >
                        📎 {item.fichier_nom}
                        {item.fichier_taille && (
                          <span className="opacity-70">({(item.fichier_taille / 1024).toFixed(0)} Ko)</span>
                        )}
                        <span className="opacity-60 ml-0.5">↓</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="border-t border-gray-100 px-3 py-3 flex-shrink-0 bg-white">
          {/* Fichier sélectionné */}
          {(fichier || fichierErreur) && (
            <div className="mb-2">
              {fichierErreur && <p className="text-xs text-red-500">{fichierErreur}</p>}
              {fichier && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5 w-fit">
                  📎 <span className="font-medium">{fichier.name}</span>
                  <span className="text-gray-400">({(fichier.size / 1024).toFixed(0)} Ko)</span>
                  <button
                    onClick={() => { setFichier(null); if (fichierRef.current) fichierRef.current.value = ''; }}
                    className="text-red-400 hover:text-red-600 ml-1"
                  >✕</button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={2}
              maxLength={3000}
              placeholder={t('messages_page.placeholder_message')}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              value={texte}
              onChange={e => setTexte(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {/* Joindre fichier */}
              <label
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-primary hover:text-primary cursor-pointer transition"
                title={t('messages_page.joindre_title')}
              >
                📎
                <input
                  ref={fichierRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                  onChange={choisirFichier}
                />
              </label>
              {/* Envoyer */}
              <button
                onClick={envoyerMessage}
                disabled={envoyant || !texte.trim()}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-white text-lg hover:bg-primary/90 transition disabled:opacity-40"
                title={t('messages_page.envoyer_title')}
              >
                {envoyant
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : '↑'}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 text-right">{texte.length} / 3000</p>
        </div>
      </div>
    </EntrepriseLayout>
  );
}
