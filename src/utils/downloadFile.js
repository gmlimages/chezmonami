// src/utils/downloadFile.js

/**
 * Télécharge un fichier de manière sécurisée (masque l'URL Supabase)
 * @param {string} fileUrl - URL du fichier
 * @param {string} fileName - Nom du fichier à sauvegarder
 */
export async function downloadFile(fileUrl, fileName) {
  try {
    // 1. Télécharger le fichier via fetch
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Erreur téléchargement: ${response.status}`);
    }

    // 2. Convertir en Blob
    const blob = await response.blob();

    // 3. Créer un lien de téléchargement invisible
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';

    // 4. Ajouter au DOM, cliquer, puis retirer
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 5. Libérer la mémoire
    window.URL.revokeObjectURL(url);

    console.log('✅ Téléchargement réussi:', fileName);
  } catch (error) {
    console.error('❌ Erreur téléchargement:', error);
    alert('Erreur lors du téléchargement du fichier');
  }
}

/**
 * Télécharge plusieurs fichiers
 * @param {Array} files - [{url: string, nom: string}]
 */
export async function downloadMultipleFiles(files) {
  for (const file of files) {
    await downloadFile(file.url, file.nom);
    // Petite pause entre chaque téléchargement
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}