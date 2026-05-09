// src/app/contact/page.js
'use client';
import { useState } from 'react';
import { ADMIN_CONTACT } from '@/data/mockData';
import PageTracker from '@/components/PageTracker';
import { toast } from '@/lib/toast';
import { useT } from '@/lib/i18n/LangProvider';

export default function ContactPage() {
  const { t } = useT();
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    sujet: '',
    message: ''
  });

  const handleSubmit = () => {
    if (!formData.nom || !formData.email || !formData.message) {
      toast.warning(t('contact.toast_champs_obligatoires'));
      return;
    }
    toast.success(t('contact.toast_succes').replace('{{email}}', formData.email));
    setFormData({ nom: '', email: '', telephone: '', sujet: '', message: '' });
  };

  return (
    <>
      {/* ✅ TRACKING AUTOMATIQUE */}
      <PageTracker pageType="contact" />
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary-dark to-primary-light text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('contact.titre')}</h1>
          <p className="text-xl text-green-100">
            {t('contact.sous_titre')}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire de contact */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('contact.envoyez_message')}</h2>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contact.nom_complet')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('contact.placeholder_nom')}
                      className="input-field"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contact.email_required')}
                    </label>
                    <input
                      type="email"
                      placeholder={t('contact.placeholder_email')}
                      className="input-field"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contact.telephone_optionnel')}
                    </label>
                    <input
                      type="tel"
                      placeholder={t('contact.placeholder_telephone')}
                      className="input-field"
                      value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contact.sujet_label')}
                    </label>
                    <select
                      className="input-field"
                      value={formData.sujet}
                      onChange={(e) => setFormData({...formData, sujet: e.target.value})}
                    >
                      <option value="">{t('contact.sujet_choisir')}</option>
                      <option value="inscription">{t('contact.sujet_inscription')}</option>
                      <option value="annonce">{t('contact.sujet_annonce')}</option>
                      <option value="question">{t('contact.sujet_question')}</option>
                      <option value="probleme">{t('contact.sujet_probleme')}</option>
                      <option value="partenariat">{t('contact.sujet_partenariat')}</option>
                      <option value="autre">{t('contact.sujet_autre')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('contact.message_required')}
                  </label>
                  <textarea
                    rows="6"
                    placeholder={t('contact.placeholder_message')}
                    className="input-field"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>

                <button onClick={handleSubmit} className="btn-primary w-full">
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {t('contact.envoyer_message_btn')}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Informations de contact */}
          <div className="space-y-6">
            {/* Coordonnées */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">{t('contact.nos_coordonnees')}</h3>
              <div className="space-y-4">
                <a
                  href={`tel:${ADMIN_CONTACT.telephone}`}
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition"
                >
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                    📞
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('contact.telephone_label')}</p>
                    <p className="font-semibold text-gray-800">{ADMIN_CONTACT.telephone}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('contact.lun_sam')}</p>
                  </div>
                </a>

                <a
                  href={`mailto:${ADMIN_CONTACT.email}`}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                >
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                    ✉️
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('contact.email_label')}</p>
                    <p className="font-semibold text-gray-800 break-all">{ADMIN_CONTACT.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('contact.reponse_24h')}</p>
                  </div>
                </a>

                <a
                  href={`https://wa.me/${ADMIN_CONTACT.telephone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition"
                >
                  <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('contact.whatsapp_label')}</p>
                    <p className="font-semibold text-gray-800">{t('contact.discuter_maintenant')}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('contact.reponse_rapide')}</p>
                  </div>
                </a>
              </div>
            </div>

            {/* FAQ rapide */}
            <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">{t('contact.besoin_aide')}</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold mb-1">{t('contact.faq_inscrire_q')}</p>
                  <p className="text-green-100">{t('contact.faq_inscrire_a')}</p>
                </div>
                <div className="pt-3 border-t border-white/20">
                  <p className="font-semibold mb-1">{t('contact.faq_publier_q')}</p>
                  <p className="text-green-100">{t('contact.faq_publier_a')}</p>
                </div>
                <div className="pt-3 border-t border-white/20">
                  <p className="font-semibold mb-1">{t('contact.faq_gratuit_q')}</p>
                  <p className="text-green-100">{t('contact.faq_gratuit_a')}</p>
                </div>
              </div>
            </div>

            {/* Horaires */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">{t('contact.horaires_titre')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('contact.lundi_vendredi')}</span>
                  <span className="font-semibold text-gray-800">{t('contact.horaires_semaine')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('contact.samedi')}</span>
                  <span className="font-semibold text-gray-800">{t('contact.horaires_samedi')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('contact.dimanche')}</span>
                  <span className="font-semibold text-red-600">{t('contact.ferme')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
