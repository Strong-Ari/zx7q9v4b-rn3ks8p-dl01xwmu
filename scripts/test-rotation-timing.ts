#!/usr/bin/env tsx

import { GAME_CONFIG } from "../src/constants/game";

/**
 * Script de test pour valider le timing de rotation spirale
 */

console.log("🔧 TEST ROTATION TIMING - Remotion");
console.log("=====================================");

// Configuration
const TOTAL_FRAMES = GAME_CONFIG.DURATION_IN_SECONDS * GAME_CONFIG.FPS; // 61 * 30 = 1830
const FPS = GAME_CONFIG.FPS; // 30
const SPIRAL_SPEED = GAME_CONFIG.SPIRAL_ROTATION_SPEED; // 0.05

console.log(`📊 Configuration:
- Durée: ${GAME_CONFIG.DURATION_IN_SECONDS} secondes
- FPS: ${GAME_CONFIG.FPS}
- Total frames: ${TOTAL_FRAMES}
- Vitesse spirale: ${SPIRAL_SPEED}
`);

// Test de la formule de rotation
function calculateRotation(frame: number, baseRotation: number = 0): number {
  const timeInSeconds = frame / FPS;
  return baseRotation + timeInSeconds * SPIRAL_SPEED * 360;
}

// Tests aux points clés
const testFrames = [0, 900, 1830]; // Début, milieu, fin
console.log("🧪 Tests de rotation:");

testFrames.forEach((frame) => {
  const rotation = calculateRotation(frame);
  const timeInSeconds = frame / FPS;
  const rotationDegrees = rotation % 360;
  const fullRotations = Math.floor(rotation / 360);

  console.log(
    `Frame ${frame}: ${timeInSeconds}s → ${rotation.toFixed(2)}° (${fullRotations} tours + ${rotationDegrees.toFixed(2)}°)`,
  );
});

// Calcul du nombre total de rotations
const totalRotation = calculateRotation(TOTAL_FRAMES);
const totalRotations = totalRotation / 360;

console.log(`
🔄 Résultats:
- Rotation totale: ${totalRotation.toFixed(2)}°
- Nombre de tours complets: ${totalRotations.toFixed(2)}
- Vitesse angulaire: ${(SPIRAL_SPEED * 360).toFixed(2)}°/seconde
`);

// Validation
if (totalRotations > 0.5) {
  console.log("✅ PASS: La rotation est suffisante pour être visible");
} else {
  console.log("⚠️  WARN: La rotation pourrait être trop lente");
}

if (totalRotations < 10) {
  console.log("✅ PASS: La vitesse de rotation est raisonnable");
} else {
  console.log("⚠️  WARN: La rotation pourrait être trop rapide");
}

// Test de cohérence FPS
console.log(`
🎯 Tests de cohérence FPS:
`);

// Simuler différents FPS pour voir l'impact
const testFps = [24, 30, 60];
testFps.forEach((fps) => {
  const timeAtFrame900 = 900 / fps;
  const rotationWithDifferentFps = timeAtFrame900 * SPIRAL_SPEED * 360;
  console.log(
    `FPS ${fps}: Frame 900 → ${timeAtFrame900.toFixed(2)}s → ${rotationWithDifferentFps.toFixed(2)}°`,
  );
});

console.log(`
🔧 Solution appliquée:
- Utilisation de GAME_CONFIG.FPS (${GAME_CONFIG.FPS}) au lieu de useVideoConfig().fps
- Garantit la cohérence entre preview et export
- Rotation indépendante du FPS utilisé par le moteur de rendu
`);
