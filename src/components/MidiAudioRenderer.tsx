import React, { useEffect, useMemo, useState } from "react";
import { Audio, useCurrentFrame, useVideoConfig } from "remotion";
import { remotionAudioPlayer } from "../services/remotionAudioPlayer";
import { MidiNote } from "../services/midiService";

interface MidiAudioRendererProps {
  notes: MidiNote[];
  collisionFrames: number[];
  volume?: number;
}

export const MidiAudioRenderer: React.FC<MidiAudioRendererProps> = ({
  notes,
  collisionFrames,
  volume = 0.3,
}) => {
  const { fps } = useVideoConfig();
  const [audioUrls, setAudioUrls] = useState<Map<number, string>>(new Map());

  // Générer les fichiers audio pour les notes aux moments de collision
  const audioElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    collisionFrames.forEach((collisionFrame, index) => {
      if (index < notes.length) {
        const note = notes[index % notes.length];

        // Créer un ID unique pour cette note
        const noteId = `${collisionFrame}-${note.pitch}-${index}`;

        elements.push(
          <AudioNote
            key={noteId}
            note={note}
            startFrame={collisionFrame}
            volume={volume}
            onAudioUrlGenerated={(url) => {
              setAudioUrls((prev) => new Map(prev).set(collisionFrame, url));
            }}
          />,
        );
      }
    });

    return elements;
  }, [notes, collisionFrames, fps, volume]);

  // Nettoyer les URLs d'objets à la fin
  useEffect(() => {
    return () => {
      audioUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [audioUrls]);

  return <>{audioElements}</>;
};

interface AudioNoteProps {
  note: MidiNote;
  startFrame: number;
  volume: number;
  onAudioUrlGenerated: (url: string) => void;
}

const AudioNote: React.FC<AudioNoteProps> = ({
  note,
  startFrame,
  volume,
  onAudioUrlGenerated,
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { fps } = useVideoConfig();

  // Générer le fichier audio pour cette note
  useEffect(() => {
    const generateAudio = async () => {
      try {
        // Générer l'audio de la note
        const audioBuffer = remotionAudioPlayer.generateNoteAudio(note);

        // Créer un fichier WAV
        const wavBlob = createWavBlob(audioBuffer, 44100);
        const url = URL.createObjectURL(wavBlob);

        setAudioUrl(url);
        onAudioUrlGenerated(url);

        console.log(
          `[MidiAudioRenderer] Audio généré pour note ${note.pitch} au frame ${startFrame}`,
        );
      } catch (error) {
        console.error("[MidiAudioRenderer] Erreur génération audio:", error);
      }
    };

    generateAudio();

    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [note, startFrame, onAudioUrlGenerated]);

  if (!audioUrl) {
    return null;
  }

  const duration = Math.min(note.duration, 2.0); // Limite à 2 secondes

  return (
    <Audio
      src={audioUrl}
      startFrom={0}
      endAt={Math.floor(duration * fps)}
      volume={volume * note.velocity}
    />
  );
};

// Fonction utilitaire pour créer un blob WAV
function createWavBlob(audioBuffer: Float32Array, sampleRate: number): Blob {
  const length = audioBuffer.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);

  // Header WAV
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, length * 2, true);

  // Données audio
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, audioBuffer[i]));
    view.setInt16(offset, sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export default MidiAudioRenderer;
