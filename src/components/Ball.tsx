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

  // FIX: Interpolation de position fluide pour réduire les saccades
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  const normalizedSpeed = Math.min(speed / GAME_CONFIG.BALL_MAX_SPEED, 1);

  // FIX: Animation de pulsation basée sur la vitesse pour plus de dynamisme
  const basePulse = interpolate(
    Math.sin(frame * 0.08), // Fréquence légèrement augmentée
    [-1, 1],
    [0.96, 1.04], // Amplitude légèrement augmentée
  );
  
  // FIX: Pulsation additionnelle basée sur la vitesse
  const speedPulse = 1 + normalizedSpeed * 0.05; // Jusqu'à 5% de pulsation supplémentaire
  const scale = basePulse * speedPulse;

  // FIX: Position interpolée pour plus de fluidité (micro-interpolation)
  const smoothPosition = {
    x: position.x + velocity.x * 0.1, // Légère prédiction de mouvement
    y: position.y + velocity.y * 0.1,
  };

  // FIX: Traînée optimisée avec interpolation douce
  const renderTrail = () => {
    if (trail.length < 2) return null;

    // FIX: Adapter le nombre d'éléments de traînée selon la vitesse
    const baseTrailElements = 6;
    const speedBonus = Math.floor(normalizedSpeed * 4); // Jusqu'à 4 éléments supplémentaires
    const maxTrailElements = baseTrailElements + speedBonus;
    
    const step = Math.max(1, Math.floor(trail.length / maxTrailElements));

    return trail
      .filter((_, index) => index % step === 0)
      .map((pos, index, filteredTrail) => {
        const progress =
          filteredTrail.length > 1 ? index / (filteredTrail.length - 1) : 0;
        
        // FIX: Opacité et taille basées sur la vitesse et la position
        const baseOpacity = 0.4 + normalizedSpeed * 0.3; // Plus de traînée quand c'est rapide
        const opacity = interpolate(progress, [0, 1], [baseOpacity, 0]);
        const trailScale = interpolate(progress, [0, 1], [0.8 + normalizedSpeed * 0.2, 0.1]);

        // FIX: Couleur de traînée avec gradient vers le blanc pour plus d'effet
        const trailColor = progress > 0.7 
          ? interpolate(progress, [0.7, 1], [color, "#ffffff"])
          : color;

        return (
          <circle
            key={`trail-${index}`}
            cx={pos.x}
            cy={pos.y}
            r={GAME_CONFIG.BALL_RADIUS * trailScale}
            fill={trailColor}
            opacity={opacity}
          />
        );
      });
  };

  // FIX: Effet de glow dynamique basé sur la vitesse
  const glowIntensity = 1.5 + normalizedSpeed * 2; // Plus de glow quand c'est rapide

  return (
    <g>
      <defs>
        <filter id={`glow-${type}`}>
          <feGaussianBlur stdDeviation={glowIntensity} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* FIX: Gradient radial pour effet 3D */}
        <radialGradient id={`ball-gradient-${type}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor={`${color}CC`} />
          <stop offset="70%" stopColor={color} />
          <stop offset="100%" stopColor={`${color}AA`} />
        </radialGradient>
      </defs>

      {/* Traînée */}
      {renderTrail()}

      {/* Balle principale */}
      <g transform={`translate(${smoothPosition.x}, ${smoothPosition.y}) scale(${scale})`}>
        {/* FIX: Ombre portée pour plus de profondeur */}
        <circle 
          r={GAME_CONFIG.BALL_RADIUS * 0.9} 
          cx={2} 
          cy={2} 
          fill="rgba(0,0,0,0.3)" 
        />
        {/* Balle avec gradient */}
        <circle 
          r={GAME_CONFIG.BALL_RADIUS} 
          fill={`url(#ball-gradient-${type})`} 
          filter={`url(#glow-${type})`} 
        />
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
