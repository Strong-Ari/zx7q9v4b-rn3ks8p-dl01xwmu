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
  radius: number;
}

export const Ball: React.FC<BallProps> = ({
  type,
  position,
  velocity,
  trail,
  radius,
}) => {
  const frame = useCurrentFrame();

  // Couleur de la balle selon le type
  const color =
    type === "yes" ? GAME_CONFIG.COLORS.YES_BALL : GAME_CONFIG.COLORS.NO_BALL;

  // FIX: Animation de pulsation plus subtile pour réduire les saccades
  const scale = interpolate(
    Math.sin(frame * 0.05), // Fréquence réduite de moitié
    [-1, 1],
    [0.98, 1.02], // Amplitude réduite
  );

  // FIX: Traînée optimisée - réduire le nombre d'éléments pour de meilleures performances
  const renderTrail = () => {
    if (trail.length < 2) return null;

    // Limiter le nombre d'éléments de traînée pour les performances
    const maxTrailElements = 8;
    const step = Math.max(1, Math.floor(trail.length / maxTrailElements));

    return trail
      .filter((_, index) => index % step === 0)
      .map((pos, index, filteredTrail) => {
        const progress =
          filteredTrail.length > 1 ? index / (filteredTrail.length - 1) : 0;
        const opacity = interpolate(progress, [0, 1], [0.5, 0]); // Réduire l'opacité max
        const trailScale = interpolate(progress, [0, 1], [0.7, 0.2]); // Réduire la taille

        return (
          <circle
            key={`trail-${index}`}
            cx={pos.x}
            cy={pos.y}
            r={GAME_CONFIG.BALL_RADIUS * trailScale}
            fill={color}
            opacity={opacity}
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
        <circle r={radius} fill={color} filter="url(#glow)" />
        <text
          fill={GAME_CONFIG.COLORS.TEXT_PRIMARY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={radius * 0.8}
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
