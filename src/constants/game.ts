export const GAME_CONFIG = {
  // Dimensions de la vidéo
  VIDEO_WIDTH: 1080,
  VIDEO_HEIGHT: 1920,
  FPS: 30,
  DURATION_IN_SECONDS: 61,

  // Configuration des balles
  BALL_RADIUS: 40,
  BALL_SPEED: 8,
  TRAIL_LENGTH: 12,
  BALL_MASS: 1,
  BALL_FRICTION: 0.98,
  BALL_ELASTICITY: 0.8,
  BALL_MIN_SPEED: 2,
  BALL_MAX_SPEED: 15,

  // Configuration des cercles
  MIN_CIRCLE_RADIUS: 100,
  MAX_CIRCLE_RADIUS: 500,
  CIRCLE_GAP_MIN_ANGLE: 45, // degrés
  CIRCLE_GAP_MAX_ANGLE: 60, // degrés
  CIRCLE_SPACING: 50,
  CIRCLE_STROKE_WIDTH: 15,
  SPIRAL_ROTATION_SPEED: 1, // degrés par frame
  SPIRAL_DENSITY: 15, // nombre de cercles
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
  COMMENT_TEXT: "Will she leave me soon?",
  TIMER_FORMAT: "Time left: {seconds}",
  SCORE_FORMAT: {
    YES: "Yes : {score}",
    NO: "No : {score}",
  },

  // Style
  UI_FONT: "system-ui, -apple-system, sans-serif",
  COMMENT_STYLE: {
    FONT_SIZE: "24px",
    PADDING: "8px 16px",
    BORDER_RADIUS: "8px",
  },
  SCORE_STYLE: {
    FONT_SIZE: "20px",
    PADDING: "4px 12px",
    BORDER_RADIUS: "6px",
  },
  TIMER_STYLE: {
    FONT_SIZE: "22px",
    PADDING: "6px 16px",
    BORDER_RADIUS: "8px",
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
