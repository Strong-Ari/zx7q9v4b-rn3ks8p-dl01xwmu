#!/usr/bin/env tsx

/**
 * Test du système audio simple
 * Ce script teste le SimpleAudioPlayer sans dépendances MIDI
 */

import { simpleAudioPlayer } from "../src/services/simpleAudioPlayer";

console.log("🔊 Test du système audio simple");
console.log("================================");

async function testSimpleAudio() {
  try {
    console.log("\n1. Test d'initialisation...");
    const initialized = await simpleAudioPlayer.initAudio();
    console.log(`   ${initialized ? "✅" : "❌"} Audio initialisé: ${initialized}`);

    if (initialized) {
      console.log("\n2. Test des sons de collision...");
      
      // Test son balle-cercle
      console.log("   🎯 Test son balle-cercle...");
      simpleAudioPlayer.playBallCircleSound();
      await new Promise(resolve => setTimeout(resolve, 300));

      // Test son balle-balle
      console.log("   ⚽ Test son balle-balle...");
      simpleAudioPlayer.playBallBallSound();
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log("\n3. Test des fréquences...");
      
      // Test différentes fréquences
      const frequencies = [440, 523.25, 659.25, 880];
      for (const freq of frequencies) {
        console.log(`   🎵 Test fréquence ${freq}Hz...`);
        simpleAudioPlayer.playFrequency(freq, 0.2);
        await new Promise(resolve => setTimeout(resolve, 250));
      }

      console.log("\n4. Test du statut...");
      const status = simpleAudioPlayer.getStatus();
      console.log("   📊 Statut du lecteur:");
      console.log(`      - Mode Browser: ${status.isBrowserMode}`);
      console.log(`      - Initialisé: ${status.isInitialized}`);
      console.log(`      - Disponible: ${status.isAvailable}`);

      console.log("\n5. Test de nettoyage...");
      simpleAudioPlayer.cleanup();
      console.log("   ✅ Ressources nettoyées");

    } else {
      console.log("   ⚠️  Audio non disponible (probablement côté serveur)");
    }

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

// Exécuter le test
testSimpleAudio().then(() => {
  console.log("\n🎉 Test du système audio simple terminé !");
  console.log("==========================================");
  process.exit(0);
}).catch((error) => {
  console.error("💥 Erreur fatale:", error);
  process.exit(1);
});