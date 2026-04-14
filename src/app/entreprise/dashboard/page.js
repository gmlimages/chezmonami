'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import EntrepriseLayout from '../EntrepriseLayout';

export default function EntrepriseDashboard() {
  const [compte, setCompte] = useState(null);
  const [stats, setStats] = useState({ appels: 0, appelsNouveaux: 0, messages: 0, documents: 0 });
  const [appelsRecents, setAppelsRecents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifs, setNotifs] = useState({ nb_messages: 0, nb_b2b: 0, nb_appels: 0, total_messages: 0, total_documents: 0 });

  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (!auth) return;
    const { token, compte: c } = JSON.parse(auth);
    setCompte(c);
    chargerDonnees(token);

    fetch('/api/entreprise/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => { if (d) setNotifs(d); }).catch(() => {});
  }, []);

  const chargerDonnees = async (token) => {
    try {
      const res = await fetch('/api/entreprise/appels-offres', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { appels } = await res.json();
        const nonRepondus = appels.filter(a => !a.ma_reponse);
        setStats(s => ({ ...s, appels: appels.length, appelsNouveaux: nonRepondus.length }));
        setAppelsRecents(appels.slice(0, 3));
      }

      // Charger le profil complet (abonnement + dates)
      const resProfil = await fetch('/api/entreprise/profil', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resProfil.ok) {
        const { compte: profilComplet } = await resProfil.json();
        if (profilComplet) setCompte(profilComplet);
      }
    } catch {}
    setLoading(false);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const isExpireBientot = (d) => {
    const diff = new Date(d) - new Date();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  };

  return (
    <EntrepriseLayout titre="Tableau de bord">
      <div className="space-y-6">

        {/* Message de bienvenue */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {compte?.nom_contact?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Bienvenue, {compte?.nom_contact || '…'} 👋
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Gérez votre espace entreprise et suivez vos activités depuis ce tableau de bord.
            </p>
          </div>
        </div>

        {/* Alerte compte en attente */}
        {compte?.statut === 'en_attente' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-3xl">⏳</div>
            <div>
              <p className="font-semibold text-amber-800">Compte en attente de validation</p>
              <p className="text-sm text-amber-600 mt-0.5">
                L&apos;administration ChezMonAmi examine votre dossier. Vous pourrez accéder à toutes les fonctionnalités après validation.
              </p>
            </div>
          </div>
        )}

        {/* Notifications */}
        {notifs.nb_messages > 0 && (
          <Link href="/entreprise/dashboard/messages" className="block bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 hover:bg-blue-100 transition">
            <span className="text-2xl flex-shrink-0">💬</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-800">
                {notifs.nb_messages} nouveau{notifs.nb_messages > 1 ? 'x' : ''} message{notifs.nb_messages > 1 ? 's' : ''} de l&apos;administration
              </p>
              <p className="text-sm text-blue-600 mt-0.5">Cliquez pour consulter vos messages</p>
            </div>
            <span className="bg-blue-600 text-white text-xs font-bold rounded-full min-w-[1.5rem] h-6 flex items-center justify-center px-2 flex-shrink-0">
              {notifs.nb_messages}
            </span>
          </Link>
        )}

        {notifs.nb_b2b > 0 && (
          <Link href="/entreprise/dashboard/reseau" className="block bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 hover:bg-green-100 transition">
            <span className="text-2xl flex-shrink-0">🤝</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-800">
                {notifs.nb_b2b} nouveau{notifs.nb_b2b > 1 ? 'x' : ''} message{notifs.nb_b2b > 1 ? 's' : ''} dans votre réseau B2B
              </p>
              <p className="text-sm text-green-600 mt-0.5">Cliquez pour consulter vos échanges</p>
            </div>
            <span className="bg-green-600 text-white text-xs font-bold rounded-full min-w-[1.5rem] h-6 flex items-center justify-center px-2 flex-shrink-0">
              {notifs.nb_b2b}
            </span>
          </Link>
        )}

        {notifs.nb_appels > 0 && (
          <Link href="/entreprise/dashboard/appels-offres" className="block bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3 hover:bg-orange-100 transition">
            <span className="text-2xl flex-shrink-0">📋</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-orange-800">
                {notifs.nb_appels} appel{notifs.nb_appels > 1 ? 's' : ''} d&apos;offres {notifs.nb_appels > 1 ? 'sans réponse' : 'sans réponse'}
              </p>
              <p className="text-sm text-orange-600 mt-0.5">Cliquez pour consulter et soumettre votre dossier</p>
            </div>
            <span className="bg-orange-600 text-white text-xs font-bold rounded-full min-w-[1.5rem] h-6 flex items-center justify-center px-2 flex-shrink-0">
              {notifs.nb_appels}
            </span>
          </Link>
        )}

        {/* Cartes stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Appels d'offres", value: stats.appels, icon: '📋', color: 'blue', href: '/entreprise/dashboard/appels-offres', useLoading: true },
            { label: 'Sans réponse', value: stats.appelsNouveaux, icon: '🔔', color: 'orange', href: '/entreprise/dashboard/appels-offres', useLoading: true },
            { label: 'Messages', value: notifs.total_messages, icon: '💬', color: 'green', href: '/entreprise/dashboard/messages', useLoading: false },
            { label: 'Documents', value: notifs.total_documents, icon: '📁', color: 'purple', href: '/entreprise/dashboard/documents', useLoading: false },
          ].map(card => (
            <Link key={card.label} href={card.href} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{card.icon}</span>
                <span className={`text-2xl font-bold text-${card.color}-600`}>{(card.useLoading && loading) ? '...' : card.value}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium group-hover:text-primary transition">{card.label}</p>
            </Link>
          ))}
        </div>

        {/* Carte abonnement */}
        {compte && (() => {
          const typePayant = ['mensuel', 'trimestriel', 'semestriel', 'annuel'];
          const estPayant = typePayant.includes(compte.abonnement);
          const maintenant = new Date();
          const dateFin = compte.date_fin_abonnement ? new Date(compte.date_fin_abonnement) : null;
          const estValide = estPayant && (!dateFin || dateFin > maintenant);
          const estExpire = estPayant && dateFin && dateFin <= maintenant;
          const joursRestants = dateFin && dateFin > maintenant
            ? Math.ceil((dateFin - maintenant) / (1000 * 60 * 60 * 24))
            : 0;
          const bientotExpire = joursRestants > 0 && joursRestants <= 14;

          // Couleurs selon statut
          const couleur = estValide
            ? bientotExpire ? 'border-orange-200 bg-orange-50/50' : 'border-green-200 bg-green-50/50'
            : estExpire ? 'border-red-200 bg-red-50/50'
            : 'border-gray-200 bg-gray-50/50';

          const labelStatut = estValide
            ? bientotExpire ? '⚠️ Expire bientôt' : '✅ Actif'
            : estExpire ? '❌ Expiré'
            : '🔒 Gratuit';

          const badgeCouleur = estValide
            ? bientotExpire ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
            : estExpire ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-600';

          return (
            <div className={`rounded-xl border p-4 sm:p-5 shadow-sm ${couleur}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💳</span>
                    <h2 className="font-bold text-gray-800">Mon abonnement</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeCouleur}`}>
                      {labelStatut}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 capitalize">
                    {compte.abonnement || 'Gratuit'}{estPayant && compte.montant_paiement ? ` — ${Number(compte.montant_paiement).toLocaleString('fr-FR')} €` : ''}
                  </p>
                </div>
                {!estValide && (
                  <a
                    href="/entreprise/dashboard/messages"
                    className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition flex-shrink-0"
                  >
                    📩 Contacter l&apos;admin
                  </a>
                )}
              </div>

              {estPayant && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {compte.date_paiement && (
                    <div className="bg-white/70 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Date de paiement</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(compte.date_paiement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                  {dateFin && (
                    <div className="bg-white/70 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Date de fin</p>
                      <p className={`font-semibold ${estExpire ? 'text-red-600' : bientotExpire ? 'text-orange-600' : 'text-gray-800'}`}>
                        {dateFin.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {estValide && dateFin && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Temps restant</span>
                    <span className={bientotExpire ? 'text-orange-600 font-semibold' : 'text-gray-600'}>
                      {joursRestants} jour{joursRestants > 1 ? 's' : ''}
                    </span>
                  </div>
                  {(() => {
                    const datePaie = compte.date_paiement ? new Date(compte.date_paiement) : null;
                    const dureeTotal = datePaie ? (dateFin - datePaie) : null;
                    const progress = dureeTotal
                      ? Math.max(0, Math.min(100, Math.round(((dateFin - maintenant) / dureeTotal) * 100)))
                      : 100;
                    return (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${bientotExpire ? 'bg-orange-400' : 'bg-green-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    );
                  })()}
                </div>
              )}

              {!estPayant && (
                <p className="mt-3 text-xs text-gray-500">
                  Votre compte est en mode gratuit. Souscrivez à un abonnement pour accéder aux fiches détaillées, aux appels d&apos;offres et à la messagerie.
                </p>
              )}
              {estExpire && (
                <p className="mt-3 text-xs text-red-600 font-medium">
                  Votre abonnement a expiré le {dateFin.toLocaleDateString('fr-FR')}. Contactez l&apos;administration pour le renouveler.
                </p>
              )}
            </div>
          );
        })()}

        {/* Mon profil rapide */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800">Mon entreprise</h2>
            <Link href="/entreprise/dashboard/profil" className="text-sm text-primary hover:underline font-medium">
              Modifier le profil →
            </Link>
          </div>
          {compte && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-0.5">Responsable</p>
                <p className="font-semibold text-gray-800 text-sm">{compte.nom_contact}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="font-semibold text-gray-800 text-sm truncate">{compte.email}</p>
              </div>
              {compte.structure?.nom && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-0.5">Structure liée</p>
                  <p className="font-semibold text-gray-800 text-sm">{compte.structure.nom}</p>
                </div>
              )}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-0.5">Statut</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  compte.statut === 'actif' ? 'bg-green-100 text-green-700' :
                  compte.statut === 'en_attente' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {compte.statut === 'actif' ? '✅ Actif' :
                   compte.statut === 'en_attente' ? '⏳ En attente' : '❌ Suspendu'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Appels d'offres récents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-800">Appels d&apos;offres récents</h2>
            <Link href="/entreprise/dashboard/appels-offres" className="text-sm text-primary hover:underline font-medium">
              Voir tous →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : appelsRecents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm">Aucun appel d&apos;offres disponible pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appelsRecents.map(appel => (
                <Link
                  key={appel.id}
                  href="/entreprise/dashboard/appels-offres"
                  className="flex items-start sm:items-center justify-between gap-3 p-3 border border-gray-100 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 text-sm truncate group-hover:text-primary transition">
                      {appel.titre}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {appel.categories?.nom || 'Tous secteurs'} •{' '}
                      {appel.international ? '🌍 International' : appel.pays?.nom || 'National'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {appel.ma_reponse ? (
                      <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        ✅ Répondu
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isExpireBientot(appel.date_limite)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isExpireBientot(appel.date_limite) ? '⚠️ ' : ''}
                        {formatDate(appel.date_limite)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </EntrepriseLayout>
  );
}
