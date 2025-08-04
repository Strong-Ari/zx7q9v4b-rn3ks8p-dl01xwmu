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
  notesIndex: Map<number, MidiNote[]>; // Cache des notes par frame
  lastProcessedFrame: number; // Dernier frame traité pour optimiser
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
    notesIndex: new Map(),
    lastProcessedFrame: -1,
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
  const playCollisionSound = useCallback((type: CollisionType): void => {
    // On joue un beep différent selon le type de collision
    if (type === "BALL_CIRCLE") {
      // Fréquence différente pour chaque type de balle
      remotionAudioPlayer.playFrequency(523.25, 0.15, 0.7); // Do# aigu
    } else if (type === "BALL_BALL") {
      remotionAudioPlayer.playFrequency(329.63, 0.18, 0.8); // Mi
    }
  }, []);

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
   * Pré-calcule l'index des notes par frame pour optimiser la lecture
   */
  const buildNotesIndex = useCallback((midiData: ProcessedMidiData, fps: number): Map<number, MidiNote[]> => {
    const notesIndex = new Map<number, MidiNote[]>();
    
    midiData.notes.forEach(note => {
      // Calculer les frames où cette note doit être jouée
      const startFrame = Math.floor(note.time * fps);
      const endFrame = Math.floor((note.time + note.duration) * fps);
      
      for (let frame = startFrame; frame <= endFrame; frame++) {
        if (!notesIndex.has(frame)) {
          notesIndex.set(frame, []);
        }
        notesIndex.get(frame)!.push(note);
      }
    });
    
    console.log(`[useMidiPlayer] Index des notes créé: ${notesIndex.size} frames avec notes`);
    return notesIndex;
  }, []);

/**
 * Joue les notes MIDI en suivant le timing de la vidéo (frame-based) - Version optimisée
 */
const playMusicAtFrame = useCallback(
  (currentFrame: number, fps: number): void => {
    if (!state.isInitialized || !midiDataRef.current) {
      return;
    }

    // Éviter les traitements redondants
    if (currentFrame <= state.lastProcessedFrame) {
      return;
    }

    // Si l'index n'est pas encore construit, le créer
    if (state.notesIndex.size === 0 && midiDataRef.current) {
      const newIndex = buildNotesIndex(midiDataRef.current, fps);
      setState(prev => ({
        ...prev,
        notesIndex: newIndex,
        lastProcessedFrame: currentFrame,
      }));
      return;
    }

    // Récupérer les notes à jouer pour ce frame
    const notesToPlay = state.notesIndex.get(currentFrame);
    
    if (notesToPlay && notesToPlay.length > 0) {
      notesToPlay.forEach(note => {
        // Vérifier si cette note n'a pas déjà été jouée pour ce frame exact
        const hasBeenPlayed = state.playedNotes.some(
          playedNote => 
            playedNote.note === note && 
            playedNote.frame === currentFrame
        );

        if (!hasBeenPlayed) {
          // Jouer la note
          remotionAudioPlayer.playNote(note, currentFrame);

          // Log pour le debug (réduit)
          if (currentFrame % 30 === 0) { // Log seulement toutes les secondes
            const noteName = midiService.midiToNoteName
              ? midiService.midiToNoteName(note.pitch)
              : `MIDI${note.pitch}`;
            console.log(
              `[useMidiPlayer] 🎵 Frame ${currentFrame}: ${notesToPlay.length} notes actives`,
            );
          }
        }
      });

      // Enregistrer les notes jouées (optimisé)
      setState(prev => ({
        ...prev,
        playedNotes: [
          ...prev.playedNotes,
          ...notesToPlay.map(note => ({ note, frame: currentFrame }))
        ],
        lastProcessedFrame: currentFrame,
      }));
    } else {
      // Mettre à jour le dernier frame traité même s'il n'y a pas de notes
      setState(prev => ({
        ...prev,
        lastProcessedFrame: currentFrame,
      }));
    }
  },
  [state.isInitialized, state.playedNotes, state.notesIndex, state.lastProcessedFrame, buildNotesIndex],
);

/**
 * Démarre la lecture continue de la musique MIDI
 */
const startBackgroundMusic = useCallback((): void => {
  if (!state.isInitialized || !midiDataRef.current) {
    console.log(
      "[useMidiPlayer] Impossible de démarrer la musique - système non initialisé",
    );
    return;
  }

  const midiData = midiDataRef.current;
  console.log(
    `[useMidiPlayer] 🎵 Démarrage de la musique de fond: ${midiData.fileName}`,
  );
  console.log(
    `[useMidiPlayer] 📊 Fichier MIDI: ${midiData.notes.length} notes, durée: ${midiData.totalDuration.toFixed(2)}s`,
  );

  // Reset complet pour recommencer proprement
  setState((prev) => ({
    ...prev,
    playedNotes: [],
    currentNoteIndex: 0,
    notesIndex: new Map(),
    lastProcessedFrame: -1,
  }));
}, [state.isInitialized]);

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
        initMidi();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [state.isInitialized, state.isLoading, initMidi]);

  // Initialisation forcée au montage du composant
  useEffect(() => {
    const forceInit = async () => {
      if (!state.isInitialized && !state.isLoading) {
        console.log("[useMidiPlayer] Initialisation forcée au montage...");
        await initMidi();
      }
    };

    forceInit();
  }, []); // Dépendances vides pour ne s'exécuter qu'au montage

  return {
    // Fonctions principales
    playCollisionSound,
    playNextNote,
    playMusicAtFrame, // Nouvelle fonction pour la lecture frame-based
    startBackgroundMusic, // Nouvelle fonction pour démarrer la musique
    initMidi,
    forceReinitAudio, // Nouvelle fonction pour forcer la réinitialisation

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
