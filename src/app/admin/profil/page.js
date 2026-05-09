'use client';
// Profil admin — infos perso, 2FA, mot de passe, et (si super_admin) gestion des autres admins.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../AdminLayout';
import { adminFetch } from '@/lib/adminFetch';
import { toast, confirmDialog } from '@/lib/toast';

function genererMdpTemporaire() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let mdp = '';
  for (let i = 0; i < 14; i++) mdp += chars.charAt(Math.floor(Math.random() * chars.length));
  return mdp;
}

export default function PageProfilAdmin() {
  const router = useRouter();
  const [adminConnecte, setAdminConnecte] = useState(null);
  const [tfaActive, setTfaActive] = useState(null);
  const [savingTfa, setSavingTfa] = useState(false);

  // Liste des admins (super_admin)
  const [admins, setAdmins] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Formulaire création / édition
  const [edition, setEdition] = useState(null); // null | { id?, nom, email, role, mot_de_passe }

  // Form mot de passe perso
  const [mdpForm, setMdpForm] = useState({ ancien: '', nouveau: '', confirm: '' });

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (!auth) { router.push('/dashboard-chezmonami'); return; }
    setAdminConnecte(JSON.parse(auth));
    chargerTfa();
  }, [router]);

  useEffect(() => {
    if (adminConnecte?.role === 'super_admin') chargerAdmins();
  }, [adminConnecte]);

  const chargerTfa = async () => {
    try {
      const res = await adminFetch('/api/admin/tfa');
      if (res.ok) {
        const d = await res.json();
        setTfaActive(!!d.tfa_active);
      }
    } catch {}
  };

  const chargerAdmins = async () => {
    setLoadingList(true);
    try {
      const res = await adminFetch('/api/admin/comptes');
      const d = await res.json();
      if (res.ok) setAdmins(d.admins || []);
    } catch {}
    setLoadingList(false);
  };

  const basculerTfa = async () => {
    if (savingTfa) return;
    setSavingTfa(true);
    try {
      const res = await adminFetch('/api/admin/tfa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !tfaActive }),
      });
      const d = await res.json();
      if (res.ok) {
        setTfaActive(d.tfa_active);
        toast.success(d.tfa_active ? '2FA activée' : '2FA désactivée');
      } else toast.error(d.error || 'Erreur');
    } catch { toast.error('Erreur réseau'); }
    setSavingTfa(false);
  };

  const changerMonMdp = async (e) => {
    e.preventDefault();
    if (mdpForm.nouveau.length < 8) { toast.error('Min 8 caractères'); return; }
    if (mdpForm.nouveau !== mdpForm.confirm) { toast.error('Confirmation incorrecte'); return; }
    try {
      const res = await adminFetch('/api/admin/changer-mot-de-passe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ancienMdp: mdpForm.ancien, nouveauMdp: mdpForm.nouveau }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success('Mot de passe modifié');
        setMdpForm({ ancien: '', nouveau: '', confirm: '' });
      } else toast.error(d.error || 'Erreur');
    } catch { toast.error('Erreur réseau'); }
  };

  // ── Super admin : actions sur les autres admins ───────────────────────────
  const ouvrirCreation = () => {
    setEdition({ nom: '', email: '', role: 'admin', mot_de_passe: genererMdpTemporaire() });
  };

  const ouvrirEdition = (a) => {
    setEdition({ id: a.id, nom: a.nom, email: a.email, role: a.role, mot_de_passe: '' });
  };

  const sauverAdmin = async () => {
    if (!edition.nom || !edition.email) { toast.error('Nom et email requis'); return; }
    if (!edition.id && !edition.mot_de_passe) { toast.error('Mot de passe requis pour la création'); return; }
    try {
      const url = edition.id ? `/api/admin/comptes/${edition.id}` : '/api/admin/comptes';
      const method = edition.id ? 'PATCH' : 'POST';
      const body = { nom: edition.nom, email: edition.email, role: edition.role };
      if (edition.mot_de_passe) body.mot_de_passe = edition.mot_de_passe;

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || 'Erreur'); return; }
      if (!edition.id) {
        toast.success(`Admin créé.\nEmail : ${edition.email}\nMot de passe temporaire : ${edition.mot_de_passe}\n⚠️ Communiquez-le par canal sécurisé.`);
      } else {
        toast.success('Admin modifié');
      }
      setEdition(null);
      chargerAdmins();
    } catch { toast.error('Erreur réseau'); }
  };

  const resetMdp = async (a) => {
    if (!(await confirmDialog({
      titre: `Réinitialiser le mot de passe de ${a.nom} ?`,
      message: 'Un nouveau mot de passe temporaire sera généré.',
      texteBouton: 'Réinitialiser',
    }))) return;
    const mdp = genererMdpTemporaire();
    try {
      const res = await adminFetch(`/api/admin/comptes/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mot_de_passe: mdp, tentatives_connexion: 0, bloque_jusqu_a: null }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(`Mot de passe réinitialisé pour ${a.nom}.\nNouveau MDP temporaire : ${mdp}\n⚠️ Communiquez-le par canal sécurisé.`);
        chargerAdmins();
      } else toast.error(d.error || 'Erreur');
    } catch { toast.error('Erreur réseau'); }
  };

  const debloquer = async (a) => {
    try {
      const res = await adminFetch(`/api/admin/comptes/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tentatives_connexion: 0, bloque_jusqu_a: null }),
      });
      if (res.ok) { toast.success('Compte débloqué'); chargerAdmins(); }
    } catch {}
  };

  const supprimerAdmin = async (a) => {
    if (!(await confirmDialog({
      titre: `Supprimer ${a.nom} ?`,
      message: 'Action définitive.',
      texteBouton: 'Supprimer',
      type: 'danger',
    }))) return;
    try {
      const res = await adminFetch(`/api/admin/comptes/${a.id}`, { method: 'DELETE' });
      const d = await res.json();
      if (res.ok) { toast.success('Admin supprimé'); chargerAdmins(); }
      else toast.error(d.error || 'Erreur');
    } catch {}
  };

  if (!adminConnecte) return null;

  return (
    <AdminLayout titre="Profil" sousTitre="Vos paramètres et la sécurité de votre compte">
      <div className="max-w-3xl space-y-6">

        {/* ─── Identité ─── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-3">👤 Identité</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Nom</p>
              <p className="font-semibold">{adminConnecte.nom}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-semibold truncate">{adminConnecte.email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Rôle</p>
              <p className="font-semibold">
                {adminConnecte.role === 'super_admin' ? '⭐ Super Admin' : '👤 Admin'}
              </p>
            </div>
          </div>
        </section>

        {/* ─── 2FA ─── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-800">🔐 Authentification à 2 facteurs</h2>
              <p className="text-sm text-gray-600 mt-1">
                À chaque connexion, un code à 6 chiffres est envoyé à <strong>{adminConnecte.email}</strong>. Valable 10 minutes.
              </p>
            </div>
            <div className="flex-shrink-0">
              {tfaActive === null ? <span className="text-xs text-gray-400">…</span> : (
                <button
                  type="button"
                  onClick={basculerTfa}
                  disabled={savingTfa}
                  role="switch"
                  aria-checked={tfaActive}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${tfaActive ? 'bg-green-500' : 'bg-gray-300'} ${savingTfa ? 'opacity-50' : ''}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${tfaActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              )}
            </div>
          </div>
          {tfaActive && (
            <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
              ✓ 2FA active.
            </p>
          )}
          {tfaActive === false && (
            <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              ⚠️ 2FA désactivée — recommandée pour protéger votre compte.
            </p>
          )}
        </section>

        {/* ─── Mot de passe ─── */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🔑 Changer mon mot de passe</h2>
          <form onSubmit={changerMonMdp} className="space-y-3 max-w-md">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe actuel</label>
              <input
                type="password"
                required
                value={mdpForm.ancien}
                onChange={(e) => setMdpForm({ ...mdpForm, ancien: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={mdpForm.nouveau}
                onChange={(e) => setMdpForm({ ...mdpForm, nouveau: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Min 8 caractères, majuscule + minuscule + chiffre recommandés.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirmer</label>
              <input
                type="password"
                required
                value={mdpForm.confirm}
                onChange={(e) => setMdpForm({ ...mdpForm, confirm: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90">
              Mettre à jour
            </button>
          </form>
        </section>

        {/* ─── Super admin : gestion des autres admins ─── */}
        {adminConnecte.role === 'super_admin' && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">⭐ Gestion des admins</h2>
              <button
                onClick={ouvrirCreation}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90"
              >
                + Créer un admin
              </button>
            </div>

            {loadingList ? (
              <p className="text-gray-400 text-sm">Chargement…</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {admins.map((a) => {
                  const estMoi = a.id === adminConnecte.id;
                  const bloque = a.bloque_jusqu_a && new Date(a.bloque_jusqu_a) > new Date();
                  return (
                    <li key={a.id} className="py-3 flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {a.nom} {estMoi && <span className="text-xs text-primary">(vous)</span>}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{a.email}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${a.role === 'super_admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {a.role === 'super_admin' ? '⭐ Super Admin' : 'Admin'}
                          </span>
                          {a.tfa_active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">🔐 2FA</span>
                          )}
                          {a.doit_changer_mdp && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">MDP à changer</span>
                          )}
                          {bloque && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">🔒 Bloqué</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => ouvrirEdition(a)} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Modifier</button>
                        <button onClick={() => resetMdp(a)} className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100">Reset MDP</button>
                        {bloque && (
                          <button onClick={() => debloquer(a)} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100">Débloquer</button>
                        )}
                        {!estMoi && (
                          <button onClick={() => supprimerAdmin(a)} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100">Supprimer</button>
                        )}
                      </div>
                    </li>
                  );
                })}
                {admins.length === 0 && (
                  <li className="py-3 text-sm text-gray-400 italic">Aucun admin.</li>
                )}
              </ul>
            )}
          </section>
        )}
      </div>

      {/* ─── Modal édition admin (super_admin) ─── */}
      {edition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEdition(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
            <h2 className="text-lg font-bold">{edition.id ? 'Modifier l\'admin' : 'Créer un admin'}</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
              <input
                type="text"
                value={edition.nom}
                onChange={(e) => setEdition({ ...edition, nom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={edition.email}
                onChange={(e) => setEdition({ ...edition, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rôle</label>
              <select
                value={edition.role}
                onChange={(e) => setEdition({ ...edition, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mot de passe {edition.id ? '(laisser vide pour ne pas changer)' : 'temporaire'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={edition.mot_de_passe}
                  onChange={(e) => setEdition({ ...edition, mot_de_passe: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setEdition({ ...edition, mot_de_passe: genererMdpTemporaire() })}
                  className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                >
                  Générer
                </button>
              </div>
              {edition.mot_de_passe && (
                <p className="text-xs text-gray-500 mt-1">Sera communiqué à l'admin (canal sécurisé). Il devra le changer à la 1ère connexion.</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEdition(null)} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={sauverAdmin} className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90">
                {edition.id ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
