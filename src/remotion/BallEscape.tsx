import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  random,
} from "remotion";
import { GAME_CONFIG } from "../constants/game";
import { useMemo, useEffect, useState, useCallback } from "react";
import { Ball } from "../components/Ball";
import { SemiCircle } from "../components/SemiCircle";
import { Scoreboard, Timer } from "../components/UI";
import { TikTokComment } from "./TikTokComment/TikTokComment";
import { WinnerAnimation } from "../components/WinnerAnimation";
import { AudioInitOverlay } from "../components/AudioInitOverlay";
import { AudioSystem, useAudioTriggers } from "../components/AudioSystem";
import { useMidiPlayer } from "../hooks/useMidiPlayer";
import { usePhysics } from "../hooks/usePhysics";
import { useDynamicCircles } from "../hooks/useDynamicCircles";

export const BallEscape: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const midiPlayer = useMidiPlayer();
  const { playCollisionSound, forceReinitAudio } = midiPlayer;
  const [audioReady, setAudioReady] = useState(false);

  // Nouveau système audio pour le rendu
  const audioTriggers = useAudioTriggers();
  const [lastCollisionFrame, setLastCollisionFrame] = useState(-1);
  const [lastSuccessFrame, setLastSuccessFrame] = useState(-1);

  // Gestion de l'initialisation audio
  const handleAudioReady = useCallback(async () => {
    console.log("[BallEscape] Initialisation audio demandée...");
    await forceReinitAudio();
    setAudioReady(true);
  }, [forceReinitAudio]);

  // Vérifier si l'audio est prêt
  const isAudioReady = audioReady || midiPlayer.audioStatus.isActive;

  // Calculer le temps écoulé en secondes
  const timeElapsed = frame / fps;
  const timeLeft = Math.max(0, GAME_CONFIG.DURATION_IN_SECONDS - timeElapsed);

  // Utiliser le moteur physique avec callback pour les SFX
  const handleCollisionSound = useCallback(() => {
    // Éviter les déclenchements multiples sur la même frame
    if (frame !== lastCollisionFrame) {
      audioTriggers.triggerCollision();
      setLastCollisionFrame(frame);
    }
    
    // Garder aussi l'ancien système pour le studio
    playCollisionSound();
  }, [audioTriggers, frame, lastCollisionFrame, playCollisionSound]);

  const gameState = usePhysics(handleCollisionSound);

  // Hook pour gérer les cercles dynamiques (apparition + rétrécissement)
  const dynamicCircles = useDynamicCircles({
    frame,
    fps,
    shrinkSpeed: 10, // px/sec (encore plus lent pour plus d'opportunités)
    interval: 0.5, // secondes entre chaque cercle (réduit pour plus de rings au début)
    maxCircles: GAME_CONFIG.SPIRAL_DENSITY,
    minRadius: GAME_CONFIG.MIN_CIRCLE_RADIUS,
    maxRadius: GAME_CONFIG.MAX_CIRCLE_RADIUS,
    initialCircles: 8, // 8 cercles dès le début pour plus d'action immédiate
    minShrinkRadius: 250, // Rayon minimum ajusté pour un bon équilibre
  });

  // Déterminer le gagnant et déclencher le son de succès
  const winner = useMemo(() => {
    if (!gameState.scores || timeLeft > 0) return null;
    const winnerResult = gameState.scores.yes > gameState.scores.no ? "yes" : "no";
    
    // Déclencher le son de succès une seule fois
    if (winnerResult && frame !== lastSuccessFrame) {
      audioTriggers.triggerSuccess();
      setLastSuccessFrame(frame);
    }
    
    return winnerResult;
  }, [gameState.scores, timeLeft, audioTriggers, frame, lastSuccessFrame]);

  // Utiliser staticFile pour charger l'image dans Remotion Studio
  const commentImagePath = staticFile("tiktok-comment-current.png");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
      }}
    >
      {/* Overlay d'initialisation audio */}
      {/* <AudioInitOverlay
        isVisible={!isAudioReady}
        onAudioReady={handleAudioReady}
      /> */}
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
        {/* Cercles dynamiques */}
        {dynamicCircles.map((circle) => {
          // Utiliser les mêmes gaps que la physique pour la synchronisation
          const physicsCircle = gameState.circles[circle.id];
          const gapAngle =
            physicsCircle?.gapAngle ||
            GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE +
              random(`circle-gap-${circle.id}`) *
                (GAME_CONFIG.CIRCLE_GAP_MAX_ANGLE -
                  GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE);
          const gapRotation =
            physicsCircle?.gapRotation ||
            random(`circle-rotation-${circle.id}`) * 360;

          return (
            <SemiCircle
              key={circle.id}
              radius={circle.radius}
              gapAngle={gapAngle}
              gapRotation={gapRotation}
              isExploding={physicsCircle?.isExploding}
              explosionColor={physicsCircle?.explosionColor}
              baseRotation={(circle.id * 360) / GAME_CONFIG.SPIRAL_DENSITY}
            />
          );
        })}

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

      {/* Système audio pour le rendu Remotion */}
      <AudioSystem
        onCollision={audioTriggers.triggers.collision}
        onBallCollision={audioTriggers.triggers.ballCollision}
        onGapPass={audioTriggers.triggers.gapPass}
        onSuccess={audioTriggers.triggers.success}
        musicVolume={0.6}
        sfxVolume={0.8}
        showDebugInfo={false} // Mettre à true pour debug
      />

      {/* Note: L'audio MIDI est géré par Tone.js dans le navigateur (studio)
          et par le composant AudioSystem pour le rendu */}
    </AbsoluteFill>
  );
};

export default BallEscape;
