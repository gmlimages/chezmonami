'use client';
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../AdminLayout';
import { toast, confirmDialog } from '@/lib/toast';

const CONTEXTES = [
  { value: '', label: 'Général' },
  { value: 'message_b2b', label: 'Message B2B' },
  { value: 'demande_contact', label: 'Demande de contact' },
  { value: 'reclamation', label: 'Réclamation' },
  { value: 'badge', label: 'Badge / vérification' },
  { value: 'appel_offres', label: "Appel d'offres" },
  { value: 'autre', label: 'Autre' },
];

export default function PageTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('');
  const [edition, setEdition] = useState(null); // null | { id?, titre, contenu, contexte, partage }
  const [substitution, setSubstitution] = useState(null); // null | { id, titre, contenu, variables: {nom: ''} }

  // Extrait les variables {{xxx}} uniques d'un texte, dans l'ordre d'apparition
  const extraireVariables = (txt) => {
    const re = /\{\{\s*([\w.-]+)\s*\}\}/g;
    const set = new Set();
    let m;
    while ((m = re.exec(txt || '')) !== null) set.add(m[1]);
    return Array.from(set);
  };

  // Remplace toutes les occurrences {{var}} par les valeurs (vide si non fourni)
  const appliquerVariables = (txt, vars) =>
    (txt || '').replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, k) => (vars[k] ?? `{{${k}}}`));

  // Ouvre la modale de substitution OU copie directement si aucune variable
  const lancerCopie = async (template) => {
    const vars = extraireVariables(template.contenu);
    if (vars.length === 0) {
      await navigator.clipboard.writeText(template.contenu);
      toast.success('Copié');
      incrementerUsage(template.id);
      return;
    }
    const initiales = {};
    vars.forEach((v) => { initiales[v] = ''; });
    setSubstitution({
      id: template.id,
      titre: template.titre,
      contenu: template.contenu,
      variables: initiales,
    });
  };

  const incrementerUsage = async (id) => {
    try {
      const auth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      await fetch(`/api/admin/templates-reponse/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.sessionToken}` },
        body: JSON.stringify({ incrementUsage: true }),
      });
      // Pas de rechargement complet — on incrémente localement pour le UX
      setTemplates((arr) => arr.map((t) => t.id === id ? { ...t, utilisations: (t.utilisations || 0) + 1 } : t));
    } catch {}
  };

  const copierAvecVariables = async () => {
    if (!substitution) return;
    const texte = appliquerVariables(substitution.contenu, substitution.variables);
    await navigator.clipboard.writeText(texte);
    toast.success('Message personnalisé copié');
    incrementerUsage(substitution.id);
    setSubstitution(null);
  };

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const auth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      const res = await fetch('/api/admin/templates-reponse', {
        headers: { Authorization: `Bearer ${auth.sessionToken}` },
      });
      const data = await res.json();
      if (res.ok) setTemplates(data.templates || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const sauver = async () => {
    if (!edition?.titre || !edition?.contenu) {
      toast.error('Titre et contenu obligatoires');
      return;
    }
    try {
      const auth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      const url = edition.id
        ? `/api/admin/templates-reponse/${edition.id}`
        : '/api/admin/templates-reponse';
      const method = edition.id ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.sessionToken}` },
        body: JSON.stringify({
          titre: edition.titre,
          contenu: edition.contenu,
          contexte: edition.contexte || null,
          partage: !!edition.partage,
        }),
      });
      if (res.ok) {
        toast.success(edition.id ? 'Template modifié' : 'Template créé');
        setEdition(null);
        charger();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur réseau');
    }
  };

  const supprimer = async (id) => {
    const ok = await confirmDialog({
      titre: 'Supprimer ce template ?',
      message: 'Action définitive.',
      texteBouton: 'Supprimer',
      type: 'danger',
    });
    if (!ok) return;
    const auth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
    const res = await fetch(`/api/admin/templates-reponse/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.sessionToken}` },
    });
    if (res.ok) { toast.success('Template supprimé'); charger(); }
    else toast.error('Erreur suppression');
  };

  const filtres = templates.filter((t) => {
    if (!filtre) return true;
    const q = filtre.toLowerCase();
    return (
      t.titre?.toLowerCase().includes(q) ||
      t.contenu?.toLowerCase().includes(q) ||
      t.contexte?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout titre="Templates de réponse" sousTitre="Messages-types réutilisables">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Rechercher…"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72"
          />
          <button
            type="button"
            onClick={() => setEdition({ titre: '', contenu: '', contexte: '', partage: false })}
            className="ml-auto bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90"
          >
            + Nouveau template
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-gray-400">Chargement…</p>
          ) : filtres.length === 0 ? (
            <p className="text-gray-400">Aucun template.</p>
          ) : (
            filtres.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{t.titre}</h3>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {t.contexte && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{t.contexte}</span>}
                      {t.partage && <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">Partagé</span>}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-600">{t.utilisations} util.</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-4 whitespace-pre-wrap">{t.contenu}</p>
                <div className="mt-3 flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => lancerCopie(t)}
                    className="flex-1 text-xs font-medium px-2 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
                  >
                    📋 Copier
                  </button>
                  <button
                    type="button"
                    onClick={() => setEdition({
                      id: t.id,
                      titre: t.titre,
                      contenu: t.contenu,
                      contexte: t.contexte || '',
                      partage: t.partage,
                    })}
                    className="text-xs font-medium px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => supprimer(t.id)}
                    className="text-xs font-medium px-2 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal édition */}
      {edition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEdition(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">{edition.id ? 'Modifier le template' : 'Nouveau template'}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                value={edition.titre}
                onChange={(e) => setEdition({ ...edition, titre: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
              <textarea
                rows={8}
                value={edition.contenu}
                onChange={(e) => setEdition({ ...edition, contenu: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y"
                placeholder="Bonjour {{nom}}, …  (vous pouvez utiliser des variables type {{nom}} à remplacer manuellement avant envoi)"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contexte</label>
                <select
                  value={edition.contexte || ''}
                  onChange={(e) => setEdition({ ...edition, contexte: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {CONTEXTES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 mt-7">
                <input
                  type="checkbox"
                  checked={!!edition.partage}
                  onChange={(e) => setEdition({ ...edition, partage: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Partager avec les autres admins</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEdition(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={sauver}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
              >
                {edition.id ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de substitution de variables */}
      {substitution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSubstitution(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Personnaliser le message</h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{substitution.titre}</p>
            </div>

            {/* Champs de saisie pour chaque variable */}
            <div className="space-y-2">
              {Object.keys(substitution.variables).map((cle) => (
                <div key={cle}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <code className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">{`{{${cle}}}`}</code>
                  </label>
                  <input
                    type="text"
                    value={substitution.variables[cle]}
                    onChange={(e) => setSubstitution({
                      ...substitution,
                      variables: { ...substitution.variables, [cle]: e.target.value },
                    })}
                    placeholder={`Valeur pour ${cle}…`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>

            {/* Aperçu live */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Aperçu</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm whitespace-pre-wrap text-gray-800 max-h-64 overflow-y-auto">
                {appliquerVariables(substitution.contenu, substitution.variables)}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubstitution(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={copierAvecVariables}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
              >
                📋 Copier le message
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
