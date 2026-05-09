'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../AdminLayout';
import { BoutonExportCSV } from '@/lib/csvExport';

function Carte({ titre, valeur, sous, href, accent = 'gray', urgence = false }) {
  const couleurs = {
    gray: 'bg-white border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
  };
  const inner = (
    <div
      className={`rounded-xl border p-4 transition hover:shadow-md ${couleurs[accent] || couleurs.gray} ${urgence ? 'ring-2 ring-red-300' : ''}`}
    >
      <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">{titre}</p>
      <p className="text-3xl font-bold mt-1 text-gray-800">{valeur}</p>
      {sous && <p className="text-xs text-gray-500 mt-1">{sous}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Section({ titre, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">{titre}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{children}</div>
    </section>
  );
}

export default function PageVueGlobale() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const auth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
        const res = await fetch('/api/admin/dashboard-overview', {
          headers: { Authorization: `Bearer ${auth.sessionToken}` },
        });
        if (res.ok) setData(await res.json());
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <AdminLayout titre="Vue globale" sousTitre="Tous les KPIs en une page">
        <p className="text-gray-400">Chargement…</p>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout titre="Vue globale">
        <p className="text-red-500">Impossible de charger les données.</p>
      </AdminLayout>
    );
  }

  const m = data.moderation;
  const aModerer = (m.docs_a_valider || 0) + (m.reclamations_ouvertes || 0) + (m.demandes_contact_en_attente || 0);

  // Aplatissement des KPIs pour export CSV
  const lignesExport = [
    { section: 'Structures', indicateur: 'Total',     valeur: data.structures.total },
    { section: 'Structures', indicateur: 'Publiées',  valeur: data.structures.publie },
    { section: 'Structures', indicateur: 'Brouillons',valeur: data.structures.brouillon },
    { section: 'Comptes',    indicateur: 'Actifs',         valeur: data.comptes.actifs },
    { section: 'Comptes',    indicateur: 'Nouveaux (24h)', valeur: data.comptes.nouveaux_24h },
    { section: 'Comptes',    indicateur: 'Payants',        valeur: data.comptes.payants },
    { section: 'Modération', indicateur: 'Docs à valider',     valeur: m.docs_a_valider },
    { section: 'Modération', indicateur: 'Réclamations',       valeur: m.reclamations_ouvertes },
    { section: 'Modération', indicateur: 'Demandes contact',   valeur: m.demandes_contact_en_attente },
    { section: 'Activité',   indicateur: 'Messages (24h)',         valeur: data.activite.messages_24h },
    { section: 'Activité',   indicateur: "Appels d'offres ouverts",valeur: data.activite.appels_offres_ouverts },
    { section: 'Activité',   indicateur: 'Actions admin (24h)',    valeur: data.activite.actions_admin_24h },
    { section: 'Activité',   indicateur: 'Impersonations actives', valeur: data.activite.impersonations_actives },
  ];
  const colonnesExport = [
    { key: 'section',     label: 'Section' },
    { key: 'indicateur',  label: 'Indicateur' },
    { key: 'valeur',      label: 'Valeur' },
  ];
  const horodatage = new Date().toISOString().slice(0, 10);

  return (
    <AdminLayout titre="Vue globale" sousTitre="Tous les indicateurs en une page">
      <div className="space-y-8">
        {/* Barre d'actions */}
        <div className="flex justify-end">
          <BoutonExportCSV
            filename={`vue-globale-${horodatage}.csv`}
            rows={lignesExport}
            columns={colonnesExport}
            label="Exporter les KPIs"
          />
        </div>

        {/* Alerte modération si > 0 */}
        {aModerer > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-red-800">{aModerer} élément{aModerer > 1 ? 's' : ''} à modérer</p>
              <p className="text-sm text-red-700">Documents, réclamations, demandes de contact en attente.</p>
            </div>
          </div>
        )}

        <Section titre="Structures">
          <Carte titre="Total" valeur={data.structures.total} accent="blue" href="/admin/structures" />
          <Carte titre="Publiées" valeur={data.structures.publie} accent="green" />
          <Carte titre="Brouillons" valeur={data.structures.brouillon} accent="amber" />
        </Section>

        <Section titre="Comptes entreprises">
          <Carte titre="Actifs" valeur={data.comptes.actifs} accent="blue" href="/admin/comptes-entreprises" />
          <Carte titre="Nouveaux (24h)" valeur={data.comptes.nouveaux_24h} accent="green" />
          <Carte titre="Payants" valeur={data.comptes.payants} accent="purple" />
        </Section>

        <Section titre="Modération">
          <Carte
            titre="Docs à valider"
            valeur={m.docs_a_valider}
            accent="amber"
            urgence={m.docs_a_valider > 0}
            href="/admin/structures"
          />
          <Carte
            titre="Réclamations"
            valeur={m.reclamations_ouvertes}
            accent="red"
            urgence={m.reclamations_ouvertes > 0}
          />
          <Carte
            titre="Demandes contact"
            valeur={m.demandes_contact_en_attente}
            accent="amber"
            urgence={m.demandes_contact_en_attente > 0}
            href="/admin/contacts-entreprises"
          />
        </Section>

        <Section titre="Activité plateforme">
          <Carte titre="Messages (24h)" valeur={data.activite.messages_24h} accent="blue" />
          <Carte titre="Appels d'offres ouverts" valeur={data.activite.appels_offres_ouverts} accent="purple" href="/admin/appels-offres" />
          <Carte titre="Actions admin (24h)" valeur={data.activite.actions_admin_24h} accent="gray" href="/admin/audit-logs" />
          <Carte
            titre="Impersonations actives"
            valeur={data.activite.impersonations_actives}
            accent={data.activite.impersonations_actives > 0 ? 'amber' : 'gray'}
          />
        </Section>

        {/* Raccourcis */}
        <Section titre="Raccourcis admin">
          <Link href="/admin/templates-reponse" className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <p className="font-semibold">📝 Templates de réponse</p>
            <p className="text-xs text-gray-500 mt-1">Gérer les messages-types</p>
          </Link>
          <Link href="/admin/audit-logs" className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <p className="font-semibold">🔍 Audit logs</p>
            <p className="text-xs text-gray-500 mt-1">Historique des actions</p>
          </Link>
          <Link href="/admin/dashboard" className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
            <p className="font-semibold">📊 Dashboard classique</p>
            <p className="text-xs text-gray-500 mt-1">Vue détaillée par module</p>
          </Link>
        </Section>
      </div>
    </AdminLayout>
  );
}
