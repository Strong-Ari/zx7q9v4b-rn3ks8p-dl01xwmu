import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { GAME_CONFIG } from "../constants/game";

interface WinnerAnimationProps {
  winner: "yes" | "no";
  yesScore: number;
  noScore: number;
}

export const WinnerAnimation: React.FC<WinnerAnimationProps> = ({
  winner,
  yesScore,
  noScore,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation de l'opacité du fond
  const backgroundOpacity = spring({
    frame,
    fps,
    config: {
      damping: 200,
      mass: 0.5,
    },
  });

  // Animation du texte
  const textScale = spring({
    frame,
    fps,
    config: {
      damping: 100,
      mass: 0.8,
    },
  });

  // Animation de rotation
  const rotation = interpolate(
    frame,
    [0, GAME_CONFIG.WINNER_ANIMATION_DURATION],
    [0, 360],
    {
      extrapolateRight: "clamp",
    },
  );

  // Couleur du gagnant
  const winnerColor =
    winner === "yes" ? GAME_CONFIG.COLORS.YES_BALL : GAME_CONFIG.COLORS.NO_BALL;

  // Animation de particules
  const particles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i * 360) / 20;
    const delay = i * 2;
    const particleProgress = spring({
      frame: frame - delay,
      fps,
      config: {
        damping: 200,
        mass: 0.5,
      },
    });

    const distance = interpolate(particleProgress, [0, 1], [0, 150]);
    const x = distance * Math.cos((angle * Math.PI) / 180);
    const y = distance * Math.sin((angle * Math.PI) / 180);
    const opacity = interpolate(particleProgress, [0, 0.7, 1], [1, 1, 0]);
    const size = interpolate(particleProgress, [0, 1], [10, 5]);

    return { x, y, opacity, size };
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `rgba(0,0,0,${backgroundOpacity * 0.9})`,
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Particules */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {particles.map((particle, i) => (
          <circle
            key={i}
            cx={GAME_CONFIG.VIDEO_WIDTH / 2 + particle.x}
            cy={GAME_CONFIG.VIDEO_HEIGHT / 2 + particle.y}
            r={particle.size}
            fill={winnerColor}
            opacity={particle.opacity}
          />
        ))}
      </svg>

      {/* Texte du gagnant */}
      <div
        style={{
          transform: `scale(${textScale}) rotate(${rotation}deg)`,
          color: winnerColor,
          fontSize: "8rem",
          fontWeight: "bold",
          textAlign: "center",
          fontFamily: "system-ui",
          textShadow: `0 0 20px ${winnerColor}`,
          marginBottom: "2rem",
        }}
      >
        {winner.toUpperCase()}
      </div>

      {/* Score final */}
      <div
        style={{
          fontSize: "3rem",
          color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
          textAlign: "center",
          opacity: backgroundOpacity,
        }}
      >
        <span style={{ color: GAME_CONFIG.COLORS.YES_BALL }}>{yesScore}</span>
        {" - "}
        <span style={{ color: GAME_CONFIG.COLORS.NO_BALL }}>{noScore}</span>
      </div>

      {/* Message final */}
      <div
        style={{
          fontSize: "2rem",
          color: GAME_CONFIG.COLORS.TEXT_SECONDARY,
          marginTop: "2rem",
          opacity: backgroundOpacity,
          textAlign: "center",
        }}
      >
        {winner === "yes"
          ? "There's definitely something there! 💚"
          : "Maybe next time... 💔"}
      </div>
    </div>
  );
};

export default WinnerAnimation;
