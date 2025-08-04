#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { MidiWavConverter } from "./midi-wav-converter";
import { SFXGenerator } from "./sfx-generator";

/**
 * Script principal pour préparer tous les audios nécessaires au rendu Remotion
 * - Convertit le MIDI sélectionné en WAV
 * - Génère tous les SFX en WAV
 * - Crée un index des fichiers audio disponibles
 */

interface AudioFile {
  type: "music" | "sfx";
  name: string;
  path: string;
  relativePath: string;
  duration?: number;
  size: number;
  createdAt: string;
}

interface AudioIndex {
  music: AudioFile[];
  sfx: AudioFile[];
  selectedMusic?: AudioFile;
  generatedAt: string;
}

class AudioRenderer {
  private readonly SELECTED_MIDI_FILE = path.join(process.cwd(), "public", "selected-midi.json");
  private readonly AUDIO_INDEX_FILE = path.join(process.cwd(), "public", "generated", "audio-index.json");
  private readonly CACHE_DIR = path.join(process.cwd(), "public", "generated", "audio-cache");
  private readonly SFX_DIR = path.join(process.cwd(), "public", "generated", "sfx");

  private midiConverter: MidiWavConverter;
  private sfxGenerator: SFXGenerator;

  constructor() {
    this.midiConverter = new MidiWavConverter();
    this.sfxGenerator = new SFXGenerator();
    this.ensureDirectories();
  }

  /**
   * Assure que tous les dossiers nécessaires existent
   */
  private ensureDirectories(): void {
    const dirs = [
      path.dirname(this.AUDIO_INDEX_FILE),
      this.CACHE_DIR,
      this.SFX_DIR,
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[AudioRenderer] 📁 Dossier créé: ${dir}`);
      }
    });
  }

  /**
   * Lit le fichier MIDI sélectionné pour le rendu
   */
  private getSelectedMidiFile(): string | null {
    try {
      if (!fs.existsSync(this.SELECTED_MIDI_FILE)) {
        console.warn(`[AudioRenderer] ⚠️  Aucun MIDI sélectionné pour le rendu`);
        return null;
      }

      const content = fs.readFileSync(this.SELECTED_MIDI_FILE, "utf8");
      const selectionInfo = JSON.parse(content);
      
      if (!selectionInfo.fileName) {
        console.warn(`[AudioRenderer] ⚠️  Fichier de sélection invalide`);
        return null;
      }

      console.log(`[AudioRenderer] 🎵 MIDI sélectionné: ${selectionInfo.fileName}`);
      return selectionInfo.fileName;
    } catch (error) {
      console.error(`[AudioRenderer] ❌ Erreur lors de la lecture du fichier sélectionné:`, error);
      return null;
    }
  }

  /**
   * Calcule la durée approximative d'un fichier WAV
   */
  private estimateWavDuration(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      // Estimation très approximative basée sur la taille
      // WAV 44.1kHz 16-bit stéréo = ~176KB par seconde
      const bytesPerSecond = 44100 * 2 * 2; // sampleRate * channels * bytesPerSample
      const dataSize = stats.size - 44; // Taille des données audio (sans en-tête WAV)
      return Math.max(0, dataSize / bytesPerSecond);
    } catch (error) {
      console.warn(`[AudioRenderer] ⚠️  Impossible d'estimer la durée pour ${filePath}`);
      return 0;
    }
  }

  /**
   * Crée un objet AudioFile à partir d'un chemin de fichier
   */
  private createAudioFile(filePath: string, type: "music" | "sfx"): AudioFile {
    const stats = fs.statSync(filePath);
    const relativePath = path.relative(path.join(process.cwd(), "public"), filePath);
    
    return {
      type,
      name: path.basename(filePath, path.extname(filePath)),
      path: filePath,
      relativePath: relativePath.replace(/\\/g, "/"), // Normaliser pour le web
      duration: this.estimateWavDuration(filePath),
      size: stats.size,
      createdAt: stats.mtime.toISOString(),
    };
  }

  /**
   * Indexe tous les fichiers audio générés
   */
  private createAudioIndex(): AudioIndex {
    const audioIndex: AudioIndex = {
      music: [],
      sfx: [],
      generatedAt: new Date().toISOString(),
    };

    // Indexer les fichiers de musique (MIDI convertis)
    if (fs.existsSync(this.CACHE_DIR)) {
      const musicFiles = fs.readdirSync(this.CACHE_DIR)
        .filter(file => file.endsWith(".wav"))
        .map(file => {
          const filePath = path.join(this.CACHE_DIR, file);
          return this.createAudioFile(filePath, "music");
        });
      
      audioIndex.music = musicFiles;
      console.log(`[AudioRenderer] 🎵 ${musicFiles.length} fichiers musicaux indexés`);
    }

    // Indexer les SFX
    if (fs.existsSync(this.SFX_DIR)) {
      const sfxFiles = fs.readdirSync(this.SFX_DIR)
        .filter(file => file.endsWith(".wav"))
        .map(file => {
          const filePath = path.join(this.SFX_DIR, file);
          return this.createAudioFile(filePath, "sfx");
        });
      
      audioIndex.sfx = sfxFiles;
      console.log(`[AudioRenderer] 🔊 ${sfxFiles.length} effets sonores indexés`);
    }

    return audioIndex;
  }

  /**
   * Sauvegarde l'index audio
   */
  private saveAudioIndex(audioIndex: AudioIndex): void {
    try {
      fs.writeFileSync(
        this.AUDIO_INDEX_FILE,
        JSON.stringify(audioIndex, null, 2),
        "utf8"
      );
      console.log(`[AudioRenderer] 💾 Index audio sauvegardé: ${this.AUDIO_INDEX_FILE}`);
    } catch (error) {
      console.error(`[AudioRenderer] ❌ Erreur lors de la sauvegarde de l'index:`, error);
    }
  }

  /**
   * Prépare la musique de fond (convertit le MIDI sélectionné)
   */
  public async prepareBackgroundMusic(): Promise<AudioFile | null> {
    console.log(`[AudioRenderer] 🎵 Préparation de la musique de fond...`);

    const selectedMidiFile = this.getSelectedMidiFile();
    if (!selectedMidiFile) {
      console.warn(`[AudioRenderer] ⚠️  Aucun MIDI sélectionné, abandon de la conversion`);
      return null;
    }

    // Convertir le MIDI en WAV
    const wavPath = await this.midiConverter.convertWithCache(selectedMidiFile);
    if (!wavPath) {
      console.error(`[AudioRenderer] ❌ Échec de la conversion du MIDI: ${selectedMidiFile}`);
      return null;
    }

    // Créer l'objet AudioFile
    const audioFile = this.createAudioFile(wavPath, "music");
    console.log(`[AudioRenderer] ✅ Musique préparée: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`);
    
    return audioFile;
  }

  /**
   * Prépare tous les effets sonores
   */
  public prepareSFX(): AudioFile[] {
    console.log(`[AudioRenderer] 🔊 Préparation des effets sonores...`);

    // Générer tous les SFX
    this.sfxGenerator.generateAllSFX();

    // Créer la liste des SFX générés
    const sfxFiles: AudioFile[] = [];
    
    if (fs.existsSync(this.SFX_DIR)) {
      const files = fs.readdirSync(this.SFX_DIR)
        .filter(file => file.endsWith(".wav"));

      files.forEach(file => {
        const filePath = path.join(this.SFX_DIR, file);
        const audioFile = this.createAudioFile(filePath, "sfx");
        sfxFiles.push(audioFile);
      });

      console.log(`[AudioRenderer] ✅ ${sfxFiles.length} effets sonores préparés`);
    }

    return sfxFiles;
  }

  /**
   * Prépare tous les audios pour le rendu
   */
  public async prepareAllAudio(): Promise<AudioIndex> {
    console.log(`[AudioRenderer] 🎬 Préparation de tous les audios pour le rendu...`);

    // Préparer la musique de fond
    const backgroundMusic = await this.prepareBackgroundMusic();

    // Préparer les SFX
    const sfxFiles = this.prepareSFX();

    // Créer l'index complet
    const audioIndex = this.createAudioIndex();
    
    // Ajouter la musique sélectionnée à l'index
    if (backgroundMusic) {
      audioIndex.selectedMusic = backgroundMusic;
    }

    // Sauvegarder l'index
    this.saveAudioIndex(audioIndex);

    // Afficher un résumé
    console.log(`[AudioRenderer] 📊 Résumé de la préparation:`);
    console.log(`[AudioRenderer]   - Musique sélectionnée: ${backgroundMusic ? backgroundMusic.name : "Aucune"}`);
    console.log(`[AudioRenderer]   - Fichiers musicaux: ${audioIndex.music.length}`);
    console.log(`[AudioRenderer]   - Effets sonores: ${audioIndex.sfx.length}`);
    
    const totalSize = [...audioIndex.music, ...audioIndex.sfx]
      .reduce((sum, file) => sum + file.size, 0);
    console.log(`[AudioRenderer]   - Taille totale: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    console.log(`[AudioRenderer] 🎉 Préparation terminée!`);
    return audioIndex;
  }

  /**
   * Nettoie les fichiers audio générés
   */
  public cleanAudioFiles(): void {
    console.log(`[AudioRenderer] 🧹 Nettoyage des fichiers audio...`);

    const dirsToClean = [this.CACHE_DIR, this.SFX_DIR];
    let totalRemoved = 0;

    dirsToClean.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file.endsWith(".wav") || file.endsWith(".json")) {
            const filePath = path.join(dir, file);
            fs.unlinkSync(filePath);
            totalRemoved++;
          }
        });
      }
    });

    // Supprimer l'index audio
    if (fs.existsSync(this.AUDIO_INDEX_FILE)) {
      fs.unlinkSync(this.AUDIO_INDEX_FILE);
      totalRemoved++;
    }

    console.log(`[AudioRenderer] ✅ Nettoyage terminé: ${totalRemoved} fichiers supprimés`);
  }

  /**
   * Affiche des statistiques sur les audios générés
   */
  public showStats(): void {
    if (!fs.existsSync(this.AUDIO_INDEX_FILE)) {
      console.log(`[AudioRenderer] 📊 Aucun audio généré`);
      return;
    }

    try {
      const content = fs.readFileSync(this.AUDIO_INDEX_FILE, "utf8");
      const audioIndex: AudioIndex = JSON.parse(content);

      console.log(`[AudioRenderer] 📊 Statistiques audio:`);
      console.log(`[AudioRenderer]   - Générées le: ${new Date(audioIndex.generatedAt).toLocaleString()}`);
      console.log(`[AudioRenderer]   - Fichiers musicaux: ${audioIndex.music.length}`);
      console.log(`[AudioRenderer]   - Effets sonores: ${audioIndex.sfx.length}`);
      
      if (audioIndex.selectedMusic) {
        console.log(`[AudioRenderer]   - Musique sélectionnée: ${audioIndex.selectedMusic.name}`);
        console.log(`[AudioRenderer]     Durée: ${audioIndex.selectedMusic.duration?.toFixed(1)}s`);
        console.log(`[AudioRenderer]     Taille: ${(audioIndex.selectedMusic.size / 1024 / 1024).toFixed(2)} MB`);
      }

      console.log(`[AudioRenderer]   - Index: ${this.AUDIO_INDEX_FILE}`);
    } catch (error) {
      console.error(`[AudioRenderer] ❌ Erreur lors de la lecture des statistiques:`, error);
    }
  }
}

// Export pour utilisation en tant que module
export { AudioRenderer, type AudioFile, type AudioIndex };

// Script principal si exécuté directement
if (require.main === module) {
  const renderer = new AudioRenderer();
  
  const args = process.argv.slice(2);
  const command = args[0] || "prepare";

  async function runCommand() {
    switch (command) {
      case "prepare":
      case "all":
        await renderer.prepareAllAudio();
        break;
      
      case "music":
        await renderer.prepareBackgroundMusic();
        break;
      
      case "sfx":
        renderer.prepareSFX();
        break;
      
      case "clean":
        renderer.cleanAudioFiles();
        break;
      
      case "stats":
        renderer.showStats();
        break;
      
      default:
        console.log(`[AudioRenderer] 📖 Commandes disponibles:`);
        console.log(`[AudioRenderer]   - prepare|all : Préparer tous les audios`);
        console.log(`[AudioRenderer]   - music : Convertir seulement la musique`);
        console.log(`[AudioRenderer]   - sfx : Générer seulement les SFX`);
        console.log(`[AudioRenderer]   - clean : Nettoyer les fichiers générés`);
        console.log(`[AudioRenderer]   - stats : Afficher les statistiques`);
    }
  }

  runCommand().catch(error => {
    console.error(`[AudioRenderer] ❌ Erreur fatale:`, error);
    process.exit(1);
  });
}