'use client';
import { toast, confirmDialog } from '@/lib/toast';
import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import AdminNewsletterQueue from '@/components/admin/AdminNewsletterQueue';
import { adminFetch } from '@/lib/adminFetch';

export default function AdminNewsletter() {
  const [onglet, setOnglet] = useState('queue');
  const [stats, setStats] = useState({
    total: 0, actifs: 0, inactifs: 0, en_attente: 0, envoyes: 0
  });

  // Message libre
  const [form, setForm] = useState({ sujet: '', contenu: '', cible: 'tous' });
  const [envoi, setEnvoi] = useState({ loading: false, resultat: null });

  // Abonnés
  const [abonnes, setAbonnes] = useState([]);
  const [loadingAbonnes, setLoadingAbonnes] = useState(false);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    chargerStats();
  }, []);

  const chargerStats = async () => {
    try {
      const res = await adminFetch('/api/admin/newsletter/abonnes?stats=1');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Erreur stats newsletter:', err);
    }
  };

  const chargerAbonnes = async () => {
    setLoadingAbonnes(true);
    try {
      const res = await adminFetch('/api/admin/newsletter/abonnes');
      if (res.ok) {
        const { abonnes: data } = await res.json();
        setAbonnes(data || []);
      }
    } catch (err) {
      console.error('Erreur chargement abonnés:', err);
    }
    setLoadingAbonnes(false);
  };

  useEffect(() => {
    if (onglet === 'abonnes') chargerAbonnes();
  }, [onglet]);

  // Recherche filtrée
  const abonnesFiltres = useMemo(() => {
    if (!recherche.trim()) return abonnes;
    const q = recherche.trim().toLowerCase();
    return abonnes.filter(a =>
      a.email?.toLowerCase().includes(q) ||
      a.nom?.toLowerCase().includes(q)
    );
  }, [abonnes, recherche]);

  // Envoi message libre — via route API server-side
  const handleEnvoyerMessage = async (e) => {
    e.preventDefault();
    if (!form.sujet.trim() || !form.contenu.trim()) return;
    setEnvoi({ loading: true, resultat: null });
    try {
      const res = await adminFetch('/api/admin/newsletter/message-libre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setEnvoi({ loading: false, resultat: { success: true, ...data } });
        setForm({ sujet: '', contenu: '', cible: 'tous' });
        chargerStats();
      } else {
        setEnvoi({ loading: false, resultat: { success: false, reason: data.error } });
      }
    } catch (err) {
      setEnvoi({ loading: false, resultat: { success: false, reason: err.message } });
    }
  };

  const handleDesabonner = async (id) => {
    if (!(await confirmDialog({ message: 'Désabonner cet abonné ?', danger: true }))) return;
    await adminFetch(`/api/admin/newsletter/abonnes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif: false }),
    });
    chargerAbonnes();
    chargerStats();
  };

  const handleReabonner = async (id) => {
    await adminFetch(`/api/admin/newsletter/abonnes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actif: true }),
    });
    chargerAbonnes();
    chargerStats();
  };

  const cibles = [
    { value: 'tous',                   label: '👥 Tous les abonnés actifs' },
    { value: 'preferences_structures', label: '🏢 Intéressés par les entreprises' },
    { value: 'preferences_produits',   label: '📦 Intéressés par les produits' },
    { value: 'preferences_promos',     label: '🔥 Promotions & Annonces' },
  ];

  return (
    <AdminLayout titre="Newsletter" sousTitre={`${stats.actifs} abonné(s) actif(s)`}>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total abonnés',  value: stats.total,      bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-800'  },
          { label: 'Actifs',         value: stats.actifs,     bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-700' },
          { label: 'Désabonnés',     value: stats.inactifs,   bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-700'   },
          { label: 'En attente',     value: stats.en_attente, bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-700'},
          { label: 'Emails envoyés', value: stats.envoyes,    bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700'  },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl border ${s.border} p-4`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Onglets ── */}
      <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm border border-gray-200 w-fit mb-6">
        {[
          { key: 'queue',   label: "📬 File d'attente" },
          { key: 'message', label: '✏️ Message libre'  },
          { key: 'abonnes', label: '👥 Abonnés'        },
        ].map(o => (
          <button
            key={o.key}
            onClick={() => setOnglet(o.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
              onglet === o.key
                ? 'bg-primary text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ── ONGLET FILE D'ATTENTE ── */}
      {onglet === 'queue' && <AdminNewsletterQueue onStatChange={chargerStats} />}

      {/* ── ONGLET MESSAGE LIBRE ── */}
      {onglet === 'message' && (
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl">
          <h2 className="text-lg font-bold text-gray-800 mb-6">
            ✏️ Envoyer un message personnalisé
          </h2>

          <form onSubmit={handleEnvoyerMessage} className="space-y-6">
            {/* Cible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destinataires</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cibles.map(c => (
                  <label
                    key={c.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      form.cible === c.value
                        ? 'border-primary bg-primary/5 text-primary font-semibold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cible"
                      value={c.value}
                      checked={form.cible === c.value}
                      onChange={e => setForm(f => ({ ...f, cible: e.target.value }))}
                      className="accent-primary"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Sujet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sujet de l'email *</label>
              <input
                type="text"
                value={form.sujet}
                onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))}
                placeholder="Ex : 🎉 Offre spéciale cette semaine !"
                required
                className="input-field"
              />
            </div>

            {/* Contenu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contenu du message *</label>
              <textarea
                value={form.contenu}
                onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))}
                placeholder={`Bonjour,\n\nNous avons une nouvelle offre spéciale pour vous...\n\nÀ bientôt,\nL'équipe ChezMonAmi`}
                required
                rows={10}
                className="input-field resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Les retours à la ligne sont conservés dans l'email.</p>
            </div>

            {/* Résultat */}
            {envoi.resultat && (
              <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
                envoi.resultat.success
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {envoi.resultat.success
                  ? `✅ Message envoyé à ${envoi.resultat.envoyes} abonné(s)${envoi.resultat.echecs > 0 ? ` (${envoi.resultat.echecs} échec(s))` : ''}`
                  : `❌ Erreur : ${envoi.resultat.reason}`}
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={envoi.loading || !form.sujet.trim() || !form.contenu.trim()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {envoi.loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : '📤 Envoyer le message'}
              </button>
              <button
                type="button"
                onClick={() => setForm({ sujet: '', contenu: '', cible: 'tous' })}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                Effacer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── ONGLET ABONNÉS ── */}
      {onglet === 'abonnes' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-800">
              👥 Liste des abonnés
              <span className="ml-2 text-sm font-normal text-gray-400">
                {abonnesFiltres.length} / {abonnes.length}
              </span>
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-3 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={recherche}
                  onChange={e => setRecherche(e.target.value)}
                  placeholder="Rechercher par email ou nom..."
                  className="input-field pl-9 py-2 text-sm w-72"
                />
                {recherche && (
                  <button onClick={() => setRecherche('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
                )}
              </div>
              <button
                onClick={chargerAbonnes}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </button>
            </div>
          </div>

          {loadingAbonnes ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Email', 'Nom', 'Statut', 'Inscrit le', 'Dernier email', 'Préférences', 'Action'].map(h => (
                      <th key={h} className={`py-3 px-4 font-semibold text-gray-600 ${h === 'Action' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {abonnesFiltres.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{a.email}</td>
                      <td className="py-3 px-4 text-gray-600">{a.nom || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${a.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {a.actif ? '✅ Actif' : '🚫 Désabonné'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {a.date_inscription ? new Date(a.date_inscription).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {a.derniere_notification ? new Date(a.derniere_notification).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {a.preferences?.nouvelles_structures !== false && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">🏢</span>}
                          {a.preferences?.nouveaux_produits !== false && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">📦</span>}
                          {(a.preferences?.promotions !== false || a.preferences?.annonces !== false) && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">🔥</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {a.actif ? (
                          <button onClick={() => handleDesabonner(a.id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium">Désabonner</button>
                        ) : (
                          <button onClick={() => handleReabonner(a.id)} className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium">Réabonner</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {abonnesFiltres.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-xl text-gray-600 mb-2">
                    {recherche ? `Aucun résultat pour "${recherche}"` : 'Aucun abonné pour le moment'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </AdminLayout>
  );
}
