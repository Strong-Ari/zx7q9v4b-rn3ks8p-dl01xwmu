#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { MidiWavConverter } from "./midi-wav-converter";
import { SFXGenerator } from "./sfx-generator";
import { AudioRenderer } from "./prepare-audio-for-render";

/**
 * Script de test pour valider le système audio complet
 */

class AudioSystemTester {
  private readonly MIDIS_DIR = path.join(process.cwd(), "public", "midis");
  
  constructor() {}

  /**
   * Teste la présence des dossiers requis
   */
  private testDirectoryStructure(): boolean {
    console.log(`[AudioTest] 🗂️  Test de la structure des dossiers...`);
    
    const requiredDirs = [
      this.MIDIS_DIR,
    ];

    let success = true;
    requiredDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        console.log(`[AudioTest] ✅ ${dir}`);
      } else {
        console.log(`[AudioTest] ❌ ${dir} - MANQUANT`);
        success = false;
      }
    });

    return success;
  }

  /**
   * Teste la présence de fichiers MIDI
   */
  private testMidiFiles(): { success: boolean; midiFiles: string[] } {
    console.log(`[AudioTest] 🎵 Test des fichiers MIDI...`);
    
    if (!fs.existsSync(this.MIDIS_DIR)) {
      console.log(`[AudioTest] ❌ Dossier MIDI manquant`);
      return { success: false, midiFiles: [] };
    }

    const midiFiles = fs.readdirSync(this.MIDIS_DIR)
      .filter(file => file.toLowerCase().endsWith(".mid"));

    if (midiFiles.length === 0) {
      console.log(`[AudioTest] ❌ Aucun fichier MIDI trouvé`);
      return { success: false, midiFiles: [] };
    }

    console.log(`[AudioTest] ✅ ${midiFiles.length} fichiers MIDI trouvés:`);
    midiFiles.forEach((file, index) => {
      const filePath = path.join(this.MIDIS_DIR, file);
      const stats = fs.statSync(filePath);
      console.log(`[AudioTest]   ${index + 1}. ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    });

    return { success: true, midiFiles };
  }

  /**
   * Teste le convertisseur MIDI
   */
  private async testMidiConverter(midiFiles: string[]): Promise<boolean> {
    console.log(`[AudioTest] 🔄 Test du convertisseur MIDI...`);
    
    const converter = new MidiWavConverter();
    
    // Tester avec le premier fichier MIDI disponible
    const testFile = midiFiles[0];
    if (!testFile) {
      console.log(`[AudioTest] ⚠️  Aucun fichier MIDI pour le test`);
      return true; // Pas d'erreur si pas de fichier
    }

    try {
      console.log(`[AudioTest] 🎵 Test de conversion: ${testFile}`);
      const wavPath = await converter.convertWithCache(testFile);
      
      if (wavPath && fs.existsSync(wavPath)) {
        const stats = fs.statSync(wavPath);
        console.log(`[AudioTest] ✅ Conversion réussie: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        return true;
      } else {
        console.log(`[AudioTest] ❌ Conversion échouée: fichier non créé`);
        return false;
      }
    } catch (error) {
      console.log(`[AudioTest] ❌ Erreur de conversion:`, error);
      return false;
    }
  }

  /**
   * Teste le générateur de SFX
   */
  private testSFXGenerator(): boolean {
    console.log(`[AudioTest] 🔊 Test du générateur SFX...`);
    
    const generator = new SFXGenerator();
    
    try {
      // Générer tous les SFX
      generator.generateAllSFX();
      
      // Vérifier que les fichiers ont été créés
      const expectedSFX = ["collision.wav", "ball-collision.wav", "gap-pass.wav", "success.wav"];
      const sfxDir = path.join(process.cwd(), "public", "generated", "sfx");
      
      if (!fs.existsSync(sfxDir)) {
        console.log(`[AudioTest] ❌ Dossier SFX non créé`);
        return false;
      }

      let allSuccess = true;
      expectedSFX.forEach(expectedFile => {
        const filePath = path.join(sfxDir, expectedFile);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          console.log(`[AudioTest] ✅ ${expectedFile} (${(stats.size / 1024).toFixed(1)} KB)`);
        } else {
          console.log(`[AudioTest] ❌ ${expectedFile} - MANQUANT`);
          allSuccess = false;
        }
      });

      return allSuccess;
    } catch (error) {
      console.log(`[AudioTest] ❌ Erreur SFX:`, error);
      return false;
    }
  }

  /**
   * Teste le système complet de préparation audio
   */
  private async testAudioRenderer(): Promise<boolean> {
    console.log(`[AudioTest] 🎬 Test du système de rendu audio...`);
    
    const renderer = new AudioRenderer();
    
    try {
      // Préparer tous les audios
      const audioIndex = await renderer.prepareAllAudio();
      
      // Vérifier l'index
      if (!audioIndex) {
        console.log(`[AudioTest] ❌ Index audio non créé`);
        return false;
      }

      console.log(`[AudioTest] ✅ Index audio créé:`);
      console.log(`[AudioTest]   - Fichiers musicaux: ${audioIndex.music.length}`);
      console.log(`[AudioTest]   - Effets sonores: ${audioIndex.sfx.length}`);
      
      if (audioIndex.selectedMusic) {
        console.log(`[AudioTest]   - Musique sélectionnée: ${audioIndex.selectedMusic.name}`);
      }

      // Vérifier que l'index est sauvegardé
      const indexPath = path.join(process.cwd(), "public", "generated", "audio-index.json");
      if (fs.existsSync(indexPath)) {
        console.log(`[AudioTest] ✅ Index sauvegardé: ${indexPath}`);
        return true;
      } else {
        console.log(`[AudioTest] ❌ Index non sauvegardé`);
        return false;
      }
    } catch (error) {
      console.log(`[AudioTest] ❌ Erreur système:`, error);
      return false;
    }
  }

  /**
   * Test de performance
   */
  private async testPerformance(midiFiles: string[]): Promise<void> {
    console.log(`[AudioTest] ⚡ Test de performance...`);
    
    if (midiFiles.length === 0) {
      console.log(`[AudioTest] ⚠️  Aucun fichier MIDI pour le test de performance`);
      return;
    }

    const converter = new MidiWavConverter();
    const testFile = midiFiles[0];
    
    // Premier appel (conversion)
    console.log(`[AudioTest] 🕐 Test conversion initiale...`);
    const start1 = Date.now();
    await converter.convertWithCache(testFile);
    const duration1 = Date.now() - start1;
    console.log(`[AudioTest] ⏱️  Conversion: ${duration1}ms`);

    // Deuxième appel (cache)
    console.log(`[AudioTest] 🕐 Test utilisation du cache...`);
    const start2 = Date.now();
    await converter.convertWithCache(testFile);
    const duration2 = Date.now() - start2;
    console.log(`[AudioTest] ⏱️  Cache: ${duration2}ms`);

    const speedup = duration1 / duration2;
    console.log(`[AudioTest] 🚀 Accélération cache: ${speedup.toFixed(1)}x`);
  }

  /**
   * Lance tous les tests
   */
  public async runAllTests(): Promise<boolean> {
    console.log(`[AudioTest] 🧪 Démarrage des tests du système audio...`);
    console.log(`[AudioTest] ================================================`);

    const results = {
      directories: false,
      midiFiles: false,
      midiConverter: false,
      sfxGenerator: false,
      audioRenderer: false,
    };

    // Test 1: Structure des dossiers
    results.directories = this.testDirectoryStructure();
    console.log();

    // Test 2: Fichiers MIDI
    const { success: midiSuccess, midiFiles } = this.testMidiFiles();
    results.midiFiles = midiSuccess;
    console.log();

    // Test 3: Convertisseur MIDI
    if (midiSuccess) {
      results.midiConverter = await this.testMidiConverter(midiFiles);
      console.log();
    }

    // Test 4: Générateur SFX
    results.sfxGenerator = this.testSFXGenerator();
    console.log();

    // Test 5: Système de rendu
    results.audioRenderer = await this.testAudioRenderer();
    console.log();

    // Test 6: Performance (si possible)
    if (midiSuccess && results.midiConverter) {
      await this.testPerformance(midiFiles);
      console.log();
    }

    // Résumé final
    console.log(`[AudioTest] 📊 Résultats des tests:`);
    console.log(`[AudioTest] ================================================`);
    
    Object.entries(results).forEach(([test, success]) => {
      const status = success ? "✅ RÉUSSI" : "❌ ÉCHEC";
      const name = test.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`[AudioTest] ${status.padEnd(10)} ${name}`);
    });

    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const successRate = (passedTests / totalTests) * 100;

    console.log(`[AudioTest] ================================================`);
    console.log(`[AudioTest] 📈 Score: ${passedTests}/${totalTests} (${successRate.toFixed(0)}%)`);

    if (successRate === 100) {
      console.log(`[AudioTest] 🎉 Tous les tests ont réussi! Le système audio est opérationnel.`);
    } else if (successRate >= 80) {
      console.log(`[AudioTest] ⚠️  La plupart des tests ont réussi. Quelques problèmes mineurs.`);
    } else {
      console.log(`[AudioTest] ❌ Plusieurs tests ont échoué. Le système nécessite des corrections.`);
    }

    return successRate === 100;
  }
}

// Script principal
if (require.main === module) {
  const tester = new AudioSystemTester();
  
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(`[AudioTest] ❌ Erreur fatale:`, error);
      process.exit(1);
    });
}