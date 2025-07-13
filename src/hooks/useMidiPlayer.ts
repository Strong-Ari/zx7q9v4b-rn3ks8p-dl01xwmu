import { useCallback, useEffect, useRef } from "react";
import { MIDI_CONFIG } from "../constants/game";

type CollisionType = "BALL_CIRCLE" | "BALL_BALL";

export const useMidiPlayer = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialiser le contexte audio
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);
    gainNodeRef.current.gain.value = MIDI_CONFIG.VOLUME;

    return () => {
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
    };
  }, []);

  // Jouer une note
  const playNote = useCallback((frequency: number, duration: number) => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed")
      return;

    // Créer un nouvel oscillateur
    const oscillator = audioContextRef.current.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      frequency,
      audioContextRef.current.currentTime,
    );

    // Connecter l'oscillateur au gain node
    oscillator.connect(gainNodeRef.current!);

    // Configurer l'enveloppe ADSR simplifiée
    const now = audioContextRef.current.currentTime;
    gainNodeRef.current!.gain.setValueAtTime(0, now);
    gainNodeRef.current!.gain.linearRampToValueAtTime(
      MIDI_CONFIG.VOLUME,
      now + 0.01,
    );
    gainNodeRef.current!.gain.linearRampToValueAtTime(0, now + duration);

    // Démarrer et arrêter l'oscillateur
    oscillator.start(now);
    oscillator.stop(now + duration);

    // Nettoyer l'ancien oscillateur
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    oscillatorRef.current = oscillator;
  }, []);

  // Jouer un son pour une collision
  const playCollisionSound = useCallback(
    (type: CollisionType) => {
      const frequencies = MIDI_CONFIG.FREQUENCIES[type];
      const frequency =
        frequencies[Math.floor(Math.random() * frequencies.length)];
      playNote(frequency, MIDI_CONFIG.NOTE_DURATION);
    },
    [playNote],
  );

  return { playCollisionSound };
};

export default useMidiPlayer;
