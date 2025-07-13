import React, { useEffect } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { GAME_CONFIG } from "../constants/game";

interface SemiCircleProps {
  radius: number;
  gapAngle: number;
  gapRotation: number;
  isExploding: boolean;
  explosionColor: string;
  baseRotation: number;
}

export const SemiCircle: React.FC<SemiCircleProps> = ({
  radius,
  gapAngle,
  gapRotation,
  isExploding,
  explosionColor,
  baseRotation,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculer la rotation cyclique
  const rotationPeriod = 1 / GAME_CONFIG.SPIRAL_ROTATION_SPEED; // Période en secondes
  const timeInSeconds = (frame / fps) % rotationPeriod;
  const rotationProgress = timeInSeconds / rotationPeriod; // 0 à 1
  const rotation = rotationProgress * 360; // Convertir en degrés

  // Calculer la rotation totale
  const totalRotation = (rotation + baseRotation) % 360; // Utiliser modulo pour éviter l'accumulation

  // Logs pour déboguer la rotation
  useEffect(() => {
    if (frame % 30 === 0) {
      console.log("--- Debug Visual Rotation ---");
      console.log("Frame:", frame);
      console.log("FPS:", fps);
      console.log("Time in seconds:", timeInSeconds);
      console.log("Rotation Period:", rotationPeriod);
      console.log("Rotation Progress:", rotationProgress);
      console.log("Base Rotation:", baseRotation);
      console.log("Current Rotation:", rotation);
      console.log("Total Rotation:", totalRotation);
      console.log("------------------");
    }
  }, [
    frame,
    fps,
    timeInSeconds,
    rotationPeriod,
    baseRotation,
    rotation,
    totalRotation,
  ]);

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

  // Calculer l'épaisseur progressive du trait
  const progressiveStrokeWidth = interpolate(
    radius,
    [GAME_CONFIG.MIN_CIRCLE_RADIUS, GAME_CONFIG.MAX_CIRCLE_RADIUS],
    [
      GAME_CONFIG.CIRCLE_STROKE_WIDTH * 1.5,
      GAME_CONFIG.CIRCLE_STROKE_WIDTH * 0.5,
    ],
  );

  // Créer le chemin de l'arc
  const startAngle = gapRotation;
  const endAngle = startAngle + (360 - gapAngle);

  const createArcPath = (
    radius: number,
    startAngle: number,
    endAngle: number,
  ) => {
    const start = {
      x: radius * Math.cos((startAngle * Math.PI) / 180),
      y: radius * Math.sin((startAngle * Math.PI) / 180),
    };
    const end = {
      x: radius * Math.cos((endAngle * Math.PI) / 180),
      y: radius * Math.sin((endAngle * Math.PI) / 180),
    };
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  // Créer un ID unique pour le dégradé
  const gradientId = `gradient-${radius}`;

  return (
    <g
      transform={`
        translate(${GAME_CONFIG.VIDEO_WIDTH / 2} ${GAME_CONFIG.VIDEO_HEIGHT / 2})
        rotate(${totalRotation})
        scale(${scale})
      `}
      style={{ opacity }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GAME_CONFIG.CIRCLE_GRADIENT_START} />
          <stop offset="100%" stopColor={GAME_CONFIG.CIRCLE_GRADIENT_END} />
        </linearGradient>
      </defs>
      <path
        d={createArcPath(radius, startAngle, endAngle)}
        stroke={isExploding ? explosionColor : `url(#${gradientId})`}
        strokeWidth={progressiveStrokeWidth}
        fill="none"
        strokeLinecap="round"
        filter="url(#glow)"
      />
    </g>
  );
};

export default SemiCircle;
