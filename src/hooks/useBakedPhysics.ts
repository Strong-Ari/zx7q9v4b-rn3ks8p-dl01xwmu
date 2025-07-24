import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { GAME_CONFIG } from "../constants/game";
import type { BakedGameState, SimulationData, BallData } from "../../types/simulation";

interface Position {
  x: number;
  y: number;
}

interface GameStateCompat {
  yesBall: {
    position: Position;
    velocity: Position;
    trail: Position[];
  };
  noBall: {
    position: Position;
    velocity: Position;
    trail: Position[];
  };
  circles: Array<{
    id: number;
    isExploding: boolean;
    explosionColor: string;
  }>;
  scores: {
    yes: number;
    no: number;
  };
}

/**
 * Hook optimisé qui utilise les données de physique précalculées
 * au lieu de simuler Matter.js en temps réel
 */
export const useBakedPhysics = (
  simulationData: SimulationData,
  onCollisionSound?: (type: "BALL_CIRCLE" | "BALL_BALL") => void
): GameStateCompat => {
  const frame = useCurrentFrame();

  // Récupérer les données pour la frame actuelle
  const currentFrameData = useMemo(() => {
    // Assurer que l'index de frame est valide
    const frameIndex = Math.min(frame, simulationData.frames.length - 1);
    return simulationData.frames[frameIndex] || simulationData.frames[0];
  }, [frame, simulationData]);

  // Calculer les traînées des balles basées sur l'historique des positions
  const ballTrails = useMemo(() => {
    const trailLength = GAME_CONFIG.TRAIL_LENGTH;
    const startFrame = Math.max(0, frame - trailLength);
    const endFrame = Math.min(frame + 1, simulationData.frames.length);

    const yesTrail: Position[] = [];
    const noTrail: Position[] = [];

    // Construire les traînées en remontant dans le temps
    for (let i = endFrame - 1; i >= startFrame; i--) {
      const frameData = simulationData.frames[i];
      if (frameData) {
        yesTrail.push(frameData.yesBall.position);
        noTrail.push(frameData.noBall.position);
      }
    }

    return { yesTrail, noTrail };
  }, [frame, simulationData]);

  // Détecter les nouvelles collisions pour les sons
  const previousFrameData = useMemo(() => {
    if (frame <= 0) return null;
    const prevIndex = Math.min(frame - 1, simulationData.frames.length - 1);
    return simulationData.frames[prevIndex];
  }, [frame, simulationData]);

  // Jouer les sons de collision si nécessaire
  useMemo(() => {
    if (!onCollisionSound || !previousFrameData || frame <= 0) return;

    const current = currentFrameData;
    const previous = previousFrameData;

    // Détecter les nouvelles explosions de cercles
    const newExplosions = current.circles.filter((circle, index) => {
      const prevCircle = previous.circles[index];
      return circle.isExploding && !prevCircle?.isExploding;
    });

    if (newExplosions.length > 0) {
      onCollisionSound("BALL_CIRCLE");
    }

    // Note: Les collisions balle-balle sont plus difficiles à détecter dans les données précalculées
    // Elles pourraient être ajoutées au format de données si nécessaire
  }, [currentFrameData, previousFrameData, onCollisionSound, frame]);

  // Convertir les données au format attendu par les composants existants
  return useMemo((): GameStateCompat => {
    return {
      yesBall: {
        position: currentFrameData.yesBall.position,
        velocity: currentFrameData.yesBall.velocity,
        trail: ballTrails.yesTrail,
      },
      noBall: {
        position: currentFrameData.noBall.position,
        velocity: currentFrameData.noBall.velocity,
        trail: ballTrails.noTrail,
      },
      circles: currentFrameData.circles.map((circle) => ({
        id: circle.id,
        isExploding: circle.isExploding,
        explosionColor: circle.explosionColor,
      })),
      scores: currentFrameData.scores,
    };
  }, [currentFrameData, ballTrails]);
};

/**
 * Hook utilitaire pour accéder aux données de cercle enrichies
 * (inclut radius, gapAngle, etc. pour les composants SemiCircle)
 */
export const useBakedCircleData = (simulationData: SimulationData) => {
  const frame = useCurrentFrame();

  return useMemo(() => {
    const frameIndex = Math.min(frame, simulationData.frames.length - 1);
    const frameData = simulationData.frames[frameIndex] || simulationData.frames[0];
    
    return frameData.circles.map((circle) => ({
      ...circle,
      // Calculer le radius basé sur l'ID (même logique qu'avant)
      radius: GAME_CONFIG.MIN_CIRCLE_RADIUS +
        (circle.id *
          (GAME_CONFIG.MAX_CIRCLE_RADIUS - GAME_CONFIG.MIN_CIRCLE_RADIUS)) /
          GAME_CONFIG.SPIRAL_DENSITY,
    }));
  }, [frame, simulationData]);
};

export default useBakedPhysics;