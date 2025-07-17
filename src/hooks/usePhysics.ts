import { useEffect, useRef, useState } from "react";
import { useCurrentFrame } from "remotion";
import PhysicsEngine, { PhysicsState } from "../physics/engine";
import { GAME_CONFIG } from "../constants/game";

interface Position {
  x: number;
  y: number;
}

interface GameState {
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

export const usePhysics = (
  onCollisionSound: (type: "BALL_CIRCLE" | "BALL_BALL") => void,
) => {
  const frame = useCurrentFrame();
  const engineRef = useRef<PhysicsEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    yesBall: {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      trail: [],
    },
    noBall: {
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      trail: [],
    },
    circles: [],
    scores: { yes: 0, no: 0 },
  });

  // Initialiser le moteur physique
  useEffect(() => {
    const handleBallCircleCollision = (ballId: string, circleId: number) => {
      if (!engineRef.current) return;

      // Mettre à jour le score et l'état du cercle
      setGameState((prev) => ({
        ...prev,
        scores: {
          yes: ballId === "yesBall" ? prev.scores.yes + 1 : prev.scores.yes,
          no: ballId === "noBall" ? prev.scores.no + 1 : prev.scores.no,
        },
        circles: prev.circles.map((circle) =>
          circle.id === circleId
            ? {
                ...circle,
                isExploding: true,
                explosionColor:
                  ballId === "yesBall"
                    ? GAME_CONFIG.COLORS.YES_BALL
                    : GAME_CONFIG.COLORS.NO_BALL,
              }
            : circle,
        ),
      }));

      // Supprimer les segments du cercle dans le moteur physique
      engineRef.current.removeCircleSegments(circleId);

      // Jouer le son de collision
      onCollisionSound("BALL_CIRCLE");
    };

    const handleBallBallCollision = () => {
      onCollisionSound("BALL_BALL");
    };

    engineRef.current = new PhysicsEngine(
      handleBallCircleCollision,
      handleBallBallCollision,
    );

    // Initialiser l'état des cercles
    const physicsState = engineRef.current.getState();
    setGameState((prev) => ({
      ...prev,
      circles: physicsState.circles.map((circle) => ({
        id: circle.id,
        isExploding: circle.isExploding,
        explosionColor: circle.explosionColor,
      })),
    }));

    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
      }
    };
  }, [onCollisionSound]);

  // Mettre à jour la physique à chaque frame
  useEffect(() => {
    if (!engineRef.current) return;

    // Mettre à jour le moteur physique avec le numéro de frame
    engineRef.current.update(frame);

    // Récupérer l'état actuel
    const physicsState = engineRef.current.getState();

    // Mettre à jour l'état du jeu
    setGameState((prev) => {
      const updateBallState = (
        currentBall: GameState["yesBall"],
        physicsBall: Matter.Body,
      ) => {
        const newPosition = {
          x: physicsBall.position.x,
          y: physicsBall.position.y,
        };

        // Optimisation: calculer la traînée seulement si la position a vraiment changé
        const hasPositionChanged =
          currentBall.trail.length === 0 ||
          Math.abs(newPosition.x - currentBall.trail[0].x) > 0.1 ||
          Math.abs(newPosition.y - currentBall.trail[0].y) > 0.1;

        if (!hasPositionChanged) {
          return currentBall; // Retourner l'état existant si pas de changement significatif
        }

        // Calculer la traînée en fonction de la vitesse (optimisé)
        const velocitySquared =
          physicsBall.velocity.x * physicsBall.velocity.x +
          physicsBall.velocity.y * physicsBall.velocity.y;
        const speed = Math.sqrt(velocitySquared);

        const trailLength = Math.min(
          GAME_CONFIG.TRAIL_LENGTH,
          Math.max(
            3,
            Math.ceil(
              (speed / GAME_CONFIG.BALL_SPEED) * GAME_CONFIG.TRAIL_LENGTH,
            ),
          ),
        );

        return {
          position: newPosition,
          velocity: physicsBall.velocity,
          trail: [newPosition, ...currentBall.trail.slice(0, trailLength - 1)],
        };
      };

      return {
        ...prev,
        yesBall: updateBallState(prev.yesBall, physicsState.yesBall),
        noBall: updateBallState(prev.noBall, physicsState.noBall),
      };
    });
  }, [frame]);

  return gameState;
};
