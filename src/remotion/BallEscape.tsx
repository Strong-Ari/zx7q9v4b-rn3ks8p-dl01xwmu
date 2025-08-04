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
import { useMidiPlayer } from "../hooks/useMidiPlayer";
import { usePhysics } from "../hooks/usePhysics";
import { useDynamicCircles } from "../hooks/useDynamicCircles";

export const BallEscape: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const midiPlayer = useMidiPlayer();
  const { playCollisionSound, forceReinitAudio, playMusicAtFrame, startBackgroundMusic } = midiPlayer;
  const [audioReady, setAudioReady] = useState(false);
  const [backgroundMusicStarted, setBackgroundMusicStarted] = useState(false);

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

  // Démarrage de la musique MIDI de fond
  useEffect(() => {
    if (isAudioReady && midiPlayer.isInitialized && !backgroundMusicStarted) {
      console.log("[BallEscape] 🎵 Démarrage de la musique MIDI de fond...");
      startBackgroundMusic();
      setBackgroundMusicStarted(true);
    }
  }, [isAudioReady, midiPlayer.isInitialized, backgroundMusicStarted, startBackgroundMusic]);

  // Synchronisation continue de la lecture MIDI avec les frames
  useEffect(() => {
    if (backgroundMusicStarted && midiPlayer.isInitialized && frame > 0) {
      // Jouer la musique MIDI synchronisée avec le timing exact des frames
      playMusicAtFrame(frame, fps);
    }
  }, [frame, backgroundMusicStarted, midiPlayer.isInitialized, playMusicAtFrame, fps]);

  // Utiliser le moteur physique
  const gameState = usePhysics(playCollisionSound);

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
      {/* Overlay d'initialisation audio */}
      {/* <AudioInitOverlay
        isVisible={!isAudioReady}
        onAudioReady={handleAudioReady}
      /> */}
      
      {/* Affichage des informations MIDI pour debug */}
      {midiPlayer.currentMidiFile && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            color: "white",
            fontSize: 12,
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: "5px 10px",
            borderRadius: 5,
            zIndex: 1000,
          }}
        >
          🎵 {midiPlayer.currentMidiFile}
        </div>
      )}

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

      {/* Note: L'audio MIDI est géré par Tone.js dans le navigateur
          et sera audible dans le studio et potentiellement dans le rendu
          selon les capacités du navigateur */}
    </AbsoluteFill>
  );
};

export default BallEscape;
