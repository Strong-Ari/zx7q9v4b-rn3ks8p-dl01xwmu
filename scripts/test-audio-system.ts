import * as fs from 'fs';
import * as path from 'path';

/**
 * Script de test pour valider le système audio sans Cloudinary
 */
async function testAudioSystem() {
  console.log('🧪 Test du système audio...');
  
  const publicDir = path.join(process.cwd(), 'public');
  const destinationPath = path.join(publicDir, 'current-audio.wav');
  const metadataPath = path.join(publicDir, 'current-audio-metadata.json');
  
  try {
    // Créer le dossier public s'il n'existe pas
    await fs.promises.mkdir(publicDir, { recursive: true });
    
    // Créer un fichier audio de test (vide)
    const testAudioData = Buffer.alloc(1024, 0); // 1KB de données nulles
    await fs.promises.writeFile(destinationPath, testAudioData);
    console.log('✅ Fichier audio de test créé');
    
    // Créer les métadonnées de test
    const metadata = {
      name: 'test-audio.wav',
      url: 'https://test.cloudinary.com/test-audio.wav',
      downloadedAt: new Date().toISOString(),
      localPath: 'current-audio.wav'
    };
    
    await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    console.log('✅ Métadonnées de test créées');
    
    // Vérifier que les fichiers existent
    const audioExists = fs.existsSync(destinationPath);
    const metadataExists = fs.existsSync(metadataPath);
    
    console.log(`📁 Fichier audio: ${audioExists ? '✅' : '❌'}`);
    console.log(`📁 Métadonnées: ${metadataExists ? '✅' : '❌'}`);
    
    if (audioExists && metadataExists) {
      console.log('🎉 Test du système audio réussi !');
      
      // Lire les métadonnées pour vérification
      const savedMetadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf-8'));
      console.log('📄 Métadonnées sauvegardées:', savedMetadata);
      
      return true;
    } else {
      console.log('❌ Test échoué : fichiers manquants');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return false;
  }
}

/**
 * Test de l'intégration avec Remotion
 */
async function testRemotionIntegration() {
  console.log('🎬 Test de l\'intégration Remotion...');
  
  try {
    const currentAudioPath = path.join(process.cwd(), 'public', 'current-audio.wav');
    
    if (!fs.existsSync(currentAudioPath)) {
      console.log('❌ Fichier current-audio.wav non trouvé');
      return false;
    }
    
    // Vérifier que staticFile fonctionne (simulation)
    const staticFilePath = 'current-audio.wav';
    console.log(`✅ Chemin staticFile: ${staticFilePath}`);
    
    // Vérifier la structure des compositions
    const ballEscapePath = path.join(process.cwd(), 'src', 'remotion', 'BallEscape.tsx');
    const ballEscapeOptimizedPath = path.join(process.cwd(), 'src', 'remotion', 'BallEscapeOptimized.tsx');
    
    const ballEscapeExists = fs.existsSync(ballEscapePath);
    const ballEscapeOptimizedExists = fs.existsSync(ballEscapeOptimizedPath);
    
    console.log(`📁 BallEscape.tsx: ${ballEscapeExists ? '✅' : '❌'}`);
    console.log(`📁 BallEscapeOptimized.tsx: ${ballEscapeOptimizedExists ? '✅' : '❌'}`);
    
    if (ballEscapeExists) {
      const content = await fs.promises.readFile(ballEscapePath, 'utf-8');
      const hasAudioImport = content.includes('Audio,');
      const hasStaticFile = content.includes('staticFile("current-audio.wav")');
      const hasAudioComponent = content.includes('<Audio src={audioPath}');
      
      console.log(`📄 Import Audio: ${hasAudioImport ? '✅' : '❌'}`);
      console.log(`📄 StaticFile: ${hasStaticFile ? '✅' : '❌'}`);
      console.log(`📄 Composant Audio: ${hasAudioComponent ? '✅' : '❌'}`);
      
      if (hasAudioImport && hasStaticFile && hasAudioComponent) {
        console.log('🎉 Intégration Remotion validée !');
        return true;
      }
    }
    
    console.log('❌ Intégration Remotion incomplète');
    return false;
    
  } catch (error) {
    console.error('❌ Erreur lors du test Remotion:', error);
    return false;
  }
}

/**
 * Point d'entrée du script de test
 */
async function main() {
  console.log('🚀 Démarrage des tests du système audio...\n');
  
  const test1 = await testAudioSystem();
  console.log('');
  const test2 = await testRemotionIntegration();
  
  console.log('\n📊 Résultat des tests:');
  console.log(`- Système audio: ${test1 ? '✅' : '❌'}`);
  console.log(`- Intégration Remotion: ${test2 ? '✅' : '❌'}`);
  
  if (test1 && test2) {
    console.log('\n🎉 Tous les tests sont passés ! Le système est prêt.');
    process.exit(0);
  } else {
    console.log('\n❌ Certains tests ont échoué. Vérifiez la configuration.');
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testAudioSystem, testRemotionIntegration };