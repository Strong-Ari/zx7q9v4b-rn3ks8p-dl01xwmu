import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { GAME_CONFIG } from "../constants/game";

interface SemiCircleProps {
  radius: number;
  gapAngle: number;
  gapRotation: number;
  baseRotation: number;
  isExploding: boolean;
  explosionColor: string;
}

export const SemiCircle: React.FC<SemiCircleProps> = ({
  radius,
  gapAngle,
  gapRotation,
  baseRotation,
  isExploding,
  explosionColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculer la position de base de l'anneau
  const ringPosition = baseRotation * (radius / GAME_CONFIG.MAX_CIRCLE_RADIUS);

  // Calculer une rotation lente basée sur la position de l'anneau
  const baseSpeed = 0.5; // Vitesse de base en degrés par frame
  const speedMultiplier =
    1 -
    (radius - GAME_CONFIG.MIN_CIRCLE_RADIUS) /
      (GAME_CONFIG.MAX_CIRCLE_RADIUS - GAME_CONFIG.MIN_CIRCLE_RADIUS);

  // Les anneaux extérieurs tournent plus lentement que les anneaux intérieurs
  const rotationSpeed = baseSpeed * (0.5 + speedMultiplier * 0.5);

  // Calculer la rotation actuelle
  const currentRotation = (frame * rotationSpeed + ringPosition) % 360;

  // Appliquer une rotation douce
  const smoothedRotation = interpolate(
    frame,
    [0, fps],
    [currentRotation, currentRotation + rotationSpeed],
    {
      extrapolateRight: "clamp",
      easing: (t) => 1 - Math.pow(1 - t, 3), // Easing cubique pour une rotation plus naturelle
    },
  );

  // Animation d'explosion
  const explosionProgress = isExploding
    ? interpolate(frame % 30, [0, 29], [0, 1], {
        extrapolateRight: "clamp",
      })
    : 0;

  const scale = isExploding
    ? interpolate(explosionProgress, [0, 1], [1, 1.2])
    : 1;

  const opacity = isExploding
    ? interpolate(explosionProgress, [0, 0.7, 1], [1, 0.5, 0])
    : 1;

  // Créer le chemin de l'arc
  const createArcPath = () => {
    const segments = 36; // Nombre de segments pour créer l'arc
    const points: string[] = [];
    const gap = gapAngle / 2;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * (360 - gapAngle) + gap;
      const radian = (angle * Math.PI) / 180;
      const x = radius * Math.cos(radian);
      const y = radius * Math.sin(radian);

      if (i === 0) {
        points.push(`M ${x} ${y}`);
      } else {
        points.push(`L ${x} ${y}`);
      }
    }

    return points.join(" ");
  };

  // Effet de brillance
  const glowEffect = isExploding ? "url(#explosion-glow)" : "url(#ring-glow)";
  const strokeWidth = interpolate(
    radius,
    [GAME_CONFIG.MIN_CIRCLE_RADIUS, GAME_CONFIG.MAX_CIRCLE_RADIUS],
    [
      GAME_CONFIG.CIRCLE_STROKE_WIDTH * 1.2,
      GAME_CONFIG.CIRCLE_STROKE_WIDTH * 0.8,
    ],
  );

  return (
    <g
      transform={`
        translate(${GAME_CONFIG.VIDEO_WIDTH / 2} ${GAME_CONFIG.VIDEO_HEIGHT / 2})
        rotate(${smoothedRotation})
        scale(${scale})
      `}
      style={{ opacity }}
    >
      <defs>
        <linearGradient
          id={`ring-gradient-${radius}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor={GAME_CONFIG.CIRCLE_GRADIENT_START} />
          <stop offset="100%" stopColor={GAME_CONFIG.CIRCLE_GRADIENT_END} />
        </linearGradient>
        <filter id="ring-glow">
          <feGaussianBlur stdDeviation="2" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.2
                    0 0 0 0 0.8
                    0 0 0 0 0.4
                    0 0 0 1 0"
          />
        </filter>
        <filter id="explosion-glow">
          <feGaussianBlur stdDeviation="4" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1
                    0 0 0 0 0.5
                    0 0 0 0 0
                    0 0 0 1 0"
          />
        </filter>
      </defs>
      <path
        d={createArcPath()}
        stroke={isExploding ? explosionColor : `url(#ring-gradient-${radius})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        filter={glowEffect}
      />
    </g>
  );
};
