#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Script pour nettoyer les logs de debug du fichier SemiCircle.tsx
 */

const filePath = join(process.cwd(), "src/components/SemiCircle.tsx");

console.log("🧹 Nettoyage des logs de debug...");

try {
  const content = readFileSync(filePath, "utf-8");

  // Supprimer les lignes de debug
  const cleanedContent = content
    .replace(
      /\s*\/\/ Debug: Logs pour diagnostic \(à supprimer après test\)\s*\n/,
      "",
    )
    .replace(
      /\s*if \(frame % 60 === 0\) \{ \/\/ Log toutes les 60 frames pour éviter le spam\s*\n/,
      "",
    )
    .replace(/\s*console\.log\(`\[DIAGNOSTIC\][^`]*`\);\s*\n/, "")
    .replace(/\s*\}\s*\n\s*\n/, "\n\n");

  writeFileSync(filePath, cleanedContent);

  console.log("✅ Logs de debug supprimés avec succès de SemiCircle.tsx");
  console.log("📝 Le fichier est maintenant prêt pour la production");
} catch (error) {
  console.error("❌ Erreur lors du nettoyage:", error);
  process.exit(1);
}
