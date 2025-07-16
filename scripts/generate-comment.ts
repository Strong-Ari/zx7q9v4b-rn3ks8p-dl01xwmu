#!/usr/bin/env tsx

import generateTikTokCommentWithRetry from "../src/services/tiktok-comment-generator";
import path from "path";
import fs from "fs/promises";

async function generateComment() {
  console.log("🎬 Génération du commentaire TikTok pour la vidéo\n");

  try {
    // Vérifier que le dossier de destination existe
    const generatedDir = path.join(process.cwd(), "public", "generated");
    try {
      await fs.access(generatedDir);
      console.log("✅ Dossier generated existant");
    } catch {
      console.log("📁 Création du dossier generated...");
      await fs.mkdir(generatedDir, { recursive: true });
    }

    console.log("🚀 Génération en cours...\n");

    const startTime = Date.now();
    const result = await generateTikTokCommentWithRetry(3);
    const endTime = Date.now();

    console.log("\n📊 Résultat:");
    console.log("=".repeat(50));

    if (result.success) {
      console.log("✅ SUCCÈS - Commentaire TikTok généré!");
      console.log(`📝 Pseudo: ${result.username}`);
      console.log(`💬 Commentaire: ${result.comment}`);
      console.log(`🖼️ Image: ${result.imagePath}`);
      console.log(`⏱️ Temps d'exécution: ${(endTime - startTime) / 1000}s`);

      // Vérifier que le fichier existe physiquement
      const fullPath = path.join(process.cwd(), "public", result.imagePath!);
      try {
        const stats = await fs.stat(fullPath);
        console.log(
          `📐 Taille du fichier: ${(stats.size / 1024).toFixed(2)} KB`,
        );
        console.log(`📅 Créé le: ${stats.birthtime.toLocaleString("fr-FR")}`);

        console.log("\n🎥 L'image est maintenant prête pour la vidéo!");
        console.log(
          "💡 Vous pouvez maintenant générer votre vidéo avec cette image de commentaire.",
        );
      } catch (err) {
        console.log("⚠️ Erreur lors de la vérification du fichier:", err);
      }
    } else {
      console.log("❌ ÉCHEC - Erreur lors de la génération");
      console.log(`🔥 Erreur: ${result.error}`);
      console.log(`⏱️ Temps d'exécution: ${(endTime - startTime) / 1000}s`);
    }

    console.log("=".repeat(50));
  } catch (error) {
    console.error("💥 Erreur critique:", error);
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  generateComment();
}

export { generateComment };
