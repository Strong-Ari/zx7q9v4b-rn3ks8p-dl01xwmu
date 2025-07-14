export const GAME_CONFIG = {
  // Dimensions de la vidéo
  VIDEO_WIDTH: 1080,
  VIDEO_HEIGHT: 1920,
  FPS: 30, // Changé à 30 FPS
  DURATION_IN_SECONDS: 61, // 1 minute et 1 seconde

  // Configuration des balles
  BALL_RADIUS: 35,
  BALL_SPEED: 5,
  TRAIL_LENGTH: 12,
  BALL_MASS: 1,
  BALL_FRICTION: 0.99,
  BALL_ELASTICITY: 0.8,
  BALL_MIN_SPEED: 3,
  BALL_MAX_SPEED: 12,
  INITIAL_CIRCLE_RADIUS: 150, // Réduit pour éviter les collisions initiales

  // Configuration des cercles
  MIN_CIRCLE_RADIUS: 280, // Augmenté pour laisser plus d'espace au centre
  MAX_CIRCLE_RADIUS: 520, // Augmenté pour plus d'anneaux
  CIRCLE_GAP_MIN_ANGLE: 40, // degrés
  CIRCLE_GAP_MAX_ANGLE: 50, // degrés
  CIRCLE_SPACING: 40, // Réduit pour plus d'anneaux
  CIRCLE_STROKE_WIDTH: 10, // Réduit pour un look plus fin
  SPIRAL_ROTATION_SPEED: 0.05, // Réduit à 0.05 rotations par seconde (un tour complet en 20 secondes)
  SPIRAL_DENSITY: 12, // Augmenté pour plus d'anneaux
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
  COMMENT_TEXT: "Does my bro Watch corn pub?",
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
    FONT_SIZE: "28px",
    PADDING: "8px 20px",
    BORDER_RADIUS: "8px",
    TOP_POSITION: "15%",
    SPACING: "20px",
  },
  TIMER_STYLE: {
    FONT_SIZE: "28px",
    PADDING: "8px 20px",
    BORDER_RADIUS: "8px",
    TOP_POSITION: "22%",
  },
} as const;

export const MIDI_CONFIG = {
  NOTE_DURATION: 0.2,
  VOLUME: 0.7,
  FREQUENCIES: {
    BALL_CIRCLE: [440, 523.25, 659.25],
    BALL_BALL: [880, 1046.5],
  },
} as const;
