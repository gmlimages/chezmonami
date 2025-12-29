// src/lib/imageUpload.js
// Service pour uploader et gérer les images dans Supabase Storage

import { supabase } from './supabase';

/**
 * Upload plusieurs fichiers images vers Supabase Storage
 * @param {File[]} files - Tableau de fichiers à uploader
 * @returns {Promise<string[]>} - URLs publiques des images uploadées
 */
export const uploadImages = async (files) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map(async (file) => {
    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = fileName;

    // Upload du fichier
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erreur upload:', error);
      throw error;
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  });

  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Erreur lors de l\'upload des images:', error);
    throw new Error('Impossible d\'uploader les images. Vérifiez que le bucket "images" existe et est public.');
  }
};

/**
 * Supprimer une image du Storage
 * @param {string} imageUrl - URL de l'image à supprimer
 * @returns {Promise<boolean>}
 */
export const deleteImage = async (imageUrl) => {
  try {
    // Extraire le nom du fichier depuis l'URL
    // URL format: https://xxxxx.supabase.co/storage/v1/object/public/images/filename.jpg
    const fileName = imageUrl.split('/').pop();
    
    const { error } = await supabase.storage
      .from('images')
      .remove([fileName]);

    if (error) {
      console.error('Erreur suppression:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    return false;
  }
};

/**
 * Supprimer plusieurs images
 * @param {string[]} imageUrls - Tableau d'URLs d'images à supprimer
 * @returns {Promise<boolean>}
 */
export const deleteImages = async (imageUrls) => {
  if (!imageUrls || imageUrls.length === 0) return true;

  try {
    const deletePromises = imageUrls.map(url => deleteImage(url));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression des images:', error);
    return false;
  }
};