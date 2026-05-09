'use client';
// Sidebar de catégories.
// Deux modes :
//  1) Mode "groupes" (prop `groupes`) : sections pliables type footer
//     (ex. "Production & Industries", "Commerce & Distribution"…).
//     Cliquer sur une section l'ouvre/ferme. Cliquer sur le titre d'une section
//     filtre par toutes les catégories du groupe.
//  2) Mode "arbre" (par défaut) : arborescence basée sur parent_id,
//     ou liste plate si aucun parent_id.
//
// Props :
//  - categories : array d'objets { id, nom, icon?, parent_id?, ... }
//  - valeur : id de la catégorie active (ou valeurTous)
//  - valeurTous : valeur représentant "Toutes" (ex. 'tous' ou 'toutes')
//  - onChange : (id) => void
//  - groupes : (optionnel) array { id, titre, icon, description?, categories: [string] }
//  - groupeActif : (optionnel) array de catégorie_id correspondant au groupe sélectionné
//  - onGroupeChange : (optionnel) (categories[] | null) => void
//  - compteurs : { [id]: number } optionnel
//  - titre : string (par défaut "Catégorie")

import { useMemo, useState } from 'react';

function buildTree(categories) {
  const byId = new Map(categories.map((c) => [c.id, { ...c, enfants: [] }]));
  const racines = [];
  byId.forEach((cat) => {
    if (cat.parent_id && byId.has(cat.parent_id)) {
      byId.get(cat.parent_id).enfants.push(cat);
    } else {
      racines.push(cat);
    }
  });
  return racines;
}

export default function CategoriesSidebar({
  categories = [],
  valeur = 'tous',
  valeurTous = 'tous',
  onChange,
  groupes = null,
  groupeActif = null,
  onGroupeChange,
  compteurs = {},
  titre = 'Catégorie',
}) {
  // ── Hooks toujours appelés (règles des hooks) ────────────────────────────
  const arbre = useMemo(() => buildTree(categories), [categories]);
  const [ouverts, setOuverts] = useState(() => new Set());
  const [voirPlus, setVoirPlus] = useState(false);

  // ── Mode GROUPES ─────────────────────────────────────────────────────────
  if (groupes && groupes.length > 0) {
    return (
      <GroupesView
        categories={categories}
        valeur={valeur}
        valeurTous={valeurTous}
        onChange={onChange}
        groupes={groupes}
        groupeActif={groupeActif}
        onGroupeChange={onGroupeChange}
        compteurs={compteurs}
        titre={titre}
      />
    );
  }

  const toggle = (id) => {
    setOuverts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const LIMITE = 8;
  const racinesAffichees = voirPlus ? arbre : arbre.slice(0, LIMITE);
  const peutVoirPlus = arbre.length > LIMITE;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 sticky top-24">
      <h3 className="text-base font-bold text-gray-900 mb-4">{titre}</h3>
      <ul className="space-y-1 text-sm">
        <li>
          <button
            type="button"
            onClick={() => onChange?.(valeurTous)}
            className={`w-full text-left px-2 py-1.5 rounded transition ${
              valeur === valeurTous
                ? 'font-bold text-primary'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Toutes
          </button>
        </li>

        {racinesAffichees.map((cat) => (
          <NoeudCategorie
            key={cat.id}
            cat={cat}
            niveau={0}
            valeur={valeur}
            onChange={onChange}
            ouverts={ouverts}
            toggle={toggle}
            compteurs={compteurs}
          />
        ))}

        {peutVoirPlus && (
          <li>
            <button
              type="button"
              onClick={() => setVoirPlus((v) => !v)}
              className="w-full text-left px-2 py-1.5 rounded text-primary hover:bg-gray-50 flex items-center gap-1"
            >
              {voirPlus ? 'Moins' : 'Plus'}
              <svg
                className={`w-3 h-3 transition-transform ${voirPlus ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}

// ── Vue par groupes (sections pliables) ─────────────────────────────────────
function GroupesView({
  categories,
  valeur,
  valeurTous,
  onChange,
  groupes,
  groupeActif,
  onGroupeChange,
  compteurs,
  titre,
}) {
  // Index pour retrouver rapidement une catégorie par id
  const catParId = useMemo(() => {
    const m = new Map();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  // Catégories qui ne sont dans aucun groupe → "Autres"
  const idsDansGroupes = useMemo(() => {
    const s = new Set();
    groupes.forEach((g) => g.categories.forEach((id) => s.add(id)));
    return s;
  }, [groupes]);

  const autres = useMemo(
    () => categories.filter((c) => !idsDansGroupes.has(c.id)),
    [categories, idsDansGroupes],
  );

  // Détermine quel groupe est actif (soit via groupeActif, soit via la catégorie sélectionnée)
  const groupeIdActif = useMemo(() => {
    if (groupeActif && groupeActif.length > 0) {
      return (
        groupes.find((g) =>
          g.categories.some((cid) => groupeActif.includes(cid)),
        )?.id ?? null
      );
    }
    if (valeur && valeur !== valeurTous) {
      return groupes.find((g) => g.categories.includes(valeur))?.id ?? null;
    }
    return null;
  }, [groupes, groupeActif, valeur, valeurTous]);

  // Sections ouvertes : par défaut, celle qui est active
  const [ouverts, setOuverts] = useState(() => {
    const s = new Set();
    if (groupeIdActif) s.add(groupeIdActif);
    return s;
  });

  const toggleGroupe = (gid) => {
    setOuverts((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  };

  const compterGroupe = (g) =>
    g.categories.reduce((acc, cid) => acc + (compteurs[cid] || 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
      <h3 className="text-base font-bold text-gray-900 mb-3 px-1">{titre}</h3>

      <ul className="space-y-1 text-sm">
        {/* Toutes */}
        <li>
          <button
            type="button"
            onClick={() => {
              onGroupeChange?.(null);
              onChange?.(valeurTous);
            }}
            className={`w-full text-left px-2 py-2 rounded transition ${
              valeur === valeurTous && !groupeActif
                ? 'font-bold text-primary bg-primary/5'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Toutes les catégories
          </button>
        </li>

        {/* Groupes pliables */}
        {groupes.map((g) => {
          const ouvert = ouverts.has(g.id);
          const total = compterGroupe(g);
          const estGroupeActif = groupeIdActif === g.id;
          const categoriesDuGroupe = g.categories
            .map((cid) => catParId.get(cid))
            .filter(Boolean);

          return (
            <li key={g.id} className="border-t border-gray-100 first:border-t-0">
              {/* En-tête du groupe : clic = plier/déplier */}
              <button
                type="button"
                onClick={() => toggleGroupe(g.id)}
                className={`w-full text-left px-2 py-2.5 rounded transition flex items-center gap-2 ${
                  estGroupeActif
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-800 hover:bg-gray-50'
                }`}
                aria-expanded={ouvert}
              >
                <span className="text-lg flex-shrink-0">{g.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-sm truncate">
                    {g.titre}
                  </span>
                  {g.description && (
                    <span className="block text-xs text-gray-500 truncate">
                      {g.description}
                    </span>
                  )}
                </span>
                {total > 0 && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    ({total})
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                    ouvert ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Contenu du groupe */}
              {ouvert && (
                <div className="ml-2 pl-3 border-l-2 border-primary/20 mb-2 mt-1 space-y-0.5">
                  {/* "Tout le groupe" : filtre par toutes les catégories */}
                  {onGroupeChange && (
                    <button
                      type="button"
                      onClick={() => {
                        onGroupeChange(g.categories);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs italic transition ${
                        estGroupeActif && groupeActif
                          ? 'font-bold text-primary'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      ↳ Tout « {g.titre} »
                    </button>
                  )}

                  {categoriesDuGroupe.length === 0 ? (
                    <p className="px-2 py-1.5 text-xs text-gray-400 italic">
                      Aucune catégorie disponible
                    </p>
                  ) : (
                    categoriesDuGroupe.map((cat) => {
                      const actif = valeur === cat.id;
                      const nb = compteurs[cat.id];
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            onGroupeChange?.(null);
                            onChange?.(cat.id);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded transition flex items-center gap-2 ${
                            actif
                              ? 'font-bold text-primary bg-primary/5'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {cat.icon && (
                            <span className="text-base flex-shrink-0">
                              {cat.icon}
                            </span>
                          )}
                          <span className="flex-1 truncate text-sm">
                            {cat.nom}
                          </span>
                          {typeof nb === 'number' && nb > 0 && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              ({nb})
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </li>
          );
        })}

        {/* Autres : catégories non rattachées à un groupe */}
        {autres.length > 0 && (
          <li className="border-t border-gray-100">
            <AutresSection
              autres={autres}
              valeur={valeur}
              onChange={onChange}
              onGroupeChange={onGroupeChange}
              compteurs={compteurs}
            />
          </li>
        )}
      </ul>
    </div>
  );
}

function AutresSection({ autres, valeur, onChange, onGroupeChange, compteurs }) {
  const [ouvert, setOuvert] = useState(false);
  const total = autres.reduce((acc, c) => acc + (compteurs[c.id] || 0), 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="w-full text-left px-2 py-2.5 rounded transition flex items-center gap-2 text-gray-800 hover:bg-gray-50"
        aria-expanded={ouvert}
      >
        <span className="text-lg flex-shrink-0">📂</span>
        <span className="flex-1 font-semibold text-sm">Autres</span>
        {total > 0 && (
          <span className="text-xs text-gray-400">({total})</span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${ouvert ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {ouvert && (
        <div className="ml-2 pl-3 border-l-2 border-gray-200 mb-2 mt-1 space-y-0.5">
          {autres.map((cat) => {
            const actif = valeur === cat.id;
            const nb = compteurs[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onGroupeChange?.(null);
                  onChange?.(cat.id);
                }}
                className={`w-full text-left px-2 py-1.5 rounded transition flex items-center gap-2 ${
                  actif
                    ? 'font-bold text-primary bg-primary/5'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.icon && (
                  <span className="text-base flex-shrink-0">{cat.icon}</span>
                )}
                <span className="flex-1 truncate text-sm">{cat.nom}</span>
                {typeof nb === 'number' && nb > 0 && (
                  <span className="text-xs text-gray-400">({nb})</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function NoeudCategorie({ cat, niveau, valeur, onChange, ouverts, toggle, compteurs }) {
  const aDesEnfants = cat.enfants && cat.enfants.length > 0;
  const estOuvert = ouverts.has(cat.id);
  const estActif = valeur === cat.id;
  const nb = compteurs[cat.id];

  return (
    <li>
      <div className="flex items-center">
        {aDesEnfants ? (
          <button
            type="button"
            onClick={() => toggle(cat.id)}
            aria-label={estOuvert ? 'Replier' : 'Déplier'}
            className="p-1 text-gray-500 hover:text-gray-800"
          >
            <svg
              className={`w-3 h-3 transition-transform ${estOuvert ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-5" />
        )}
        <button
          type="button"
          onClick={() => onChange?.(cat.id)}
          style={{ paddingLeft: `${niveau * 0.5}rem` }}
          className={`flex-1 text-left px-2 py-1.5 rounded transition flex items-center gap-2 ${
            estActif
              ? 'font-bold text-primary'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {cat.icon && <span className="text-base">{cat.icon}</span>}
          <span className="flex-1 truncate">{cat.nom}</span>
          {typeof nb === 'number' && nb > 0 && (
            <span className="text-xs text-gray-400">({nb})</span>
          )}
        </button>
      </div>
      {aDesEnfants && estOuvert && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-2">
          {cat.enfants.map((enfant) => (
            <NoeudCategorie
              key={enfant.id}
              cat={enfant}
              niveau={niveau + 1}
              valeur={valeur}
              onChange={onChange}
              ouverts={ouverts}
              toggle={toggle}
              compteurs={compteurs}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
