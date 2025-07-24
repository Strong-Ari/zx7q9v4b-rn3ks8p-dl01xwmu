export const GAME_CONFIG = {
  // Dimensions de la vidéo
  VIDEO_WIDTH: 1080,
  VIDEO_HEIGHT: 1920,
  FPS: 30, // Changé à 30 FPS
  DURATION_IN_SECONDS: 61, // 1 minute et 1 seconde

  // Configuration des balles - Paramètres optimisés pour la fluidité
  BALL_RADIUS: 35,
  BALL_SPEED: 5, // FIX: Vitesse réduite pour plus de contrôle
  TRAIL_LENGTH: 18, // FIX: Augmenté pour des traînées plus visibles et fluides
  BALL_MASS: 1,
  BALL_FRICTION: 0.998, // FIX: Friction optimisée pour la fluidité
  BALL_ELASTICITY: 0.85, // FIX: Élasticité ajustée pour des rebonds plus naturels
  BALL_MIN_SPEED: 1.5, // FIX: Vitesse minimum plus basse pour permettre des mouvements plus doux
  BALL_MAX_SPEED: 12, // FIX: Vitesse maximum réduite pour plus de contrôle
  INITIAL_CIRCLE_RADIUS: 140, // FIX: Rayon initial optimisé

  // Configuration des cercles - Paramètres optimisés pour une meilleure synchronisation
  MIN_CIRCLE_RADIUS: 250, // Réduit pour plus d'espace central
  MAX_CIRCLE_RADIUS: 500, // Légèrement réduit pour un meilleur équilibre
  CIRCLE_GAP_MIN_ANGLE: 40, // Réduit pour des ouvertures plus petites (plus difficile)
  CIRCLE_GAP_MAX_ANGLE: 50, // Réduit pour plus de défi
  CIRCLE_SPACING: 35, // Réduit pour plus d'anneaux
  CIRCLE_STROKE_WIDTH: 8, // Réduit pour un look plus élégant
  SPIRAL_ROTATION_SPEED: 0.04, // FIX: Vitesse encore plus réduite pour une rotation très fluide
  SPIRAL_DENSITY: 15, // Augmenté pour plus d'anneaux
  CIRCLE_GRADIENT_START: "#4ade80",
  CIRCLE_GRADIENT_END: "#22d3ee",

  // Animation
  WINNER_ANIMATION_DURATION: 90, // Durée de l'animation du gagnant en frames

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
    FONT_SIZE: "38px",
    PADDING: "8px 20px",
    BORDER_RADIUS: "12px",
    TOP_POSITION: "22%",
    SPACING: "20px",
  },
  TIMER_STYLE: {
    FONT_SIZE: "58px",
    PADDING: "8px 20px",
    BORDER_RADIUS: "24px",
    TOP_POSITION: "82%",
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
