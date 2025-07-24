// Types pour les données de simulation précalculées

export interface BallData {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

export interface CircleData {
  id: number;
  radius: number;
  baseRotation: number;
  gapAngle: number;
  isExploding: boolean;
  explosionFrame?: number;
  explosionColor: string;
}

export interface FrameData {
  frame: number;
  yesBall: BallData;
  noBall: BallData;
  circles: CircleData[];
  scores: { yes: number; no: number };
}

export interface SimulationData {
  frames: FrameData[];
  metadata: {
    totalFrames: number;
    fps: number;
    duration: number;
    generatedAt: string;
  };
}

// Données pour la traînée des balles (calculées dynamiquement)
export interface BallTrailData {
  trail: Array<{ x: number; y: number }>;
}

// Interface pour le nouvel état de jeu basé sur les données précalculées
export interface BakedGameState {
  yesBall: BallData & BallTrailData;
  noBall: BallData & BallTrailData;
  circles: CircleData[];
  scores: { yes: number; no: number };
}