#!/usr/bin/env tsx

import generateTikTokCommentWithRetry from "../src/services/tiktok-comment-generator";
import path from "path";
import fs from "fs/promises";

async function generateCommentStartup() {
  try {
    // Vérifier que le dossier de destination existe
    const generatedDir = path.join(process.cwd(), "public", "generated");
    try {
      await fs.access(generatedDir);
    } catch {
      await fs.mkdir(generatedDir, { recursive: true });
    }

    console.log("🎬 Génération du commentaire TikTok de démarrage...");

    const result = await generateTikTokCommentWithRetry(2);

    if (result.success) {
      console.log(`✅ Commentaire généré: ${result.username} - "${result.comment}"`);
    } else {
      console.log(`⚠️ Échec de génération: ${result.error}`);
    }
  } catch (error) {
    console.log("⚠️ Erreur lors de la génération de démarrage:", error instanceof Error ? error.message : error);
  }
}

// Exécution du script
if (require.main === module) {
  generateCommentStartup();
}

export { generateCommentStartup };