#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import * as wav from "wav";

/**
 * Générateur d'effets sonores (SFX) pour les événements du jeu
 * Génère des sons de collision simples en WAV
 */

interface SFXConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

interface SoundParams {
  frequency: number;
  duration: number;
  volume: number;
  attack: number;
  decay: number;
  release: number;
  type: "sine" | "square" | "sawtooth" | "triangle" | "noise";
}

class SFXGenerator {
  private readonly SFX_DIR = path.join(process.cwd(), "public", "generated", "sfx");
  
  private readonly DEFAULT_CONFIG: SFXConfig = {
    sampleRate: 44100,
    channels: 1, // Mono pour les SFX
    bitDepth: 16,
  };

  constructor() {
    this.ensureDirectory();
  }

  /**
   * Assure que le dossier SFX existe
   */
  private ensureDirectory(): void {
    if (!fs.existsSync(this.SFX_DIR)) {
      fs.mkdirSync(this.SFX_DIR, { recursive: true });
      console.log(`[SFXGenerator] 📁 Dossier SFX créé: ${this.SFX_DIR}`);
    }
  }

  /**
   * Génère une onde sinusoïdale
   */
  private generateWave(
    type: SoundParams["type"],
    frequency: number,
    time: number,
    phase: number = 0
  ): number {
    const omega = 2 * Math.PI * frequency * time + phase;

    switch (type) {
      case "sine":
        return Math.sin(omega);
      
      case "square":
        return Math.sign(Math.sin(omega));
      
      case "sawtooth":
        return 2 * (omega / (2 * Math.PI) - Math.floor(omega / (2 * Math.PI) + 0.5));
      
      case "triangle":
        const sawValue = 2 * (omega / (2 * Math.PI) - Math.floor(omega / (2 * Math.PI) + 0.5));
        return 2 * Math.abs(sawValue) - 1;
      
      case "noise":
        return Math.random() * 2 - 1;
      
      default:
        return Math.sin(omega);
    }
  }

  /**
   * Applique une enveloppe ADSR au signal
   */
  private applyEnvelope(
    value: number,
    time: number,
    duration: number,
    attack: number,
    decay: number,
    sustain: number,
    release: number
  ): number {
    const sustainLevel = 0.7; // Niveau de sustain (70%)
    
    if (time <= attack) {
      // Phase d'attaque : 0 -> 1
      return value * (time / attack);
    } else if (time <= attack + decay) {
      // Phase de décroissance : 1 -> sustain
      const decayProgress = (time - attack) / decay;
      const level = 1 - decayProgress * (1 - sustainLevel);
      return value * level;
    } else if (time <= duration - release) {
      // Phase de sustain : maintien du niveau
      return value * sustainLevel;
    } else {
      // Phase de release : sustain -> 0
      const releaseProgress = (time - (duration - release)) / release;
      const level = sustainLevel * (1 - releaseProgress);
      return value * Math.max(0, level);
    }
  }

  /**
   * Génère un échantillon audio basé sur les paramètres
   */
  private generateSample(params: SoundParams, config: SFXConfig = this.DEFAULT_CONFIG): Buffer {
    const sampleCount = Math.floor(params.duration * config.sampleRate);
    const samples: number[] = [];

    for (let i = 0; i < sampleCount; i++) {
      const time = i / config.sampleRate;
      
      // Générer l'onde de base
      let sample = this.generateWave(params.type, params.frequency, time);
      
      // Appliquer l'enveloppe ADSR
      sample = this.applyEnvelope(
        sample,
        time,
        params.duration,
        params.attack,
        params.decay,
        0.7, // sustain level
        params.release
      );
      
      // Appliquer le volume
      sample *= params.volume;
      
      // Convertir en échantillon 16-bit
      const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
      samples.push(intSample);
    }

    // Convertir en buffer binaire
    const buffer = Buffer.alloc(samples.length * 2); // 2 bytes per 16-bit sample
    for (let i = 0; i < samples.length; i++) {
      buffer.writeInt16LE(samples[i], i * 2);
    }

    return buffer;
  }

  /**
   * Sauvegarde un échantillon en tant que fichier WAV
   */
  private saveWAV(
    samples: Buffer,
    filename: string,
    config: SFXConfig = this.DEFAULT_CONFIG
  ): string {
    const filePath = path.join(this.SFX_DIR, filename);
    
    // Créer l'en-tête WAV
    const headerSize = 44;
    const fileSize = headerSize + samples.length - 8;
    const header = Buffer.alloc(headerSize);
    
    // Chunk descriptor
    header.write("RIFF", 0);
    header.writeUInt32LE(fileSize, 4);
    header.write("WAVE", 8);
    
    // fmt sub-chunk
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16); // PCM = 16 bytes
    header.writeUInt16LE(1, 20);  // PCM format
    header.writeUInt16LE(config.channels, 22);
    header.writeUInt32LE(config.sampleRate, 24);
    header.writeUInt32LE(config.sampleRate * config.channels * (config.bitDepth / 8), 28);
    header.writeUInt16LE(config.channels * (config.bitDepth / 8), 32);
    header.writeUInt16LE(config.bitDepth, 34);
    
    // data sub-chunk
    header.write("data", 36);
    header.writeUInt32LE(samples.length, 40);
    
    // Écrire le fichier
    const wavFile = Buffer.concat([header, samples]);
    fs.writeFileSync(filePath, wavFile);
    
    console.log(`[SFXGenerator] ✅ SFX généré: ${filename} (${(wavFile.length / 1024).toFixed(1)} KB)`);
    
    return filePath;
  }

  /**
   * Génère un son de collision balle-cercle
   */
  public generateCollisionSound(): string {
    const params: SoundParams = {
      frequency: 800, // Note aigue pour la collision
      duration: 0.2,  // Son court
      volume: 0.6,
      attack: 0.01,   // Attaque rapide
      decay: 0.05,    // Décroissance rapide
      release: 0.1,   // Release courte
      type: "sine",
    };

    const samples = this.generateSample(params);
    return this.saveWAV(samples, "collision.wav");
  }

  /**
   * Génère un son de collision balle-balle
   */
  public generateBallCollisionSound(): string {
    const params: SoundParams = {
      frequency: 600, // Note moins aigue
      duration: 0.15, // Encore plus court
      volume: 0.5,
      attack: 0.005,  // Attaque très rapide
      decay: 0.03,    // Décroissance rapide
      release: 0.08,  // Release courte
      type: "triangle",
    };

    const samples = this.generateSample(params);
    return this.saveWAV(samples, "ball-collision.wav");
  }

  /**
   * Génère un son de passage de gap (réussite)
   */
  public generateGapPassSound(): string {
    const params: SoundParams = {
      frequency: 1200, // Note très aigue pour la réussite
      duration: 0.3,   // Un peu plus long
      volume: 0.7,
      attack: 0.02,    // Attaque douce
      decay: 0.1,      // Décroissance moyenne
      release: 0.15,   // Release plus longue
      type: "sine",
    };

    const samples = this.generateSample(params);
    return this.saveWAV(samples, "gap-pass.wav");
  }

  /**
   * Génère un son de succès/victoire
   */
  public generateSuccessSound(): string {
    // Générer un accord majeur (do-mi-sol)
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const duration = 0.5;
    const config = this.DEFAULT_CONFIG;
    
    const sampleCount = Math.floor(duration * config.sampleRate);
    const samples: number[] = [];

    for (let i = 0; i < sampleCount; i++) {
      const time = i / config.sampleRate;
      let sample = 0;
      
      // Additionner les trois fréquences
      frequencies.forEach((freq, index) => {
        const volume = 0.3; // Volume réduit car on additionne 3 ondes
        let wave = this.generateWave("sine", freq, time);
        
        // Enveloppe ADSR
        wave = this.applyEnvelope(wave, time, duration, 0.05, 0.1, 0.8, 0.2);
        
        sample += wave * volume;
      });
      
      // Convertir en échantillon 16-bit
      const intSample = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
      samples.push(intSample);
    }

    // Convertir en buffer
    const buffer = Buffer.alloc(samples.length * 2);
    for (let i = 0; i < samples.length; i++) {
      buffer.writeInt16LE(samples[i], i * 2);
    }

    return this.saveWAV(buffer, "success.wav");
  }

  /**
   * Génère tous les SFX du jeu
   */
  public generateAllSFX(): void {
    console.log(`[SFXGenerator] 🎵 Génération de tous les effets sonores...`);
    
    const sounds = [
      { name: "collision (balle-cercle)", generator: () => this.generateCollisionSound() },
      { name: "collision balle-balle", generator: () => this.generateBallCollisionSound() },
      { name: "passage de gap", generator: () => this.generateGapPassSound() },
      { name: "succès", generator: () => this.generateSuccessSound() },
    ];

    sounds.forEach(({ name, generator }) => {
      try {
        const filePath = generator();
        console.log(`[SFXGenerator] ✅ ${name} généré avec succès`);
      } catch (error) {
        console.error(`[SFXGenerator] ❌ Erreur pour ${name}:`, error);
      }
    });

    console.log(`[SFXGenerator] 🎉 Génération terminée! Dossier: ${this.SFX_DIR}`);
  }

  /**
   * Liste tous les SFX disponibles
   */
  public listSFX(): void {
    if (!fs.existsSync(this.SFX_DIR)) {
      console.log(`[SFXGenerator] 📁 Aucun SFX généré`);
      return;
    }

    const files = fs.readdirSync(this.SFX_DIR)
      .filter(file => file.endsWith(".wav"));

    if (files.length === 0) {
      console.log(`[SFXGenerator] 📁 Aucun fichier SFX trouvé`);
      return;
    }

    console.log(`[SFXGenerator] 🎵 SFX disponibles:`);
    files.forEach((file, index) => {
      const filePath = path.join(this.SFX_DIR, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`[SFXGenerator]   ${index + 1}. ${file} (${sizeKB} KB)`);
    });
  }
}

// Export pour utilisation en tant que module
export { SFXGenerator, type SoundParams, type SFXConfig };

// Script principal si exécuté directement
if (require.main === module) {
  const generator = new SFXGenerator();
  
  const args = process.argv.slice(2);
  const command = args[0] || "generate";

  switch (command) {
    case "generate":
    case "all":
      generator.generateAllSFX();
      break;
    
    case "collision":
      generator.generateCollisionSound();
      break;
    
    case "ball-collision":
      generator.generateBallCollisionSound();
      break;
    
    case "gap-pass":
      generator.generateGapPassSound();
      break;
    
    case "success":
      generator.generateSuccessSound();
      break;
    
    case "list":
      generator.listSFX();
      break;
    
    default:
      console.log(`[SFXGenerator] 📖 Commandes disponibles:`);
      console.log(`[SFXGenerator]   - generate|all : Générer tous les SFX`);
      console.log(`[SFXGenerator]   - collision : Son collision balle-cercle`);
      console.log(`[SFXGenerator]   - ball-collision : Son collision balle-balle`);
      console.log(`[SFXGenerator]   - gap-pass : Son passage de gap`);
      console.log(`[SFXGenerator]   - success : Son de succès`);
      console.log(`[SFXGenerator]   - list : Lister les SFX générés`);
  }
}