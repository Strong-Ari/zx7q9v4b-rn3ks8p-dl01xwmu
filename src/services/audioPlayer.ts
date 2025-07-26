import * as Tone from "tone";
import { MidiNote } from "./midiService";

export class AudioPlayer {
  private synth: Tone.PolySynth | null = null;
  private isInitialized = false;
  private isPreviewMode = false;

  constructor() {
    // Détecter si nous sommes en mode preview ou en mode render
    this.detectPreviewMode();
  }

  /**
   * Détecte si nous sommes en mode preview (Remotion Player) ou en mode render
   */
  private detectPreviewMode(): void {
    try {
      // Maintenant on active l'audio dans tous les modes (studio + render)
      this.isPreviewMode =
        typeof window !== "undefined" && typeof document !== "undefined";

      console.log(
        `[AudioPlayer] Mode détecté: ${this.isPreviewMode ? "Browser/Studio" : "Server"}`,
      );
    } catch {
      this.isPreviewMode = false;
      console.log(
        "[AudioPlayer] Mode Serveur détecté (pas de window/document)",
      );
    }
  }

  /**
   * Initialise le système audio (studio et render)
   */
  public async initAudio(): Promise<boolean> {
    if (!this.isPreviewMode) {
      console.log("[AudioPlayer] Audio désactivé côté serveur");
      return false;
    }

    if (this.isInitialized) {
      console.log("[AudioPlayer] Audio déjà initialisé");
      return true;
    }

    try {
      console.log("[AudioPlayer] Initialisation du système audio...");

      // Démarrer le contexte audio Tone.js
      await Tone.start();
      console.log("[AudioPlayer] Contexte audio Tone.js démarré");

      // Créer un synthétiseur polyphonique avec un son agréable
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "triangle",
        },
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 1.2,
        },
      }).toDestination();

      // Configurer le volume
      this.synth.volume.value = -10; // -10dB pour éviter la distorsion

      this.isInitialized = true;
      console.log("[AudioPlayer] Système audio initialisé avec succès");
      return true;
    } catch (error) {
      console.error(
        "[AudioPlayer] Erreur lors de l'initialisation audio:",
        error,
      );
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Joue une note MIDI
   */
  public playNote(note: MidiNote): void {
    if (!this.isPreviewMode || !this.isInitialized || !this.synth) {
      return; // Ne pas jouer côté serveur ou si pas initialisé
    }

    try {
      // Convertir le numéro MIDI en note Tone.js
      const frequency = this.midiToFrequency(note.pitch);
      const noteName = this.midiToNoteName(note.pitch);

      // Jouer la note avec la vélocité et la durée
      const volume = this.velocityToVolume(note.velocity);
      const duration = Math.min(note.duration, 2.0); // Limiter la durée max à 2 secondes

      this.synth.triggerAttackRelease(frequency, duration, undefined, volume);

      console.log(
        `[AudioPlayer] Note jouée: ${noteName} (${frequency.toFixed(1)}Hz) - Durée: ${duration.toFixed(2)}s - Volume: ${volume.toFixed(2)}`,
      );
    } catch (error) {
      console.error(
        "[AudioPlayer] Erreur lors de la lecture de la note:",
        error,
      );
    }
  }

  /**
   * Joue une note par sa fréquence directement
   */
  public playFrequency(
    frequency: number,
    duration: number = 0.2,
    velocity: number = 0.7,
  ): void {
    if (!this.isPreviewMode || !this.isInitialized || !this.synth) {
      return;
    }

    try {
      const volume = this.velocityToVolume(velocity);
      this.synth.triggerAttackRelease(frequency, duration, undefined, volume);

      console.log(
        `[AudioPlayer] Fréquence jouée: ${frequency.toFixed(1)}Hz - Durée: ${duration.toFixed(2)}s`,
      );
    } catch (error) {
      console.error(
        "[AudioPlayer] Erreur lors de la lecture de la fréquence:",
        error,
      );
    }
  }

  /**
   * Arrête toutes les notes en cours
   */
  public stopAllNotes(): void {
    if (!this.isPreviewMode || !this.isInitialized || !this.synth) {
      return;
    }

    try {
      this.synth.releaseAll();
      console.log("[AudioPlayer] Toutes les notes arrêtées");
    } catch (error) {
      console.error("[AudioPlayer] Erreur lors de l'arrêt des notes:", error);
    }
  }

  /**
   * Nettoie les ressources audio
   */
  public cleanup(): void {
    if (!this.isPreviewMode) {
      return;
    }

    try {
      if (this.synth) {
        this.synth.dispose();
        this.synth = null;
      }

      this.isInitialized = false;
      console.log("[AudioPlayer] Ressources audio nettoyées");
    } catch (error) {
      console.error("[AudioPlayer] Erreur lors du nettoyage:", error);
    }
  }

  /**
   * Vérifie si l'audio est disponible
   */
  public isAudioAvailable(): boolean {
    return this.isPreviewMode && this.isInitialized;
  }

  /**
   * Obtient le statut du lecteur
   */
  public getStatus(): {
    isPreviewMode: boolean;
    isInitialized: boolean;
    isAvailable: boolean;
  } {
    return {
      isPreviewMode: this.isPreviewMode,
      isInitialized: this.isInitialized,
      isAvailable: this.isAudioAvailable(),
    };
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
   * Convertit la vélocité MIDI (0-1) en volume Tone.js
   */
  private velocityToVolume(velocity: number): number {
    // Mappage logarithmique pour un meilleur rendu sonore
    return Math.pow(velocity, 0.5) * 0.8; // Max 0.8 pour éviter la distorsion
  }
}

// Export de l'instance singleton
export const audioPlayer = new AudioPlayer();
