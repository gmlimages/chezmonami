// components/ImageUploader.js
// Composant réutilisable pour uploader des images

'use client'
import { useState } from 'react'
import { uploadImages } from '@/lib/imageUpload'
import { supabase } from '@/lib/supabase'

export default function ImageUploader({ images = [], onChange, maxImages = 5 }) {
  const [uploading, setUploading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState(images)

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    
    if (previewUrls.length + files.length > maxImages) {
      alert(`❌ Vous ne pouvez ajouter que ${maxImages} images maximum`)
      return
    }

    setUploading(true)
    try {
      const uploadedUrls = await uploadImages(files)
      const newImages = [...previewUrls, ...uploadedUrls]
      setPreviewUrls(newImages)
      onChange(newImages)
    } catch (error) {
      console.error('Erreur upload:', error)
      alert('❌ Erreur lors de l\'upload des images')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (index, imageUrl) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;

  try {
    // Extraction + suppression INLINE (comme fichiers)
    if (imageUrl.includes('supabase')) {
      const fileName = imageUrl.split('/').pop();
      
      console.log('🗑️ Suppression:', fileName); // Debug
      
      const { data, error } = await supabase.storage
        .from('images')
        .remove([fileName]);
      
      if (error) {
        console.error('Erreur Supabase:', error);
      } else {
        console.log('✅ Supprimé:', data);
      }
    }

    // Retrait local (TOUJOURS exécuté)
    const newImages = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newImages);
    onChange(newImages);
    
  } catch (error) {
    console.error('Erreur suppression:', error);
    // Retirer quand même
    const newImages = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newImages);
    onChange(newImages);
  }
};

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    
    if (dragIndex === dropIndex) return

    const newImages = [...previewUrls]
    const draggedItem = newImages[dragIndex]
    newImages.splice(dragIndex, 1)
    newImages.splice(dropIndex, 0, draggedItem)
    
    setPreviewUrls(newImages)
    onChange(newImages)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-4">
      {/* Zone d'upload */}
      <div className="relative">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          disabled={uploading || previewUrls.length >= maxImages}
          className="hidden"
          id="image-upload"
        />
        <label
          htmlFor="image-upload"
          className={`block w-full p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
            uploading || previewUrls.length >= maxImages
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-primary bg-primary/5 hover:bg-primary/10'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600">Upload en cours...</p>
            </div>
          ) : previewUrls.length >= maxImages ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-600">
                Limite atteinte ({maxImages} images max)
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                Cliquez pour sélectionner des images
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WEBP • Max {maxImages} images • Max 5MB par image
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Aperçu des images */}
      {previewUrls.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              {previewUrls.length} image{previewUrls.length > 1 ? 's' : ''} 
            </p>
            <p className="text-xs text-gray-500">
              📌 Glissez-déposez pour réorganiser
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewUrls.map((url, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragOver={handleDragOver}
                className="relative group cursor-move"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-primary transition">
                  <img
                    src={url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Badge première image */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-white text-xs font-bold rounded">
                      Principale
                    </div>
                  )}
                  
                  {/* Bouton supprimer */}
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(index, url)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-100 z-50 transition flex items-center justify-center hover:bg-red-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  {/* Overlay déplacement */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                </div>
                
                <p className="text-xs text-center text-gray-500 mt-1">
                  Image {index + 1}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          💡 <strong>Astuce :</strong> La première image sera utilisée comme image principale. 
          Glissez-déposez les images pour les réorganiser.
        </p>
      </div>
    </div>
  )
}