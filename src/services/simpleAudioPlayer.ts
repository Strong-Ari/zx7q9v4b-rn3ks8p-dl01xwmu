import * as Tone from "tone";

export class SimpleAudioPlayer {
  private synth: Tone.PolySynth | null = null;
  private isInitialized = false;
  private isBrowserMode = false;

  constructor() {
    this.detectBrowserMode();
  }

  /**
   * Détecte si nous sommes dans un navigateur
   */
  private detectBrowserMode(): void {
    try {
      this.isBrowserMode = typeof window !== "undefined" && typeof document !== "undefined";
      console.log(`[SimpleAudioPlayer] Mode détecté: ${this.isBrowserMode ? "Browser" : "Server"}`);
    } catch {
      this.isBrowserMode = false;
      console.log("[SimpleAudioPlayer] Mode Serveur détecté");
    }
  }

  /**
   * Initialise le système audio
   */
  public async initAudio(): Promise<boolean> {
    if (!this.isBrowserMode) {
      console.log("[SimpleAudioPlayer] Audio désactivé côté serveur");
      return false;
    }

    if (this.isInitialized) {
      console.log("[SimpleAudioPlayer] Audio déjà initialisé");
      return true;
    }

    try {
      console.log("[SimpleAudioPlayer] Initialisation du système audio...");

      // Démarrer le contexte audio Tone.js
      await Tone.start();
      console.log("[SimpleAudioPlayer] Contexte audio Tone.js démarré");

      // Créer un synthétiseur simple
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
      this.synth.volume.value = -8;

      this.isInitialized = true;
      console.log("[SimpleAudioPlayer] Système audio initialisé avec succès");
      return true;
    } catch (error) {
      console.error("[SimpleAudioPlayer] Erreur lors de l'initialisation audio:", error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Joue un son de collision balle-cercle
   */
  public playBallCircleSound(): void {
    if (!this.isBrowserMode || !this.isInitialized || !this.synth) {
      return;
    }

    try {
      // Fréquences pour les collisions balle-cercle
      const frequencies = [440, 523.25, 659.25]; // La, Do, Mi
      const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
      
      this.synth.triggerAttackRelease(randomFreq, 0.2);
      
      console.log(`[SimpleAudioPlayer] Son balle-cercle joué: ${randomFreq.toFixed(1)}Hz`);
    } catch (error) {
      console.error("[SimpleAudioPlayer] Erreur lors de la lecture du son:", error);
    }
  }

  /**
   * Joue un son de collision balle-balle
   */
  public playBallBallSound(): void {
    if (!this.isBrowserMode || !this.isInitialized || !this.synth) {
      return;
    }

    try {
      // Fréquences pour les collisions balle-balle
      const frequencies = [880, 1046.5]; // La aigu, Do aigu
      const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
      
      this.synth.triggerAttackRelease(randomFreq, 0.15);
      
      console.log(`[SimpleAudioPlayer] Son balle-balle joué: ${randomFreq.toFixed(1)}Hz`);
    } catch (error) {
      console.error("[SimpleAudioPlayer] Erreur lors de la lecture du son:", error);
    }
  }

  /**
   * Joue une fréquence spécifique
   */
  public playFrequency(frequency: number, duration: number = 0.2): void {
    if (!this.isBrowserMode || !this.isInitialized || !this.synth) {
      return;
    }

    try {
      this.synth.triggerAttackRelease(frequency, duration);
      console.log(`[SimpleAudioPlayer] Fréquence jouée: ${frequency.toFixed(1)}Hz`);
    } catch (error) {
      console.error("[SimpleAudioPlayer] Erreur lors de la lecture de la fréquence:", error);
    }
  }

  /**
   * Arrête toutes les notes
   */
  public stopAllNotes(): void {
    if (!this.isBrowserMode || !this.isInitialized || !this.synth) {
      return;
    }

    try {
      this.synth.releaseAll();
      console.log("[SimpleAudioPlayer] Toutes les notes arrêtées");
    } catch (error) {
      console.error("[SimpleAudioPlayer] Erreur lors de l'arrêt des notes:", error);
    }
  }

  /**
   * Nettoie les ressources
   */
  public cleanup(): void {
    if (!this.isBrowserMode) {
      return;
    }

    try {
      if (this.synth) {
        this.synth.dispose();
        this.synth = null;
      }

      this.isInitialized = false;
      console.log("[SimpleAudioPlayer] Ressources audio nettoyées");
    } catch (error) {
      console.error("[SimpleAudioPlayer] Erreur lors du nettoyage:", error);
    }
  }

  /**
   * Vérifie si l'audio est disponible
   */
  public isAudioAvailable(): boolean {
    return this.isBrowserMode && this.isInitialized;
  }

  /**
   * Obtient le statut du lecteur
   */
  public getStatus(): {
    isBrowserMode: boolean;
    isInitialized: boolean;
    isAvailable: boolean;
  } {
    return {
      isBrowserMode: this.isBrowserMode,
      isInitialized: this.isInitialized,
      isAvailable: this.isAudioAvailable(),
    };
  }
}

// Export de l'instance singleton
export const simpleAudioPlayer = new SimpleAudioPlayer();