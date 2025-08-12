export const GAME_CONFIG = {
  // Dimensions de la vidéo
  VIDEO_WIDTH: 720,
  VIDEO_HEIGHT: 1280,
  FPS: 30, // Changé à 30 FPS
  DURATION_IN_SECONDS: 61, // 1 minute et 1 seconde

  // Configuration des balles - Paramètres optimisés
  BALL_RADIUS: 35,
  BALL_SPEED: 8, // Réduit pour une vitesse plus modérée
  TRAIL_LENGTH: 8, // Augmenté pour des traînées plus visibles
  BALL_MASS: 1,
  BALL_FRICTION: 0.999, // Réduit pour maintenir la vitesse
  BALL_ELASTICITY: 0.9, // Augmenté pour des rebonds plus énergiques
  BALL_MIN_SPEED: 5, // Augmenté pour éviter que les balles ralentissent trop
  BALL_MAX_SPEED: 18, // Réduit pour une vitesse plus contrôlée
  INITIAL_CIRCLE_RADIUS: 120, // Réduit pour plus d'espace de mouvement initial

  // Configuration des cercles - Paramètres optimisés pour une meilleure synchronisation
  MIN_CIRCLE_RADIUS: 250, // Réduit pour plus d'espace central
  MAX_CIRCLE_RADIUS: 800, // Légèrement réduit pour un meilleur équilibre
  CIRCLE_GAP_MIN_ANGLE: 60, // Augmenté pour des ouvertures plus larges (plus facile)
  CIRCLE_GAP_MAX_ANGLE: 80, // Augmenté pour plus d'opportunités de cassage
  CIRCLE_SPACING: 35, // Réduit pour plus d'anneaux
  CIRCLE_STROKE_WIDTH: 9, // Réduit pour un look plus élégant
  SPIRAL_ROTATION_SPEED: 0.1, // Vitesse réduite pour une rotation plus lente et fluide
  SPIRAL_DENSITY: 35, // Encore plus d'anneaux
  CIRCLE_GRADIENT_START: "#4ade80",
  CIRCLE_GRADIENT_END: "#22d3ee",

  // Couleurs
  COLORS: {
    YES_BALL: "#4ade80", // vert vif
    NO_BALL: "#f87171", // rouge vif
    BACKGROUND: "#000000",
    CIRCLE_COLOR: "#ffffff",
    TEXT_PRIMARY: "#ffffff",
    TEXT_SECONDARY: "#94a3b8",
    SCORE_YES_BG: "#22c55e",
    SCORE_NO_BG: "#dc2626",
  },

  // Interface
  TIMER_FORMAT: "Time left: {seconds}",
  SCORE_FORMAT: {
    YES: "Yes : {score}",
    NO: "No : {score}",
  },

  // Style
  UI_FONT: "system-ui, -apple-system, sans-serif",
  COMMENT_STYLE: {
    FONT_SIZE: "32px",
    PADDING: "12px 24px",
    BORDER_RADIUS: "12px",
    TOP_POSITION: "8%",
  },
  SCORE_STYLE: {
    FONT_SIZE: "36px", // Plus gros
    PADDING: "6px 8px", // Plus de padding
    BORDER_RADIUS: "17px",
    TOP_POSITION: "25%", // Position fixe
    SPACING: "16px", // Espacement fixe
    MIN_WIDTH: "140px", // Plus large
    TEXT_ALIGN: "center" as const,
    FONT_WEIGHT: "800", // Plus gras
  },
  TIMER_STYLE: {
    FONT_SIZE: "42px", // Plus gros
    PADDING: "1px 2px", // Plus de padding
    BORDER_RADIUS: "21px",
    TOP_POSITION: "82%", // Position fixe absolue
    WIDTH: "300px", // Plus large pour éviter le retour à la ligne
    TEXT_ALIGN: "center" as const,
    FONT_WEIGHT: "999", // Plus gras
  },
} as const;

export const MIDI_CONFIG = {
  // Configuration héritée (conservée pour compatibilité)
  NOTE_DURATION: 0.2,
  VOLUME: 0.7,
  FREQUENCIES: {
    BALL_CIRCLE: [440, 523.25, 659.25],
    BALL_BALL: [880, 1046.5],
  },

  // Nouvelle configuration MIDI
  MIDI_ENABLED: true,
  PREVIEW_ONLY: false, // Audio dans le studio ET le rendu
  MAX_NOTE_DURATION: 2.0, // Durée maximale d'une note en secondes
  FALLBACK_TO_FREQUENCIES: true, // Utiliser les fréquences si MIDI échoue

  // Configuration Tone.js
  SYNTH_CONFIG: {
    OSCILLATOR_TYPE: "triangle" as const,
    ENVELOPE: {
      ATTACK: 0.02,
      DECAY: 0.1,
      SUSTAIN: 0.3,
      RELEASE: 1.2,
    },
    VOLUME_DB: -10, // Volume en dB pour éviter la distorsion
  },

  // Configuration de debug
  DEBUG_LOGS: true,
  LOG_NOTE_NAMES: true,
} as const;
