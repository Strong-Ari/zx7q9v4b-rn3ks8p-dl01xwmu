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

  // Calculer la vitesse pour des effets dynamiques
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  const normalizedSpeed = Math.min(speed / GAME_CONFIG.BALL_MAX_SPEED, 1);

  // Animation de pulsation basée sur la vitesse
  const basePulse = Math.sin(frame * 0.15) * 0.1;
  const speedPulse = normalizedSpeed * 0.15;
  const scale = interpolate(
    basePulse + speedPulse,
    [-0.25, 0.25],
    [0.9, 1.15],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Effet de déformation basé sur la vitesse (stretch dans la direction du mouvement)
  const stretchFactor = 1 + normalizedSpeed * 0.3;
  const velocityAngle = Math.atan2(velocity.y, velocity.x);

  // Rendu de la traînée améliorée
  const renderTrail = () => {
    if (trail.length < 2) return null;

    return trail.map((pos, index) => {
      const progress = trail.length > 1 ? index / (trail.length - 1) : 0;
      
      // Opacité plus fluide
      const opacity = interpolate(
        progress,
        [0, 0.3, 1],
        [0.9, 0.4, 0],
        {
          easing: (t: number) => 1 - t * t, // Easing quadratique pour un fade plus naturel
        }
      );
      
      // Taille de la traînée plus fluide
      const trailScale = interpolate(
        progress,
        [0, 1],
        [0.95, 0.2],
        {
          easing: (t: number) => 1 - t * t * t, // Easing cubique pour une diminution plus naturelle
        }
      );

      // Couleur de la traînée avec un léger décalage vers le blanc
      const trailColor = interpolate(
        progress,
        [0, 1],
        [color, "#ffffff"],
        {
          colorSpace: "hsl",
        }
      );

      return (
        <circle
          key={index}
          cx={pos.x}
          cy={pos.y}
          r={GAME_CONFIG.BALL_RADIUS * trailScale}
          fill={trailColor}
          opacity={opacity}
          filter="url(#trail-glow)"
        />
      );
    });
  };

  // Intensité de l'éclat basée sur la vitesse
  const glowIntensity = 2 + normalizedSpeed * 4;

  return (
    <g>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={glowIntensity} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="trail-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <radialGradient id={`ball-gradient-${type}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="60%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.9" />
        </radialGradient>
      </defs>

      {/* Traînée */}
      {renderTrail()}

      {/* Balle principale avec effet de déformation */}
      <g 
        transform={`
          translate(${position.x}, ${position.y}) 
          rotate(${(velocityAngle * 180) / Math.PI})
          scale(${scale * stretchFactor}, ${scale})
          rotate(${-(velocityAngle * 180) / Math.PI})
        `}
      >
        {/* Ombre de la balle */}
        <circle 
          r={GAME_CONFIG.BALL_RADIUS} 
          fill={color} 
          opacity="0.3"
          transform="translate(2, 2)"
        />
        
        {/* Balle principale */}
        <circle 
          r={GAME_CONFIG.BALL_RADIUS} 
          fill={`url(#ball-gradient-${type})`} 
          filter="url(#glow)" 
        />
        
        {/* Texte avec amélioration */}
        <text
          fill={GAME_CONFIG.COLORS.TEXT_PRIMARY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={GAME_CONFIG.BALL_RADIUS * 0.7}
          fontWeight="bold"
          style={{
            textTransform: "uppercase",
            fontFamily: "system-ui",
            textShadow: "0 0 4px rgba(0,0,0,0.8)",
          }}
        >
          {type}
        </text>
      </g>

      {/* Effet de vitesse (particules) */}
      {normalizedSpeed > 0.5 && (
        <g opacity={normalizedSpeed}>
          {[...Array(3)].map((_, i) => {
            const particleAngle = velocityAngle + Math.PI + (i - 1) * 0.3;
            const particleDistance = 50 + i * 15;
            const particleX = position.x + Math.cos(particleAngle) * particleDistance;
            const particleY = position.y + Math.sin(particleAngle) * particleDistance;
            
            return (
              <circle
                key={i}
                cx={particleX}
                cy={particleY}
                r={2 + i}
                fill={color}
                opacity={0.6 - i * 0.2}
                filter="url(#trail-glow)"
              />
            );
          })}
        </g>
      )}
    </g>
  );
};

export default Ball;
