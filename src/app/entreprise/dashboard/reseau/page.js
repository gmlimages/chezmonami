'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import EntrepriseLayout from '../../EntrepriseLayout';
import { useT } from '@/lib/i18n/LangProvider';
import { lireContexteDepuisURL, messageContextuelDepuis } from '@/lib/messagesContextuels';

/* ─────────────────────────────────────────────
   Helper : formatage date relative
───────────────────────────────────────────── */
function makeFormatDate(t, lang) {
  const localeDate = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-GB' : 'fr-FR';
  return function formatDate(d) {
    if (!d) return '';
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    if (diff < 60_000) return t('reseau_page.a_l_instant');
    const ilYa = t('reseau_page.il_y_a');
    if (diff < 3_600_000) return `${ilYa ? ilYa + ' ' : ''}${Math.floor(diff / 60_000)} ${t('reseau_page.min_suffix')}`.trim();
    if (diff < 86_400_000) return `${ilYa ? ilYa + ' ' : ''}${Math.floor(diff / 3_600_000)}${t('reseau_page.heure_suffix')}`.trim();
    return date.toLocaleDateString(localeDate, { day: '2-digit', month: 'short' });
  };
}

/* ─────────────────────────────────────────────
   Sous-composant : avatar initiale
───────────────────────────────────────────── */
function Avatar({ nom, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-sm' : size === 'lg' ? 'w-12 h-12 text-xl' : 'w-10 h-10 text-base';
  return (
    <div className={`${sizeClass} rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0`}>
      {nom?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sous-composant : panneau de demandes
───────────────────────────────────────────── */
function PanneauDemandes({ demandes, onOuvrirConversation, onSupprimerDemande, formatDate: fmt }) {
  const { t } = useT();
  const nbRefusees = (demandes.envoyees || []).filter(d => d.statut === 'refusee').length;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5">

      {/* Envoyées */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('reseau_page.mes_demandes_envoyees')}</h3>
          {nbRefusees > 0 && (
            <button
              onClick={() => onSupprimerDemande('vider_refusees')}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition"
            >
              {t('reseau_page.vider_refusees')} ({nbRefusees})
            </button>
          )}
        </div>

        {demandes.envoyees.length === 0 ? (
          <p className="text-sm text-gray-400 italic">{t('reseau_page.aucune_demande_envoyee')}</p>
        ) : (
          <div className="space-y-2">
            {demandes.envoyees.map(d => (
              <div key={d.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                d.statut === 'refusee' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
              }`}>
                <Avatar nom={d.destinataire?.nom_contact} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {d.destinataire?.nom_contact}
                    {d.destinataire?.badge_verifie && <span className="ml-1 text-green-600 text-xs">✓</span>}
                  </p>
                  {d.destinataire?.structures?.nom && (
                    <p className="text-xs text-gray-500 truncate">{d.destinataire.structures.nom}</p>
                  )}
                  {d.statut === 'refusee' && (
                    <p className="text-xs text-red-600 font-medium mt-0.5">
                      {t('reseau_page.demande_refusee_admin')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(d.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {d.statut === 'en_attente' && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold whitespace-nowrap">{t('reseau_page.en_attente')}</span>
                  )}
                  {d.statut === 'approuvee' && (
                    <>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{t('reseau_page.approuvee')}</span>
                      {d.conversation?.id && (
                        <button
                          onClick={() => onOuvrirConversation(d.conversation.id)}
                          className="px-2 py-0.5 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary/90 transition"
                        >
                          {t('reseau_page.ouvrir')}
                        </button>
                      )}
                    </>
                  )}
                  {d.statut === 'refusee' && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">{t('reseau_page.refusee')}</span>
                  )}
                  {/* Bouton supprimer pour refusée ou approuvée */}
                  {(d.statut === 'refusee' || d.statut === 'approuvee') && (
                    <button
                      onClick={() => onSupprimerDemande(d.id)}
                      className="text-gray-300 hover:text-red-500 transition text-sm leading-none mt-0.5"
                      title={t('reseau_page.supprimer_liste')}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reçues — uniquement les approuvées (les en_attente ne sont pas visibles ici) */}
      {demandes.recues.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('reseau_page.demandes_recues')}</h3>
          <div className="space-y-2">
            {demandes.recues.map(d => (
              <div key={d.id} className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                <Avatar nom={d.demandeur?.nom_contact} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {d.demandeur?.nom_contact}
                    {d.demandeur?.badge_verifie && <span className="ml-1 text-green-600 text-xs">✓</span>}
                  </p>
                  {d.demandeur?.structures?.nom && (
                    <p className="text-xs text-gray-500 truncate">{d.demandeur.structures.nom}</p>
                  )}
                  {d.message_demande && (
                    <p className="text-xs text-gray-500 italic mt-0.5 line-clamp-2">&ldquo;{d.message_demande}&rdquo;</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(d.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {d.conversation?.id && (
                    <button
                      onClick={() => onOuvrirConversation(d.conversation.id)}
                      className="px-2 py-0.5 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary/90 transition"
                    >
                      {t('reseau_page.ouvrir')}
                    </button>
                  )}
                  <button
                    onClick={() => onSupprimerDemande(d.id)}
                    className="text-gray-300 hover:text-red-500 transition text-sm leading-none"
                    title={t('reseau_page.supprimer_liste')}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Sous-composant : drawer nouvelle demande
───────────────────────────────────────────── */
function DrawerNouvelleDemande({ token, onSuccess, onClose, prefillStructureId = null, prefillMessage = '' }) {
  const { t } = useT();
  const [query, setQuery] = useState('');
  const [resultats, setResultats] = useState([]); // tableau de { structure_id, nom, ville, categorie, a_compte, compte }
  const [rechercheLoading, setRechercheLoading] = useState(false);
  const [selectionne, setSelectionne] = useState(null); // structure sélectionnée
  const [message, setMessage] = useState(prefillMessage || '');
  const [envoyant, setEnvoyant] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Pré-sélection automatique d'une structure depuis un lien contextuel
  useEffect(() => {
    if (!prefillStructureId || !token) return;
    let annule = false;
    (async () => {
      try {
        const res = await fetch(`/api/entreprise/structures/recherche?q=${encodeURIComponent('id:' + prefillStructureId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!annule && res.ok) {
          const { structures } = await res.json();
          const found = (structures || []).find(s => String(s.structure_id) === String(prefillStructureId));
          if (found) setSelectionne(found);
        }
      } catch {}
    })();
    return () => { annule = true; };
  }, [prefillStructureId, token]);

  useEffect(() => {
    if (query.length < 2) { setResultats([]); return; }
    const timer = setTimeout(async () => {
      setRechercheLoading(true);
      try {
        const res = await fetch(`/api/entreprise/structures/recherche?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const { structures } = await res.json();
          setResultats(structures || []);
        }
      } catch {}
      setRechercheLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, token]);

  const envoyer = async (e) => {
    e.preventDefault();
    if (!selectionne || !selectionne.a_compte) return;
    setEnvoyant(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await fetch('/api/entreprise/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ destinataire_id: selectionne.compte.id, message_demande: message }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'succes', text: t('reseau_page.demande_envoyee') });
        setSelectionne(null);
        setQuery('');
        setMessage('');
        setTimeout(() => onSuccess(), 1500);
      } else {
        setFeedback({ type: 'erreur', text: data.error || t('reseau_page.erreur_generique') });
      }
    } catch {
      setFeedback({ type: 'erreur', text: t('reseau_page.erreur_reseau') });
    }
    setEnvoyant(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{t('reseau_page.nouvelle_demande_titre')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition text-sm">✕</button>
        </div>

        <p className="text-sm text-gray-500">
          {t('reseau_page.recherche_desc')}
        </p>

        {/* Feedback */}
        {feedback.text && (
          <div className={`p-3 rounded-xl text-sm font-medium border ${feedback.type === 'succes' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {feedback.text}
          </div>
        )}

        {!selectionne ? (
          <div>
            <div className="relative">
              <input
                type="text"
                placeholder={t('reseau_page.placeholder_recherche')}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              {rechercheLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {resultats.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {resultats.map(s => (
                  <button
                    key={s.structure_id}
                    type="button"
                    onClick={() => { setSelectionne(s); setQuery(''); setResultats([]); }}
                    className="w-full text-left px-4 py-3 hover:bg-primary/5 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-800 text-sm">{s.nom}</p>
                      {s.a_compte
                        ? <span className="text-xs text-green-600 font-medium flex-shrink-0">{t('reseau_page.compte_actif')}</span>
                        : <span className="text-xs text-gray-400 flex-shrink-0">{t('reseau_page.sans_compte')}</span>
                      }
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.categorie?.icon && `${s.categorie.icon} `}{s.categorie?.nom}
                      {s.ville && ` · ${s.ville}`}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {query.length >= 2 && !rechercheLoading && resultats.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-3 mt-2">{t('reseau_page.aucune_structure').replace('{{q}}', query)}</p>
            )}
          </div>
        ) : !selectionne.a_compte ? (
          /* Structure sans compte */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm flex-shrink-0">
                {selectionne.nom?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm">{selectionne.nom}</p>
                {selectionne.ville && <p className="text-xs text-gray-500">{selectionne.ville}</p>}
              </div>
              <button type="button" onClick={() => setSelectionne(null)} className="text-gray-400 hover:text-gray-600 text-sm flex-shrink-0">✕</button>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
              <p className="font-semibold mb-1">{t('reseau_page.pas_de_compte_titre')}</p>
              <p>{t('reseau_page.pas_de_compte_desc')}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectionne(null)}
              className="w-full py-2.5 border border-gray-300 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
            >
              {t('reseau_page.choisir_autre')}
            </button>
          </div>
        ) : (
          /* Structure avec compte → formulaire demande */
          <form onSubmit={envoyer} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <Avatar nom={selectionne.nom} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-gray-800 text-sm">{selectionne.nom}</p>
                  {selectionne.compte?.badge_verifie && <span className="text-green-600 text-xs">✓</span>}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {selectionne.compte?.nom_contact}{selectionne.ville && ` · ${selectionne.ville}`}
                </p>
              </div>
              <button type="button" onClick={() => setSelectionne(null)} className="text-gray-400 hover:text-gray-600 text-sm flex-shrink-0">✕</button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('reseau_page.message_optionnel')}</label>
              <textarea
                rows={3}
                placeholder={t('reseau_page.placeholder_presentation')}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700">
                {t('reseau_page.info_examen')}
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setSelectionne(null)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
                {t('reseau_page.changer')}
              </button>
              <button type="submit" disabled={envoyant} className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition">
                {envoyant ? t('reseau_page.envoi') : t('reseau_page.envoyer_demande')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page principale
───────────────────────────────────────────── */
export default function ReseauEntreprisePage() {
  return (
    <Suspense fallback={<EntrepriseLayout titre="Mon réseau"><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></EntrepriseLayout>}>
      <ReseauEntreprise />
    </Suspense>
  );
}

function ReseauEntreprise() {
  const { t, lang } = useT();
  const formatDate = makeFormatDate(t, lang);
  const [token, setToken] = useState('');
  const [compte, setCompte] = useState(null);
  const [loading, setLoading] = useState(true);

  const [conversations, setConversations] = useState([]);
  const [demandes, setDemandes] = useState({ envoyees: [], recues: [] });

  // Mobile : 'liste' | 'chat' | 'demandes'
  const [vueMobile, setVueMobile] = useState('liste');

  // Desktop : conversation ouverte (null = état vide)
  const [convActiveId, setConvActiveId] = useState(null);
  const [convActiveData, setConvActiveData] = useState(null); // { conversation, messages, interlocuteur }
  const [convLoading, setConvLoading] = useState(false);
  const [convBloquee, setConvBloquee] = useState(false);

  const [nouveauMessage, setNouveauMessage] = useState('');
  const [envoyant, setEnvoyant] = useState(false);

  const [showDrawerDemande, setShowDrawerDemande] = useState(false);
  const [panneauGauche, setPanneauGauche] = useState('conversations'); // 'conversations' | 'demandes'

  // Pré-remplissage contextuel (?contact=&from=&ref=)
  const searchParams = useSearchParams();
  const router = useRouter();
  const [prefillStructureId, setPrefillStructureId] = useState(null);
  const [prefillMessage, setPrefillMessage] = useState('');

  useEffect(() => {
    const ctx = lireContexteDepuisURL(searchParams);
    if (ctx?.structureId) {
      setPrefillStructureId(ctx.structureId);
      setPrefillMessage(messageContextuelDepuis(ctx, t));
      setShowDrawerDemande(true);
    }
  }, [searchParams, t]);

  const messagesEndRef = useRef(null);

  /* ── Init ── */
  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (!auth) return;
    const { token: tk, compte: c } = JSON.parse(auth);
    setToken(tk);
    setCompte(c);
    chargerTout(tk);
  }, []);

  /* ── Scroll messages ── */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [convActiveData?.messages]);

  /* ── Chargement liste ── */
  const chargerTout = async (tk) => {
    setLoading(true);
    try {
      const [resConv, resDemandes] = await Promise.all([
        fetch('/api/entreprise/conversations', { headers: { Authorization: `Bearer ${tk}` } }),
        fetch('/api/entreprise/contacts', { headers: { Authorization: `Bearer ${tk}` } }),
      ]);
      if (resConv.ok) {
        const { conversations: c } = await resConv.json();
        setConversations(c || []);
      }
      if (resDemandes.ok) {
        const d = await resDemandes.json();
        setDemandes(d);
      }
    } catch {}
    setLoading(false);
  };

  /* ── Ouvrir une conversation ── */
  const ouvrirConversation = async (convId) => {
    setConvActiveId(convId);
    setConvLoading(true);
    setConvBloquee(false);
    setVueMobile('chat');
    try {
      const res = await fetch(`/api/entreprise/conversations/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        setConvBloquee(true);
        setConvActiveData(null);
      } else if (res.ok) {
        const data = await res.json();
        setConvActiveData({
          conversation: data.conversation,
          messages: data.messages || [],
          interlocuteur: data.interlocuteur,
        });
        setConvBloquee(false);
        chargerTout(token);
      }
    } catch {}
    setConvLoading(false);
  };

  /* ── Fermer conversation (mobile retour) ── */
  const fermerConversation = () => {
    setConvActiveId(null);
    setConvActiveData(null);
    setConvBloquee(false);
    setVueMobile('liste');
    chargerTout(token);
  };

  /* ── Envoyer message ── */
  const envoyerMessage = async (e) => {
    e.preventDefault();
    if (!nouveauMessage.trim() || !convActiveId) return;
    setEnvoyant(true);
    try {
      const res = await fetch(`/api/entreprise/conversations/${convActiveId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu: nouveauMessage }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setConvActiveData(prev => prev ? { ...prev, messages: [...prev.messages, message] } : prev);
        setNouveauMessage('');
      } else if (res.status === 403) {
        setConvBloquee(true);
      }
    } catch {}
    setEnvoyant(false);
  };

  /* ── Supprimer une demande ── */
  const supprimerDemande = async (demandeId) => {
    if (demandeId === 'vider_refusees') {
      const refusees = (demandes.envoyees || []).filter(d => d.statut === 'refusee');
      await Promise.all(
        refusees.map(d =>
          fetch('/api/entreprise/contacts', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ demande_id: d.id }),
          })
        )
      );
    } else {
      await fetch('/api/entreprise/contacts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ demande_id: demandeId }),
      });
    }
    chargerTout(token);
  };

  /* ── Compteurs ── */
  const totalNonLus = conversations.reduce((acc, c) => acc + (c.nonLus || 0), 0);
  const demandesEnAttente = (demandes.recues || []).filter(d => d.statut === 'en_attente').length;

  /* ── Loading initial ── */
  if (loading) {
    return (
      <EntrepriseLayout titre={t('reseau_page.titre')}>
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </EntrepriseLayout>
    );
  }

  const interlocuteur = convActiveData?.interlocuteur;
  const messages = convActiveData?.messages || [];
  const convSelectionnee = conversations.find(c => c.id === convActiveId);

  /* ─────────────────────────────────────
     Colonne gauche (panneau conversations)
  ───────────────────────────────────── */
  const ColonneGauche = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header panneau gauche */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-base">{t('reseau_page.reseau_label')}</h2>
          <button
            onClick={() => setShowDrawerDemande(true)}
            className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-primary/90 transition shadow-sm"
          >
            <span className="text-sm leading-none">+</span>
            <span>{t('reseau_page.nouvelle_demande_btn')}</span>
          </button>
        </div>

        {/* Onglets panneau gauche */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setPanneauGauche('conversations')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition relative ${
              panneauGauche === 'conversations' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('reseau_page.messages_tab')}
            {totalNonLus > 0 && (
              <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {totalNonLus > 9 ? '9+' : totalNonLus}
              </span>
            )}
          </button>
          <button
            onClick={() => setPanneauGauche('demandes')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition relative ${
              panneauGauche === 'demandes' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('reseau_page.demandes_tab')}
            {demandesEnAttente > 0 && (
              <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {demandesEnAttente}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Corps du panneau gauche */}
      {panneauGauche === 'conversations' ? (
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl">💬</div>
              <p className="text-sm font-semibold text-gray-600">{t('reseau_page.aucune_conversation')}</p>
              <p className="text-xs text-gray-400">{t('reseau_page.aucune_conversation_desc')}</p>
              <button
                onClick={() => setShowDrawerDemande(true)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t('reseau_page.envoyer_demande_link')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map(conv => {
                const dernierMsg = conv.messages_b2b?.[0];
                const isActive = convActiveId === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => ouvrirConversation(conv.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                      isActive ? 'bg-primary/8 border-r-2 border-primary' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar nom={conv.interlocuteur?.nom_contact} size="md" />
                      {conv.nonLus > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                          {conv.nonLus > 9 ? '9+' : conv.nonLus}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 justify-between">
                        <p className={`text-sm truncate ${conv.nonLus > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                          {conv.interlocuteur?.nom_contact}
                          {conv.interlocuteur?.badge_verifie && <span className="ml-1 text-green-600 text-xs">✓</span>}
                        </p>
                        <span className="text-[11px] text-gray-400 flex-shrink-0 ml-1">{formatDate(conv.updated_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {conv.interlocuteur?.structures?.nom || t('reseau_page.aucune_structure_label')}
                      </p>
                      {dernierMsg && (
                        <p className={`text-xs truncate mt-0.5 ${conv.nonLus > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                          {dernierMsg.contenu}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <PanneauDemandes
          demandes={demandes}
          onOuvrirConversation={(id) => { ouvrirConversation(id); setPanneauGauche('conversations'); }}
          onSupprimerDemande={supprimerDemande}
          formatDate={formatDate}
        />
      )}
    </div>
  );

  /* ─────────────────────────────────────
     Colonne droite (conversation active)
  ───────────────────────────────────── */
  const ColonneDroite = (
    <div className="flex flex-col h-full bg-gray-50">
      {convActiveId === null ? (
        /* État vide desktop */
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-4xl shadow-sm">
            💬
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-gray-700">{t('reseau_page.selectionnez_conversation')}</p>
            <p className="text-sm text-gray-400 max-w-xs">
              {t('reseau_page.selectionnez_desc')}
            </p>
          </div>
          <button
            onClick={() => setShowDrawerDemande(true)}
            className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-primary/90 transition shadow-sm"
          >
            <span>+</span>
            <span>{t('reseau_page.nouvelle_demande_btn')}</span>
          </button>
        </div>
      ) : convLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Header conversation */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
            {/* Bouton retour mobile uniquement */}
            <button
              onClick={fermerConversation}
              className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition flex-shrink-0 text-lg"
              aria-label={t('reseau_page.retour_liste')}
            >
              ←
            </button>
            <Avatar nom={interlocuteur?.nom_contact || convSelectionnee?.interlocuteur?.nom_contact} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-gray-800 text-sm truncate">
                  {interlocuteur?.nom_contact || convSelectionnee?.interlocuteur?.nom_contact}
                </p>
                {(interlocuteur?.badge_verifie || convSelectionnee?.interlocuteur?.badge_verifie) && (
                  <span className="text-green-600 text-xs flex-shrink-0">✓</span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {interlocuteur?.structures?.nom || convSelectionnee?.interlocuteur?.structures?.nom || t('reseau_page.aucune_structure_label')}
              </p>
            </div>
          </div>

          {/* Zone messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {convBloquee ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-6">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-2xl">🔒</div>
                <p className="font-bold text-gray-700">{t('reseau_page.conversation_suspendue')}</p>
                <p className="text-sm text-gray-500 max-w-xs">
                  {t('reseau_page.renouvelez_abo')}
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400">{t('reseau_page.demarrez_conversation')}</p>
              </div>
            ) : (
              messages.map(msg => {
                const estMoi = msg.expediteur_id === compte?.id;
                return (
                  <div key={msg.id} className={`flex ${estMoi ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      estMoi
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                    }`}>
                      <p className="leading-relaxed">{msg.contenu}</p>
                      <p className={`text-[11px] mt-1 ${estMoi ? 'text-white/70' : 'text-gray-400'}`}>
                        {formatDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          {!convBloquee && (
            <form onSubmit={envoyerMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2 items-end">
              <input
                type="text"
                value={nouveauMessage}
                onChange={e => setNouveauMessage(e.target.value)}
                placeholder={t('reseau_page.placeholder_message')}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={envoyant}
              />
              <button
                type="submit"
                disabled={envoyant || !nouveauMessage.trim()}
                className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition text-lg"
                aria-label={t('reseau_page.envoyer_aria')}
              >
                {envoyant ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>→</span>
                )}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );

  /* ─────────────────────────────────────
     Rendu principal
  ───────────────────────────────────── */
  return (
    <EntrepriseLayout titre={t('reseau_page.titre')}>
      {/* Drawer nouvelle demande */}
      {showDrawerDemande && (
        <DrawerNouvelleDemande
          token={token}
          prefillStructureId={prefillStructureId}
          prefillMessage={prefillMessage}
          onSuccess={() => {
            setShowDrawerDemande(false);
            setPrefillStructureId(null);
            setPrefillMessage('');
            if (searchParams?.get('contact')) router.replace('/entreprise/dashboard/reseau');
            chargerTout(token);
          }}
          onClose={() => {
            setShowDrawerDemande(false);
            setPrefillStructureId(null);
            setPrefillMessage('');
            if (searchParams?.get('contact')) router.replace('/entreprise/dashboard/reseau');
          }}
        />
      )}

      {/* ── LAYOUT DESKTOP : split-pane ── */}
      <div className="hidden lg:flex h-[calc(100vh-8rem)] rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Colonne gauche fixe */}
        <div className="w-80 flex-shrink-0 flex flex-col">
          {ColonneGauche}
        </div>
        {/* Colonne droite flexible */}
        <div className="flex-1 flex flex-col min-w-0">
          {ColonneDroite}
        </div>
      </div>

      {/* ── LAYOUT MOBILE : une vue à la fois ── */}
      <div className="lg:hidden h-[calc(100vh-7rem)] flex flex-col rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Mobile : liste */}
        {vueMobile === 'liste' && (
          <div className="flex flex-col h-full">
            {ColonneGauche}
          </div>
        )}

        {/* Mobile : chat */}
        {vueMobile === 'chat' && (
          <div className="flex flex-col h-full">
            {ColonneDroite}
          </div>
        )}
      </div>
    </EntrepriseLayout>
  );
}
