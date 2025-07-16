#!/usr/bin/env tsx

import generateTikTokCommentWithRetry from "../src/services/tiktok-comment-generator";
import path from "path";
import fs from "fs/promises";

async function generateCommentStartup() {
  try {
    // Vérifier que les dossiers de destination existent
    const publicDir = path.join(process.cwd(), "public");
    const publicGeneratedDir = path.join(publicDir, "generated");

    // Créer les dossiers s'ils n'existent pas
    await fs.mkdir(publicGeneratedDir, { recursive: true });

    console.log("🎬 Génération du commentaire TikTok de démarrage...");

    const result = await generateTikTokCommentWithRetry(2);

    if (result.success) {
      // Chemins des fichiers
      const sourceImage = path.join(
        publicGeneratedDir,
        "tiktok-comment-current.png",
      );
      const remotionImage = path.join(publicDir, "tiktok-comment-current.png");

      try {
        // Vérifier si l'image source existe
        await fs.access(sourceImage);
        console.log("✅ Image source trouvée:", sourceImage);

        // Copier l'image à la racine de public/
        await fs.copyFile(sourceImage, remotionImage);
        console.log("✅ Image copiée vers:", remotionImage);

        // Vérifier que la copie a bien été faite
        await fs.access(remotionImage);
        console.log("✅ Vérification de la copie réussie");

        // Vérifier la taille du fichier
        const stats = await fs.stat(remotionImage);
        console.log(`📊 Taille du fichier: ${stats.size} bytes`);

        if (stats.size === 0) {
          throw new Error("Le fichier copié est vide");
        }
      } catch (error) {
        console.error("⚠️ Erreur lors de la copie de l'image:", error);
        throw error; // Propager l'erreur pour arrêter le processus
      }

      console.log(
        `✅ Commentaire généré avec succès:\n` +
          `   Username: ${result.username}\n` +
          `   Comment: "${result.comment}"\n` +
          `   Image: ${remotionImage}`,
      );
    } else {
      throw new Error(`Échec de génération: ${result.error}`);
    }
  } catch (error) {
    console.error(
      "❌ Erreur fatale lors de la génération de démarrage:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1); // Arrêter le processus en cas d'erreur
  }
}

// Exécution du script
if (require.main === module) {
  generateCommentStartup();
}

export { generateCommentStartup };
