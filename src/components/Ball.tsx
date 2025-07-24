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

  // FIX: Calculer l'angle de rotation basé sur la vélocité pour que le texte suive le mouvement
  const rotationAngle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);

  // FIX: Traînée optimisée avec ligne continue au lieu de cercles discrets
  const renderTrail = () => {
    if (trail.length < 2) return null;

    // Créer un chemin SVG pour une traînée fluide
    const pathData = trail.reduce((path, pos, index) => {
      if (index === 0) {
        return `M ${pos.x} ${pos.y}`;
      }
      return `${path} L ${pos.x} ${pos.y}`;
    }, "");

    // Gradient pour la traînée
    const gradientId = `trail-gradient-${type}`;
    
    return (
      <g>
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="50%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={`trail-blur-${type}`}>
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path
          d={pathData}
          stroke={`url(#${gradientId})`}
          strokeWidth={GAME_CONFIG.BALL_RADIUS * 0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={`url(#trail-blur-${type})`}
        />
        {/* Traînée additionnelle plus fine pour plus d'effet */}
        <path
          d={pathData}
          stroke={color}
          strokeWidth={GAME_CONFIG.BALL_RADIUS * 0.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.4}
        />
      </g>
    );
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
        
        {/* FIX: Texte qui tourne avec la direction du mouvement */}
        <g transform={`rotate(${rotationAngle})`}>
          <text
            fill={GAME_CONFIG.COLORS.TEXT_PRIMARY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={GAME_CONFIG.BALL_RADIUS * 0.6}
            fontWeight="bold"
            style={{
              textTransform: "uppercase",
              fontFamily: "system-ui",
              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            {type}
          </text>
        </g>
      </g>
    </g>
  );
};

export default Ball;
