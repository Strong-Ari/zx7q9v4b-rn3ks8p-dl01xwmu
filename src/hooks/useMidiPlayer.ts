import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentFrame } from "remotion";
import { remotionAudioPlayer } from "../services/remotionAudioPlayer";

type CollisionType = "BALL_CIRCLE" | "BALL_BALL";

interface AudioState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useMidiPlayer = () => {
  const currentFrame = useCurrentFrame();
  const [state, setState] = useState<AudioState>({
    isInitialized: false,
    isLoading: false,
    error: null,
  });

  const initPromiseRef = useRef<Promise<void> | null>(null);

  /**
   * Initialise le système audio pour les collisions
   */
  const initAudio = useCallback(async (): Promise<void> => {
    // Éviter les initialisations multiples
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    initPromiseRef.current = (async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        console.log(
          "[useMidiPlayer] Initialisation du système audio pour les collisions...",
        );

        // Initialiser le lecteur audio Remotion
        const audioInitialized = await remotionAudioPlayer.initAudio();
        if (!audioInitialized) {
          console.log(
            "[useMidiPlayer] Audio désactivé - fonctionnement en mode silencieux",
          );
        }

        setState((prev) => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          error: null,
        }));

        console.log("[useMidiPlayer] Système audio initialisé avec succès");
      } catch (error) {
        console.error(
          "[useMidiPlayer] Erreur lors de l'initialisation:",
          error,
        );
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Erreur inconnue",
        }));
      }
    })();

    return initPromiseRef.current;
  }, []);

  /**
   * Joue un son pour une collision
   */
  const pentatonicFrequencies = [261.63, 293.66, 329.63, 392.0, 440.0]; // Do, Ré, Mi, Sol, La

  let ballCircleIndex = 0;
  let ballBallIndex = 0;

  const playCollisionSound = useCallback((type: CollisionType): void => {
    if (type === "BALL_CIRCLE") {
      const freq =
        pentatonicFrequencies[ballCircleIndex % pentatonicFrequencies.length];
      remotionAudioPlayer.playFrequency(freq, 0.15, 0.7);
      ballCircleIndex++;
    } else if (type === "BALL_BALL") {
      const freq =
        pentatonicFrequencies[ballBallIndex % pentatonicFrequencies.length];
      remotionAudioPlayer.playFrequency(freq, 0.18, 0.8);
      ballBallIndex++;
    }
  }, []);

  /**
   * Force la réinitialisation audio (utile pour Remotion Studio)
   */
  const forceReinitAudio = useCallback(async (): Promise<void> => {
    console.log("[useMidiPlayer] Forçage de la réinitialisation audio...");
    const audioInitialized = await remotionAudioPlayer.forceReinit();
    if (audioInitialized) {
      console.log("[useMidiPlayer] Audio réinitialisé avec succès");
    }
  }, []);

  /**
   * Nettoie les ressources au démontage
   */
  useEffect(() => {
    return () => {
      remotionAudioPlayer.cleanup();
      console.log("[useMidiPlayer] Ressources nettoyées");
    };
  }, []);

  // Auto-initialisation si pas encore fait
  useEffect(() => {
    if (!state.isInitialized && !state.isLoading && !initPromiseRef.current) {
      // Délai pour s'assurer que Remotion Studio est prêt
      const timer = setTimeout(() => {
        initAudio();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [state.isInitialized, state.isLoading, initAudio]);

  // Initialisation forcée au montage du composant
  useEffect(() => {
    const forceInit = async () => {
      if (!state.isInitialized && !state.isLoading) {
        console.log("[useMidiPlayer] Initialisation forcée au montage...");
        await initAudio();
      }
    };

    forceInit();
  }, []); // Dépendances vides pour ne s'exécuter qu'au montage

  return {
    // Fonction principale
    playCollisionSound,
    forceReinitAudio,

    // État
    ...state,

    // Utilitaires
    audioStatus: remotionAudioPlayer.getAudioStats(),
  };
};

export default useMidiPlayer;
