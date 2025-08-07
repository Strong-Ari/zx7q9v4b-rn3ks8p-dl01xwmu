import * as fs from 'fs';
import * as path from 'path';

interface CloudinaryResource {
  public_id: string;
  format: string;
  resource_type: string;
  url: string;
  secure_url: string;
}

interface CloudinaryAudio {
  name: string;
  url: string;
}

/**
 * Récupère la liste des audios depuis Cloudinary via l'API
 */
async function fetchCloudinaryAudios(): Promise<CloudinaryAudio[]> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Variables d\'environnement Cloudinary manquantes: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }

  try {
    // URL de l'API Cloudinary pour lister les ressources audio
    const baseUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources`;
    const params = new URLSearchParams({
      resource_type: 'video', // Les fichiers audio sont dans la catégorie video
      type: 'upload',
      prefix: 'audio/', // Supposant que les audios sont dans un dossier audio/
      max_results: '100'
    });

    // Authentification basique
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API Cloudinary: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filtrer et formatter les résultats
    const audioFiles: CloudinaryAudio[] = data.resources
      .filter((resource: CloudinaryResource) => 
        resource.format === 'wav' || resource.format === 'mp3'
      )
      .map((resource: CloudinaryResource) => ({
        name: path.basename(resource.public_id) + '.' + resource.format,
        url: resource.secure_url
      }));

    console.log(`✅ ${audioFiles.length} fichiers audio trouvés sur Cloudinary`);
    return audioFiles;

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des audios:', error);
    throw error;
  }
}

/**
 * Met à jour le fichier download-random-audio.ts avec la liste récupérée
 */
async function updateDownloadScript(audios: CloudinaryAudio[]) {
  const scriptPath = path.join(process.cwd(), 'scripts', 'download-random-audio.ts');
  
  try {
    // Lire le fichier actuel
    const content = await fs.promises.readFile(scriptPath, 'utf-8');
    
    // Générer la nouvelle liste
    const audiosArray = audios.map(audio => 
      `  {\n    name: "${audio.name}",\n    url: "${audio.url}"\n  }`
    ).join(',\n');
    
    const newAudiosConstant = `const CLOUDINARY_AUDIOS: CloudinaryAudio[] = [\n${audiosArray}\n];`;
    
    // Remplacer l'ancienne liste
    const updatedContent = content.replace(
      /const CLOUDINARY_AUDIOS: CloudinaryAudio\[] = \[[\s\S]*?\];/,
      newAudiosConstant
    );
    
    // Écrire le fichier mis à jour
    await fs.promises.writeFile(scriptPath, updatedContent);
    console.log(`✅ Script mis à jour: ${scriptPath}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du script:', error);
    throw error;
  }
}

/**
 * Point d'entrée du script
 */
async function main() {
  console.log('🔄 Synchronisation des audios Cloudinary...');
  
  try {
    const audios = await fetchCloudinaryAudios();
    await updateDownloadScript(audios);
    console.log('🎉 Synchronisation terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Échec de la synchronisation:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fetchCloudinaryAudios, updateDownloadScript };