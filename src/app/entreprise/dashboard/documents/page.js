'use client';
import { useState, useEffect, useRef } from 'react';
import EntrepriseLayout from '@/app/entreprise/EntrepriseLayout';
import { supabase } from '@/lib/supabase';

const TYPES_DOCUMENTS = [
  {
    value: 'registre_commerce',
    label: 'Registre de commerce',
    description: 'Document officiel prouvant l\'existence légale de votre entreprise',
    icon: '📋',
    obligatoire: true,
  },
  {
    value: 'statuts_societe',
    label: 'Statuts de la société',
    description: 'Acte constitutif ou statuts de votre entreprise',
    icon: '📄',
    obligatoire: true,
  },
  {
    value: 'identite_dirigeant',
    label: "Pièce d'identité du dirigeant",
    description: "CNI, passeport ou titre de séjour du représentant légal",
    icon: '🪪',
    obligatoire: true,
  },
  {
    value: 'justificatif_adresse',
    label: "Justificatif d'adresse professionnelle",
    description: 'Facture récente ou bail commercial à votre nom',
    icon: '🏢',
    obligatoire: false,
  },
  {
    value: 'autre',
    label: 'Autre document',
    description: 'Tout autre document utile à la vérification de votre compte',
    icon: '📎',
    obligatoire: false,
  },
];

const statutConfig = {
  en_attente: {
    label: 'En attente de validation',
    badge: 'bg-yellow-100 text-yellow-800',
    icon: '⏳',
  },
  valide: {
    label: 'Validé',
    badge: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  refuse: {
    label: 'Refusé',
    badge: 'bg-red-100 text-red-800',
    icon: '❌',
  },
};

export default function DocumentsPage() {
  const [compte, setCompte] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadEnCours, setUploadEnCours] = useState(null); // type_document en cours d'upload
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);
  const [typeSelectionne, setTypeSelectionne] = useState(null);

  useEffect(() => {
    const auth = localStorage.getItem('entrepriseAuth');
    if (!auth) return;
    try {
      const parsed = JSON.parse(auth);
      setCompte(parsed);
      chargerDocuments(parsed.token);
    } catch {
      // ignore
    }
  }, []);

  // Ouvre un document via proxy (masque l'URL Supabase)
  const ouvrirDocument = async (docId, nomFichier) => {
    const token = compte?.token;
    if (!token) return;
    try {
      const res = await fetch(`/api/entreprise/documents/${docId}/view`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { afficherMessage('Impossible d\'ouvrir le fichier.', 'erreur'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = nomFichier || 'document';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      afficherMessage('Erreur lors de l\'ouverture du fichier.', 'erreur');
    }
  };

  const chargerDocuments = async (token) => {
    setLoading(true);
    try {
      const res = await fetch('/api/entreprise/documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setDocuments(data.documents || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const afficherMessage = (texte, type = 'succes') => {
    setMessage({ texte, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const ouvrirSelecteur = (typeDoc) => {
    setTypeSelectionne(typeDoc);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !typeSelectionne) return;

    // Validation : PDF, JPG, PNG, max 5 Mo
    const typesAcceptes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!typesAcceptes.includes(file.type)) {
      afficherMessage('Format non accepté. Utilisez PDF, JPG ou PNG.', 'erreur');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      afficherMessage('Fichier trop lourd (max 5 Mo).', 'erreur');
      e.target.value = '';
      return;
    }

    setUploadEnCours(typeSelectionne);
    try {
      const auth = JSON.parse(localStorage.getItem('entrepriseAuth') || '{}');
      const ext = file.name.split('.').pop();
      const filePath = `documents/${auth.id}-${typeSelectionne}-${Date.now()}.${ext}`;

      // 1. Upload dans Supabase Storage (bucket "images")
      const { error: storageError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (storageError) throw storageError;

      // 2. Récupérer l'URL publique
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);

      // 3. Enregistrer en base via l'API
      const res = await fetch('/api/entreprise/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type_document: typeSelectionne,
          nom_fichier: file.name,
          url_fichier: urlData.publicUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'enregistrement');

      afficherMessage('Document soumis avec succès. En attente de validation.');
      chargerDocuments(auth.token);
    } catch (err) {
      afficherMessage('Erreur lors de l\'envoi : ' + err.message, 'erreur');
    } finally {
      setUploadEnCours(null);
      setTypeSelectionne(null);
      e.target.value = '';
    }
  };

  // Calcul de la progression
  const docParType = {};
  documents.forEach((d) => {
    docParType[d.type_document] = d;
  });

  const obligatoires = TYPES_DOCUMENTS.filter((t) => t.obligatoire);
  const nbObligatoiresValides = obligatoires.filter(
    (t) => docParType[t.value]?.statut === 'valide'
  ).length;
  const progression = Math.round((nbObligatoiresValides / obligatoires.length) * 100);
  const badgeEligible = nbObligatoiresValides === obligatoires.length;

  return (
    <EntrepriseLayout titre="Mes documents">
      {/* Message de notification */}
      {message && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium transition-all max-w-sm ${
            message.type === 'erreur' ? 'bg-red-500' : 'bg-green-500'
          }`}
        >
          {message.texte}
        </div>
      )}

      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* En-tête avec progression */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Vérification du compte</h1>
        <p className="text-gray-500 text-sm mb-6">
          Soumettez vos documents pour obtenir le badge vérifié et renforcer votre crédibilité.
        </p>

        {/* Badge statut */}
        {compte?.badge_verifie ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
            <span className="text-3xl">✅</span>
            <div>
              <p className="font-bold text-green-800">Badge vérifié obtenu !</p>
              <p className="text-sm text-green-600">
                Votre compte est certifié. Ce badge est visible sur votre fiche.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-700">Progression vers le badge vérifié</p>
                <p className="text-sm text-gray-500">
                  {nbObligatoiresValides}/{obligatoires.length} documents obligatoires validés
                </p>
              </div>
              <span
                className={`text-2xl font-bold ${
                  badgeEligible ? 'text-green-600' : 'text-primary'
                }`}
              >
                {progression}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  badgeEligible ? 'bg-green-500' : 'bg-primary'
                }`}
                style={{ width: `${progression}%` }}
              />
            </div>
            {badgeEligible && (
              <p className="text-sm text-green-600 mt-3 font-medium">
                🎉 Tous les documents requis sont validés ! L'administration vous attribuera le badge bientôt.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Liste des documents */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {TYPES_DOCUMENTS.map((type) => {
            const doc = docParType[type.value];
            const statut = doc ? statutConfig[doc.statut] : null;
            const enCours = uploadEnCours === type.value;

            return (
              <div
                key={type.value}
                className={`bg-white rounded-xl border p-5 shadow-sm transition ${
                  doc?.statut === 'valide'
                    ? 'border-green-200'
                    : doc?.statut === 'refuse'
                    ? 'border-red-200'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon + infos */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">{type.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800">{type.label}</p>
                        {type.obligatoire && (
                          <span className="text-xs text-red-500 font-medium">Obligatoire</span>
                        )}
                        {statut && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statut.badge}`}
                          >
                            {statut.icon} {statut.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{type.description}</p>

                      {/* Document soumis */}
                      {doc && (
                        <div className="mt-2 space-y-1">
                          <button
                            type="button"
                            onClick={() => ouvrirDocument(doc.id, doc.nom_fichier)}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <span>📎</span>
                            <span className="truncate max-w-xs">{doc.nom_fichier}</span>
                          </button>
                          {doc.commentaire_admin && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                              <span className="text-red-500 text-sm">💬</span>
                              <p className="text-sm text-red-700">{doc.commentaire_admin}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bouton upload */}
                  <div className="flex-shrink-0">
                    {doc?.statut === 'valide' ? (
                      <span className="inline-flex items-center gap-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                        ✓ Validé
                      </span>
                    ) : (
                      <button
                        onClick={() => ouvrirSelecteur(type.value)}
                        disabled={enCours}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                          enCours
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : doc
                            ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                            : 'bg-primary text-white hover:opacity-90'
                        }`}
                      >
                        {enCours ? (
                          <>
                            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Envoi...
                          </>
                        ) : doc ? (
                          <>📤 Remplacer</>
                        ) : (
                          <>📤 Envoyer</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info formats */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4">
        <p className="text-sm text-blue-800 font-medium mb-1">📌 Formats acceptés</p>
        <p className="text-sm text-blue-700">
          PDF, JPG, PNG — Taille maximale : 5 Mo par fichier.
          Les documents soumis sont examinés dans un délai de 2 à 5 jours ouvrables.
        </p>
      </div>
    </EntrepriseLayout>
  );
}
