export const GAME_CONFIG = {
  // Dimensions de la vidéo
  VIDEO_WIDTH: 1080,
  VIDEO_HEIGHT: 1920,
  FPS: 30, // Changé à 30 FPS
  DURATION_IN_SECONDS: 61, // 1 minute et 1 seconde

  // Configuration des balles - Paramètres optimisés et corrigés
  BALL_RADIUS: 35,
  BALL_SPEED: 6, // Augmenté légèrement pour plus de dynamisme
  TRAIL_LENGTH: 8, // Réduit pour de meilleures performances
  BALL_MASS: 1,
  BALL_FRICTION: 0.005, // FIXÉ: Valeur Matter.js réelle (au lieu de 0.995)
  BALL_FRICTION_AIR: 0.0005, // AJOUTÉ: Friction de l'air
  BALL_ELASTICITY: 0.85, // FIXÉ: Restitution réelle (au lieu de 0.9)
  BALL_DENSITY: 0.0005, // AJOUTÉ: Densité pour Matter.js
  BALL_SLOP: 0.05, // AJOUTÉ: Tolérance de collision
  BALL_MIN_SPEED: 2, // Réduit pour permettre des mouvements plus lents
  BALL_MAX_SPEED: 15, // Augmenté pour plus d'intensité
  INITIAL_CIRCLE_RADIUS: 120, // Réduit pour plus d'espace de mouvement initial

  // Configuration des cercles - Paramètres optimisés pour une meilleure synchronisation
  MIN_CIRCLE_RADIUS: 250, // Réduit pour plus d'espace central
  MAX_CIRCLE_RADIUS: 500, // Légèrement réduit pour un meilleur équilibre
  CIRCLE_GAP_MIN_ANGLE: 35, // Réduit pour des ouvertures plus petites (plus difficile)
  CIRCLE_GAP_MAX_ANGLE: 45, // Réduit pour plus de défi
  CIRCLE_SPACING: 35, // Réduit pour plus d'anneaux
  CIRCLE_STROKE_WIDTH: 8, // Réduit pour un look plus élégant
  SPIRAL_ROTATION_SPEED: 0.05, // Vitesse réduite pour une rotation plus lente et fluide
  SPIRAL_DENSITY: 15, // Augmenté pour plus d'anneaux
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
