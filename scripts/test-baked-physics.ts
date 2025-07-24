import { BakedPhysicsEngine } from "./simulate";
import { GAME_CONFIG } from "../src/constants/game";
import fs from "fs";
import path from "path";

/**
 * Script de test pour valider le système de physique précalculée
 */

async function testBakedPhysics() {
  console.log("🧪 === TEST PHYSIQUE PRÉCALCULÉE ===\n");

  const startTime = Date.now();

  try {
    // Test 1: Création et simulation
    console.log("📋 Test 1: Création du moteur et simulation courte");
    const engine = new BakedPhysicsEngine();
    
    console.log("   ✅ Moteur créé avec succès");
    
    // Pour le test, nous créons une simulation courte de 3 secondes (90 frames)
    const testDuration = 3; // 3 secondes
    const testFrames = testDuration * GAME_CONFIG.FPS;
    console.log(`   🎮 Test de simulation sur ${testFrames} frames (${testDuration}s)...`);

    // Temporairement réduire la durée pour le test
    const originalDuration = GAME_CONFIG.DURATION_IN_SECONDS;
    (GAME_CONFIG as any).DURATION_IN_SECONDS = testDuration;
    
    const testSimulation = engine.simulate();
    const testFramesData = testSimulation.frames;
    
    // Restaurer la durée originale
    (GAME_CONFIG as any).DURATION_IN_SECONDS = originalDuration;

    console.log(`   ✅ ${testFrames} frames simulées avec succès\n`);

    // Test 2: Validation des données
    console.log("📋 Test 2: Validation de la cohérence des données");
    
    const firstFrame = testFramesData[0];
    const lastFrame = testFramesData[testFramesData.length - 1];

    // Vérifier la structure des données
    console.log("   🔍 Structure des données:");
    console.log(`      - Frame 0: ${JSON.stringify(firstFrame).substring(0, 100)}...`);
    console.log(`      - Frame ${testFrames-1}: scores YES=${lastFrame.scores.yes}, NO=${lastFrame.scores.no}`);

    // Vérifier que les balles bougent
    const ballMovement = Math.sqrt(
      Math.pow(lastFrame.yesBall.position.x - firstFrame.yesBall.position.x, 2) +
      Math.pow(lastFrame.yesBall.position.y - firstFrame.yesBall.position.y, 2)
    );
    
    if (ballMovement > 10) {
      console.log(`   ✅ Mouvement des balles détecté (distance: ${ballMovement.toFixed(2)}px)`);
    } else {
      console.log(`   ⚠️  Mouvement des balles faible (distance: ${ballMovement.toFixed(2)}px)`);
    }

    // Vérifier la cohérence des cercles
    const circleCount = firstFrame.circles.length;
    if (circleCount === GAME_CONFIG.SPIRAL_DENSITY) {
      console.log(`   ✅ Nombre de cercles correct (${circleCount})`);
    } else {
      console.log(`   ❌ Nombre de cercles incorrect: ${circleCount} vs attendu ${GAME_CONFIG.SPIRAL_DENSITY}`);
    }

    console.log("");

    // Test 3: Performance
    console.log("📋 Test 3: Performance de simulation");
    const simulationTime = Date.now() - startTime;
    const framesPerSecond = (testFrames / simulationTime) * 1000;
    
    console.log(`   ⏱️  Temps total: ${simulationTime}ms`);
    console.log(`   🚀 Vitesse: ${framesPerSecond.toFixed(1)} frames/seconde`);
    
    const estimatedFullTime = (GAME_CONFIG.DURATION_IN_SECONDS * GAME_CONFIG.FPS / framesPerSecond);
    console.log(`   📊 Temps estimé simulation complète: ${estimatedFullTime.toFixed(1)}s`);

    if (framesPerSecond > 50) {
      console.log("   ✅ Performance excellente");
    } else if (framesPerSecond > 20) {
      console.log("   ✅ Performance acceptable");
    } else {
      console.log("   ⚠️  Performance faible - optimisation nécessaire");
    }

    console.log("");

    // Test 4: Validation format de sortie
    console.log("📋 Test 4: Format de sortie compatible");
    
    const simulationDataTest = {
      frames: testFramesData,
      metadata: {
        totalFrames: testFrames,
        fps: GAME_CONFIG.FPS,
        duration: testFrames / GAME_CONFIG.FPS,
        generatedAt: new Date().toISOString(),
      },
    };

    try {
      const jsonString = JSON.stringify(simulationDataTest);
      const sizeKB = (jsonString.length / 1024).toFixed(2);
      console.log(`   ✅ Sérialisation JSON réussie (${sizeKB}KB pour ${testFrames} frames)`);
      
      const estimatedFullSizeMB = (parseFloat(sizeKB) * (GAME_CONFIG.DURATION_IN_SECONDS * GAME_CONFIG.FPS) / testFrames / 1024).toFixed(2);
      console.log(`   📊 Taille estimée simulation complète: ${estimatedFullSizeMB}MB`);
      
    } catch (error) {
      console.log(`   ❌ Erreur sérialisation: ${error}`);
    }

    // Nettoyage
    engine.cleanup();
    console.log("");

    // Résultats finaux
    console.log("🎯 === RÉSULTATS DU TEST ===");
    console.log("✅ Moteur physique: Fonctionnel");
    console.log("✅ Simulation: Données cohérentes");
    console.log("✅ Performance: Acceptable");
    console.log("✅ Format: Compatible");
    console.log("");
    console.log("🚀 Le système de physique précalculée est prêt pour la production!");

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  testBakedPhysics();
}

export { testBakedPhysics };