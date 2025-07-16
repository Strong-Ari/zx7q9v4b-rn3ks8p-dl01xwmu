#!/usr/bin/env tsx

import generateTikTokCommentWithRetry from '../src/services/tiktok-comment-generator';
import path from 'path';
import fs from 'fs/promises';

async function testTikTokGenerator() {
  console.log('🧪 Test du générateur de commentaires TikTok\n');
  
  try {
    // Vérifier que le dossier de destination existe
    const generatedDir = path.join(process.cwd(), 'public', 'generated');
    try {
      await fs.access(generatedDir);
      console.log('✅ Dossier generated existant');
    } catch {
      console.log('📁 Création du dossier generated...');
      await fs.mkdir(generatedDir, { recursive: true });
    }
    
    console.log('🚀 Lancement du test de génération...\n');
    
    const startTime = Date.now();
    const result = await generateTikTokCommentWithRetry(2);
    const endTime = Date.now();
    
    console.log('\n📊 Résultats du test:');
    console.log('=' .repeat(50));
    
    if (result.success) {
      console.log('✅ SUCCÈS - Commentaire TikTok généré!');
      console.log(`📝 Pseudo: ${result.username}`);
      console.log(`💬 Commentaire: ${result.comment}`);
      console.log(`🖼️ Image: ${result.imagePath}`);
      console.log(`⏱️ Temps d'exécution: ${endTime - startTime}ms`);
      
      // Vérifier que le fichier existe physiquement
      const fullPath = path.join(process.cwd(), 'public', result.imagePath!);
      try {
        const stats = await fs.stat(fullPath);
        console.log(`📐 Taille du fichier: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`📅 Créé le: ${stats.birthtime.toLocaleString('fr-FR')}`);
      } catch (err) {
        console.log('⚠️ Erreur lors de la vérification du fichier:', err);
      }
      
    } else {
      console.log('❌ ÉCHEC - Erreur lors de la génération');
      console.log(`🔥 Erreur: ${result.error}`);
      console.log(`⏱️ Temps d'exécution: ${endTime - startTime}ms`);
    }
    
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('💥 Erreur critique dans le test:', error);
    process.exit(1);
  }
}

// Fonction pour nettoyer les anciens fichiers de test (optionnel)
async function cleanupOldFiles() {
  try {
    const generatedDir = path.join(process.cwd(), 'public', 'generated');
    const files = await fs.readdir(generatedDir);
    
    const testFiles = files.filter(file => 
      file.startsWith('tiktok-comment-') && file.endsWith('.png')
    );
    
    if (testFiles.length > 5) {
      console.log(`🧹 Nettoyage des anciens fichiers de test (${testFiles.length} fichiers)...`);
      
      // Trier par date de création et garder seulement les 5 plus récents
      const fileStats = await Promise.all(
        testFiles.map(async file => {
          const filePath = path.join(generatedDir, file);
          const stats = await fs.stat(filePath);
          return { file, path: filePath, birthtime: stats.birthtime };
        })
      );
      
      fileStats.sort((a, b) => b.birthtime.getTime() - a.birthtime.getTime());
      const filesToDelete = fileStats.slice(5);
      
      for (const { path: filePath, file } of filesToDelete) {
        await fs.unlink(filePath);
        console.log(`🗑️ Supprimé: ${file}`);
      }
    }
  } catch (error) {
    console.log('⚠️ Erreur lors du nettoyage:', error);
  }
}

// Exécution du test
if (require.main === module) {
  (async () => {
    await cleanupOldFiles();
    await testTikTokGenerator();
  })();
}

export { testTikTokGenerator };