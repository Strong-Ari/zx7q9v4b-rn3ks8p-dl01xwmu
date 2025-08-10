// Audio généré dynamiquement pour Remotion - Version simplifiée pour les collisions
import * as Tone from "tone";

/**
 * Lecteur audio pour Remotion spécialisé pour les sons de collision
 * Utilise Tone.js pour générer des sons de collision en temps réel
 */
export class RemotionAudioPlayer {
  private synth: Tone.PolySynth | null = null;
  private isInitialized = false;
  private isRemotionEnvironment = false;

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

      // Créer un synthétiseur optimisé pour les sons de collision
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "sine", // Son plus pur pour les collisions
        },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.3,
          release: 0.2,
        },
      }).toDestination();

      // Volume optimisé pour les collisions
      this.synth.volume.value = -8;

      this.isInitialized = true;
      console.log("[RemotionAudioPlayer] Système audio initialisé avec succès");

      // Test audio pour confirmer que tout fonctionne
      setTimeout(() => {
        this.playFrequency(440, 0.1, 0.5); // Test court
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
        `[RemotionAudioPlayer] Collision son: ${frequency.toFixed(1)}Hz - Durée: ${safeDuration}s - Volume: ${safeVolume}`,
      );
    } catch (error) {
      console.error(
        "[RemotionAudioPlayer] Erreur lors de la lecture de la fréquence:",
        error,
      );
    }
  }

  /**
   * Obtient les statistiques audio
   */
  public getAudioStats(): {
    isActive: boolean;
  } {
    return {
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
}

// Export de l'instance singleton
export const remotionAudioPlayer = new RemotionAudioPlayer();
