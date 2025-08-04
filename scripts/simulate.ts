import Matter from "matter-js";
import { GAME_CONFIG } from "../src/constants/game";
import fs from "fs";
import path from "path";

// Types pour les données de simulation
interface BallData {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

interface CircleData {
  id: number;
  radius: number;
  baseRotation: number;
  gapAngle: number;
  isExploding: boolean;
  explosionFrame?: number;
  explosionColor: string;
}

interface FrameData {
  frame: number;
  yesBall: BallData;
  noBall: BallData;
  circles: CircleData[];
  scores: { yes: number; no: number };
}

interface SimulationData {
  frames: FrameData[];
  metadata: {
    totalFrames: number;
    fps: number;
    duration: number;
    generatedAt: string;
  };
}

class BakedPhysicsEngine {
  private engine: Matter.Engine;
  private world: Matter.World;
  private yesBall!: Matter.Body; // Utiliser ! pour indiquer qu'elle sera assignée dans le constructeur
  private noBall!: Matter.Body; // Utiliser ! pour indiquer qu'elle sera assignée dans le constructeur
  private circles: CircleData[] = [];
  private circleSegments: Matter.Body[][] = [];
  private scores = { yes: 0, no: 0 };
  private frameCount = 0;

  constructor() {
    console.log("🚀 Initialisation du moteur physique pour simulation...");

    // Configuration identique au moteur original mais optimisée pour la simulation
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.5 },
      constraintIterations: 8,
      positionIterations: 10,
      velocityIterations: 8,
      timing: { timeScale: 1 },
    });

    this.engine.world.gravity.scale = 0.001;
    this.world = this.engine.world;

    this.initializeBodies();
    this.setupCollisions();
  }

  private initializeBodies() {
    const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
    const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
    const angle = Math.PI / 4;

    // Créer les balles
    this.yesBall = Matter.Bodies.circle(
      centerX + Math.cos(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      centerY + Math.sin(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      GAME_CONFIG.BALL_RADIUS,
      {
        label: "yesBall",
        friction: 0.005,
        frictionAir: 0.0005,
        restitution: 0.85,
        mass: 1,
        density: 0.0005,
        slop: 0.05,
        inertia: Infinity,
        collisionFilter: { category: 0x0002, mask: 0x0001 },
      }
    );

    this.noBall = Matter.Bodies.circle(
      centerX - Math.cos(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      centerY - Math.sin(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      GAME_CONFIG.BALL_RADIUS,
      {
        label: "noBall",
        friction: 0.005,
        frictionAir: 0.0005,
        restitution: 0.85,
        mass: 1,
        density: 0.0005,
        slop: 0.05,
        inertia: Infinity,
        collisionFilter: { category: 0x0002, mask: 0x0001 },
      }
    );

    // Vitesses initiales
    const initialSpeed = GAME_CONFIG.BALL_SPEED * 0.8;
    Matter.Body.setVelocity(this.yesBall, {
      x: Math.cos(angle) * initialSpeed,
      y: Math.sin(angle) * initialSpeed,
    });
    Matter.Body.setVelocity(this.noBall, {
      x: -Math.cos(angle) * initialSpeed,
      y: -Math.sin(angle) * initialSpeed,
    });

    // Créer les murs
    const wallThickness = 50;
    const walls = [
      Matter.Bodies.rectangle(
        GAME_CONFIG.VIDEO_WIDTH / 2,
        GAME_CONFIG.VIDEO_HEIGHT + wallThickness / 2,
        GAME_CONFIG.VIDEO_WIDTH,
        wallThickness,
        { isStatic: true, friction: 0.1, restitution: 0.8 }
      ),
      Matter.Bodies.rectangle(
        GAME_CONFIG.VIDEO_WIDTH / 2,
        -wallThickness / 2,
        GAME_CONFIG.VIDEO_WIDTH,
        wallThickness,
        { isStatic: true, friction: 0.1, restitution: 0.8 }
      ),
      Matter.Bodies.rectangle(
        -wallThickness / 2,
        GAME_CONFIG.VIDEO_HEIGHT / 2,
        wallThickness,
        GAME_CONFIG.VIDEO_HEIGHT,
        { isStatic: true, friction: 0.1, restitution: 0.8 }
      ),
      Matter.Bodies.rectangle(
        GAME_CONFIG.VIDEO_WIDTH + wallThickness / 2,
        GAME_CONFIG.VIDEO_HEIGHT / 2,
        wallThickness,
        GAME_CONFIG.VIDEO_HEIGHT,
        { isStatic: true, friction: 0.1, restitution: 0.8 }
      ),
    ];

    // Créer les cercles
    this.createCircles();

    // Ajouter tout au monde
    Matter.World.add(this.world, [this.yesBall, this.noBall, ...walls]);
    this.circleSegments.forEach((segments) => {
      Matter.World.add(this.world, segments);
    });
  }

  private createCircles() {
    const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
    const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
    const radiusStep =
      (GAME_CONFIG.MAX_CIRCLE_RADIUS - GAME_CONFIG.MIN_CIRCLE_RADIUS) /
      (GAME_CONFIG.SPIRAL_DENSITY - 1);

    for (let i = 0; i < GAME_CONFIG.SPIRAL_DENSITY; i++) {
      const radius = GAME_CONFIG.MIN_CIRCLE_RADIUS + radiusStep * i * 1.5;
      const gapAngle =
        GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE +
        Math.random() *
          (GAME_CONFIG.CIRCLE_GAP_MAX_ANGLE - GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE);

      // Données du cercle
      const circleData: CircleData = {
        id: i,
        radius,
        baseRotation: (i * 360) / GAME_CONFIG.SPIRAL_DENSITY,
        gapAngle,
        isExploding: false,
        explosionColor: GAME_CONFIG.COLORS.YES_BALL,
      };
      this.circles.push(circleData);

      // Créer les segments physiques
      const segments: Matter.Body[] = [];
      const segmentCount = 36;

      for (let j = 0; j < segmentCount; j++) {
        const angle = (j * 360) / segmentCount;
        if (angle < 360 - gapAngle) {
          const segment = Matter.Bodies.rectangle(
            centerX + radius * Math.cos((angle * Math.PI) / 180),
            centerY + radius * Math.sin((angle * Math.PI) / 180),
            radius * 0.15,
            GAME_CONFIG.CIRCLE_STROKE_WIDTH * 1.5,
            {
              isStatic: true,
              angle: (angle * Math.PI) / 180,
              label: `circle_${i}_segment_${j}`,
              collisionFilter: { category: 0x0001, mask: 0x0002 },
              chamfer: { radius: 2 },
              friction: 0.1,
              restitution: 0.5,
            }
          );
          segments.push(segment);
        }
      }
      this.circleSegments.push(segments);
    }
  }

  private setupCollisions() {
    Matter.Events.on(this.engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const ballBody =
          bodyA.label === "yesBall" || bodyA.label === "noBall"
            ? bodyA
            : bodyB.label === "yesBall" || bodyB.label === "noBall"
              ? bodyB
              : null;
        const circleBody = bodyA.label.startsWith("circle_")
          ? bodyA
          : bodyB.label.startsWith("circle_")
            ? bodyB
            : null;

        if (ballBody && circleBody) {
          const circleId = parseInt(circleBody.label.split("_")[1]);
          const circle = this.circles[circleId];

          if (!circle.isExploding) {
            const timeInSeconds = this.frameCount / GAME_CONFIG.FPS;
            const currentRotation =
              circle.baseRotation +
              timeInSeconds * GAME_CONFIG.SPIRAL_ROTATION_SPEED * 360;

            const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
            const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
            const ballAngle =
              (Math.atan2(
                ballBody.position.y - centerY,
                ballBody.position.x - centerX
              ) *
                180) /
              Math.PI;

            const normalizedBallAngle = (ballAngle + 360) % 360;
            const gapStart = currentRotation % 360;
            const gapEnd = (gapStart + circle.gapAngle) % 360;

            const isInGap =
              gapStart <= gapEnd
                ? normalizedBallAngle >= gapStart && normalizedBallAngle <= gapEnd
                : normalizedBallAngle >= gapStart || normalizedBallAngle <= gapEnd;

            if (isInGap) {
              // Marquer le cercle comme explosé
              circle.isExploding = true;
              circle.explosionFrame = this.frameCount;
              circle.explosionColor =
                ballBody.label === "yesBall"
                  ? GAME_CONFIG.COLORS.YES_BALL
                  : GAME_CONFIG.COLORS.NO_BALL;

              // Mettre à jour le score
              if (ballBody.label === "yesBall") {
                this.scores.yes++;
              } else {
                this.scores.no++;
              }

              // Supprimer les segments physiques
              Matter.World.remove(this.world, this.circleSegments[circleId]);
            } else {
              // Rebond
              const velocity = ballBody.velocity;
              const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
              const radius = Math.sqrt(
                Math.pow(ballBody.position.x - centerX, 2) +
                  Math.pow(ballBody.position.y - centerY, 2)
              );
              const normalX = (ballBody.position.x - centerX) / radius;
              const normalY = (ballBody.position.y - centerY) / radius;

              Matter.Body.setVelocity(ballBody, {
                x: -normalX * speed,
                y: -normalY * speed,
              });

              Matter.Body.setPosition(ballBody, {
                x: ballBody.position.x + normalX * 2,
                y: ballBody.position.y + normalY * 2,
              });
            }
          }
        }

        // Collision entre balles
        if (
          (bodyA.label === "yesBall" || bodyA.label === "noBall") &&
          (bodyB.label === "yesBall" || bodyB.label === "noBall") &&
          bodyA.label !== bodyB.label
        ) {
          // Événement collision balles (pour le son)
        }
      });
    });
  }

  private update() {
    const deltaTime = 1000 / GAME_CONFIG.FPS; // Delta fixe
    Matter.Engine.update(this.engine, deltaTime);

    // Contraintes de vitesse
    const bodies = [this.yesBall, this.noBall];
    bodies.forEach((body) => {
      const velocity = body.velocity;
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      if (speed < GAME_CONFIG.BALL_MIN_SPEED && speed > 0) {
        const factor = GAME_CONFIG.BALL_MIN_SPEED / speed;
        Matter.Body.setVelocity(body, {
          x: velocity.x * factor,
          y: velocity.y * factor,
        });
      } else if (speed > GAME_CONFIG.BALL_MAX_SPEED) {
        const factor = GAME_CONFIG.BALL_MAX_SPEED / speed;
        Matter.Body.setVelocity(body, {
          x: velocity.x * factor,
          y: velocity.y * factor,
        });
      }
    });

    this.frameCount++;
  }

  private captureFrame(): FrameData {
    return {
      frame: this.frameCount,
      yesBall: {
        position: { x: this.yesBall.position.x, y: this.yesBall.position.y },
        velocity: { x: this.yesBall.velocity.x, y: this.yesBall.velocity.y },
      },
      noBall: {
        position: { x: this.noBall.position.x, y: this.noBall.position.y },
        velocity: { x: this.noBall.velocity.x, y: this.noBall.velocity.y },
      },
      circles: this.circles.map((circle) => ({ ...circle })),
      scores: { ...this.scores },
    };
  }

  public simulate(): SimulationData {
    const totalFrames = GAME_CONFIG.DURATION_IN_SECONDS * GAME_CONFIG.FPS;
    const frames: FrameData[] = [];

    console.log(`🎮 Simulation de ${totalFrames} frames (${GAME_CONFIG.DURATION_IN_SECONDS}s à ${GAME_CONFIG.FPS}fps)...`);

    for (let frame = 0; frame < totalFrames; frame++) {
      this.update();
      frames.push(this.captureFrame());

      // Progress bar
      if (frame % 100 === 0) {
        const progress = ((frame / totalFrames) * 100).toFixed(1);
        console.log(`📊 Progression: ${progress}% (${frame}/${totalFrames} frames)`);
      }
    }

    return {
      frames,
      metadata: {
        totalFrames,
        fps: GAME_CONFIG.FPS,
        duration: GAME_CONFIG.DURATION_IN_SECONDS,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  public cleanup() {
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
  }
}

// Script principal
async function main() {
  console.log("🎯 === SIMULATION PHYSIQUE PRÉCALCULÉE ===");
  console.log(`📋 Configuration: ${GAME_CONFIG.DURATION_IN_SECONDS}s × ${GAME_CONFIG.FPS}fps = ${GAME_CONFIG.DURATION_IN_SECONDS * GAME_CONFIG.FPS} frames`);

  const startTime = Date.now();

  try {
    // Créer le dossier de données s'il n'existe pas
    const dataDir = path.join(process.cwd(), "src", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Simulation
    const engine = new BakedPhysicsEngine();
    const simulationData = engine.simulate();
    engine.cleanup();

    // Sauvegarde
    const outputPath = path.join(dataDir, "simulation-data.json");
    fs.writeFileSync(outputPath, JSON.stringify(simulationData, null, 2));

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log("✅ === SIMULATION TERMINÉE ===");
    console.log(`⏱️  Durée: ${duration.toFixed(2)}s`);
    console.log(`📁 Fichier: ${outputPath}`);
    console.log(`📊 Taille: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🎯 Scores finaux: YES=${simulationData.frames[simulationData.frames.length - 1].scores.yes}, NO=${simulationData.frames[simulationData.frames.length - 1].scores.no}`);

    // Générer aussi une version TypeScript pour l'import
    const tsContent = `// Auto-généré le ${new Date().toISOString()}
// Données de simulation précalculées pour l'export optimisé

import type { SimulationData } from '../types/simulation';

export const simulationData: SimulationData = ${JSON.stringify(simulationData, null, 2)};
`;

    const tsOutputPath = path.join(dataDir, "simulation-data.ts");
    fs.writeFileSync(tsOutputPath, tsContent);
    console.log(`📄 Version TypeScript: ${tsOutputPath}`);

  } catch (error) {
    console.error("❌ Erreur lors de la simulation:", error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

export { BakedPhysicsEngine };
export type { SimulationData, FrameData, BallData, CircleData };