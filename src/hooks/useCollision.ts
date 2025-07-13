import { useCallback } from "react";
import { GAME_CONFIG } from "../constants/game";

interface Position {
  x: number;
  y: number;
}

interface Circle {
  radius: number;
  gapAngle: number;
  gapRotation: number;
}

export const useCollision = () => {
  // Vérifier si un point est dans l'ouverture d'un cercle
  const isPointInGap = useCallback(
    (point: Position, circle: Circle): boolean => {
      // Calculer l'angle du point par rapport au centre
      const angle =
        (Math.atan2(
          point.y - GAME_CONFIG.VIDEO_HEIGHT / 2,
          point.x - GAME_CONFIG.VIDEO_WIDTH / 2,
        ) *
          180) /
        Math.PI;

      // Normaliser l'angle entre 0 et 360
      const normalizedAngle = (angle - circle.gapRotation + 360) % 360;

      // Le point est dans l'ouverture si son angle est dans la plage du gap
      return normalizedAngle <= circle.gapAngle;
    },
    [],
  );

  // Vérifier la collision entre une balle et un cercle
  const checkBallCircleCollision = useCallback(
    (ballPos: Position, circle: Circle): boolean => {
      // Distance entre la balle et le centre
      const dx = ballPos.x - GAME_CONFIG.VIDEO_WIDTH / 2;
      const dy = ballPos.y - GAME_CONFIG.VIDEO_HEIGHT / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Si la balle est proche du rayon du cercle
      const collisionThreshold = GAME_CONFIG.BALL_RADIUS;
      if (
        Math.abs(distance - circle.radius) <= collisionThreshold &&
        !isPointInGap(ballPos, circle)
      ) {
        return true;
      }

      return false;
    },
    [isPointInGap],
  );

  // Vérifier la collision entre deux balles
  const checkBallBallCollision = useCallback(
    (ball1: Position, ball2: Position): boolean => {
      const dx = ball1.x - ball2.x;
      const dy = ball1.y - ball2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance <= GAME_CONFIG.BALL_RADIUS * 2;
    },
    [],
  );

  // Calculer la nouvelle vélocité après une collision avec un cercle
  const calculateNewVelocity = useCallback(
    (pos: Position, vel: Position): Position => {
      // Calculer le vecteur normal au point de collision
      const dx = pos.x - GAME_CONFIG.VIDEO_WIDTH / 2;
      const dy = pos.y - GAME_CONFIG.VIDEO_HEIGHT / 2;
      const length = Math.sqrt(dx * dx + dy * dy);
      const normal = { x: dx / length, y: dy / length };

      // Calculer la réflexion
      const dot = vel.x * normal.x + vel.y * normal.y;
      return {
        x: vel.x - 2 * dot * normal.x,
        y: vel.y - 2 * dot * normal.y,
      };
    },
    [],
  );

  return {
    checkBallCircleCollision,
    checkBallBallCollision,
    calculateNewVelocity,
  };
};

export default useCollision;
