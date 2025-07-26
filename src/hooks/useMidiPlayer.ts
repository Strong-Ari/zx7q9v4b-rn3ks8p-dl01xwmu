import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentFrame } from "remotion";
import {
  midiService,
  ProcessedMidiData,
  MidiNote,
} from "../services/midiService";
import { remotionAudioPlayer } from "../services/remotionAudioPlayer";

type CollisionType = "BALL_CIRCLE" | "BALL_BALL";

interface MidiPlayerState {
  isInitialized: boolean;
  isLoading: boolean;
  currentMidiFile: string | null;
  currentNoteIndex: number;
  totalNotes: number;
  error: string | null;
  collisionFrames: number[];
  playedNotes: Array<{ note: MidiNote; frame: number }>;
  needsUserInteraction: boolean;
}

export const useMidiPlayer = () => {
  const currentFrame = useCurrentFrame();
  const [state, setState] = useState<MidiPlayerState>({
    isInitialized: false,
    isLoading: false,
    currentMidiFile: null,
    currentNoteIndex: 0,
    totalNotes: 0,
    error: null,
    collisionFrames: [],
    playedNotes: [],
    needsUserInteraction: false,
  });

  const midiDataRef = useRef<ProcessedMidiData | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  /**
   * Force l'activation de l'audio avec interaction utilisateur
   */
  const activateAudio = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[useMidiPlayer] Tentative d'activation audio utilisateur...");
      
      // Créer un contexte audio temporaire pour forcer l'activation
      if (typeof window !== "undefined") {
        const tempContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = tempContext.createOscillator();
        const gain = tempContext.createGain();
        
        source.connect(gain);
        gain.connect(tempContext.destination);
        gain.gain.value = 0; // Silencieux
        source.start();
        source.stop(tempContext.currentTime + 0.01);
        
        await tempContext.close();
      }

      // Maintenant initialiser Tone.js
      const success = await remotionAudioPlayer.initAudio();
      if (success) {
        setState(prev => ({ ...prev, needsUserInteraction: false }));
        console.log("[useMidiPlayer] Audio activé avec succès via interaction utilisateur");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("[useMidiPlayer] Erreur lors de l'activation audio:", error);
      return false;
    }
  }, []);

  /**
   * Initialise le système MIDI avec gestion améliorée des erreurs
   */
  const initMidi = useCallback(async (): Promise<void> => {
    // Éviter les initialisations multiples
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    initPromiseRef.current = (async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        console.log("[useMidiPlayer] 🎵 Initialisation du système MIDI...");

        // 1. Essayer d'initialiser l'audio
        let audioInitialized = false;
        try {
          audioInitialized = await remotionAudioPlayer.initAudio();
        } catch (audioError) {
          console.log("[useMidiPlayer] Erreur audio initiale:", audioError);
          // Continuer sans audio pour l'instant
        }

        if (!audioInitialized) {
          console.log("[useMidiPlayer] Audio nécessite une interaction utilisateur");
          setState(prev => ({ ...prev, needsUserInteraction: true }));
        }

        // 2. Sélectionner un fichier MIDI
        const selectedFile = midiService.selectRandomMidiFile();
        console.log(`[useMidiPlayer] 📁 Fichier MIDI sélectionné: ${selectedFile}`);

        // 3. Charger et parser le fichier MIDI
        const midiData = await midiService.loadMidiFile(selectedFile);
        midiDataRef.current = midiData;

        console.log(
          `[useMidiPlayer] ✅ MIDI chargé: ${midiData.notes.length} notes, durée: ${midiData.totalDuration.toFixed(2)}s`,
        );

        setState((prev) => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          currentMidiFile: selectedFile,
          totalNotes: midiData.notes.length,
          currentNoteIndex: 0,
          error: null,
        }));

        console.log("[useMidiPlayer] 🎉 Système MIDI initialisé avec succès");
      } catch (error) {
        console.error("[useMidiPlayer] ❌ Erreur lors de l'initialisation:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isInitialized: false, // Marquer comme non initialisé
          error: error instanceof Error ? error.message : "Erreur inconnue",
        }));
      }
    })();

    return initPromiseRef.current;
  }, []);

  /**
   * Joue la note suivante dans la séquence MIDI
   */
  const playNextNote = useCallback((): void => {
    if (!state.isInitialized || !midiDataRef.current) {
      console.log("[useMidiPlayer] ⚠️ Système MIDI non initialisé, note ignorée");
      
      // Essayer de réinitialiser si pas initialisé
      if (!state.isLoading) {
        console.log("[useMidiPlayer] 🔄 Tentative de réinitialisation...");
        initMidi();
      }
      return;
    }

    const midiData = midiDataRef.current;
    const currentIndex = state.currentNoteIndex;

    // Vérifier s'il y a des notes disponibles
    if (midiData.notes.length === 0) {
      console.log("[useMidiPlayer] ⚠️ Aucune note disponible dans le fichier MIDI");
      return;
    }

    // Obtenir la note actuelle (avec bouclage)
    const noteIndex = currentIndex % midiData.notes.length;
    const currentNote = midiData.notes[noteIndex];

    // Vérifier si l'audio nécessite une interaction
    if (state.needsUserInteraction) {
      console.log("[useMidiPlayer] 🖱️ Audio nécessite une interaction utilisateur");
      // Essayer d'activer automatiquement
      activateAudio().then(success => {
        if (success) {
          // Re-jouer la note après activation
          remotionAudioPlayer.playNote(currentNote, currentFrame);
        }
      });
    } else {
      // Jouer la note normalement
      remotionAudioPlayer.playNote(currentNote, currentFrame);
    }

    // Log pour le debug
    const noteName = midiService.midiToNoteName
      ? midiService.midiToNoteName(currentNote.pitch)
      : `MIDI${currentNote.pitch}`;

    console.log(
      `[useMidiPlayer] 🎵 Note ${noteIndex + 1}/${midiData.notes.length} jouée: ${noteName} (vélocité: ${currentNote.velocity.toFixed(2)})`,
    );

    // Mettre à jour l'index pour la prochaine note et enregistrer la collision
    setState((prev) => ({
      ...prev,
      currentNoteIndex: (currentIndex + 1) % midiData.notes.length,
      collisionFrames: [...prev.collisionFrames, currentFrame],
      playedNotes: [
        ...prev.playedNotes,
        { note: currentNote, frame: currentFrame },
      ],
    }));
  }, [state.isInitialized, state.currentNoteIndex, state.needsUserInteraction, currentFrame, initMidi, activateAudio]);

  /**
   * Joue un son pour une collision (utilise la note suivante)
   */
  const playCollisionSound = useCallback(
    (type: CollisionType): void => {
      // Pour les collisions, on joue simplement la note suivante
      playNextNote();

      // Log pour le debug
      console.log(`[useMidiPlayer] 💥 Collision ${type} -> note MIDI jouée`);
    },
    [playNextNote],
  );

  /**
   * Reset la séquence MIDI au début
   */
  const resetSequence = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      currentNoteIndex: 0,
      collisionFrames: [],
      playedNotes: [],
    }));
    console.log("[useMidiPlayer] 🔄 Séquence MIDI remise à zéro");
  }, []);

  /**
   * Change de fichier MIDI
   */
  const changeMidiFile = useCallback(
    async (fileName?: string): Promise<void> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const selectedFile = fileName || midiService.selectRandomMidiFile();
        console.log(
          `[useMidiPlayer] 📁 Changement de fichier MIDI: ${selectedFile}`,
        );

        const midiData = await midiService.loadMidiFile(selectedFile);
        midiDataRef.current = midiData;

        setState((prev) => ({
          ...prev,
          isLoading: false,
          currentMidiFile: selectedFile,
          totalNotes: midiData.notes.length,
          currentNoteIndex: 0,
          error: null,
        }));

        console.log(
          `[useMidiPlayer] ✅ Nouveau fichier MIDI chargé: ${midiData.notes.length} notes`,
        );
      } catch (error) {
        console.error(
          "[useMidiPlayer] ❌ Erreur lors du changement de fichier:",
          error,
        );
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Erreur lors du changement de fichier",
        }));
      }
    },
    [],
  );

  /**
   * Obtient les informations sur le fichier MIDI actuel
   */
  const getMidiInfo = useCallback(() => {
    if (!midiDataRef.current) return null;

    const midiData = midiDataRef.current;
    return {
      fileName: midiData.fileName,
      totalNotes: midiData.notes.length,
      totalDuration: midiData.totalDuration,
      currentNoteIndex: state.currentNoteIndex,
      progress:
        state.totalNotes > 0
          ? (state.currentNoteIndex / state.totalNotes) * 100
          : 0,
    };
  }, [state.currentNoteIndex, state.totalNotes]);

  /**
   * Nettoie les ressources au démontage
   */
  useEffect(() => {
    return () => {
      remotionAudioPlayer.cleanup();
      console.log("[useMidiPlayer] 🧹 Ressources nettoyées");
    };
  }, []);

  // Auto-initialisation améliorée avec retry
  useEffect(() => {
    if (!state.isInitialized && !state.isLoading && !initPromiseRef.current) {
      console.log("[useMidiPlayer] 🚀 Démarrage de l'auto-initialisation...");
      initMidi();
    }
  }, [state.isInitialized, state.isLoading, initMidi]);

  // Retry automatique en cas d'erreur après 2 secondes
  useEffect(() => {
    if (state.error && !state.isLoading && !state.isInitialized) {
      console.log("[useMidiPlayer] 🔄 Retry automatique dans 2 secondes...");
      const timer = setTimeout(() => {
        console.log("[useMidiPlayer] 🔄 Tentative de récupération...");
        setState(prev => ({ ...prev, error: null }));
        initPromiseRef.current = null; // Reset pour permettre une nouvelle initialisation
        initMidi();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [state.error, state.isLoading, state.isInitialized, initMidi]);

  return {
    // Fonctions principales
    playCollisionSound,
    playNextNote,
    initMidi,
    activateAudio,

    // Gestion de la séquence
    resetSequence,
    changeMidiFile,

    // État et informations
    ...state,
    getMidiInfo,

    // Utilitaires
    availableFiles: midiService.getAvailableFiles(),
    audioStatus: remotionAudioPlayer.getAudioStats(),
  };
};

export default useMidiPlayer;
