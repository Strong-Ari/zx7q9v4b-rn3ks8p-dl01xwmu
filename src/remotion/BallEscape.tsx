import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  random,
  Audio,
} from "remotion";
import { GAME_CONFIG } from "../constants/game";
import { useMemo, useEffect, useCallback } from "react";
import { Ball } from "../components/Ball";
import { SemiCircle } from "../components/SemiCircle";
import { Scoreboard, Timer } from "../components/UI";
import { TikTokComment } from "./TikTokComment/TikTokComment";
import { WinnerAnimation } from "../components/WinnerAnimation";
import { usePhysics } from "../hooks/usePhysics";
import { useDynamicCircles } from "../hooks/useDynamicCircles";
import { audioService } from "../services/audioService";

export const BallEscape: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculer le temps écoulé en secondes
  const timeElapsed = frame / fps;
  const timeLeft = Math.max(0, GAME_CONFIG.DURATION_IN_SECONDS - timeElapsed);

  // Sélectionner un fichier MIDI aléatoire pour la musique de fond
  const selectedMidiFile = useMemo(() => {
    const midiFiles = [
      "AfterDark.mid",
      "BoMoonlightN12.mid", 
      "BoMoonlightTungstenFilament.mid",
      "DespacitoPiano.mid",
      "FawltyTowers.mid",
      "Flowers.mid",
      "HotelCalifornia.mid",
      "Hunter x Hunter 2011 - Departure!.mid",
      "IllBeGone.mid",
      "JamboreeMladenFranko&HisOrchestra.mid",
      "PinkPanther.mid",
      "Pirates of the Caribbean - He's a Pirate (1) (1).mid",
      "Super Mario 64 - Medley (1).mid",
      "Titantic.mid",
      "Tokyo Ghoul - Unravel.mid",
      "Under-The-Sea-(From-'The-Little-Mermaid')-1.mid"
    ];
    
    // Utiliser un seed basé sur le nom du fichier pour une sélection déterministe
    const seed = "ball-escape-midi";
    const randomIndex = Math.floor(random(seed) * midiFiles.length);
    return midiFiles[randomIndex];
  }, []);

  // Fonction pour les sons de collision avec le nouveau service audio
  const playCollisionSound = useCallback(async (type: "BALL_CIRCLE" | "BALL_BALL") => {
    try {
      await audioService.playCollisionSound(type);
    } catch (error) {
      console.warn("Erreur lors de la lecture du son de collision:", error);
    }
  }, []);

  // Utiliser le moteur physique
  const gameState = usePhysics(playCollisionSound);

  // Hook pour gérer les cercles dynamiques (apparition + rétrécissement)
  const dynamicCircles = useDynamicCircles({
    frame,
    fps,
    shrinkSpeed: 10, // px/sec (encore plus lent pour plus d'opportunités)
    interval: 0.5, // secondes entre chaque cercle (réduit pour plus de rings au début)
    maxCircles: GAME_CONFIG.SPIRAL_DENSITY,
  });

  // Utiliser les cercles dynamiques au lieu des statiques
  const circles = dynamicCircles;

  // Calculer les positions des balles avec traînées
  const ballPositions = useMemo(() => {
    return {
      yesBall: gameState.yesBall,
      noBall: gameState.noBall,
    };
  }, [gameState.yesBall, gameState.noBall]);

  // Déterminer le gagnant
  const winner = useMemo(() => {
    if (timeLeft <= 0) {
      if (gameState.scores.yes > gameState.scores.no) return "yes";
      if (gameState.scores.no > gameState.scores.yes) return "no";
      return "tie";
    }
    return null;
  }, [timeLeft, gameState.scores]);

  // Nettoyer les ressources audio au démontage
  useEffect(() => {
    return () => {
      audioService.cleanup();
    };
  }, []);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Musique de fond MIDI */}
      <Audio
        src={staticFile(`midis/${selectedMidiFile}`)}
        volume={0.3}
        startFrom={0}
        endAt={GAME_CONFIG.DURATION_IN_SECONDS * fps}
      />

      {/* Cercles avec gaps */}
      {circles.map((circle) => (
        <SemiCircle
          key={circle.id}
          radius={circle.radius}
          strokeWidth={GAME_CONFIG.CIRCLE_STROKE_WIDTH}
          gapAngle={circle.gapAngle}
          rotation={circle.gapRotation}
          color={
            circle.isExploding
              ? circle.explosionColor
              : GAME_CONFIG.COLORS.CIRCLE_COLOR
          }
          isExploding={circle.isExploding}
        />
      ))}

      {/* Balles */}
      <Ball
        position={ballPositions.yesBall.position}
        color={GAME_CONFIG.COLORS.YES_BALL}
        radius={GAME_CONFIG.BALL_RADIUS}
        trail={ballPositions.yesBall.trail}
      />
      <Ball
        position={ballPositions.noBall.position}
        color={GAME_CONFIG.COLORS.NO_BALL}
        radius={GAME_CONFIG.BALL_RADIUS}
        trail={ballPositions.noBall.trail}
      />

      {/* Interface utilisateur */}
      <TikTokComment text={GAME_CONFIG.COMMENT_TEXT} />
      <Scoreboard scores={gameState.scores} />
      <Timer timeLeft={timeLeft} />

      {/* Animation de victoire */}
      {winner && <WinnerAnimation winner={winner} />}
    </AbsoluteFill>
  );
};

export default BallEscape;
