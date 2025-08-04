import { AUDIO_CONFIG } from "../constants/game";

/**
 * Service audio simple pour les sons de collision
 * Utilise l'API Web Audio pour générer des sons de fréquence
 */
class AudioService {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  /**
   * Initialise le contexte audio
   */
  private async initAudioContext(): Promise<void> {
    if (this.isInitialized || typeof window === "undefined") {
      return;
    }

    try {
      this.audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Démarrer le contexte audio si nécessaire
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      
      this.isInitialized = true;
      console.log("[AudioService] Contexte audio initialisé");
    } catch (error) {
      console.warn("[AudioService] Impossible d'initialiser l'audio:", error);
    }
  }

  /**
   * Joue un son de collision basé sur le type
   */
  public async playCollisionSound(type: "BALL_CIRCLE" | "BALL_BALL"): Promise<void> {
    if (!this.isInitialized) {
      await this.initAudioContext();
    }

    if (!this.audioContext) {
      return;
    }

    try {
      const config = AUDIO_CONFIG.COLLISION_SOUNDS[type];
      
      // Créer un oscillateur pour générer la fréquence
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // Configurer l'oscillateur
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);
      
      // Configurer le volume avec une enveloppe
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.01); // Attack rapide
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration); // Decay
      
      // Connecter et jouer
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.start(now);
      oscillator.stop(now + config.duration);
      
      console.log(`[AudioService] Son joué: ${type} (${config.frequency}Hz)`);
    } catch (error) {
      console.warn("[AudioService] Erreur lors de la lecture du son:", error);
    }
  }

  /**
   * Nettoie les ressources audio
   */
  public cleanup(): void {
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }
    this.isInitialized = false;
    console.log("[AudioService] Ressources nettoyées");
  }
}

// Instance singleton
export const audioService = new AudioService();