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
  });

  const midiDataRef = useRef<ProcessedMidiData | null>(null);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  /**
   * Initialise le système MIDI
   */
  const initMidi = useCallback(async (): Promise<void> => {
    // Éviter les initialisations multiples
    if (initPromiseRef.current) {
      return initPromiseRef.current;
    }

    initPromiseRef.current = (async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        console.log("[useMidiPlayer] Initialisation du système MIDI...");

        // 1. Initialiser le lecteur audio Remotion
        const audioInitialized = await remotionAudioPlayer.initAudio();
        if (!audioInitialized) {
          console.log(
            "[useMidiPlayer] Audio désactivé - fonctionnement en mode silencieux",
          );
        }

        // 2. Sélectionner un fichier MIDI aléatoire
        const selectedFile = midiService.selectRandomMidiFile();
        console.log(
          `[useMidiPlayer] Fichier MIDI sélectionné: ${selectedFile}`,
        );

        // 3. Charger et parser le fichier MIDI
        const midiData = await midiService.loadMidiFile(selectedFile);
        midiDataRef.current = midiData;

        console.log(
          `[useMidiPlayer] MIDI chargé: ${midiData.notes.length} notes, durée: ${midiData.totalDuration.toFixed(2)}s`,
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

        console.log("[useMidiPlayer] Système MIDI initialisé avec succès");
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
   * Joue la note suivante dans la séquence MIDI
   */
  const playNextNote = useCallback((): void => {
    if (!state.isInitialized || !midiDataRef.current) {
      console.log("[useMidiPlayer] Système MIDI non initialisé, note ignorée");
      return;
    }

    const midiData = midiDataRef.current;
    const currentIndex = state.currentNoteIndex;

    // Vérifier s'il y a des notes disponibles
    if (midiData.notes.length === 0) {
      console.log(
        "[useMidiPlayer] Aucune note disponible dans le fichier MIDI",
      );
      return;
    }

    // Obtenir la note actuelle (avec bouclage)
    const noteIndex = currentIndex % midiData.notes.length;
    const currentNote = midiData.notes[noteIndex];

    // Jouer la note avec le frame actuel pour la synchronisation
    remotionAudioPlayer.playNote(currentNote, currentFrame);

    // Log pour le debug
    const noteName = midiService.midiToNoteName
      ? midiService.midiToNoteName(currentNote.pitch)
      : `MIDI${currentNote.pitch}`;

    console.log(
      `[useMidiPlayer] Note ${noteIndex + 1}/${midiData.notes.length} jouée: ${noteName} (vélocité: ${currentNote.velocity.toFixed(2)})`,
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
  }, [state.isInitialized, state.currentNoteIndex]);

  /**
   * Joue un son pour une collision (ancien système, simple beep)
   */
  const playCollisionSound = useCallback(
    (type: CollisionType): void => {
      // On joue un beep différent selon le type de collision
      if (type === "BALL_CIRCLE") {
        // Fréquence différente pour chaque type de balle
        remotionAudioPlayer.playFrequency(523.25, 0.15, 0.7); // Do# aigu
      } else if (type === "BALL_BALL") {
        remotionAudioPlayer.playFrequency(329.63, 0.18, 0.8); // Mi
      }
    },
    [],
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
    console.log("[useMidiPlayer] Séquence MIDI remise à zéro");
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
          `[useMidiPlayer] Changement de fichier MIDI: ${selectedFile}`,
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
          `[useMidiPlayer] Nouveau fichier MIDI chargé: ${midiData.notes.length} notes`,
        );
      } catch (error) {
        console.error(
          "[useMidiPlayer] Erreur lors du changement de fichier:",
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
      console.log("[useMidiPlayer] Ressources nettoyées");
    };
  }, []);

  // Auto-initialisation si pas encore fait
  useEffect(() => {
    if (!state.isInitialized && !state.isLoading && !initPromiseRef.current) {
      initMidi();
    }
  }, [state.isInitialized, state.isLoading, initMidi]);

  return {
    // Fonctions principales
    playCollisionSound,
    playNextNote,
    initMidi,

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
