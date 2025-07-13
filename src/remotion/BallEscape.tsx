import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { GAME_CONFIG } from "../constants/game";
import { useMemo } from "react";
import { Ball } from "../components/Ball";
import { SemiCircle } from "../components/SemiCircle";
import { Comment, Scoreboard, Timer } from "../components/UI";
import { WinnerAnimation } from "../components/WinnerAnimation";
import { useMidiPlayer } from "../hooks/useMidiPlayer";
import { usePhysics } from "../hooks/usePhysics";

export const BallEscape: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { playCollisionSound } = useMidiPlayer();

  // Calculer le temps écoulé en secondes
  const timeElapsed = frame / fps;
  const timeLeft = Math.max(0, GAME_CONFIG.DURATION_IN_SECONDS - timeElapsed);

  // Utiliser le moteur physique
  const gameState = usePhysics(playCollisionSound);

  // Déterminer le gagnant
  const winner = useMemo(() => {
    if (!gameState.scores || timeLeft > 0) return null;
    return gameState.scores.yes > gameState.scores.no ? "yes" : "no";
  }, [gameState.scores, timeLeft]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
      }}
    >
      {/* Interface utilisateur */}
      <Comment />
      <Scoreboard
        yesScore={gameState.scores.yes}
        noScore={gameState.scores.no}
      />
      <Timer timeLeft={timeLeft} />

      {/* Zone de jeu */}
      <svg width="100%" height="100%">
        {/* Cercles */}
        {gameState.circles.map((circle) => (
          <SemiCircle
            key={circle.id}
            radius={
              GAME_CONFIG.MIN_CIRCLE_RADIUS +
              (circle.id *
                (GAME_CONFIG.MAX_CIRCLE_RADIUS -
                  GAME_CONFIG.MIN_CIRCLE_RADIUS)) /
                GAME_CONFIG.SPIRAL_DENSITY
            }
            gapAngle={
              GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE +
              Math.random() *
                (GAME_CONFIG.CIRCLE_GAP_MAX_ANGLE -
                  GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE)
            }
            gapRotation={Math.random() * 360}
            isExploding={circle.isExploding}
            explosionColor={circle.explosionColor}
            baseRotation={(circle.id * 360) / GAME_CONFIG.SPIRAL_DENSITY}
          />
        ))}

        {/* Balles */}
        <Ball
          type="yes"
          position={gameState.yesBall.position}
          velocity={gameState.yesBall.velocity}
          trail={gameState.yesBall.trail}
        />
        <Ball
          type="no"
          position={gameState.noBall.position}
          velocity={gameState.noBall.velocity}
          trail={gameState.noBall.trail}
        />
      </svg>

      {/* Animation du gagnant */}
      {winner && (
        <WinnerAnimation
          winner={winner}
          yesScore={gameState.scores.yes}
          noScore={gameState.scores.no}
        />
      )}
    </AbsoluteFill>
  );
};

export default BallEscape;
