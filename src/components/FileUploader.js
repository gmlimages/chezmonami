// src/components/FileUploader.js
// Composant pour uploader des fichiers (PDF, Word, Excel, etc.)
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FileUploader({ fichiers = [], onChange }) {
  const [uploading, setUploading] = useState(false);

  const typesAcceptes = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'text/plain': '.txt',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar'
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Vérifier la taille (max 10MB par fichier)
    const fichiersTropGros = files.filter(f => f.size > 10 * 1024 * 1024);
    if (fichiersTropGros.length > 0) {
      alert(`❌ Certains fichiers dépassent 10MB : ${fichiersTropGros.map(f => f.name).join(', ')}`);
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = fileName;

        // Upload du fichier
        const { data, error } = await supabase.storage
          .from('annonces-fichiers')
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
          .from('annonces-fichiers')
          .getPublicUrl(filePath);

        return {
          nom: file.name,
          url: urlData.publicUrl,
          taille: file.size,
          type: file.type
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const nouveauxFichiers = [...fichiers, ...uploadedFiles];
      onChange(nouveauxFichiers);

      alert(`✅ ${uploadedFiles.length} fichier(s) uploadé(s) avec succès !`);
    } catch (error) {
      console.error('Erreur upload fichiers:', error);
      alert('❌ Erreur lors de l\'upload. Vérifiez que le bucket "annonces-fichiers" existe et est public.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (index, fileUrl) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      // Extraire le nom du fichier depuis l'URL
      if (fileUrl.includes('supabase')) {
        const fileName = fileUrl.split('/').pop();
        await supabase.storage
          .from('annonces-fichiers')
          .remove([fileName]);
      }

      const nouveauxFichiers = fichiers.filter((_, i) => i !== index);
      onChange(nouveauxFichiers);
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const formatTaille = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getIconeFichier = (type) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    if (type.includes('text')) return '📃';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Zone d'upload */}
      <div className="relative">
        <input
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className={`block w-full p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
            uploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                Cliquez pour sélectionner des fichiers
              </p>
              <p className="text-xs text-gray-500">
                PDF, Word, Excel, TXT, ZIP, RAR • Max 10MB par fichier
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Liste des fichiers */}
      {fichiers.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {fichiers.length} fichier{fichiers.length > 1 ? 's' : ''} joint{fichiers.length > 1 ? 's' : ''}
          </p>
          
          <div className="space-y-2">
            {fichiers.map((fichier, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-3xl flex-shrink-0">
                    {getIconeFichier(fichier.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {fichier.nom}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTaille(fichier.taille)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Bouton télécharger */}
                  <a
                    href={fichier.url}
                    download={fichier.nom}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Télécharger"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>

                  {/* Bouton supprimer */}
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(index, fichier.url)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    title="Supprimer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-800">
          💡 <strong>Formats acceptés :</strong> PDF, Word (.doc, .docx), Excel (.xls, .xlsx), TXT, ZIP, RAR
          <br />
          📏 <strong>Taille maximale :</strong> 10 MB par fichier
          <br />
          📎 <strong>Nombre de fichiers :</strong> Illimité
        </p>
      </div>
    </div>
  );
}