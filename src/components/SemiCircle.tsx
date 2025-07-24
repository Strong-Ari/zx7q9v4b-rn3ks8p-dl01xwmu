import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
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
  if (isExploding) {
    return null;
  }

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // FIX: Utiliser GAME_CONFIG.FPS pour garantir la cohérence entre preview et export
  const timeInSeconds = frame / GAME_CONFIG.FPS;
  const currentRotation =
    baseRotation + timeInSeconds * GAME_CONFIG.SPIRAL_ROTATION_SPEED * 360;

  // Debug: Logs pour diagnostic (à supprimer après test)
  if (frame % 60 === 0) {
    // Log toutes les 60 frames pour éviter le spam
    console.log(
      `[DIAGNOSTIC] Frame: ${frame}, FPS Config: ${GAME_CONFIG.FPS}, FPS Video: ${fps}, Rotation: ${currentRotation.toFixed(2)}`,
    );
  }

  const createArcPath = () => {
    const segments = 36;
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

  const strokeWidth = GAME_CONFIG.CIRCLE_STROKE_WIDTH;
  const filterId = `glow-${radius}`;

  return (
    <g
      transform={`
        translate(${GAME_CONFIG.VIDEO_WIDTH / 2} ${GAME_CONFIG.VIDEO_HEIGHT / 2})
        rotate(${currentRotation})
      `}
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
        <filter id={filterId}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="2"
            floodColor={GAME_CONFIG.CIRCLE_GRADIENT_START}
            floodOpacity="0.5"
          />
        </filter>
      </defs>
      <path
        d={createArcPath()}
        stroke={`url(#ring-gradient-${radius})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        filter={`url(#${filterId})`}
      />
    </g>
  );
};
