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

  // FIX: Animation de pulsation plus subtile pour réduire les saccades
  const scale = interpolate(
    Math.sin(frame * 0.05), // Fréquence réduite de moitié
    [-1, 1],
    [0.98, 1.02], // Amplitude réduite
  );

  // FIX: Traînée optimisée - réduire le nombre d'éléments pour de meilleures performances
  const renderTrail = () => {
    if (trail.length < 2) return null;

    // Limiter le nombre d'éléments de traînée pour les performances d'export
    const maxTrailElements = 6; // Réduit encore plus pour l'export
    const step = Math.max(1, Math.floor(trail.length / maxTrailElements));

    return trail
      .filter((_, index) => index % step === 0)
      .map((pos, index, filteredTrail) => {
        const progress =
          filteredTrail.length > 1 ? index / (filteredTrail.length - 1) : 0;
        const opacity = interpolate(progress, [0, 1], [0.4, 0]); // Réduire encore l'opacité
        const trailScale = interpolate(progress, [0, 1], [0.6, 0.2]); // Réduire la taille

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
      {/* FIX: Supprimer le filtre glow pour de meilleures performances d'export */}
      
      {/* Traînée */}
      {renderTrail()}

      {/* Balle principale */}
      <g transform={`translate(${position.x}, ${position.y}) scale(${scale})`}>
        {/* FIX: Gradient radial simple au lieu du filtre glow pour les performances */}
        <defs>
          <radialGradient id={`ballGradient-${type}`} cx="30%" cy="30%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="70%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </radialGradient>
        </defs>
        
        <circle 
          r={GAME_CONFIG.BALL_RADIUS} 
          fill={`url(#ballGradient-${type})`}
          stroke={color}
          strokeWidth="1"
        />
        <text
          fill={GAME_CONFIG.COLORS.TEXT_PRIMARY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={GAME_CONFIG.BALL_RADIUS * 0.7} // Légèrement plus petit pour de meilleures performances
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
