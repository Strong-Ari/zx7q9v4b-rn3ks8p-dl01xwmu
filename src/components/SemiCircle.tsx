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

  // Calculer la rotation de manière synchronisée avec la physique
  const radiusStep = (GAME_CONFIG.MAX_CIRCLE_RADIUS - GAME_CONFIG.MIN_CIRCLE_RADIUS) / (GAME_CONFIG.SPIRAL_DENSITY - 1);
  const circleIndex = Math.round((radius - GAME_CONFIG.MIN_CIRCLE_RADIUS) / (radiusStep * 1.5));
  const ringPosition = baseRotation * (radius / GAME_CONFIG.MAX_CIRCLE_RADIUS);
  
  const baseSpeed = 0.5;
  const speedMultiplier = 1 - (radius - GAME_CONFIG.MIN_CIRCLE_RADIUS) / (GAME_CONFIG.MAX_CIRCLE_RADIUS - GAME_CONFIG.MIN_CIRCLE_RADIUS);
  const rotationSpeed = baseSpeed * (0.5 + speedMultiplier * 0.5);
  
  // Rotation fluide et continue
  const currentRotation = (frame * rotationSpeed + ringPosition) % 360;

  // Animation d'explosion améliorée
  const explosionProgress = isExploding
    ? interpolate(frame % 30, [0, 29], [0, 1], {
        extrapolateRight: "clamp",
        easing: (t) => 1 - Math.pow(1 - t, 2), // Easing quadratique pour une explosion plus naturelle
      })
    : 0;

  const scale = isExploding
    ? interpolate(explosionProgress, [0, 1], [1, 1.5], {
        easing: (t: number) => t * t, // Accélération de l'expansion
      })
    : 1;

  const opacity = isExploding
    ? interpolate(explosionProgress, [0, 0.5, 1], [1, 0.8, 0], {
        easing: (t: number) => 1 - t, // Fade out linéaire
      })
    : 1;

  // Créer le chemin de l'arc avec une meilleure précision
  const createArcPath = () => {
    const segments = 72; // Plus de segments pour une courbe plus lisse
    const points: string[] = [];
    
    // Position de l'ouverture fixe à 180° (côté opposé à 0°)
    const gapStart = 180 - gapAngle / 2;
    const gapEnd = 180 + gapAngle / 2;
    
    // Créer l'arc en évitant l'ouverture
    const totalAngle = 360 - gapAngle;
    
    for (let i = 0; i <= segments; i++) {
      const progress = i / segments;
      let angle;
      
      if (gapStart > gapEnd) {
        // L'ouverture traverse 0°
        if (progress <= (360 - gapStart) / totalAngle) {
          angle = gapEnd + progress * (360 - gapStart);
        } else {
          angle = 0 + (progress - (360 - gapStart) / totalAngle) * gapStart / (gapStart / totalAngle);
        }
      } else {
        // L'ouverture est continue
        if (progress <= gapStart / totalAngle) {
          angle = progress * gapStart / (gapStart / totalAngle);
        } else {
          angle = gapEnd + (progress - gapStart / totalAngle) * (360 - gapEnd) / ((360 - gapEnd) / totalAngle);
        }
      }
      
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

  // Effets visuels améliorés
  const strokeWidth = interpolate(
    radius,
    [GAME_CONFIG.MIN_CIRCLE_RADIUS, GAME_CONFIG.MAX_CIRCLE_RADIUS],
    [
      GAME_CONFIG.CIRCLE_STROKE_WIDTH * 1.2,
      GAME_CONFIG.CIRCLE_STROKE_WIDTH * 0.8,
    ],
    {
      easing: (t: number) => t, // Interpolation linéaire
    }
  );

  // Effet de brillance dynamique
  const glowIntensity = isExploding 
    ? interpolate(explosionProgress, [0, 1], [2, 8])
    : interpolate(Math.sin(frame * 0.05), [-1, 1], [1, 2]);

  return (
    <g
      transform={`
        translate(${GAME_CONFIG.VIDEO_WIDTH / 2} ${GAME_CONFIG.VIDEO_HEIGHT / 2})
        rotate(${currentRotation})
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
          <stop 
            offset="0%" 
            stopColor={isExploding ? explosionColor : GAME_CONFIG.CIRCLE_GRADIENT_START} 
            stopOpacity={isExploding ? 0.9 : 1}
          />
          <stop 
            offset="50%" 
            stopColor={isExploding ? "#ffffff" : "#ffffff"} 
            stopOpacity={isExploding ? 0.6 : 0.3}
          />
          <stop 
            offset="100%" 
            stopColor={isExploding ? explosionColor : GAME_CONFIG.CIRCLE_GRADIENT_END} 
            stopOpacity={isExploding ? 0.9 : 1}
          />
        </linearGradient>
        
        <filter id={`ring-glow-${radius}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={glowIntensity} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`explosion-glow-${radius}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={glowIntensity * 2} result="coloredBlur" />
          <feColorMatrix
            type="matrix"
            values="1 0.5 0 0 0
                    0.5 1 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
          />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <path
        d={createArcPath()}
        stroke={`url(#ring-gradient-${radius})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        filter={isExploding ? `url(#explosion-glow-${radius})` : `url(#ring-glow-${radius})`}
      />
    </g>
  );
};
