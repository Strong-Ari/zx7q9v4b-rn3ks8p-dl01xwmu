import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { GAME_CONFIG } from "../constants/game";
import { useMemo } from "react";
import { Ball } from "../components/Ball";
import { SemiCircle } from "../components/SemiCircle";
import { Scoreboard, Timer } from "../components/UI";
import { TikTokComment } from "./TikTokComment/TikTokComment";
import { WinnerAnimation } from "../components/WinnerAnimation";
import { useMidiPlayer } from "../hooks/useMidiPlayer";
import { useBakedPhysics, useBakedCircleData } from "../hooks/useBakedPhysics";
import type { SimulationData } from "../../types/simulation";

interface BallEscapeOptimizedProps {
  simulationData: SimulationData;
}

/**
 * 🚀 VERSION OPTIMISÉE avec physique précalculée
 * 
 * Cette version utilise les données précalculées au lieu de Matter.js en temps réel.
 * Résultat: Export fluide, cohérent, sans surcharge CPU/RAM.
 */
export const BallEscapeOptimized: React.FC<BallEscapeOptimizedProps> = ({
  simulationData,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { playCollisionSound } = useMidiPlayer();

  // Calculer le temps écoulé en secondes
  const timeElapsed = frame / fps;
  const timeLeft = Math.max(0, GAME_CONFIG.DURATION_IN_SECONDS - timeElapsed);

  // ✅ NOUVEAU: Utiliser les données précalculées au lieu de la physique en temps réel
  const gameState = useBakedPhysics(simulationData, playCollisionSound);
  const circleData = useBakedCircleData(simulationData);

  // Déterminer le gagnant
  const winner = useMemo(() => {
    if (!gameState.scores || timeLeft > 0) return null;
    return gameState.scores.yes > gameState.scores.no ? "yes" : "no";
  }, [gameState.scores, timeLeft]);

  // Utiliser staticFile pour charger l'image dans Remotion Studio
  const commentImagePath = staticFile("tiktok-comment-current.png");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
      }}
    >
      {/* Interface utilisateur */}
      <TikTokComment
        imagePath={commentImagePath}
        x={0.1}
        y={0.04}
        scale={0.9}
        startFrame={0}
        animationType="bounceIn"
        animationDuration={20}
      />
      <Scoreboard
        yesScore={gameState.scores.yes}
        noScore={gameState.scores.no}
      />
      <Timer timeLeft={timeLeft} />

      {/* Zone de jeu */}
      <svg width="100%" height="100%">
        {/* ✅ OPTIMISÉ: Cercles utilisant les données précalculées */}
        {circleData.map((circle) => (
          <SemiCircle
            key={circle.id}
            radius={circle.radius}
            gapAngle={circle.gapAngle}
            gapRotation={0} // Rotation gérée dans baseRotation
            isExploding={circle.isExploding}
            explosionColor={circle.explosionColor}
            baseRotation={circle.baseRotation}
          />
        ))}

        {/* ✅ OPTIMISÉ: Balles utilisant les positions précalculées */}
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

export default BallEscapeOptimized;