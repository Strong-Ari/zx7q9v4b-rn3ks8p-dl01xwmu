// Audio généré dynamiquement pour Remotion
import { MidiNote } from "./midiService";
import * as Tone from "tone";

/**
 * Lecteur audio pour Remotion qui peut générer de l'audio dans le rendu final
 * Utilise une approche hybride : Tone.js pour le studio, audio files pour le rendu
 */
export class RemotionAudioPlayer {
  private synth: Tone.PolySynth | null = null;
  private isInitialized = false;
  private isRemotionEnvironment = false;
  private audioQueue: Array<{ note: MidiNote; frame: number }> = [];

  constructor() {
    this.detectEnvironment();
  }

  /**
   * Détecte l'environnement d'exécution
   */
  private detectEnvironment(): void {
    try {
      // Vérifier si nous sommes dans un environnement Remotion
      this.isRemotionEnvironment =
        typeof window !== "undefined" && typeof document !== "undefined";

      console.log(
        `[RemotionAudioPlayer] Environnement: ${this.isRemotionEnvironment ? "Browser (Studio/Render)" : "Server"}`,
      );
    } catch {
      this.isRemotionEnvironment = false;
      console.log("[RemotionAudioPlayer] Environnement: Server");
    }
  }

  /**
   * Initialise le système audio
   */
  public async initAudio(): Promise<boolean> {
    if (!this.isRemotionEnvironment) {
      console.log("[RemotionAudioPlayer] Audio désactivé côté serveur");
      return false;
    }

    if (this.isInitialized) {
      console.log("[RemotionAudioPlayer] Audio déjà initialisé");
      return true;
    }

    try {
      console.log("[RemotionAudioPlayer] Initialisation du système audio...");

      // Forcer l'initialisation du contexte audio avec une interaction utilisateur
      if (Tone.context.state !== "running") {
        console.log("[RemotionAudioPlayer] Démarrage du contexte audio...");

        // Créer un événement de clic temporaire pour débloquer l'audio
        const unlockAudio = () => {
          console.log(
            "[RemotionAudioPlayer] Déblocage audio via interaction utilisateur...",
          );
          Tone.start();
          document.removeEventListener("click", unlockAudio);
          document.removeEventListener("keydown", unlockAudio);
          document.removeEventListener("touchstart", unlockAudio);
        };

        document.addEventListener("click", unlockAudio);
        document.addEventListener("keydown", unlockAudio);
        document.addEventListener("touchstart", unlockAudio);

        // Essayer de démarrer directement aussi
        await Tone.start();
        console.log("[RemotionAudioPlayer] Contexte audio Tone.js démarré");
      }

      // Créer un synthétiseur avec un son plus adapté au rendu
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "sawtooth", // Son plus riche pour le rendu
        },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.5,
          release: 0.5,
        },
      }).toDestination();

      // Volume optimisé pour le rendu
      this.synth.volume.value = -6; // Un peu plus fort pour être audible dans le rendu

      this.isInitialized = true;
      console.log("[RemotionAudioPlayer] Système audio initialisé avec succès");

      // Test audio pour confirmer que tout fonctionne
      setTimeout(() => {
        this.playFrequency(440, 0.2, 0.5); // Test avec un La 440Hz plus long et plus fort
      }, 200);

      return true;
    } catch (error) {
      console.error(
        "[RemotionAudioPlayer] Erreur lors de l'initialisation audio:",
        error,
      );
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Joue une note MIDI avec timing Remotion
   */
  public playNote(note: MidiNote, currentFrame?: number): void {
    if (!this.isRemotionEnvironment || !this.isInitialized || !this.synth) {
      return;
    }

    try {
      // Convertir le numéro MIDI en fréquence
      const frequency = this.midiToFrequency(note.pitch);
      const noteName = this.midiToNoteName(note.pitch);

      // Jouer la note avec la vélocité et la durée
      const volume = this.velocityToVolume(note.velocity);
      const duration = Math.min(note.duration, 1.0); // Limiter pour éviter les chevauchements

      this.synth.triggerAttackRelease(frequency, duration, undefined, volume);

      // Enregistrer dans la queue pour debug
      if (currentFrame !== undefined) {
        this.audioQueue.push({ note, frame: currentFrame });

        // Garder seulement les 50 dernières notes pour debug
        if (this.audioQueue.length > 50) {
          this.audioQueue.shift();
        }
      }

      console.log(
        `[RemotionAudioPlayer] Note jouée: ${noteName} (${frequency.toFixed(1)}Hz) - Frame: ${currentFrame || "N/A"}`,
      );
    } catch (error) {
      console.error(
        "[RemotionAudioPlayer] Erreur lors de la lecture de la note:",
        error,
      );
    }
  }

  /**
   * Joue une fréquence spécifique (pour les sons de collision)
   */
  public playFrequency(
    frequency: number,
    duration: number,
    volume: number = 0.7,
  ): void {
    if (!this.isRemotionEnvironment || !this.isInitialized || !this.synth) {
      return;
    }

    try {
      // Limiter la durée pour éviter les chevauchements
      const safeDuration = Math.min(duration, 1.0);
      const safeVolume = Math.max(0, Math.min(1, volume));

      this.synth.triggerAttackRelease(
        frequency,
        safeDuration,
        undefined,
        safeVolume,
      );

      console.log(
        `[RemotionAudioPlayer] Fréquence jouée: ${frequency.toFixed(1)}Hz - Durée: ${safeDuration}s - Volume: ${safeVolume}`,
      );
    } catch (error) {
      console.error(
        "[RemotionAudioPlayer] Erreur lors de la lecture de la fréquence:",
        error,
      );
    }
  }

  /**
   * Génère un fichier audio synthétique pour une note (pour le rendu)
   */
  public generateNoteAudio(note: MidiNote, sampleRate = 44100): Float32Array {
    const frequency = this.midiToFrequency(note.pitch);
    const duration = Math.min(note.duration, 1.0);
    const volume = this.velocityToVolume(note.velocity);

    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Float32Array(numSamples);

    // Générer une onde en dents de scie avec enveloppe
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const phase = (t * frequency) % 1;

      // Onde en dents de scie
      const sample = (2 * phase - 1) * volume;

      // Enveloppe ADSR simplifiée
      const attackTime = 0.01;
      const releaseTime = 0.1;
      let envelope = 1;

      if (t < attackTime) {
        envelope = t / attackTime;
      } else if (t > duration - releaseTime) {
        envelope = (duration - t) / releaseTime;
      }

      buffer[i] = sample * envelope * 0.3; // Réduire le volume global
    }

    return buffer;
  }

  /**
   * Crée un data URL pour l'audio (utilisable avec Remotion Audio)
   */
  public createAudioDataUrl(note: MidiNote): string {
    const audioBuffer = this.generateNoteAudio(note);

    // Créer un WAV simple
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
    view.setUint32(24, 44100, true);
    view.setUint32(28, 44100 * 2, true);
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

    // Convertir en data URL
    const blob = new Blob([arrayBuffer], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  }

  /**
   * Obtient les statistiques de la queue audio
   */
  public getAudioStats(): {
    totalNotesPlayed: number;
    recentNotes: Array<{ note: MidiNote; frame: number }>;
    isActive: boolean;
  } {
    return {
      totalNotesPlayed: this.audioQueue.length,
      recentNotes: this.audioQueue.slice(-10),
      isActive: this.isInitialized && this.isRemotionEnvironment,
    };
  }

  /**
   * Nettoie les ressources
   */
  public cleanup(): void {
    if (!this.isRemotionEnvironment) {
      return;
    }

    try {
      if (this.synth) {
        this.synth.dispose();
        this.synth = null;
      }

      this.isInitialized = false;
      this.audioQueue = [];
      console.log("[RemotionAudioPlayer] Ressources audio nettoyées");
    } catch (error) {
      console.error("[RemotionAudioPlayer] Erreur lors du nettoyage:", error);
    }
  }

  /**
   * Vérifie si l'audio est disponible
   */
  public isAudioAvailable(): boolean {
    return this.isRemotionEnvironment && this.isInitialized;
  }

  /**
   * Force la réinitialisation de l'audio (utile pour Remotion Studio)
   */
  public async forceReinit(): Promise<boolean> {
    console.log(
      "[RemotionAudioPlayer] Forçage de la réinitialisation audio...",
    );
    this.isInitialized = false;
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    return this.initAudio();
  }

  /**
   * Convertit un numéro MIDI en fréquence Hz
   */
  private midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  /**
   * Convertit un numéro MIDI en nom de note
   */
  private midiToNoteName(midiNote: number): string {
    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = noteNames[midiNote % 12];
    return `${note}${octave}`;
  }

  /**
   * Convertit la vélocité MIDI en volume
   */
  private velocityToVolume(velocity: number): number {
    return Math.pow(velocity, 0.5) * 0.7;
  }
}

// Export de l'instance singleton
export const remotionAudioPlayer = new RemotionAudioPlayer();
