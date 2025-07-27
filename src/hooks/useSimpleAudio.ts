import { useCallback, useEffect, useState } from "react";
import { simpleAudioPlayer } from "../services/simpleAudioPlayer";

type CollisionType = "BALL_CIRCLE" | "BALL_BALL";

interface SimpleAudioState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useSimpleAudio = () => {
  const [state, setState] = useState<SimpleAudioState>({
    isInitialized: false,
    isLoading: false,
    error: null,
  });

  /**
   * Initialise le système audio
   */
  const initAudio = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log("[useSimpleAudio] Initialisation du système audio...");
      
      const success = await simpleAudioPlayer.initAudio();
      
      if (success) {
        setState((prev) => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          error: null,
        }));
        console.log("[useSimpleAudio] Système audio initialisé avec succès");
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Impossible d'initialiser l'audio",
        }));
        console.log("[useSimpleAudio] Échec de l'initialisation audio");
      }
    } catch (error) {
      console.error("[useSimpleAudio] Erreur lors de l'initialisation:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }));
    }
  }, []);

  /**
   * Joue un son de collision
   */
  const playCollisionSound = useCallback((type: CollisionType): void => {
    if (!state.isInitialized) {
      console.log("[useSimpleAudio] Audio non initialisé, son ignoré");
      return;
    }

    try {
      if (type === "BALL_CIRCLE") {
        simpleAudioPlayer.playBallCircleSound();
      } else if (type === "BALL_BALL") {
        simpleAudioPlayer.playBallBallSound();
      }
      
      console.log(`[useSimpleAudio] Son de collision ${type} joué`);
    } catch (error) {
      console.error("[useSimpleAudio] Erreur lors de la lecture du son:", error);
    }
  }, [state.isInitialized]);

  /**
   * Joue une fréquence spécifique
   */
  const playFrequency = useCallback((frequency: number, duration: number = 0.2): void => {
    if (!state.isInitialized) {
      console.log("[useSimpleAudio] Audio non initialisé, fréquence ignorée");
      return;
    }

    try {
      simpleAudioPlayer.playFrequency(frequency, duration);
      console.log(`[useSimpleAudio] Fréquence ${frequency}Hz jouée`);
    } catch (error) {
      console.error("[useSimpleAudio] Erreur lors de la lecture de la fréquence:", error);
    }
  }, [state.isInitialized]);

  /**
   * Arrête tous les sons
   */
  const stopAllSounds = useCallback((): void => {
    simpleAudioPlayer.stopAllNotes();
    console.log("[useSimpleAudio] Tous les sons arrêtés");
  }, []);

  /**
   * Nettoie les ressources au démontage
   */
  useEffect(() => {
    return () => {
      simpleAudioPlayer.cleanup();
      console.log("[useSimpleAudio] Ressources nettoyées");
    };
  }, []);

  // Auto-initialisation si pas encore fait
  useEffect(() => {
    if (!state.isInitialized && !state.isLoading) {
      initAudio();
    }
  }, [state.isInitialized, state.isLoading, initAudio]);

  return {
    // Fonctions principales
    playCollisionSound,
    playFrequency,
    stopAllSounds,
    initAudio,

    // État
    ...state,

    // Utilitaires
    audioStatus: simpleAudioPlayer.getStatus(),
  };
};

export default useSimpleAudio;