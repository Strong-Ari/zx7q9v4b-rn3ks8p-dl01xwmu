#!/usr/bin/env tsx

import fs from "fs";
import path from "path";

/**
 * Script pour sélectionner un fichier MIDI aléatoire avant le rendu
 * Ce script est exécuté par le script "prerender" dans package.json
 */

const MIDIS_DIR = path.join(process.cwd(), "public", "midis");
const SELECTED_MIDI_FILE = path.join(
  process.cwd(),
  "public",
  "selected-midi.json",
);

interface SelectedMidiInfo {
  fileName: string;
  selectedAt: string;
  renderTimestamp: number;
}

function selectRandomMidiFile(): void {
  try {
    console.log("[select-midi] 🎵 Sélection d'un fichier MIDI aléatoire...");

    // Lister tous les fichiers MIDI disponibles
    if (!fs.existsSync(MIDIS_DIR)) {
      console.error(`[select-midi] ❌ Dossier MIDI non trouvé: ${MIDIS_DIR}`);
      process.exit(1);
    }

    const allFiles = fs.readdirSync(MIDIS_DIR);
    const midiFiles = allFiles.filter((file) =>
      file.toLowerCase().endsWith(".mid"),
    );

    if (midiFiles.length === 0) {
      console.error(
        "[select-midi] ❌ Aucun fichier MIDI trouvé dans le dossier",
      );
      process.exit(1);
    }

    console.log(
      `[select-midi] 📁 ${midiFiles.length} fichiers MIDI disponibles:`,
    );
    midiFiles.forEach((file, index) => {
      console.log(`[select-midi]   ${index + 1}. ${file}`);
    });

    // Sélectionner un fichier aléatoire
    const randomIndex = Math.floor(Math.random() * midiFiles.length);
    const selectedFile = midiFiles[randomIndex];

    // Créer l'information de sélection
    const selectionInfo: SelectedMidiInfo = {
      fileName: selectedFile,
      selectedAt: new Date().toISOString(),
      renderTimestamp: Date.now(),
    };

    // Sauvegarder la sélection
    fs.writeFileSync(
      SELECTED_MIDI_FILE,
      JSON.stringify(selectionInfo, null, 2),
      "utf8",
    );

    console.log(`[select-midi] ✅ Fichier MIDI sélectionné: ${selectedFile}`);
    console.log(`[select-midi] 💾 Sauvegardé dans: ${SELECTED_MIDI_FILE}`);
    console.log(`[select-midi] 🕐 Timestamp: ${selectionInfo.selectedAt}`);
  } catch (error) {
    console.error(
      "[select-midi] ❌ Erreur lors de la sélection du fichier MIDI:",
      error,
    );
    process.exit(1);
  }
}

// Fonction pour obtenir le fichier MIDI sélectionné (utilisé par l'app)
export function getSelectedMidiFile(): string | null {
  try {
    if (!fs.existsSync(SELECTED_MIDI_FILE)) {
      console.log(
        "[select-midi] ℹ️  Aucun fichier MIDI pré-sélectionné, sélection aléatoire...",
      );
      return null;
    }

    const content = fs.readFileSync(SELECTED_MIDI_FILE, "utf8");
    const selectionInfo: SelectedMidiInfo = JSON.parse(content);

    console.log(
      `[select-midi] 📖 Fichier MIDI pré-sélectionné: ${selectionInfo.fileName}`,
    );
    return selectionInfo.fileName;
  } catch (error) {
    console.error(
      "[select-midi] ⚠️  Erreur lors de la lecture du fichier sélectionné:",
      error,
    );
    return null;
  }
}

// Si le script est exécuté directement
if (require.main === module) {
  selectRandomMidiFile();
}
