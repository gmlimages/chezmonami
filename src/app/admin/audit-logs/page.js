'use client';
import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../AdminLayout';
import { downloadCSV } from '@/lib/csvExport';

const ACTIONS_COURANTES = [
  '', 'structure.', 'compte.', 'message.', 'appel_offres.', 'template.', 'impersonation.',
];

export default function PageAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtres, setFiltres] = useState({ action: '', cible_type: '', date_min: '' });
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const auth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        ...(filtres.action ? { action: filtres.action } : {}),
        ...(filtres.cible_type ? { cible_type: filtres.cible_type } : {}),
        ...(filtres.date_min ? { date_min: filtres.date_min } : {}),
      });
      const res = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${auth.sessionToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [filtres, offset]);

  useEffect(() => { charger(); }, [charger]);

  const exporter = () => {
    downloadCSV(`audit-logs-${new Date().toISOString().slice(0, 10)}.csv`, logs, [
      { key: 'created_at', label: 'Date', format: (v) => new Date(v).toLocaleString('fr-FR') },
      { key: 'admin_email', label: 'Admin' },
      { key: 'action', label: 'Action' },
      { key: 'cible_type', label: 'Type cible' },
      { key: 'cible_id', label: 'ID cible' },
      { key: 'ip', label: 'IP' },
      { key: 'details', label: 'Détails' },
    ]);
  };

  return (
    <AdminLayout titre="Audit logs" sousTitre="Historique des actions admin">
      <div className="space-y-4">
        {/* Filtres */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
            <input
              type="text"
              placeholder="ex: structure.publier"
              value={filtres.action}
              onChange={(e) => { setOffset(0); setFiltres({ ...filtres, action: e.target.value }); }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-56"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type cible</label>
            <select
              value={filtres.cible_type}
              onChange={(e) => { setOffset(0); setFiltres({ ...filtres, cible_type: e.target.value }); }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">Tous</option>
              <option value="structure">Structure</option>
              <option value="compte_structure">Compte entreprise</option>
              <option value="message">Message</option>
              <option value="appel_offres">Appel d'offres</option>
              <option value="template_reponse">Template</option>
              <option value="impersonation">Impersonation</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Depuis</label>
            <input
              type="date"
              value={filtres.date_min}
              onChange={(e) => { setOffset(0); setFiltres({ ...filtres, date_min: e.target.value }); }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={exporter}
              disabled={!logs.length}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              ⬇ Exporter CSV
            </button>
            <button
              type="button"
              onClick={() => { setFiltres({ action: '', cible_type: '', date_min: '' }); setOffset(0); }}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Admin</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Cible</th>
                  <th className="px-3 py-2 text-left">IP</th>
                  <th className="px-3 py-2 text-left">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">Chargement…</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">Aucun log</td></tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                      <td className="px-3 py-2">{l.admin_email || '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{l.action}</td>
                      <td className="px-3 py-2 text-gray-700">
                        {l.cible_type ? (
                          <span><span className="text-xs text-gray-400">{l.cible_type}</span> {l.cible_id}</span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{l.ip || '—'}</td>
                      <td className="px-3 py-2">
                        {l.details ? (
                          <details>
                            <summary className="cursor-pointer text-xs text-primary">voir</summary>
                            <pre className="mt-1 text-xs text-gray-600 max-w-md whitespace-pre-wrap">{JSON.stringify(l.details, null, 2)}</pre>
                          </details>
                        ) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 text-xs text-gray-600">
            <span>{total} entrée{total > 1 ? 's' : ''} · page {Math.floor(offset / limit) + 1}/{Math.max(1, Math.ceil(total / limit))}</span>
            <div className="flex gap-2">
              <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))} className="px-3 py-1 rounded border border-gray-200 bg-white disabled:opacity-50">←</button>
              <button disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)} className="px-3 py-1 rounded border border-gray-200 bg-white disabled:opacity-50">→</button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
