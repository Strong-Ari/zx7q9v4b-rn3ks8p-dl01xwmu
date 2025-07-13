import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { GAME_CONFIG } from "../constants/game";

interface Position {
  x: number;
  y: number;
}

interface BallProps {
  type: "yes" | "no";
  position: Position;
  velocity: Position;
  trail: Position[];
}

export const Ball: React.FC<BallProps> = ({
  type,
  position,
  velocity,
  trail,
}) => {
  const frame = useCurrentFrame();

  // Couleur de la balle selon le type
  const color =
    type === "yes" ? GAME_CONFIG.COLORS.YES_BALL : GAME_CONFIG.COLORS.NO_BALL;

  // Animation de pulsation
  const scale = interpolate(Math.sin(frame * 0.1), [-1, 1], [0.95, 1.05]);

  // Rendu de la traînée
  const renderTrail = () => {
    if (trail.length < 2) return null;

    return trail.map((pos, index) => {
      // Assurer que l'interpolation a toujours une plage croissante
      const progress = trail.length > 1 ? index / (trail.length - 1) : 0;
      const opacity = interpolate(progress, [0, 1], [0.8, 0]);
      const trailScale = interpolate(progress, [0, 1], [0.9, 0.3]);

      return (
        <circle
          key={index}
          cx={pos.x}
          cy={pos.y}
          r={GAME_CONFIG.BALL_RADIUS * trailScale}
          fill={color}
          opacity={opacity}
          filter="url(#glow)"
        />
      );
    });
  };

  return (
    <g>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Traînée */}
      {renderTrail()}

      {/* Balle principale */}
      <g transform={`translate(${position.x}, ${position.y}) scale(${scale})`}>
        <circle r={GAME_CONFIG.BALL_RADIUS} fill={color} filter="url(#glow)" />
        <text
          fill={GAME_CONFIG.COLORS.TEXT_PRIMARY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={GAME_CONFIG.BALL_RADIUS * 0.8}
          fontWeight="bold"
          style={{
            textTransform: "uppercase",
            fontFamily: "system-ui",
          }}
        >
          {type}
        </text>
      </g>
    </g>
  );
};

export default Ball;
