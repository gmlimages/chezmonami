'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import { supabase } from '@/lib/supabase';

// ── Helpers ──────────────────────────────────────────────────────────────────

function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const key = keyFn(item) || 'Inconnu';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      year: d.getFullYear(),
      month: d.getMonth(),
      count: 0,
    });
  }
  return months;
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function BarRow({ label, count, maxCount, color = 'bg-primary' }) {
  const width = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-sm text-gray-700 truncate text-right">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div
          className={`${color} h-5 rounded-full transition-all duration-500`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="w-8 shrink-0 text-sm font-semibold text-gray-700 text-right">{count}</div>
    </div>
  );
}

function KpiCard({ label, value, icon, bgIcon, textColor = 'text-gray-800' }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${bgIcon} rounded-xl flex items-center justify-center text-2xl shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminStatistiques() {
  const [loading, setLoading] = useState(true);
  const [tousComptes, setTousComptes] = useState([]);
  const [listePays, setListePays] = useState([]);
  const [filtreP, setFiltreP] = useState('');

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comptes_structures')
        .select(`
          id, statut, badge_verifie, abonnement, date_inscription, demande_suppression,
          structures (
            id, nom,
            pays (nom),
            villes (nom)
          )
        `);

      if (error) throw error;

      const comptes = data || [];
      setTousComptes(comptes);

      const pays = [...new Set(
        comptes.map(c => c.structures?.pays?.nom).filter(Boolean)
      )].sort();
      setListePays(pays);
    } catch (err) {
      console.error('Erreur chargement statistiques :', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <AdminLayout titre="Statistiques" sousTitre="Vue d'ensemble des sociétés inscrites">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement des statistiques...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ── Filtrage par pays ──
  const comptes = filtreP
    ? tousComptes.filter(c => c.structures?.pays?.nom === filtreP)
    : tousComptes;

  // ── KPIs calculés ──
  const total              = comptes.length;
  const actifs             = comptes.filter(c => c.statut === 'actif').length;
  const enAttente          = comptes.filter(c => c.statut === 'en_attente').length;
  const suspendus          = comptes.filter(c => c.statut === 'suspendu').length;
  const badgeVerifie       = comptes.filter(c => c.badge_verifie).length;
  const avecStructure      = comptes.filter(c => c.structures?.id).length;
  const sansStructure      = comptes.filter(c => !c.structures?.id).length;
  const demandesSuppression = comptes.filter(c => c.demande_suppression).length;

  // ── Par statut ──
  const STATUTS = [
    { key: 'actif',      label: 'Actif',       color: 'bg-green-500' },
    { key: 'en_attente', label: 'En attente',  color: 'bg-yellow-400' },
    { key: 'suspendu',   label: 'Suspendu',    color: 'bg-red-500' },
    { key: 'inactif',    label: 'Inactif',     color: 'bg-gray-400' },
  ];
  const grouped_statut = groupBy(comptes, c => c.statut);
  const parStatut = STATUTS.map(s => ({
    label: s.label,
    count: grouped_statut[s.key] || 0,
    color: s.color,
  }));
  const maxStatut = Math.max(...parStatut.map(s => s.count), 1);

  // ── Par abonnement ──
  const TYPES_ABO = ['gratuit', 'mensuel', 'trimestriel', 'semestriel', 'annuel'];
  const grouped_abo = groupBy(comptes, c => c.abonnement || 'gratuit');
  const parAbonnement = TYPES_ABO.map(t => ({
    label: t.charAt(0).toUpperCase() + t.slice(1),
    count: grouped_abo[t] || 0,
    color: t === 'gratuit' ? 'bg-gray-400'
         : t === 'mensuel' ? 'bg-blue-400'
         : t === 'trimestriel' ? 'bg-indigo-500'
         : t === 'semestriel' ? 'bg-violet-500'
         : 'bg-primary',
  }));
  const maxAbo = Math.max(...parAbonnement.map(a => a.count), 1);

  // ── Par pays ──
  const grouped_pays = groupBy(tousComptes, c => c.structures?.pays?.nom || 'Sans pays');
  const parPays = Object.entries(grouped_pays)
    .map(([nom, count]) => ({ nom, count }))
    .sort((a, b) => b.count - a.count);
  const maxPays = Math.max(...parPays.map(p => p.count), 1);

  // ── Par ville (top 10, dans le filtre pays) ──
  const grouped_ville = groupBy(comptes, c => c.structures?.villes?.nom || null);
  delete grouped_ville['Inconnu'];
  const parVille = Object.entries(grouped_ville)
    .map(([nom, count]) => ({ nom, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const maxVille = Math.max(...parVille.map(v => v.count), 1);

  // ── Inscriptions par mois (6 derniers) ──
  const moisTemplate = getLast6Months();
  comptes.forEach(c => {
    if (!c.date_inscription) return;
    const d = new Date(c.date_inscription);
    const m = moisTemplate.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (m) m.count++;
  });
  const maxMois = Math.max(...moisTemplate.map(m => m.count), 1);

  return (
    <AdminLayout titre="Statistiques" sousTitre="Vue d'ensemble des sociétés inscrites">
      <div className="space-y-6">

        {/* ── Barre d'actions : filtre pays + actualiser ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-semibold text-gray-600">Filtrer par pays :</label>
            <select
              value={filtreP}
              onChange={e => setFiltreP(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Tous les pays</option>
              {listePays.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {filtreP && (
              <button
                onClick={() => setFiltreP('')}
                className="text-xs text-gray-500 hover:text-red-500 underline transition"
              >
                Réinitialiser
              </button>
            )}
          </div>
          <button
            onClick={chargerDonnees}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 shadow-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>

        {filtreP && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-700">
            Affichage filtré pour : <strong>{filtreP}</strong> — {total} compte{total > 1 ? 's' : ''}
          </div>
        )}

        {/* ── Ligne 1 : KPIs principaux ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total sociétés"    value={total}       icon="🏢" bgIcon="bg-blue-100"   textColor="text-blue-700" />
          <KpiCard label="Comptes actifs"    value={actifs}      icon="✅" bgIcon="bg-green-100"  textColor="text-green-700" />
          <KpiCard label="En attente"        value={enAttente}   icon="⏳" bgIcon="bg-yellow-100" textColor="text-yellow-700" />
          <KpiCard label="Badge vérifié"     value={badgeVerifie} icon="🏅" bgIcon="bg-purple-100" textColor="text-purple-700" />
        </div>

        {/* ── Ligne 2 : KPIs secondaires ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Avec structure"        value={avecStructure}      icon="🔗" bgIcon="bg-teal-100"   textColor="text-teal-700" />
          <KpiCard label="Suspendus"             value={suspendus}          icon="🚫" bgIcon="bg-red-100"    textColor="text-red-700" />
          <KpiCard label="Dem. suppression"      value={demandesSuppression} icon="🗑️" bgIcon="bg-orange-100" textColor="text-orange-700" />
          <KpiCard label="Sans structure"        value={sansStructure}      icon="❓" bgIcon="bg-gray-100"   textColor="text-gray-600" />
        </div>

        {/* ── Ligne 3 : Statuts + Abonnements ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Répartition par statut */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-5">Répartition par statut</h2>
            {total === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
            ) : (
              <div className="space-y-4">
                {parStatut.map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{s.label}</span>
                      <span className="font-bold text-gray-800">{s.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`${s.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${(s.count / maxStatut) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Répartition par abonnement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-5">Répartition par abonnement</h2>
            {total === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
            ) : (
              <div className="space-y-4">
                {parAbonnement.map(a => (
                  <div key={a.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{a.label}</span>
                      <span className="font-bold text-gray-800">{a.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`${a.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${(a.count / maxAbo) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Ligne 4 : Inscriptions par mois ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-5">Inscriptions (6 derniers mois)</h2>
          <div className="flex items-end gap-3 h-40">
            {moisTemplate.map(m => {
              const height = maxMois > 0 ? Math.max((m.count / maxMois) * 100, m.count > 0 ? 6 : 0) : 0;
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-gray-700">{m.count > 0 ? m.count : ''}</span>
                  <div className="w-full bg-gray-100 rounded-t overflow-hidden relative" style={{ height: '90px' }}>
                    <div
                      className="bg-primary w-full rounded-t transition-all duration-500 absolute bottom-0"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 text-center leading-tight">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Ligne 5 : Par pays + Par ville ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Répartition par pays — toujours sur l'ensemble */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">Répartition par pays</h2>
            <p className="text-xs text-gray-400 mb-4">Sur l'ensemble des comptes</p>
            {parPays.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
            ) : (
              <div className="space-y-3">
                {parPays.map(p => (
                  <BarRow key={p.nom} label={p.nom} count={p.count} maxCount={maxPays} color="bg-blue-500" />
                ))}
              </div>
            )}
          </div>

          {/* Top 10 villes — selon le filtre pays */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">Top 10 villes</h2>
            <p className="text-xs text-gray-400 mb-4">
              {filtreP ? `Filtré : ${filtreP}` : 'Tous les pays'}
            </p>
            {parVille.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
            ) : (
              <div className="space-y-3">
                {parVille.map(v => (
                  <BarRow key={v.nom} label={v.nom} count={v.count} maxCount={maxVille} color="bg-teal-500" />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
