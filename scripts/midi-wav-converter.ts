#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import crypto from "crypto";

/**
 * Script pour convertir les fichiers MIDI en WAV avec système de cache
 * Utilise FluidSynth via la ligne de commande pour une qualité optimale
 */

interface ConversionConfig {
  sampleRate: number;
  gain: number;
  soundfontPath?: string;
  outputFormat: "wav" | "raw";
}

interface CacheEntry {
  midiPath: string;
  midiHash: string;
  wavPath: string;
  config: ConversionConfig;
  createdAt: string;
  size: number;
}

interface CacheIndex {
  [midiFileName: string]: CacheEntry;
}

class MidiWavConverter {
  private readonly MIDIS_DIR = path.join(process.cwd(), "public", "midis");
  private readonly CACHE_DIR = path.join(process.cwd(), "public", "generated", "audio-cache");
  private readonly SFX_DIR = path.join(process.cwd(), "public", "generated", "sfx");
  private readonly CACHE_INDEX_FILE = path.join(this.CACHE_DIR, "cache-index.json");
  
  private readonly DEFAULT_CONFIG: ConversionConfig = {
    sampleRate: 44100,
    gain: 0.8,
    outputFormat: "wav",
  };

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Assure que tous les dossiers nécessaires existent
   */
  private ensureDirectories(): void {
    [this.CACHE_DIR, this.SFX_DIR].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[MidiWavConverter] 📁 Dossier créé: ${dir}`);
      }
    });
  }

  /**
   * Calcule le hash MD5 d'un fichier
   */
  private calculateFileHash(filePath: string): string {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("md5").update(content).digest("hex");
  }

  /**
   * Charge l'index du cache
   */
  private loadCacheIndex(): CacheIndex {
    try {
      if (!fs.existsSync(this.CACHE_INDEX_FILE)) {
        return {};
      }
      const content = fs.readFileSync(this.CACHE_INDEX_FILE, "utf8");
      return JSON.parse(content);
    } catch (error) {
      console.warn(`[MidiWavConverter] ⚠️  Erreur lors du chargement du cache:`, error);
      return {};
    }
  }

  /**
   * Sauvegarde l'index du cache
   */
  private saveCacheIndex(index: CacheIndex): void {
    try {
      fs.writeFileSync(
        this.CACHE_INDEX_FILE,
        JSON.stringify(index, null, 2),
        "utf8"
      );
    } catch (error) {
      console.error(`[MidiWavConverter] ❌ Erreur lors de la sauvegarde du cache:`, error);
    }
  }

  /**
   * Vérifie si FluidSynth est installé
   */
  private checkFluidSynthInstallation(): boolean {
    try {
      execSync("fluidsynth --version", { stdio: "pipe" });
      return true;
    } catch (error) {
      console.error(`[MidiWavConverter] ❌ FluidSynth n'est pas installé ou accessible`);
      console.error(`[MidiWavConverter] 💡 Installation: apt-get install fluidsynth (Ubuntu) ou brew install fluidsynth (macOS)`);
      return false;
    }
  }

  /**
   * Trouve un SoundFont par défaut
   */
  private findDefaultSoundfont(): string | null {
    const commonPaths = [
      "/usr/share/sounds/sf2/FluidR3_GM.sf2",
      "/usr/share/sounds/sf2/default.sf2",
      "/System/Library/Components/CoreAudio.component/Contents/Resources/gs_instruments.dls",
      "C:\\Windows\\System32\\drivers\\gm.dls",
      path.join(process.cwd(), "assets", "soundfonts", "default.sf2"),
    ];

    for (const sfPath of commonPaths) {
      if (fs.existsSync(sfPath)) {
        console.log(`[MidiWavConverter] 🎵 SoundFont trouvé: ${sfPath}`);
        return sfPath;
      }
    }

    console.warn(`[MidiWavConverter] ⚠️  Aucun SoundFont trouvé dans les emplacements standards`);
    return null;
  }

  /**
   * Convertit un fichier MIDI en WAV en utilisant FluidSynth
   */
  private convertMidiToWav(
    midiPath: string,
    outputPath: string,
    config: ConversionConfig = this.DEFAULT_CONFIG
  ): boolean {
    try {
      if (!this.checkFluidSynthInstallation()) {
        return false;
      }

      const soundfont = config.soundfontPath || this.findDefaultSoundfont();
      if (!soundfont) {
        throw new Error("Aucun SoundFont disponible");
      }

      // Commande FluidSynth pour la conversion
      const command = [
        "fluidsynth",
        "-ni",                          // Mode non-interactif
        `-F "${outputPath}"`,           // Fichier de sortie
        `-r ${config.sampleRate}`,      // Taux d'échantillonnage
        `-g ${config.gain}`,            // Gain
        `"${soundfont}"`,               // SoundFont
        `"${midiPath}"`,                // Fichier MIDI d'entrée
      ].join(" ");

      console.log(`[MidiWavConverter] 🎵 Conversion en cours: ${path.basename(midiPath)}`);
      console.log(`[MidiWavConverter] 📊 Commande: ${command}`);

      execSync(command, { stdio: "pipe" });

      if (!fs.existsSync(outputPath)) {
        throw new Error("Le fichier de sortie n'a pas été créé");
      }

      const stats = fs.statSync(outputPath);
      console.log(`[MidiWavConverter] ✅ Conversion réussie: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      return true;
    } catch (error) {
      console.error(`[MidiWavConverter] ❌ Erreur lors de la conversion:`, error);
      return false;
    }
  }

  /**
   * Convertit un fichier MIDI avec cache
   */
  public async convertWithCache(
    midiFileName: string,
    config: ConversionConfig = this.DEFAULT_CONFIG
  ): Promise<string | null> {
    const midiPath = path.join(this.MIDIS_DIR, midiFileName);
    
    if (!fs.existsSync(midiPath)) {
      console.error(`[MidiWavConverter] ❌ Fichier MIDI non trouvé: ${midiPath}`);
      return null;
    }

    // Charger l'index du cache
    const cacheIndex = this.loadCacheIndex();
    
    // Calculer le hash du fichier MIDI
    const midiHash = this.calculateFileHash(midiPath);
    
    // Vérifier si une version cachée existe et est valide
    const cacheKey = midiFileName;
    const cacheEntry = cacheIndex[cacheKey];
    
    if (cacheEntry && cacheEntry.midiHash === midiHash) {
      const cachedWavPath = cacheEntry.wavPath;
      if (fs.existsSync(cachedWavPath)) {
        console.log(`[MidiWavConverter] 💾 Utilisation du cache: ${path.basename(cachedWavPath)}`);
        return cachedWavPath;
      }
    }

    // Générer le chemin de sortie
    const wavFileName = path.basename(midiFileName, path.extname(midiFileName)) + ".wav";
    const wavPath = path.join(this.CACHE_DIR, wavFileName);
    
    // Convertir le fichier
    const success = this.convertMidiToWav(midiPath, wavPath, config);
    
    if (!success) {
      return null;
    }

    // Mettre à jour le cache
    const stats = fs.statSync(wavPath);
    cacheIndex[cacheKey] = {
      midiPath,
      midiHash,
      wavPath,
      config,
      createdAt: new Date().toISOString(),
      size: stats.size,
    };
    
    this.saveCacheIndex(cacheIndex);
    
    return wavPath;
  }

  /**
   * Convertit tous les fichiers MIDI du dossier
   */
  public async convertAllMidis(config: ConversionConfig = this.DEFAULT_CONFIG): Promise<void> {
    console.log(`[MidiWavConverter] 🎵 Démarrage de la conversion de tous les MIDIs...`);
    
    if (!fs.existsSync(this.MIDIS_DIR)) {
      console.error(`[MidiWavConverter] ❌ Dossier MIDI non trouvé: ${this.MIDIS_DIR}`);
      return;
    }

    const midiFiles = fs.readdirSync(this.MIDIS_DIR)
      .filter(file => file.toLowerCase().endsWith(".mid"));

    console.log(`[MidiWavConverter] 📁 ${midiFiles.length} fichiers MIDI trouvés`);

    let successCount = 0;
    let skippedCount = 0;

    for (const midiFile of midiFiles) {
      const result = await this.convertWithCache(midiFile, config);
      if (result) {
        successCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`[MidiWavConverter] ✅ Conversion terminée:`);
    console.log(`[MidiWavConverter]   - Succès: ${successCount}`);
    console.log(`[MidiWavConverter]   - Échecs: ${skippedCount}`);
    console.log(`[MidiWavConverter]   - Cache: ${this.CACHE_DIR}`);
  }

  /**
   * Nettoie le cache (supprime les entrées orphelines)
   */
  public cleanCache(): void {
    console.log(`[MidiWavConverter] 🧹 Nettoyage du cache...`);
    
    const cacheIndex = this.loadCacheIndex();
    const cleanedIndex: CacheIndex = {};
    let removedCount = 0;

    for (const [key, entry] of Object.entries(cacheIndex)) {
      // Vérifier si le fichier MIDI source existe encore
      if (!fs.existsSync(entry.midiPath)) {
        // Supprimer le fichier WAV en cache
        if (fs.existsSync(entry.wavPath)) {
          fs.unlinkSync(entry.wavPath);
        }
        removedCount++;
        continue;
      }

      // Vérifier si le fichier WAV en cache existe encore
      if (!fs.existsSync(entry.wavPath)) {
        removedCount++;
        continue;
      }

      cleanedIndex[key] = entry;
    }

    this.saveCacheIndex(cleanedIndex);
    console.log(`[MidiWavConverter] ✅ Cache nettoyé: ${removedCount} entrées supprimées`);
  }

  /**
   * Affiche des statistiques sur le cache
   */
  public showCacheStats(): void {
    const cacheIndex = this.loadCacheIndex();
    const entries = Object.values(cacheIndex);
    
    if (entries.length === 0) {
      console.log(`[MidiWavConverter] 📊 Cache vide`);
      return;
    }

    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    
    console.log(`[MidiWavConverter] 📊 Statistiques du cache:`);
    console.log(`[MidiWavConverter]   - Fichiers: ${entries.length}`);
    console.log(`[MidiWavConverter]   - Taille totale: ${sizeMB} MB`);
    console.log(`[MidiWavConverter]   - Dossier: ${this.CACHE_DIR}`);
  }
}

// Export pour utilisation en tant que module
export { MidiWavConverter, type ConversionConfig };

// Script principal si exécuté directement
if (require.main === module) {
  const converter = new MidiWavConverter();
  
  // Analyser les arguments de ligne de commande
  const args = process.argv.slice(2);
  const command = args[0] || "convert-all";

  switch (command) {
    case "convert-all":
      converter.convertAllMidis();
      break;
    
    case "clean":
      converter.cleanCache();
      break;
    
    case "stats":
      converter.showCacheStats();
      break;
    
    case "convert":
      if (args[1]) {
        converter.convertWithCache(args[1]);
      } else {
        console.error(`[MidiWavConverter] ❌ Usage: npm run convert <fichier.mid>`);
      }
      break;
    
    default:
      console.log(`[MidiWavConverter] 📖 Commandes disponibles:`);
      console.log(`[MidiWavConverter]   - convert-all : Convertir tous les MIDIs`);
      console.log(`[MidiWavConverter]   - convert <fichier> : Convertir un fichier spécifique`);
      console.log(`[MidiWavConverter]   - clean : Nettoyer le cache`);
      console.log(`[MidiWavConverter]   - stats : Afficher les statistiques`);
  }
}