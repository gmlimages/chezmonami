'use client';
// Hook réutilisable pour la sélection multiple sur les listes admin.
//
// Usage :
//   const { selected, toggle, toggleAll, clear, isSelected, allSelected, count } =
//     useBulkSelection(items, (it) => it.id);
//
//   <input type="checkbox" checked={allSelected} onChange={toggleAll} />
//   {items.map(it => (
//     <input type="checkbox" checked={isSelected(it.id)} onChange={() => toggle(it.id)} />
//   ))}
//   <button disabled={!count} onClick={() => bulkValider(selected)}>Valider ({count})</button>

import { useState, useMemo, useCallback } from 'react';

export function useBulkSelection(items = [], getId = (it) => it.id) {
  const [selected, setSelected] = useState(() => new Set());

  const ids = useMemo(() => (items || []).map(getId), [items, getId]);

  const isSelected = useCallback((id) => selected.has(id), [selected]);

  const toggle = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const allIn = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allIn) return new Set();
      return new Set(ids);
    });
  }, [ids]);

  const clear = useCallback(() => setSelected(new Set()), []);

  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = selected.size > 0 && !allSelected;

  return {
    selected: Array.from(selected),
    selectedSet: selected,
    isSelected,
    toggle,
    toggleAll,
    clear,
    allSelected,
    someSelected,
    count: selected.size,
  };
}
