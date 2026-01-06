// src/app/admin/structures/page.js - VERSION COMPLÈTE AVEC NOUVEAUX CHAMPS
// ✅ Images séparées + CTA + Services + NOUVEAUX: Horaires détaillés, Langues, Paiements, Livraison, Badges, Vidéos

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

// 🆕 LANGUES DISPONIBLES
const LANGUES_DISPONIBLES = [
  { value: 'français', label: 'Français', icon: '🇫🇷' },
  { value: 'arabe', label: 'Arabe', icon: '🇲🇦' },
  { value: 'anglais', label: 'Anglais', icon: '🇬🇧' },
  { value: 'espagnol', label: 'Espagnol', icon: '🇪🇸' },
  { value: 'allemand', label: 'Allemand', icon: '🇩🇪' },
  { value: 'italien', label: 'Italien', icon: '🇮🇹' },
  { value: 'chinois', label: 'Chinois', icon: '🇨🇳' }
];

// 🆕 MODES DE PAIEMENT
const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces', icon: '💵' },
  { value: 'carte', label: 'Carte bancaire', icon: '💳' },
  { value: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { value: 'virement', label: 'Virement bancaire', icon: '🏦' },
  { value: 'cheque', label: 'Chèque', icon: '📝' }
];

// 🆕 CERTIFICATS
const CERTIFICATS_DISPONIBLES = [
  { value: 'iso_9001', label: 'ISO 9001', icon: '🏅' },
  { value: 'halal', label: 'Halal', icon: '☪️' },
  { value: 'bio', label: 'Bio', icon: '🌱' },
  { value: 'label_qualite', label: 'Label Qualité', icon: '⭐' },
  { value: 'hygiene', label: 'Hygiène certifiée', icon: '🧼' }
];

// 🆕 JOURS DE LA SEMAINE
const JOURS_SEMAINE = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

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
    politique_annulation: '',
    // 🆕 NOUVEAUX CHAMPS
    annee_creation: '',
    nombre_employes: '',
    nombre_produits_vendus: 0,
    horaires_detailles: {
      lundi: { ouvert: true, heures: '09:00-18:00' },
      mardi: { ouvert: true, heures: '09:00-18:00' },
      mercredi: { ouvert: true, heures: '09:00-18:00' },
      jeudi: { ouvert: true, heures: '09:00-18:00' },
      vendredi: { ouvert: true, heures: '09:00-18:00' },
      samedi: { ouvert: true, heures: '10:00-17:00' },
      dimanche: { ouvert: false, heures: '' }
    },
    langues_parlees: [],
    modes_paiement: [],
    livraison_locale: false,
    livraison_internationale: false,
    click_and_collect: false,
    sur_place: false,
    verifie: false,
    certificats: [],
    youtube_video_url: '',
    youtube_video_url_2: ''
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
      politique_annulation: '',
      annee_creation: '',
      nombre_employes: '',
      nombre_produits_vendus: 0,
      horaires_detailles: {
        lundi: { ouvert: true, heures: '09:00-18:00' },
        mardi: { ouvert: true, heures: '09:00-18:00' },
        mercredi: { ouvert: true, heures: '09:00-18:00' },
        jeudi: { ouvert: true, heures: '09:00-18:00' },
        vendredi: { ouvert: true, heures: '09:00-18:00' },
        samedi: { ouvert: true, heures: '10:00-17:00' },
        dimanche: { ouvert: false, heures: '' }
      },
      langues_parlees: [],
      modes_paiement: [],
      livraison_locale: false,
      livraison_internationale: false,
      click_and_collect: false,
      sur_place: false,
      verifie: false,
      certificats: [],
      youtube_video_url: '',
      youtube_video_url_2: ''
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
    
    // 🆕 Horaires détaillés - Parse JSON ou structure par défaut
    let horairesDetailles = {
      lundi: { ouvert: true, heures: '09:00-18:00' },
      mardi: { ouvert: true, heures: '09:00-18:00' },
      mercredi: { ouvert: true, heures: '09:00-18:00' },
      jeudi: { ouvert: true, heures: '09:00-18:00' },
      vendredi: { ouvert: true, heures: '09:00-18:00' },
      samedi: { ouvert: true, heures: '10:00-17:00' },
      dimanche: { ouvert: false, heures: '' }
    };
    
    if (structure.horaires_detailles && typeof structure.horaires_detailles === 'object') {
      horairesDetailles = structure.horaires_detailles;
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
      politique_annulation: structure.politique_annulation || '',
      // 🆕 NOUVEAUX CHAMPS
      annee_creation: structure.annee_creation || '',
      nombre_employes: structure.nombre_employes || '',
      nombre_produits_vendus: structure.nombre_produits_vendus || 0,
      horaires_detailles: horairesDetailles,
      langues_parlees: structure.langues_parlees || [],
      modes_paiement: structure.modes_paiement || [],
      livraison_locale: structure.livraison_locale || false,
      livraison_internationale: structure.livraison_internationale || false,
      click_and_collect: structure.click_and_collect || false,
      sur_place: structure.sur_place || false,
      verifie: structure.verifie || false,
      certificats: structure.certificats || [],
      youtube_video_url: structure.youtube_video_url || '',
      youtube_video_url_2: structure.youtube_video_url_2 || ''
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
      const dataToSave = {
        ...formData,
        // Conversion des valeurs vides en null pour les champs optionnels
        annee_creation: formData.annee_creation ? parseInt(formData.annee_creation) : null,
        nombre_employes: formData.nombre_employes ? parseInt(formData.nombre_employes) : null,
        nombre_produits_vendus: formData.nombre_produits_vendus ? parseInt(formData.nombre_produits_vendus) : 0
      };

      if (structureEnCours) {
        await structuresAPI.update(structureEnCours.id, dataToSave);
        alert('✅ Structure modifiée avec succès !');
      } else {
        await structuresAPI.create(dataToSave);
        alert('✅ Structure ajoutée avec succès !');
      }
      
      chargerDonnees();
      setMode('liste');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('❌ Erreur lors de la sauvegarde');
    }
  };

  const structuresFiltrees = structures.filter(s => 
    s.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    s.ville?.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    s.pays?.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout titre="Gestion des Structures">
        <div className="flex items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminLayout>
    );
  }

  // MODE FORMULAIRE
  if (mode === 'formulaire') {
    const categorieSelectionnee = categories.find(c => c.id === formData.categorie_id);
    const isHotelOuAppart = categorieSelectionnee?.nom?.toLowerCase().includes('hotel') || 
                            categorieSelectionnee?.nom?.toLowerCase().includes('appartement');
    const isBoutique = categorieSelectionnee?.nom?.toLowerCase().includes('boutique');
    const isUsine = categorieSelectionnee?.nom?.toLowerCase().includes('usine') || 
                    categorieSelectionnee?.nom?.toLowerCase().includes('production');

    return (
      <AdminLayout 
        titre={structureEnCours ? 'Modifier une structure' : 'Ajouter une structure'}
        sousTitre="Remplissez tous les champs obligatoires"
      >
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Informations de base */}
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">📋 Informations de base</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom de la structure *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    placeholder="Ex: Restaurant Le Palais"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                  <select
                    className="input-field"
                    value={formData.categorie_id}
                    onChange={(e) => setFormData({...formData, categorie_id: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pays *</label>
                  <select
                    className="input-field"
                    value={formData.pays_id}
                    onChange={(e) => setFormData({...formData, pays_id: e.target.value, ville_id: ''})}
                  >
                    <option value="">Sélectionner un pays</option>
                    {pays.map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ville *</label>
                  <select
                    className="input-field"
                    value={formData.ville_id}
                    onChange={(e) => setFormData({...formData, ville_id: e.target.value})}
                    disabled={!formData.pays_id}
                  >
                    <option value="">Sélectionner une ville</option>
                    {villes.map(v => (
                      <option key={v.id} value={v.id}>{v.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse complète</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.adresse}
                    onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                    placeholder="Ex: 123 Avenue Mohammed V"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description courte * (Max 200 caractères)</label>
                <textarea
                  rows="2"
                  maxLength="200"
                  className="input-field"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Décrivez brièvement votre structure..."
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/200 caractères</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description longue (Optionnel)</label>
                <textarea
                  rows="5"
                  className="input-field"
                  value={formData.description_longue}
                  onChange={(e) => setFormData({...formData, description_longue: e.target.value})}
                  placeholder="Description détaillée, historique, spécialités..."
                />
              </div>
            </div>

            {/* 🆕 SECTION INFORMATIONS ENTREPRISE */}
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">🏢 Informations sur l'entreprise</h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Année de création (Optionnel)</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="input-field"
                    value={formData.annee_creation}
                    onChange={(e) => setFormData({...formData, annee_creation: e.target.value})}
                    placeholder="Ex: 2010"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre d'employés (Optionnel)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={formData.nombre_employes}
                    onChange={(e) => setFormData({...formData, nombre_employes: e.target.value})}
                    placeholder="Ex: 15"
                  />
                </div>

                {(isBoutique || isUsine) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Produits vendus (Optionnel)</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={formData.nombre_produits_vendus}
                      onChange={(e) => setFormData({...formData, nombre_produits_vendus: e.target.value})}
                      placeholder="Ex: 1000"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">📞 Contact</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    placeholder="+212600000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="contact@structure.ma"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Horaires (texte simple) *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.horaires}
                  onChange={(e) => setFormData({...formData, horaires: e.target.value})}
                  placeholder="Ex: Lun-Sam 9h-18h, Fermé dimanche"
                />
              </div>
            </div>

            {/* 🆕 HORAIRES DÉTAILLÉS */}
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">🕒 Horaires détaillés (Optionnel)</h3>
              
              <div className="space-y-4">
                {JOURS_SEMAINE.map(jour => (
                  <div key={jour} className="grid md:grid-cols-4 gap-4 items-center p-4 border rounded-lg">
                    <div className="font-medium text-gray-700 capitalize">{jour}</div>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.horaires_detailles[jour]?.ouvert}
                        onChange={(e) => setFormData({
                          ...formData,
                          horaires_detailles: {
                            ...formData.horaires_detailles,
                            [jour]: {
                              ...formData.horaires_detailles[jour],
                              ouvert: e.target.checked
                            }
                          }
                        })}
                        className="w-5 h-5 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Ouvert</span>
                    </label>

                    <div className="md:col-span-2">
                      <input
                        type="text"
                        disabled={!formData.horaires_detailles[jour]?.ouvert}
                        className="input-field"
                        value={formData.horaires_detailles[jour]?.heures || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          horaires_detailles: {
                            ...formData.horaires_detailles,
                            [jour]: {
                              ...formData.horaires_detailles[jour],
                              heures: e.target.value
                            }
                          }
                        })}
                        placeholder="Ex: 09:00-18:00 ou 09:00-13:00, 15:00-18:00"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🆕 LANGUES PARLÉES */}
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">🌍 Langues parlées</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                {LANGUES_DISPONIBLES.map(langue => (
                  <label
                    key={langue.value}
                    className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={formData.langues_parlees.includes(langue.value)}
                      onChange={(e) => {
                        const newLangues = e.target.checked
                          ? [...formData.langues_parlees, langue.value]
                          : formData.langues_parlees.filter(l => l !== langue.value);
                        setFormData({...formData, langues_parlees: newLangues});
                      }}
                      className="w-5 h-5 text-primary focus:ring-primary"
                    />
                    <span className="text-2xl">{langue.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{langue.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 🆕 MODES DE PAIEMENT */}
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">💳 Modes de paiement acceptés</h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                {MODES_PAIEMENT.map(mode => (
                  <label
                    key={mode.value}
                    className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={formData.modes_paiement.includes(mode.value)}
                      onChange={(e) => {
                        const newModes = e.target.checked
                          ? [...formData.modes_paiement, mode.value]
                          : formData.modes_paiement.filter(m => m !== mode.value);
                        setFormData({...formData, modes_paiement: newModes});
                      }}
                      className="w-5 h-5 text-primary focus:ring-primary"
                    />
                    <span className="text-2xl">{mode.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{mode.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 🆕 SERVICES DE LIVRAISON ET VENTE */}
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">🚚 Services proposés</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={formData.livraison_locale}
                    onChange={(e) => setFormData({...formData, livraison_locale: e.target.checked})}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-lg font-medium text-gray-800">🚚 Livraison locale</span>
                    <p className="text-xs text-gray-500">Livraison dans la ville/région</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={formData.livraison_internationale}
                    onChange={(e) => setFormData({...formData, livraison_internationale: e.target.checked})}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-lg font-medium text-gray-800">✈️ Livraison internationale</span>
                    <p className="text-xs text-gray-500">Expédition à l'étranger</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={formData.click_and_collect}
                    onChange={(e) => setFormData({...formData, click_and_collect: e.target.checked})}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-lg font-medium text-gray-800">📦 Click & Collect</span>
                    <p className="text-xs text-gray-500">Retrait sur place</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={formData.sur_place}
                    onChange={(e) => setFormData({...formData, sur_place: e.target.checked})}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-lg font-medium text-gray-800">🏪 Service sur place</span>
                    <p className="text-xs text-gray-500">Achat/consommation sur place</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 🆕 BADGES ET CERTIFICATIONS */}
            <div className="space-y-6 mb-8">
  <h3 className="text-xl font-bold text-gray-800 border-b pb-3">🏅 Badges et Certifications</h3>
  
  <div className="mb-4">
    <label className="flex items-center gap-3 p-4 border-2 border-green-200 bg-green-50 rounded-lg cursor-pointer hover:border-green-400 transition">
      <input
        type="checkbox"
        checked={formData.verifie}
        onChange={(e) => setFormData({...formData, verifie: e.target.checked})}
        className="w-5 h-5 text-green-600 focus:ring-green-500"
      />
      <div>
        <span className="text-lg font-bold text-green-800">✅ Structure vérifiée</span>
        <p className="text-xs text-green-600">Badge "Vérifié" affiché sur la page</p>
      </div>
    </label>
  </div>

  {/* 🆕 CHAMP LIBRE POUR CERTIFICATS */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Certificats (un par ligne)
    </label>
    <textarea
      rows="5"
      className="input-field"
      value={formData.certificats.join('\n')}
      onChange={(e) => {
        const certs = e.target.value.split('\n').filter(c => c.trim() !== '');
        setFormData({...formData, certificats: certs});
      }}
      placeholder="Exemple:&#10;🏅 ISO 9001&#10;☪️ Halal&#10;🌱 Bio&#10;⭐ Label Qualité"
    />
    <p className="text-xs text-gray-500 mt-1">
      💡 Conseil : Commence chaque ligne par un emoji + espace + nom du certificat
    </p>
  </div>

  {/* Aperçu */}
  {formData.certificats.length > 0 && (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-sm font-medium text-blue-800 mb-2">
        ✅ {formData.certificats.length} certificat{formData.certificats.length > 1 ? 's' : ''} ajouté{formData.certificats.length > 1 ? 's' : ''} :
      </p>
      <div className="flex flex-wrap gap-2">
        {formData.certificats.map((cert, index) => (
          <span key={index} className="px-3 py-1 bg-white border border-blue-300 rounded-full text-sm">
            {cert}
          </span>
        ))}
      </div>
    </div>
  )}
</div>

            {/* 🆕 VIDÉOS YOUTUBE */}
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">🎥 Vidéos de présentation (Max 2)</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vidéo YouTube 1 (Optionnel)</label>
                  <input
                    type="url"
                    className="input-field"
                    value={formData.youtube_video_url}
                    onChange={(e) => setFormData({...formData, youtube_video_url: e.target.value})}
                    placeholder="https://www.youtube.com/watch?v=xxxxx"
                  />
                  <p className="text-xs text-gray-500 mt-1">Copiez l'URL complète de votre vidéo YouTube</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vidéo YouTube 2 (Optionnel)</label>
                  <input
                    type="url"
                    className="input-field"
                    value={formData.youtube_video_url_2}
                    onChange={(e) => setFormData({...formData, youtube_video_url_2: e.target.value})}
                    placeholder="https://www.youtube.com/watch?v=xxxxx"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">📸 Images</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images de couverture (max 5)</label>
                <ImageUploader
                  images={formData.images}
                  onChange={(images) => setFormData({...formData, images})}
                  maxImages={5}
                  label="Couverture"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Galerie photos (max 20)</label>
                <ImageUploader
                  images={formData.galerie}
                  onChange={(galerie) => setFormData({...formData, galerie})}
                  maxImages={20}
                  label="Galerie"
                />
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 border-b pb-3">🎯 Boutons d'action (CTA)</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action principale</label>
                  <select
                    className="input-field"
                    value={formData.cta_principal}
                    onChange={(e) => setFormData({...formData, cta_principal: e.target.value})}
                  >
                    <option value="">Aucune action</option>
                    {CTA_TYPES.map(cta => (
                      <option key={cta.value} value={cta.value}>{cta.icon} {cta.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action secondaire</label>
                  <select
                    className="input-field"
                    value={formData.cta_secondaire}
                    onChange={(e) => setFormData({...formData, cta_secondaire: e.target.value})}
                  >
                    <option value="">Aucune action</option>
                    {CTA_TYPES.map(cta => (
                      <option key={cta.value} value={cta.value}>{cta.icon} {cta.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Canaux de contact</label>
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
                    <span className="text-sm font-medium text-gray-700">✉️ Email</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Services hôtel */}
            {isHotelOuAppart && (
              <div className="space-y-6 mb-8">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-3">🏨 Services inclus</h3>
                
                <div className="grid md:grid-cols-3 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Politique d'annulation</label>
                  <textarea
                    rows="3"
                    placeholder="Ex: Annulation gratuite jusqu'à 48h avant l'arrivée. Au-delà, première nuit facturée."
                    className="input-field"
                    value={formData.politique_annulation}
                    onChange={(e) => setFormData({...formData, politique_annulation: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Boutons d'action */}
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

  // MODE LISTE
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Badges</th>
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
                    <div className="flex flex-col gap-1">
                      {structure.verifie && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">✅ Vérifié</span>
                      )}
                      {structure.certificats?.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          🏅 {structure.certificats.length} cert.
                        </span>
                      )}
                      {structure.youtube_video_url && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">🎥 Vidéo</span>
                      )}
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