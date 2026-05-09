// src/app/annonce/[id]/page.js
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { annoncesAPI, statistiquesAPI } from '@/lib/api';
import PageTracker from '@/components/PageTracker';
import { downloadFile } from '@/utils/downloadFile';
import { useT } from '@/lib/i18n/LangProvider';
import BoutonPartage from '@/components/BoutonPartage';
import { JsonLd, annonceSchema, breadcrumbSchema } from '@/components/JsonLd';

export default function AnnonceDetail() {
  const { t, lang } = useT();
  const params = useParams();
  const router = useRouter();
  const [annonce, setAnnonce] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerAnnonce();
  }, [params.id]);

  const chargerAnnonce = async () => {
    try {
      setLoading(true);
      const data = await annoncesAPI.getAll();
      const annonceTrouvee = data.find(a => a.id === params.id);
      
      if (annonceTrouvee) {
        setAnnonce(annonceTrouvee);
        
        // Tracker la vue
        await statistiquesAPI.enregistrerElementPopulaire(
          'annonce',
          annonceTrouvee.id,
          annonceTrouvee.titre
        );
      }
    } catch (error) {
      console.error('Erreur chargement annonce:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTaille = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getIconeFichier = (type) => {
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('excel') || type?.includes('sheet')) return '📊';
    if (type?.includes('zip') || type?.includes('rar')) return '🗜️';
    return '📎';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!annonce) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📢</div>
          <p className="text-xl text-gray-600 mb-4">{t('annonce_detail.non_trouvee')}</p>
          <Link href="/" className="btn-primary">{t('annonce_detail.retour_accueil')}</Link>
        </div>
      </div>
    );
  }

  const joursRestants = Math.ceil((new Date(annonce.date_fin) - new Date()) / (1000 * 60 * 60 * 24));
  const estUrgent = joursRestants <= 7;
  const estExpire = joursRestants < 0;

  const typeConfig = {
    'Financement': { 
      icon: '💰', 
      color: 'bg-blue-500', 
      lightColor: 'bg-blue-50', 
      textColor: 'text-blue-700' 
    },
    'Appel d\'offres': { 
      icon: '📄', 
      color: 'bg-green-500', 
      lightColor: 'bg-green-50', 
      textColor: 'text-green-700' 
    },
    'Emploi': { 
      icon: '💼', 
      color: 'bg-purple-500', 
      lightColor: 'bg-purple-50', 
      textColor: 'text-purple-700' 
    },
    'Salon BtoB': { 
      icon: '🏢', 
      color: 'bg-indigo-500', 
      lightColor: 'bg-indigo-50', 
      textColor: 'text-indigo-700' 
    },
    'Voyage d\'affaires': { 
      icon: '✈️', 
      color: 'bg-cyan-500', 
      lightColor: 'bg-cyan-50', 
      textColor: 'text-cyan-700' 
    },
    'Partenariat': { 
      icon: '🤝', 
      color: 'bg-pink-500', 
      lightColor: 'bg-pink-50', 
      textColor: 'text-pink-700' 
    }
  };

  const config = typeConfig[annonce.type] || typeConfig['Financement'];

  return (
    <>
      {annonce && (
        <PageTracker
          pageType="annonce_detail"
          elementId={annonce.id}
          elementType="annonce"
        />
      )}
      {annonce && <JsonLd data={annonceSchema(annonce)} />}
      {annonce && (
        <JsonLd
          data={breadcrumbSchema([
            { name: 'Accueil', url: '/' },
            { name: 'Annonces', url: '/annonces' },
            { name: annonce.titre, url: `/annonce/${annonce.id}` },
          ])}
        />
      )}
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-primary hover:text-primary-dark font-semibold">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              {t('annonce_detail.retour')}
            </button>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header avec type */}
          <div className={`${config.color} text-white rounded-xl p-8 mb-8 shadow-lg`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-4xl">{config.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">{annonce.type}</span>
                  {annonce.type === 'Emploi' && annonce.sous_type && (
                    <span className="px-3 py-1 bg-white/30 rounded-full text-sm font-bold">
                      {annonce.sous_type}
                    </span>
                  )}
                  {estUrgent && !estExpire && (
                    <span className="px-3 py-1 bg-red-500 rounded-full text-sm font-bold animate-pulse">{t('annonce_detail.urgent_jours')} - {joursRestants}j</span>
                  )}
                  {estExpire && <span className="px-3 py-1 bg-gray-500 rounded-full text-sm font-bold">{t('annonce_detail.expire')}</span>}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">{annonce.titre}</h1>
              </div>
            </div>
            <p className="text-xl text-white/90 font-medium">{annonce.organisme}</p>
            <div className="mt-4">
              <BoutonPartage titre={annonce.titre} description={annonce.description} variant="compact" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('annonce_detail.description')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{annonce.description}</p>
                {annonce.description_longue && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-xl font-bold mb-3 text-gray-800">{t('annonce_detail.details_complets')}</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{annonce.description_longue}</p>
                  </div>
                )}
              </div>

              {annonce.type === 'Emploi' && annonce.sous_type && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-3 text-purple-900 flex items-center gap-2">
                    {t('annonce_detail.info_poste')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        📝
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('annonce_detail.type_contrat')}</p>
                        <p className="font-bold text-gray-800">{annonce.sous_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        📍
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('annonce_detail.localisation')}</p>
                        <p className="font-bold text-gray-800">{annonce.ville?.nom || t('annonce_detail.national')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pièces jointes - ✅ CORRIGÉ ICI */}
              {annonce.pieces_jointes && annonce.pieces_jointes.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('annonce_detail.pieces_jointes')} ({annonce.pieces_jointes.length})</h2>
                  <div className="space-y-3">
                    {annonce.pieces_jointes.map((fichier, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          downloadFile(fichier.url, fichier.nom);
                        }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition group w-full text-left"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="text-3xl flex-shrink-0">{getIconeFichier(fichier.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{fichier.nom}</p>
                            <p className="text-xs text-gray-500">{formatTaille(fichier.taille)}</p>
                          </div>
                        </div>
                        <div className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg group-hover:bg-blue-600 transition flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-semibold">{t('annonce_detail.telecharger')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('annonce_detail.dates_importantes')}</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">⏰</div>
                      <div>
                        <p className="text-sm text-gray-500">{t('annonce_detail.date_limite')}</p>
                        <p className="font-semibold text-gray-800">{new Date(annonce.date_fin).toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full font-bold text-sm ${estExpire ? 'bg-gray-200 text-gray-600' : joursRestants <= 3 ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                      {estExpire ? t('annonce_detail.expire_court') : `${joursRestants}j`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">{t('annonce_detail.contact')}</h3>
                  <div className="space-y-3">
                    {annonce.telephone && (
                      <a href={`tel:${annonce.telephone}`} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition">
                        <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">📞</div>
                        <div className="flex-1"><p className="text-xs text-gray-500">{t('annonce_detail.telephone')}</p><p className="font-semibold text-gray-800 text-sm">{annonce.telephone}</p></div>
                      </a>
                    )}
                    {annonce.contact && (
                      <a href={`mailto:${annonce.contact}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center">✉️</div>
                        <div className="flex-1"><p className="text-xs text-gray-500">{t('annonce_detail.email')}</p><p className="font-semibold text-gray-800 text-sm break-all">{annonce.contact}</p></div>
                      </a>
                    )}
                    {annonce.lien_externe && (
                      <a href={annonce.lien_externe} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
                        <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center">🔗</div>
                        <div className="flex-1"><p className="text-xs text-gray-500">{t('annonce_detail.site_web')}</p><p className="font-semibold text-purple-600 text-sm">{t('annonce_detail.visiter')}</p></div>
                      </a>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold mb-4">{t('annonce_detail.compte_rebours')}</h3>
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">{estExpire ? '0' : joursRestants}</div>
                    <p className="text-white/80">{joursRestants > 1 ? t('annonce_detail.jour_pluriel') : t('annonce_detail.jour_singulier')} {joursRestants > 1 ? t('annonce_detail.restant_pluriel') : t('annonce_detail.restant_singulier')}</p>
                  </div>
                </div>

                {!estExpire && annonce.contact && (
                  <div className={`${config.lightColor} rounded-xl p-6`}>
                    <h3 className={`font-bold mb-2 ${config.textColor}`}>{t('annonce_detail.interesse')}</h3>
                    <a href={`mailto:${annonce.contact}`} className="btn-accent w-full flex items-center justify-center gap-2">
                      <span>{t('annonce_detail.envoyer_email')}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}