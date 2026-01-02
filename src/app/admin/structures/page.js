// src/app/admin/structures/page.js - VERSION COMPLÈTE FINALE
// ✅ Images séparées + CTA + Services

'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/AdminLayout';
import ImageUploader from '@/components/ImageUploader';
import { structuresAPI, categoriesAPI, paysAPI, villesAPI } from '@/lib/api';

// Types de CTA disponibles
const CTA_TYPES = [
  { value: 'rdv', label: 'Prendre rendez-vous', icon: '📅' },
  { value: 'reserver_table', label: 'Réserver une table', icon: '🍽️' },
  { value: 'reserver_chambre', label: 'Réserver une chambre', icon: '🏩' },
  { value: 'commander', label: 'Passer commande', icon: '🛍️' },
  { value: 'devis', label: 'Demander un devis', icon: '📋' },
  { value: 'contact', label: 'Nous contacter', icon: '📞' }
  
];

// Services pour hôtels/appartements
const SERVICES_DISPONIBLES = [
  { value: 'wifi', label: 'WiFi gratuit', icon: '📶' },
  { value: 'piscine', label: 'Piscine', icon: '🏊' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'climatisation', label: 'Climatisation', icon: '❄️' },
  { value: 'room_service', label: 'Room Service', icon: '🛎️' },
  { value: 'gym', label: 'Salle de sport', icon: '🏋️' },
  { value: 'spa', label: 'Spa', icon: '💆' },
  { value: 'petit_dejeuner', label: 'Petit-déjeuner', icon: '🥐' },
  { value: 'blanchisserie', label: 'Blanchisserie', icon: '👔' }
];

export default function AdminStructures() {
  const [mode, setMode] = useState('liste');
  const [structureEnCours, setStructureEnCours] = useState(null);
  const [structures, setStructures] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pays, setPays] = useState([]);
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  
  const [formData, setFormData] = useState({
    nom: '',
    categorie_id: '',
    ville_id: '',
    pays_id: '',
    description: '',
    description_longue: '',
    telephone: '',
    email: '',
    horaires: '',
    adresse: '',
    images: [],
    galerie: [],
    cta_principal: '',
    cta_secondaire: '',
    canaux_contact: [],
    services_inclus: [],
    politique_annulation: ''
  });

  useEffect(() => {
    chargerDonnees();
  }, []);

  useEffect(() => {
    if (formData.pays_id) {
      chargerVilles(formData.pays_id);
    }
  }, [formData.pays_id]);

  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const [structuresData, categoriesData, paysData] = await Promise.all([
        structuresAPI.getAll(),
        categoriesAPI.getAll(),
        paysAPI.getAll()
      ]);
      setStructures(structuresData);
      setCategories(categoriesData);
      setPays(paysData);
    } catch (error) {
      console.error('Erreur chargement:', error);
      alert('❌ Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const chargerVilles = async (paysId) => {
    try {
      const villesData = await villesAPI.getByPays(paysId);
      setVilles(villesData);
    } catch (error) {
      console.error('Erreur chargement villes:', error);
    }
  };

  const ajouterStructure = () => {
    setStructureEnCours(null);
    setFormData({
      nom: '',
      categorie_id: categories[0]?.id || '',
      ville_id: '',
      pays_id: '',
      description: '',
      description_longue: '',
      telephone: '',
      email: '',
      horaires: '',
      adresse: '',
      images: [],
      galerie: [],
      cta_principal: '',
      cta_secondaire: '',
      canaux_contact: [],
      services_inclus: [],
      politique_annulation: ''
    });
    setVilles([]);
    setMode('formulaire');
  };

  const modifierStructure = async (structure) => {
    setStructureEnCours(structure);
    
    if (structure.pays?.id) {
      await chargerVilles(structure.pays.id);
    }
    
    let galerieNormalisee = [];
    if (structure.galerie) {
      if (Array.isArray(structure.galerie)) {
        galerieNormalisee = structure.galerie.map(item => 
          typeof item === 'string' ? item : item.url
        );
      } else if (typeof structure.galerie === 'object') {
        galerieNormalisee = Object.values(structure.galerie).filter(v => typeof v === 'string');
      }
    }
    
    setFormData({
      nom: structure.nom,
      categorie_id: structure.categorie_id,
      ville_id: structure.ville?.id || '',
      pays_id: structure.pays?.id || '',
      description: structure.description,
      description_longue: structure.description_longue || '',
      telephone: structure.telephone,
      email: structure.email,
      horaires: structure.horaires,
      adresse: structure.adresse || '',
      images: structure.images || [],
      galerie: galerieNormalisee,
      cta_principal: structure.cta_principal || '',
      cta_secondaire: structure.cta_secondaire || '',
      canaux_contact: structure.canaux_contact || [],
      services_inclus: structure.services_inclus || [],
      politique_annulation: structure.politique_annulation || ''
    });
    setMode('formulaire');
  };

  const supprimerStructure = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette structure ?')) return;

    try {
      await structuresAPI.delete(id);
      alert('✅ Structure supprimée avec succès !');
      chargerDonnees();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const sauvegarderStructure = async () => {
    if (!formData.nom || !formData.ville_id || !formData.pays_id || !formData.categorie_id) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const galerieFormatee = formData.galerie.map((url, index) => ({
        url: url,
        alt: `${formData.nom} - Photo ${index + 1}`
      }));

      const dataToSave = {
        nom: formData.nom,
        categorie_id: formData.categorie_id,
        pays_id: formData.pays_id,
        ville_id: formData.ville_id,
        description: formData.description,
        description_longue: formData.description_longue,
        telephone: formData.telephone,
        email: formData.email,
        horaires: formData.horaires,
        adresse: formData.adresse,
        images: formData.images,
        galerie: galerieFormatee,
        cta_principal: formData.cta_principal,
        cta_secondaire: formData.cta_secondaire,
        canaux_contact: formData.canaux_contact,
        services_inclus: formData.services_inclus,
        politique_annulation: formData.politique_annulation
      };

      if (structureEnCours) {
        await structuresAPI.update(structureEnCours.id, dataToSave);
        alert('✅ Structure modifiée avec succès !');
      } else {
        await structuresAPI.create(dataToSave);
        alert('✅ Structure ajoutée avec succès !');
      }
      
      setMode('liste');
      chargerDonnees();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const structuresFiltrees = structures.filter(s => {
    if (!recherche) return true;
    const searchLower = recherche.toLowerCase();
    return (
      s.nom.toLowerCase().includes(searchLower) ||
      s.ville?.nom.toLowerCase().includes(searchLower) ||
      s.pays?.nom.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <AdminLayout titre="Gestion des Structures">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (mode === 'formulaire') {
    return (
      <AdminLayout titre={structureEnCours ? 'Modifier la structure' : 'Ajouter une structure'}>
        <div className="max-w-4xl">
          <button onClick={() => setMode('liste')} className="mb-6 flex items-center gap-2 text-primary hover:text-primary-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la liste
          </button>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la structure *</label>
                <input type="text" className="input-field" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                <select className="input-field" value={formData.categorie_id} onChange={(e) => setFormData({...formData, categorie_id: e.target.value})}>
                  <option value="">Choisir une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pays *</label>
                <select className="input-field" value={formData.pays_id} onChange={(e) => setFormData({...formData, pays_id: e.target.value, ville_id: ''})}>
                  <option value="">Choisir un pays</option>
                  {pays.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville *</label>
                <select className="input-field" value={formData.ville_id} onChange={(e) => setFormData({...formData, ville_id: e.target.value})} disabled={!formData.pays_id}>
                  <option value="">Choisir une ville</option>
                  {villes.map(v => (
                    <option key={v.id} value={v.id}>{v.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                <input type="tel" className="input-field" value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse complète</label>
              <textarea
                rows="2"
                placeholder="Ex: Rue de la liberté, Immeuble ABC, Quartier Bonanjo"
                className="input-field"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Horaires *</label>
              <input type="text" placeholder="Ex: Lun-Ven: 9h-18h" className="input-field" value={formData.horaires} onChange={(e) => setFormData({...formData, horaires: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description courte *</label>
              <textarea rows="3" className="input-field" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description complète</label>
              <textarea rows="6" className="input-field" value={formData.description_longue} onChange={(e) => setFormData({...formData, description_longue: e.target.value})} />
            </div>

            {/* SECTION 1 : IMAGES DE COUVERTURE */}
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  🖼️ Images de couverture
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  La première image sera affichée comme image principale
                </p>
              </div>
              <ImageUploader
                images={formData.images}
                onChange={(newImages) => setFormData({...formData, images: newImages})}
                maxImages={null}
                label="Couverture"
              />
            </div>

            {/* SECTION 2 : GALERIE SUPPLÉMENTAIRE */}
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  📸 Galerie photos supplémentaires
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Photos additionnelles qui seront affichées dans une galerie cliquable
                </p>
              </div>
              <ImageUploader
                images={formData.galerie}
                onChange={(newImages) => setFormData({...formData, galerie: newImages})}
                maxImages={null}
                label="Galerie"
              />
            </div>

            {/* SECTION 3 : CALL-TO-ACTION (CTA) */}
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  🎯 Boutons d'action (CTA)
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Configurez les boutons qui apparaîtront sur la page de la structure
                </p>
              </div>

              <div className="space-y-6">
                {/* CTA Principal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action principale *
                  </label>
                  <select 
                    className="input-field"
                    value={formData.cta_principal}
                    onChange={(e) => setFormData({...formData, cta_principal: e.target.value})}
                  >
                    <option value="">Sélectionner une action</option>
                    {CTA_TYPES.map(cta => (
                      <option key={cta.value} value={cta.value}>
                        {cta.icon} {cta.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CTA Secondaire */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action secondaire (optionnel)
                  </label>
                  <select 
                    className="input-field"
                    value={formData.cta_secondaire}
                    onChange={(e) => setFormData({...formData, cta_secondaire: e.target.value})}
                  >
                    <option value="">Aucune action secondaire</option>
                    {CTA_TYPES.filter(cta => cta.value !== formData.cta_principal).map(cta => (
                      <option key={cta.value} value={cta.value}>
                        {cta.icon} {cta.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Canaux de contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Canaux de contact disponibles *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.canaux_contact.includes('whatsapp')}
                        onChange={(e) => {
                          const newCanaux = e.target.checked
                            ? [...formData.canaux_contact, 'whatsapp']
                            : formData.canaux_contact.filter(c => c !== 'whatsapp');
                          setFormData({...formData, canaux_contact: newCanaux});
                        }}
                        className="w-5 h-5 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-700">📱 WhatsApp</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.canaux_contact.includes('email')}
                        onChange={(e) => {
                          const newCanaux = e.target.checked
                            ? [...formData.canaux_contact, 'email']
                            : formData.canaux_contact.filter(c => c !== 'email');
                          setFormData({...formData, canaux_contact: newCanaux});
                        }}
                        className="w-5 h-5 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-700">📧 Email</span>
                    </label>
                  </div>
                </div>

                {/* Aperçu CTA */}
                {formData.cta_principal && formData.canaux_contact.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      📱 Aperçu des boutons :
                    </p>
                    <div className="flex gap-2">
                      {formData.canaux_contact.includes('whatsapp') && (
                        <div className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg">
                          {CTA_TYPES.find(c => c.value === formData.cta_principal)?.icon} WhatsApp
                        </div>
                      )}
                      {formData.canaux_contact.includes('email') && (
                        <div className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg">
                          {CTA_TYPES.find(c => c.value === formData.cta_principal)?.icon} Email
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4 : SERVICES (Hôtels/Appartements) */}
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  🏨 Services & équipements
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Cochez les services disponibles (pour hôtels, appartements, etc.)
                </p>
              </div>

              <div className="space-y-6">
                {/* Grid services */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {SERVICES_DISPONIBLES.map(service => (
                    <label 
                      key={service.value}
                      className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={formData.services_inclus.includes(service.value)}
                        onChange={(e) => {
                          const newServices = e.target.checked
                            ? [...formData.services_inclus, service.value]
                            : formData.services_inclus.filter(s => s !== service.value);
                          setFormData({...formData, services_inclus: newServices});
                        }}
                        className="w-5 h-5 text-primary focus:ring-primary"
                      />
                      <span className="text-2xl">{service.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{service.label}</span>
                    </label>
                  ))}
                </div>

                {/* Politique d'annulation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Politique d'annulation
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Ex: Annulation gratuite jusqu'à 48h avant l'arrivée. Au-delà, première nuit facturée."
                    className="input-field"
                    value={formData.politique_annulation}
                    onChange={(e) => setFormData({...formData, politique_annulation: e.target.value})}
                  />
                </div>

                {/* Aperçu services */}
                {formData.services_inclus.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-800 mb-2">
                      ✅ {formData.services_inclus.length} service{formData.services_inclus.length > 1 ? 's' : ''} sélectionné{formData.services_inclus.length > 1 ? 's' : ''} :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.services_inclus.map(serviceValue => {
                        const service = SERVICES_DISPONIBLES.find(s => s.value === serviceValue);
                        return (
                          <span key={serviceValue} className="px-3 py-1 bg-white border border-green-300 rounded-full text-sm">
                            {service?.icon} {service?.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button onClick={sauvegarderStructure} className="btn-primary flex-1">
                {structureEnCours ? 'Modifier' : 'Ajouter'} la structure
              </button>
              <button onClick={() => setMode('liste')} className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titre="Gestion des Structures" sousTitre={`${structures.length} structures enregistrées`}>
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <button onClick={ajouterStructure} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter une structure
        </button>

        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-3 text-gray-400" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher une structure..."
            className="input-field pl-10"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Structure</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Catégorie</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Localisation</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">CTA</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Photos</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {structuresFiltrees.map((structure) => (
                <tr key={structure.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {structure.images?.[0] && (
                        <img src={structure.images[0]} alt={structure.nom} className="w-12 h-12 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{structure.nom}</p>
                        <p className="text-sm text-gray-500">Note: {structure.note || 0}/5</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${structure.categorie?.color}`}>
                      {structure.categorie?.icon} {structure.categorie?.nom}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-800">{structure.ville?.nom}</p>
                    <p className="text-xs text-gray-500">{structure.pays?.nom}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-800">{structure.telephone}</p>
                    <p className="text-xs text-gray-500">{structure.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600">
                      {structure.cta_principal && (
                        <div className="flex items-center gap-1">
                          <span>{CTA_TYPES.find(c => c.value === structure.cta_principal)?.icon}</span>
                          <span>{structure.canaux_contact?.length || 0} canaux</span>
                        </div>
                      )}
                      {structure.services_inclus?.length > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          {structure.services_inclus.length} services
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600">
                      <div>Couverture: {structure.images?.length || 0}</div>
                      <div>Galerie: {Array.isArray(structure.galerie) ? structure.galerie.length : 0}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => modifierStructure(structure)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => supprimerStructure(structure.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {structuresFiltrees.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow mt-6">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl text-gray-600 mb-2">Aucune structure trouvée</p>
          <p className="text-gray-500">Essayez avec d'autres termes de recherche</p>
        </div>
      )}
    </AdminLayout>
  );
}