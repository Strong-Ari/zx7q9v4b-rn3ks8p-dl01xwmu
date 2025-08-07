import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Charger les variables d'environnement manuellement
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (error) {
  console.warn('⚠️ Impossible de charger le fichier .env:', error);
}

interface CloudinaryAudio {
  name: string;
  url: string;
}

// Liste des musiques disponibles sur Cloudinary
// Format: { name: "nom_fichier.wav", url: "https://res.cloudinary.com/..." }
const CLOUDINARY_AUDIOS: CloudinaryAudio[] = [
  {
    name: "AfterDark.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/AfterDark.wav"
  },
  {
    name: "Attack_on_Titan_Jiyuu_no_Tsubasa.wav", 
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/Attack_on_Titan_Jiyuu_no_Tsubasa.wav"
  },
  {
    name: "BoMoonlightN12.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/BoMoonlightN12.wav"
  },
  {
    name: "BoMoonlightTungstenFilament.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/BoMoonlightTungstenFilament.wav"
  },
  {
    name: "comfort_chain.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/comfort_chain.wav"
  },
  {
    name: "Crystal_Waters_Gypsy_Woman.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/Crystal_Waters_Gypsy_Woman.wav"
  },
  {
    name: "DespacitoPiano.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/DespacitoPiano.wav"
  },
  {
    name: "FawltyTowers.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/FawltyTowers.wav"
  },
  {
    name: "Flowers.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/Flowers.wav"
  },
  {
    name: "Gravity_Falls_Made_Me_Realize.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/Gravity_Falls_Made_Me_Realize.wav"
  },
  {
    name: "HotelCalifornia.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/HotelCalifornia.wav"
  },
  {
    name: "Hunter_x_Hunter_2011_Departure.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/Hunter_x_Hunter_2011_Departure.wav"
  },
  {
    name: "IllBeGone.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/IllBeGone.wav"
  },
  {
    name: "JamboreeMladenFranko.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/JamboreeMladenFranko.wav"
  },
  {
    name: "Naruto_Main_Theme_Short_Version.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/Naruto_Main_Theme_Short_Version.wav"
  },
  {
    name: "Naruto_Shippuden_Opening_9.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/Naruto_Shippuden_Opening_9.wav"
  },
  {
    name: "One_Piece_Minato_Mura.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/One_Piece_Minato_Mura.wav"
  },
  {
    name: "PinkPanther.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/PinkPanther.wav"
  },
  {
    name: "Pirates_of_the_Caribbean_Hes_a_Pirate.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/Pirates_of_the_Caribbean_Hes_a_Pirate.wav"
  },
  {
    name: "Sam_Gellaitry_Assumptions.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/Sam_Gellaitry_Assumptions.wav"
  },
  {
    name: "Titantic.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/Titantic.wav"
  },
  {
    name: "Tokyo_Ghoul_Unravel.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/Tokyo_Ghoul_Unravel.wav"
  },
  {
    name: "Under_The_Sea_Little_Mermaid.wav",
    url: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1/audio/Under_The_Sea_Little_Mermaid.wav"
  }
];

/**
 * Télécharge un fichier depuis une URL
 */
async function downloadFile(url: string, destination: string): Promise<void> {
  try {
    console.log(`📥 Téléchargement depuis: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await fs.promises.writeFile(destination, Buffer.from(buffer));
    
    console.log(`✅ Fichier téléchargé: ${destination}`);
  } catch (error) {
    console.error(`❌ Erreur lors du téléchargement: ${error}`);
    throw error;
  }
}

/**
 * Sélectionne et télécharge une musique aléatoire depuis Cloudinary
 */
async function downloadRandomAudio(): Promise<string> {
  try {
    // Vérifier les variables d'environnement Cloudinary
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error('❌ CLOUDINARY_CLOUD_NAME non défini dans les variables d\'environnement');
    }

    // Remplacer YOUR_CLOUD_NAME par le vrai nom du cloud
    const audiosWithCorrectUrls = CLOUDINARY_AUDIOS.map(audio => ({
      ...audio,
      url: audio.url.replace('YOUR_CLOUD_NAME', cloudName)
    }));

    // Sélectionner une musique aléatoire
    const randomIndex = Math.floor(Math.random() * audiosWithCorrectUrls.length);
    const selectedAudio = audiosWithCorrectUrls[randomIndex];
    
    console.log(`🎵 Musique sélectionnée: ${selectedAudio.name}`);
    
    // Définir le chemin de destination
    const publicDir = path.join(process.cwd(), 'public');
    const destinationPath = path.join(publicDir, 'current-audio.wav');
    
    // Créer le dossier public s'il n'existe pas
    await fs.promises.mkdir(publicDir, { recursive: true });
    
    // Supprimer l'ancien fichier s'il existe
    try {
      await fs.promises.unlink(destinationPath);
      console.log('🗑️ Ancien fichier audio supprimé');
    } catch (error) {
      // Fichier n'existe pas, ce n'est pas grave
    }
    
    // Télécharger le nouveau fichier
    await downloadFile(selectedAudio.url, destinationPath);
    
    // Sauvegarder les métadonnées de la musique sélectionnée
    const metadataPath = path.join(publicDir, 'current-audio-metadata.json');
    const metadata = {
      name: selectedAudio.name,
      url: selectedAudio.url,
      downloadedAt: new Date().toISOString(),
      localPath: 'current-audio.wav'
    };
    
    await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`📄 Métadonnées sauvegardées: ${metadataPath}`);
    
    return destinationPath;
    
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement de l\'audio:', error);
    throw error;
  }
}

/**
 * Point d'entrée du script
 */
async function main() {
  console.log('🚀 Démarrage du téléchargement d\'audio aléatoire...');
  
  try {
    const audioPath = await downloadRandomAudio();
    console.log(`🎉 Audio téléchargé avec succès: ${audioPath}`);
    process.exit(0);
  } catch (error) {
    console.error('💥 Échec du téléchargement:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { downloadRandomAudio, CLOUDINARY_AUDIOS };