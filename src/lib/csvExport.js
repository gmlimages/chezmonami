// Export CSV universel (client OU server). Aucune dépendance.
// Gère l'échappement RFC 4180 (guillemets doubles), le BOM UTF-8 (Excel-friendly)
// et le téléchargement direct côté client.
//
// Usage côté client :
//   import { downloadCSV } from '@/lib/csvExport';
//   downloadCSV('structures.csv', rows, [
//     { key: 'nom', label: 'Nom' },
//     { key: 'pays.nom', label: 'Pays' },
//     { key: 'created_at', label: 'Créé le', format: (v) => new Date(v).toLocaleDateString('fr-FR') },
//   ]);

function getValue(obj, path) {
  if (!obj || !path) return '';
  return path.split('.').reduce(
    (acc, k) => (acc !== null && acc !== undefined ? acc[k] : undefined),
    obj
  );
}

function escapeCell(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  // RFC 4180 : si la valeur contient ; , " ou newline → entourer de "" et doubler les "
  if (/[",;\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCSV(rows, columns, separator = ';') {
  const header = columns.map((c) => escapeCell(c.label)).join(separator);
  const body = (rows || [])
    .map((row) =>
      columns
        .map((c) => {
          const raw = getValue(row, c.key);
          const v = c.format ? c.format(raw, row) : raw;
          return escapeCell(v);
        })
        .join(separator)
    )
    .join('\r\n');
  // BOM UTF-8 → Excel détecte l'encodage correctement
  return '\ufeff' + header + '\r\n' + body;
}

export function downloadCSV(filename, rows, columns, separator = ';') {
  if (typeof window === 'undefined') return;
  const csv = buildCSV(rows, columns, separator);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Bouton React utilitaire — usage : <BoutonExportCSV filename="..." rows={...} columns={...} />
import React from 'react';

export function BoutonExportCSV({
  filename,
  rows,
  columns,
  label = 'Exporter CSV',
  className = '',
  disabled = false,
}) {
  const onClick = () => downloadCSV(filename, rows, columns);
  return React.createElement(
    'button',
    {
      type: 'button',
      onClick,
      disabled: disabled || !rows?.length,
      className:
        className ||
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition',
    },
    React.createElement(
      'svg',
      {
        className: 'w-4 h-4',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        viewBox: '0 0 24 24',
      },
      React.createElement('path', {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        d: 'M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3',
      })
    ),
    label
  );
}
