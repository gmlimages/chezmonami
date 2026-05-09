'use client';
import { toast, confirmDialog } from '@/lib/toast';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { adminFetch } from '@/lib/adminFetch';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatDateCourt(d) {
  if (!d) return '';
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'À l\'instant';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

const MAX_FICHIER = 5 * 1024 * 1024;

export default function AdminMessages() {
  const [onglet, setOnglet] = useState('messages'); // 'messages' | 'b2b' | 'demandes'
  const nomAdminRef = useRef('');

  // ── Messages admin (thread) ──────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compteActif, setCompteActif] = useState(null);
  const [reponses, setReponses] = useState({});
  const [envoyant, setEnvoyant] = useState(false);
  const [vueMobile, setVueMobile] = useState('liste');
  const threadEndRef = useRef(null);

  // ── Compose (nouveau message admin → société) ─────────────────────────────
  const [compose, setCompose] = useState({ contenu: '' });
  const [composeFichier, setComposeFichier] = useState(null);
  const [composeFichierErreur, setComposeFichierErreur] = useState('');
  const composeFichierRef = useRef(null);
  const [envoyantCompose, setEnvoyantCompose] = useState(false);

  // ── Recherche nouveau compte (initier conversation) ───────────────────────
  const [showRechercheCompte, setShowRechercheCompte] = useState(false);
  const [rechercheQuery, setRechercheQuery] = useState('');
  const [rechercheResultats, setRechercheResultats] = useState([]);
  const [rechercheLoading, setRechercheLoading] = useState(false);

  // ── B2B ───────────────────────────────────────────────────────────────────
  const [convB2B, setConvB2B] = useState([]);
  const [loadingB2B, setLoadingB2B] = useState(false);
  const [convSelectionnee, setConvSelectionnee] = useState(null);

  // ── Demandes contact structure ────────────────────────────────────────────
  const [demandes, setDemandes] = useState([]);
  const [loadingDemandes, setLoadingDemandes] = useState(false);
  const [demandeActive, setDemandeActive] = useState(null);
  const [noteAdmin, setNoteAdmin] = useState('');
  const [traitant, setTraitant] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const afficherToast = (texte, type = 'succes') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ texte, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth) {
      try { nomAdminRef.current = JSON.parse(auth).nom || 'Administration'; } catch {}
    }
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  // ── Chargement messages ───────────────────────────────────────────────────
  const chargerMessages = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/messages');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { chargerMessages(); }, []);

  useEffect(() => {
    if (onglet === 'b2b' && convB2B.length === 0) chargerConvB2B();
    if (onglet === 'demandes' && demandes.length === 0) chargerDemandes();
  }, [onglet]);

  useEffect(() => {
    if (threadEndRef.current) threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [compteActif, messages]);

  // ── Comptes uniques ───────────────────────────────────────────────────────
  const comptesUniques = (() => {
    const map = new Map();
    messages.forEach(m => {
      const c = m.comptes_structures;
      if (!c) return;
      const existing = map.get(c.id);
      const nbNouveaux = (existing?.nbNouveaux || 0) + (m.statut === 'nouveau' ? 1 : 0);
      if (!existing || new Date(m.created_at) > new Date(existing.dernier)) {
        map.set(c.id, {
          ...c,
          dernier: m.created_at,
          dernierMsg: m.sujet,
          nbNouveaux: existing ? nbNouveaux : (m.statut === 'nouveau' ? 1 : 0),
        });
      } else {
        map.get(c.id).nbNouveaux = nbNouveaux;
      }
    });
    return [...map.values()].sort((a, b) => new Date(b.dernier) - new Date(a.dernier));
  })();

  const messagesCompte = compteActif
    ? messages.filter(m => m.comptes_structures?.id === compteActif.id)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : [];

  const nbNouveauxTotal = messages.filter(m => m.statut === 'nouveau').length;

  // ── Ouvrir un compte (thread) ─────────────────────────────────────────────
  const ouvrirCompte = async (compte) => {
    setCompteActif(compte);
    setVueMobile('thread');
    // Marquer tous ses messages "nouveau" comme lus
    const nouveaux = messages.filter(m => m.comptes_structures?.id === compte.id && m.statut === 'nouveau');
    await Promise.all(nouveaux.map(m =>
      adminFetch(`/api/admin/messages/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'lu' }),
      })
    ));
    if (nouveaux.length > 0) {
      setMessages(prev => prev.map(m =>
        m.comptes_structures?.id === compte.id && m.statut === 'nouveau'
          ? { ...m, statut: 'lu' }
          : m
      ));
    }
  };

  // ── Répondre à un message ─────────────────────────────────────────────────
  const envoyerReponse = async (msgId) => {
    if (!reponses[msgId]?.trim()) return;
    setEnvoyant(true);
    try {
      const res = await adminFetch(`/api/admin/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reponse_admin: reponses[msgId], traite_par: nomAdminRef.current }),
      });
      if (res.ok) {
        const { message } = await res.json();
        // Merge to preserve comptes_structures join data
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, ...message } : m));
        setReponses(prev => { const n = { ...prev }; delete n[msgId]; return n; });
        afficherToast('Réponse envoyée !');
      } else {
        afficherToast('Erreur lors de l\'envoi', 'erreur');
      }
    } catch { afficherToast('Erreur réseau', 'erreur'); }
    setEnvoyant(false);
  };

  // ── Télécharger un fichier joint ─────────────────────────────────────────
  const telechargerFichier = async (msgId, nom) => {
    try {
      const res = await adminFetch(`/api/admin/messages/${msgId}/fichier`);
      if (!res.ok) { afficherToast('Impossible d\'ouvrir le fichier', 'erreur'); return; }
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
    } catch { afficherToast('Erreur lors de l\'ouverture du fichier', 'erreur'); }
  };

  // ── Supprimer tous les messages d'une entreprise ─────────────────────────
  const supprimerTousMessages = async (compteId) => {
    if (!(await confirmDialog({ message: 'Supprimer tous les messages de cette entreprise ? Cette action est irréversible.', danger: true }))) return;
    const msgs = messages.filter(m => m.comptes_structures?.id === compteId);
    await Promise.all(msgs.map(m => adminFetch(`/api/admin/messages/${m.id}`, { method: 'DELETE' })));
    setMessages(prev => prev.filter(m => m.comptes_structures?.id !== compteId));
    if (compteActif?.id === compteId) { setCompteActif(null); setVueMobile('liste'); }
    afficherToast('Messages supprimés');
  };

  // ── Supprimer un message ──────────────────────────────────────────────────
  const supprimerMessage = async (id) => {
    if (!(await confirmDialog({ message: 'Supprimer ce message définitivement ?', danger: true }))) return;
    try {
      const res = await adminFetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
        afficherToast('Message supprimé');
      }
    } catch {}
  };

  // ── Nouveau message admin → société ──────────────────────────────────────
  const choisirComposeFichier = (e) => {
    const f = e.target.files?.[0];
    setComposeFichierErreur('');
    if (!f) { setComposeFichier(null); return; }
    if (f.size > MAX_FICHIER) {
      setComposeFichierErreur('Fichier trop volumineux (max 5 Mo)');
      e.target.value = '';
      setComposeFichier(null);
      return;
    }
    setComposeFichier(f);
  };

  const envoyerNouveauMessage = async (e) => {
    e.preventDefault();
    if (!compteActif || !compose.contenu.trim()) return;
    setEnvoyantCompose(true);
    const sujetAuto = compose.contenu.trim().slice(0, 80);
    try {
      let res;
      if (composeFichier) {
        const fd = new FormData();
        fd.append('compte_id', compteActif.id);
        fd.append('sujet', sujetAuto);
        fd.append('contenu', compose.contenu.trim());
        fd.append('traite_par', nomAdminRef.current);
        fd.append('fichier', composeFichier);
        res = await adminFetch('/api/admin/messages', { method: 'POST', body: fd });
      } else {
        res = await adminFetch('/api/admin/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            compte_id: compteActif.id,
            sujet: sujetAuto,
            contenu: compose.contenu.trim(),
            traite_par: nomAdminRef.current,
          }),
        });
      }
      if (res.ok) {
        const { message } = await res.json();
        setMessages(prev => [...prev, { ...message, comptes_structures: compteActif }]);
        setCompose({ contenu: '' });
        setComposeFichier(null);
        if (composeFichierRef.current) composeFichierRef.current.value = '';
        afficherToast('Message envoyé à la société !');
      } else {
        afficherToast('Erreur lors de l\'envoi', 'erreur');
      }
    } catch { afficherToast('Erreur réseau', 'erreur'); }
    setEnvoyantCompose(false);
  };

  // ── B2B ───────────────────────────────────────────────────────────────────
  const supprimerConvB2B = async (convId) => {
    if (!(await confirmDialog({ message: 'Supprimer définitivement cette conversation et tous ses messages ? Cette action est irréversible.', danger: true }))) return;
    try {
      const res = await adminFetch(`/api/admin/conversations-b2b/${convId}`, { method: 'DELETE' });
      if (res.ok) {
        setConvB2B(prev => prev.filter(c => c.id !== convId));
        if (convSelectionnee?.id === convId) setConvSelectionnee(null);
        afficherToast('Conversation supprimée.');
      } else {
        afficherToast('Erreur lors de la suppression', 'erreur');
      }
    } catch {
      afficherToast('Erreur réseau', 'erreur');
    }
  };

  const chargerConvB2B = async () => {
    setLoadingB2B(true);
    try {
      const res = await adminFetch('/api/admin/conversations-b2b');
      if (res.ok) {
        const { conversations } = await res.json();
        setConvB2B(conversations || []);
      }
    } catch {}
    setLoadingB2B(false);
  };

  // ── Demandes contact structure ────────────────────────────────────────────
  const chargerDemandes = async () => {
    setLoadingDemandes(true);
    try {
      const res = await adminFetch('/api/admin/demandes-contact-structure');
      if (res.ok) {
        const { demandes: data } = await res.json();
        setDemandes(data || []);
      }
    } catch {}
    setLoadingDemandes(false);
  };

  const traiterDemande = async (id, action) => {
    setTraitant(true);
    try {
      const res = await adminFetch(`/api/admin/demandes-contact-structure/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note_admin: noteAdmin }),
      });
      if (res.ok) {
        afficherToast(action === 'valider' ? 'Demande validée et email envoyé !' : 'Demande refusée');
        setDemandeActive(null);
        setNoteAdmin('');
        chargerDemandes();
      } else {
        afficherToast('Erreur lors du traitement', 'erreur');
      }
    } catch { afficherToast('Erreur réseau', 'erreur'); }
    setTraitant(false);
  };

  const nbDemandesEnAttente = demandes.filter(d => d.statut === 'en_attente').length;

  // ── Recherche de compte pour nouvelle conversation ────────────────────────
  useEffect(() => {
    if (!showRechercheCompte) { setRechercheQuery(''); setRechercheResultats([]); return; }
  }, [showRechercheCompte]);

  useEffect(() => {
    if (rechercheQuery.length < 2) { setRechercheResultats([]); return; }
    const t = setTimeout(async () => {
      setRechercheLoading(true);
      try {
        const res = await adminFetch(`/api/admin/comptes-entreprises?q=${encodeURIComponent(rechercheQuery)}`);
        if (res.ok) {
          const { comptes } = await res.json();
          setRechercheResultats(comptes || []);
        }
      } catch {}
      setRechercheLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [rechercheQuery]);

  const selectionnerCompteRecherche = (c) => {
    ouvrirCompte(c);
    setShowRechercheCompte(false);
    setRechercheQuery('');
    setRechercheResultats([]);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout titre="Messages">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-3 ${toast.type === 'succes' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          <span>{toast.type === 'succes' ? '✅' : '❌'}</span>
          {toast.texte}
          <button onClick={() => setToast(null)} className="ml-2 opacity-80 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6 flex-wrap">
        <button
          onClick={() => setOnglet('messages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${onglet === 'messages' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
        >
          📩 Messages admin
          {nbNouveauxTotal > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.2rem] h-5 flex items-center justify-center px-1">
              {nbNouveauxTotal}
            </span>
          )}
        </button>
        <button
          onClick={() => setOnglet('b2b')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${onglet === 'b2b' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
        >
          🤝 Échanges B2B
          {convB2B.length > 0 && <span className="text-xs text-gray-400">({convB2B.length})</span>}
        </button>
        <button
          onClick={() => setOnglet('demandes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${onglet === 'demandes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
        >
          🔗 Demandes contact
          {nbDemandesEnAttente > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[1.2rem] h-5 flex items-center justify-center px-1">
              {nbDemandesEnAttente}
            </span>
          )}
        </button>
      </div>

      {/* ══════════ ONGLET MESSAGES ADMIN — thread view ══════════ */}
      {onglet === 'messages' && (
        loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex h-[calc(100vh-14rem)] rounded-2xl border border-gray-200 overflow-hidden shadow-sm bg-white">

            {/* Colonne gauche — liste des entreprises */}
            <div className={`${vueMobile === 'thread' ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 flex-shrink-0 border-r border-gray-200`}>
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-gray-700">Entreprises ({comptesUniques.length})</p>
                <button
                  onClick={() => setShowRechercheCompte(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition"
                  title="Nouvelle conversation"
                >
                  ✏️ Nouveau
                </button>
              </div>
              {comptesUniques.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
                  <span className="text-4xl mb-3">📭</span>
                  <p className="text-sm text-gray-500">Aucun message reçu</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {comptesUniques.map(c => (
                    <div
                      key={c.id}
                      className={`flex items-center gap-0 transition hover:bg-gray-50 ${compteActif?.id === c.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                    >
                      <button
                        onClick={() => ouvrirCompte(c)}
                        className="flex-1 flex items-center gap-3 px-4 py-3 text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 overflow-hidden">
                          {c.photo_profil
                            ? <img src={c.photo_profil} alt={c.nom_contact} className="w-full h-full object-cover" />
                            : <span>{c.nom_contact?.charAt(0)?.toUpperCase() || '?'}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-sm truncate ${c.nbNouveaux > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {c.nom_contact}
                              {c.badge_verifie && <span className="ml-1 text-green-500 text-xs">✓</span>}
                            </p>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">{formatDateCourt(c.dernier)}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{c.dernierMsg}</p>
                        </div>
                        {c.nbNouveaux > 0 && (
                          <span className="w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {c.nbNouveaux}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => supprimerTousMessages(c.id)}
                        className="pr-3 text-gray-400 hover:text-red-500 transition flex-shrink-0 text-base"
                        title="Supprimer tous les messages de cette entreprise"
                      >
                        🗑
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colonne droite — thread de la conversation */}
            <div className={`${vueMobile === 'liste' && !compteActif ? 'hidden lg:flex' : 'flex'} flex-1 flex-col min-w-0`}>
              {!compteActif ? (
                <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-gray-400">
                  <span className="text-5xl mb-4">💬</span>
                  <p className="text-sm font-medium text-gray-600">Sélectionnez une entreprise</p>
                  <p className="text-xs mt-1">pour voir son historique de messages</p>
                </div>
              ) : (
                <>
                  {/* Header thread */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                    <button
                      onClick={() => { setVueMobile('liste'); setCompteActif(null); }}
                      className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
                    >
                      ←
                    </button>
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 overflow-hidden">
                      {compteActif.photo_profil
                        ? <img src={compteActif.photo_profil} alt={compteActif.nom_contact} className="w-full h-full object-cover" />
                        : <span>{compteActif.nom_contact?.charAt(0)?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{compteActif.nom_contact}</p>
                      <p className="text-xs text-gray-500 truncate">{compteActif.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">{messagesCompte.length} message{messagesCompte.length > 1 ? 's' : ''}</span>
                  </div>

                  {/* Messages en thread */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesCompte.map(msg => (
                      <div key={msg.id} className="space-y-2">

                        {msg.de_admin ? (
                          /* ── Message initié par l'admin (bulle gauche) ── */
                          <div className="flex justify-start">
                            <div className="max-w-[80%] lg:max-w-[70%]">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs text-gray-400">{formatDate(msg.created_at)}</p>
                                  {msg.traite_par && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                      Envoyé par {msg.traite_par}
                                    </span>
                                  )}
                                </div>
                                <button onClick={() => supprimerMessage(msg.id)} className="text-sm text-gray-400 hover:text-red-500 transition" title="Supprimer">🗑</button>
                              </div>
                              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.contenu}</p>
                                {msg.fichier_nom && (
                                  <button
                                    onClick={() => telechargerFichier(msg.id, msg.fichier_nom)}
                                    className="mt-2 flex items-center gap-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg px-2 py-1 w-fit bg-white hover:bg-gray-50 transition cursor-pointer"
                                    title="Télécharger le fichier"
                                  >
                                    📎 {msg.fichier_nom}
                                    {msg.fichier_taille && <span className="text-gray-400">({(msg.fichier_taille / 1024).toFixed(0)} Ko)</span>}
                                    <span className="text-gray-400 ml-0.5">↓</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* ── Message de l'entreprise (bulle droite) ── */
                          <>
                            <div className="flex justify-end">
                              <div className="max-w-[80%] lg:max-w-[70%]">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-xs text-gray-400">{formatDate(msg.created_at)}</span>
                                  <div className="flex items-center gap-2">
                                    {msg.statut === 'nouveau' && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded">NOUVEAU</span>}
                                    {msg.statut === 'repondu' && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">RÉPONDU</span>}
                                    <button onClick={() => supprimerMessage(msg.id)} className="text-sm text-red-400 hover:text-red-600 transition" title="Supprimer">🗑</button>
                                  </div>
                                </div>
                                <div className="bg-primary/10 rounded-2xl rounded-tr-sm px-4 py-3">
                                  <p className="text-xs font-semibold text-primary mb-1">{msg.sujet}</p>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.contenu}</p>
                                  {msg.fichier_nom && (
                                    <button
                                      onClick={() => telechargerFichier(msg.id, msg.fichier_nom)}
                                      className="mt-2 flex items-center gap-1.5 text-xs text-primary border border-primary/20 rounded-lg px-2 py-1 w-fit bg-white hover:bg-primary/5 transition cursor-pointer"
                                      title="Télécharger le fichier"
                                    >
                                      📎 {msg.fichier_nom}
                                      {msg.fichier_taille && <span className="text-gray-400">({(msg.fichier_taille / 1024).toFixed(0)} Ko)</span>}
                                      <span className="text-primary/60 ml-0.5">↓</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Réponse admin au message de l'entreprise */}
                            {msg.reponse_admin && (
                              <div className="flex justify-start">
                                <div className="max-w-[80%] lg:max-w-[70%]">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs text-gray-400">{formatDate(msg.date_reponse)}</p>
                                      {msg.traite_par && (
                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                          Pris en charge par {msg.traite_par}
                                        </span>
                                      )}
                                    </div>
                                    <button onClick={() => supprimerMessage(msg.id)} className="text-sm text-gray-400 hover:text-red-500 transition" title="Supprimer">🗑</button>
                                  </div>
                                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Administration</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.reponse_admin}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                          </>
                        )}
                      </div>
                    ))}
                    <div ref={threadEndRef} />
                  </div>

                  {/* ── Zone Compose — admin envoie un nouveau message ── */}
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex-shrink-0">
                    <p className="text-xs font-semibold text-gray-500 mb-2">✏️ Écrire à cette société</p>
                    <form onSubmit={envoyerNouveauMessage} className="space-y-2">
                      {composeFichier && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 bg-white rounded-lg px-3 py-1.5 w-fit border border-gray-200">
                          📎 <span className="font-medium">{composeFichier.name}</span>
                          <span className="text-gray-400">({(composeFichier.size/1024).toFixed(0)} Ko)</span>
                          <button type="button" onClick={() => { setComposeFichier(null); if (composeFichierRef.current) composeFichierRef.current.value=''; }} className="text-red-400 hover:text-red-600">✕</button>
                        </div>
                      )}
                      {composeFichierErreur && <p className="text-xs text-red-500">{composeFichierErreur}</p>}
                      <div className="flex items-end gap-2">
                        <textarea
                          rows={2}
                          maxLength={3000}
                          required
                          placeholder="Votre message… (Ctrl+Entrée pour envoyer)"
                          value={compose.contenu}
                          onChange={e => setCompose(p => ({ ...p, contenu: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); envoyerNouveauMessage(e); } }}
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none bg-white"
                        />
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <label className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-primary hover:text-primary cursor-pointer transition" title="Joindre un fichier">
                            📎
                            <input ref={composeFichierRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" onChange={choisirComposeFichier} />
                          </label>
                          <button
                            type="submit"
                            disabled={envoyantCompose || !compose.contenu.trim()}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary text-white text-lg hover:bg-primary/90 transition disabled:opacity-40"
                            title="Envoyer"
                          >
                            {envoyantCompose ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '↑'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      )}

      {/* Modal recherche compte pour nouvelle conversation */}
      {showRechercheCompte && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Nouvelle conversation</h3>
              <button onClick={() => setShowRechercheCompte(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm">✕</button>
            </div>
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Rechercher un compte société..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                value={rechercheQuery}
                onChange={e => setRechercheQuery(e.target.value)}
              />
              {rechercheLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {rechercheResultats.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {rechercheResultats.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectionnerCompteRecherche(c)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 overflow-hidden">
                      {c.photo_profil
                        ? <img src={c.photo_profil} alt={c.nom_contact} className="w-full h-full object-cover" />
                        : <span>{c.nom_contact?.charAt(0)?.toUpperCase() || '?'}</span>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {c.nom_contact}
                        {c.badge_verifie && <span className="ml-1 text-green-500 text-xs">✓</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{c.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {rechercheQuery.length >= 2 && !rechercheLoading && rechercheResultats.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-3">Aucun compte trouvé pour &quot;{rechercheQuery}&quot;</p>
            )}
            {rechercheQuery.length < 2 && (
              <p className="text-xs text-gray-400 text-center">Tapez au moins 2 caractères pour rechercher</p>
            )}
          </div>
        </div>
      )}

      {/* ══════════ ONGLET B2B ══════════ */}
      {onglet === 'b2b' && (
        loadingB2B ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : convB2B.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-24 text-center">
            <div className="text-5xl mb-4">🤝</div>
            <p className="text-lg font-semibold text-gray-700">Aucun échange B2B</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {convB2B.map(conv => {
                const nomA = conv.compte_a?.structures?.[0]?.nom || conv.compte_a?.nom_contact || '—';
                const nomB = conv.compte_b?.structures?.[0]?.nom || conv.compte_b?.nom_contact || '—';
                return (
                  <div key={conv.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-800 text-sm truncate">{nomA}</p>
                        <p className="text-xs text-gray-400">↔</p>
                        <p className="font-bold text-gray-800 text-sm truncate">{nomB}</p>
                      </div>
                      <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${conv.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {conv.active ? 'Active' : 'Suspendue'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{conv.nb_messages} message{conv.nb_messages > 1 ? 's' : ''}</p>
                    <div className="mt-auto flex gap-2">
                      <button
                        onClick={() => setConvSelectionnee(conv)}
                        className="flex-1 py-2 rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary hover:text-white transition"
                      >
                        Voir
                      </button>
                      <button
                        onClick={() => supprimerConvB2B(conv.id)}
                        className="px-3 py-2 rounded-lg bg-red-50 text-red-500 text-sm hover:bg-red-100 hover:text-red-700 transition flex-shrink-0"
                        title="Supprimer cette conversation"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal B2B */}
            {convSelectionnee && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
                    <div>
                      <h2 className="text-base font-bold text-gray-800">
                        {convSelectionnee.compte_a?.structures?.[0]?.nom || convSelectionnee.compte_a?.nom_contact}
                        {' ↔ '}
                        {convSelectionnee.compte_b?.structures?.[0]?.nom || convSelectionnee.compte_b?.nom_contact}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">Lecture seule</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => supprimerConvB2B(convSelectionnee.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 hover:text-red-700 transition"
                      >
                        🗑 Supprimer
                      </button>
                      <button onClick={() => setConvSelectionnee(null)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold">✕</button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {(convSelectionnee.messages_b2b || [])
                      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                      .map(msg => {
                        const estA = msg.expediteur_id === convSelectionnee.compte_a_id;
                        const exp = estA
                          ? (convSelectionnee.compte_a?.structures?.[0]?.nom || convSelectionnee.compte_a?.nom_contact)
                          : (convSelectionnee.compte_b?.structures?.[0]?.nom || convSelectionnee.compte_b?.nom_contact);
                        return (
                          <div key={msg.id} className={`flex flex-col ${estA ? 'items-start' : 'items-end'}`}>
                            <p className="text-xs text-gray-400 mb-1">{exp}</p>
                            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${estA ? 'bg-gray-100 text-gray-800 rounded-bl-none' : 'bg-primary/10 text-gray-800 rounded-br-none'}`}>
                              <p>{msg.contenu}</p>
                              <p className="text-xs text-gray-400 mt-1 text-right">
                                {new Date(msg.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    {!convSelectionnee.messages_b2b?.length && (
                      <p className="text-center text-gray-400 text-sm py-8">Aucun message.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )
      )}

      {/* ══════════ ONGLET DEMANDES CONTACT STRUCTURE ══════════ */}
      {onglet === 'demandes' && (
        loadingDemandes ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : demandes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-24 text-center">
            <div className="text-5xl mb-4">🔗</div>
            <p className="text-lg font-semibold text-gray-700">Aucune demande de contact</p>
          </div>
        ) : (
          <>
            {nbDemandesEnAttente > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium">
                ⏳ {nbDemandesEnAttente} demande{nbDemandesEnAttente > 1 ? 's' : ''} en attente de traitement
              </div>
            )}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Demandeur</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Structure visée</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Statut</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {demandes.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{d.nom_demandeur}</p>
                        <p className="text-xs text-gray-500">{d.email_demandeur}</p>
                        {d.telephone_demandeur && <p className="text-xs text-gray-400">{d.telephone_demandeur}</p>}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="font-medium text-gray-800">{d.structure?.nom}</p>
                        <p className="text-xs text-gray-500">{d.structure?.ville?.nom}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                        {formatDate(d.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          d.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                          d.statut === 'traite' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {d.statut === 'en_attente' ? '⏳ En attente' : d.statut === 'traite' ? '✅ Traité' : '❌ Refusé'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {d.statut === 'en_attente' && (
                          <button
                            onClick={() => { setDemandeActive(d); setNoteAdmin(''); }}
                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition"
                          >
                            Traiter
                          </button>
                        )}
                        {d.statut !== 'en_attente' && d.note_admin && (
                          <span className="text-xs text-gray-400 italic" title={d.note_admin}>Note admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal traitement demande */}
            {demandeActive && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                  <div className="flex items-start justify-between p-6 border-b border-gray-200">
                    <div>
                      <h2 className="text-base font-bold text-gray-800">Traiter la demande</h2>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {demandeActive.nom_demandeur} → {demandeActive.structure?.nom}
                      </p>
                    </div>
                    <button onClick={() => setDemandeActive(null)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">✕</button>
                  </div>
                  <div className="p-6 space-y-4">
                    {demandeActive.message_demandeur && (
                      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700">
                        <p className="font-semibold text-xs text-gray-500 uppercase mb-1">Message du demandeur</p>
                        <p>{demandeActive.message_demandeur}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Note admin (optionnel — envoyée par email)</label>
                      <textarea
                        rows={3}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder="Précisions pour le demandeur..."
                        value={noteAdmin}
                        onChange={e => setNoteAdmin(e.target.value)}
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                      ℹ️ <strong>Valider</strong> : vérifie si la structure a un compte, envoie un email au demandeur.<br />
                      <strong>Refuser</strong> : envoie un email de refus au demandeur.
                    </div>
                  </div>
                  <div className="flex gap-3 p-6 border-t border-gray-200">
                    <button
                      onClick={() => traiterDemande(demandeActive.id, 'refuser')}
                      disabled={traitant}
                      className="flex-1 py-2.5 border-2 border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50"
                    >
                      ❌ Refuser
                    </button>
                    <button
                      onClick={() => traiterDemande(demandeActive.id, 'valider')}
                      disabled={traitant}
                      className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {traitant ? 'Traitement…' : '✅ Valider'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )
      )}
    </AdminLayout>
  );
}
