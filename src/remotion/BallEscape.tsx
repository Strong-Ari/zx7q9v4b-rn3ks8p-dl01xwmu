import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  random,
  Audio,
} from "remotion";
import { GAME_CONFIG } from "../constants/game";
import { useMemo } from "react";
import { Ball } from "../components/Ball";
import { SemiCircle } from "../components/SemiCircle";
import { Scoreboard, Timer } from "../components/UI";
import { TikTokComment } from "./TikTokComment/TikTokComment";
import { useMidiPlayer } from "../hooks/useMidiPlayer";
import { usePhysics } from "../hooks/usePhysics";
import { useDynamicCircles } from "../hooks/useDynamicCircles";

export const BallEscape: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const midiPlayer = useMidiPlayer();
  const { playCollisionSound } = midiPlayer;

  // Calculer le temps écoulé en secondes
  const timeElapsed = frame / fps;
  const timeLeft = Math.max(0, GAME_CONFIG.DURATION_IN_SECONDS - timeElapsed);

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

  // Mémoïser les gaps et rotations pour chaque cercle dynamique
  const gapDataById = useMemo(() => {
    const data: Record<number, { gapAngle: number; gapRotation: number }> = {};
    for (let i = 0; i < GAME_CONFIG.SPIRAL_DENSITY; i++) {
      data[i] = {
        gapAngle:
          GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE +
          random(`circle-gap-${i}`) *
            (GAME_CONFIG.CIRCLE_GAP_MAX_ANGLE -
              GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE),
        gapRotation: random(`circle-rotation-${i}`) * 360,
      };
    }
    return data;
  }, []);

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
            physicsCircle?.gapAngle ?? gapDataById[circle.id]?.gapAngle;
          const gapRotation =
            physicsCircle?.gapRotation ?? gapDataById[circle.id]?.gapRotation;

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

      <Audio loop src={staticFile("music.wav")} />
      {/* Note: L'audio MIDI est géré par Tone.js dans le navigateur
          et sera audible dans le studio et potentiellement dans le rendu
          selon les capacités du navigateur */}
    </AbsoluteFill>
  );
};

export default BallEscape;
