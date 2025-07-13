import Matter from "matter-js";
import { GAME_CONFIG } from "../constants/game";

export interface PhysicsState {
  yesBall: Matter.Body;
  noBall: Matter.Body;
  circles: Array<{
    id: number;
    segments: Matter.Body[];
    isExploding: boolean;
    explosionColor: string;
  }>;
}

class PhysicsEngine {
  private engine: Matter.Engine;
  private world: Matter.World;
  private runner: Matter.Runner;
  private state: PhysicsState;
  private collisionHandlers: {
    onBallCircleCollision: (ballId: string, circleId: number) => void;
    onBallBallCollision: () => void;
  };
  private lastFrameTime: number = 0;

  constructor(
    onBallCircleCollision: (ballId: string, circleId: number) => void,
    onBallBallCollision: () => void,
  ) {
    // Créer le moteur physique avec des paramètres plus précis
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
      constraintIterations: 8,
      positionIterations: 12,
      velocityIterations: 8,
      timing: {
        timeScale: 1,
        timestamp: 0,
      },
    });

    this.world = this.engine.world;
    this.runner = Matter.Runner.create();
    this.collisionHandlers = {
      onBallCircleCollision,
      onBallBallCollision,
    };

    // Initialiser l'état
    this.state = this.initializeState();

    // Configurer les collisions
    Matter.Events.on(this.engine, "collisionStart", this.handleCollisions);
  }

  private initializeState(): PhysicsState {
    const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
    const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
    const angle = Math.PI / 4;

    // Créer les balles avec des propriétés physiques ajustées
    const yesBall = Matter.Bodies.circle(
      centerX + Math.cos(angle) * GAME_CONFIG.MIN_CIRCLE_RADIUS,
      centerY + Math.sin(angle) * GAME_CONFIG.MIN_CIRCLE_RADIUS,
      GAME_CONFIG.BALL_RADIUS,
      {
        label: "yesBall",
        friction: 0.001,
        frictionAir: 0.0005,
        restitution: GAME_CONFIG.BALL_ELASTICITY,
        mass: GAME_CONFIG.BALL_MASS,
        density: 0.001,
        slop: 0.05,
        timeScale: 1,
      },
    );

    const noBall = Matter.Bodies.circle(
      centerX - Math.cos(angle) * GAME_CONFIG.MIN_CIRCLE_RADIUS,
      centerY - Math.sin(angle) * GAME_CONFIG.MIN_CIRCLE_RADIUS,
      GAME_CONFIG.BALL_RADIUS,
      {
        label: "noBall",
        friction: 0.001,
        frictionAir: 0.0005,
        restitution: GAME_CONFIG.BALL_ELASTICITY,
        mass: GAME_CONFIG.BALL_MASS,
        density: 0.001,
        slop: 0.05,
        timeScale: 1,
      },
    );

    // Appliquer la vitesse initiale
    Matter.Body.setVelocity(yesBall, {
      x: Math.cos(angle) * GAME_CONFIG.BALL_SPEED,
      y: Math.sin(angle) * GAME_CONFIG.BALL_SPEED,
    });

    Matter.Body.setVelocity(noBall, {
      x: -Math.cos(angle) * GAME_CONFIG.BALL_SPEED,
      y: -Math.sin(angle) * GAME_CONFIG.BALL_SPEED,
    });

    // Créer les cercles avec leurs segments
    const circles = this.createCircles();

    // Ajouter tous les corps au monde
    Matter.World.add(this.world, [yesBall, noBall]);
    circles.forEach((circle) => {
      Matter.World.add(this.world, circle.segments);
    });

    return {
      yesBall,
      noBall,
      circles,
    };
  }

  private createCircles() {
    const circles: PhysicsState["circles"] = [];
    const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
    const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
    const spiralSpacing =
      (GAME_CONFIG.MAX_CIRCLE_RADIUS - GAME_CONFIG.MIN_CIRCLE_RADIUS) /
      GAME_CONFIG.SPIRAL_DENSITY;

    for (let i = 0; i < GAME_CONFIG.SPIRAL_DENSITY; i++) {
      const radius = GAME_CONFIG.MIN_CIRCLE_RADIUS + i * spiralSpacing;
      const gapAngle =
        GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE +
        Math.random() *
          (GAME_CONFIG.CIRCLE_GAP_MAX_ANGLE - GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE);
      const gapRotation = Math.random() * 360;
      const baseRotation = (i * 360) / GAME_CONFIG.SPIRAL_DENSITY;

      // Créer les segments du cercle
      const segments = this.createCircleSegments(
        i,
        radius,
        gapAngle,
        gapRotation + baseRotation,
      );

      circles.push({
        id: i,
        segments,
        isExploding: false,
        explosionColor: "none",
      });
    }

    return circles;
  }

  private createCircleSegments(
    circleId: number,
    radius: number,
    gapAngle: number,
    rotation: number,
  ): Matter.Body[] {
    const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
    const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
    const segments: Matter.Body[] = [];

    // Convertir les angles en radians
    const gapStart = (rotation * Math.PI) / 180;
    const gapEnd = ((rotation + gapAngle) * Math.PI) / 180;
    const arcLength = 2 * Math.PI - (gapEnd - gapStart);

    // Augmenter le nombre de segments pour une meilleure précision
    const numSegments = Math.ceil(arcLength / (Math.PI / 16));
    const segmentAngle = arcLength / numSegments;

    // Créer les segments
    for (let i = 0; i < numSegments; i++) {
      const angle1 = gapEnd + i * segmentAngle;
      const angle2 = angle1 + segmentAngle;

      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);

      const segment = Matter.Bodies.rectangle(
        (x1 + x2) / 2,
        (y1 + y2) / 2,
        Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        GAME_CONFIG.CIRCLE_STROKE_WIDTH,
        {
          angle: Math.atan2(y2 - y1, x2 - x1),
          isStatic: true,
          label: `circle_${circleId}`,
          render: { visible: false },
          friction: 0,
          restitution: GAME_CONFIG.BALL_ELASTICITY,
          slop: 0.05,
        },
      );

      segments.push(segment);
    }

    return segments;
  }

  private handleCollisions = (event: Matter.IEventCollision<Matter.Engine>) => {
    event.pairs.forEach((pair) => {
      const { bodyA, bodyB } = pair;

      // Collision entre balles
      if (
        (bodyA.label === "yesBall" && bodyB.label === "noBall") ||
        (bodyA.label === "noBall" && bodyB.label === "yesBall")
      ) {
        this.collisionHandlers.onBallBallCollision();
        return;
      }

      // Collision avec un segment de cercle
      const ballBody =
        bodyA.label === "yesBall" || bodyA.label === "noBall" ? bodyA : bodyB;
      const circleBody = bodyA.label.startsWith("circle_") ? bodyA : bodyB;

      if (ballBody && circleBody) {
        const circleId = parseInt(circleBody.label.split("_")[1]);
        this.collisionHandlers.onBallCircleCollision(ballBody.label, circleId);
      }
    });
  };

  public update(frame: number) {
    // Calculer le delta temps depuis la dernière frame
    const currentTime = frame * (1000 / GAME_CONFIG.FPS);
    const deltaTime = this.lastFrameTime
      ? currentTime - this.lastFrameTime
      : 1000 / GAME_CONFIG.FPS;
    this.lastFrameTime = currentTime;

    // Mettre à jour le moteur physique avec le delta temps
    Matter.Engine.update(this.engine, deltaTime);

    // Mettre à jour la rotation des segments des cercles
    this.state.circles.forEach((circle, circleIndex) => {
      if (!circle.isExploding) {
        const rotationSpeed =
          GAME_CONFIG.SPIRAL_ROTATION_SPEED * (Math.PI / 180);
        const baseRotation =
          ((circleIndex * 360) / GAME_CONFIG.SPIRAL_DENSITY) * (Math.PI / 180);
        const currentRotation = frame * rotationSpeed + baseRotation;

        circle.segments.forEach((segment) => {
          const radius = Math.sqrt(
            Math.pow(segment.position.x - GAME_CONFIG.VIDEO_WIDTH / 2, 2) +
              Math.pow(segment.position.y - GAME_CONFIG.VIDEO_HEIGHT / 2, 2),
          );

          Matter.Body.setPosition(segment, {
            x:
              GAME_CONFIG.VIDEO_WIDTH / 2 +
              radius * Math.cos(segment.angle + currentRotation),
            y:
              GAME_CONFIG.VIDEO_HEIGHT / 2 +
              radius * Math.sin(segment.angle + currentRotation),
          });

          Matter.Body.setAngle(segment, segment.angle + currentRotation);
        });
      }
    });

    // Appliquer les contraintes de vitesse
    const bodies = [this.state.yesBall, this.state.noBall];
    bodies.forEach((body) => {
      const velocity = body.velocity;
      const speed = Math.sqrt(
        velocity.x * velocity.x + velocity.y * velocity.y,
      );

      // Vitesse minimale
      if (speed < GAME_CONFIG.BALL_MIN_SPEED) {
        const factor = GAME_CONFIG.BALL_MIN_SPEED / speed;
        Matter.Body.setVelocity(body, {
          x: velocity.x * factor,
          y: velocity.y * factor,
        });
      }

      // Vitesse maximale
      if (speed > GAME_CONFIG.BALL_MAX_SPEED) {
        const factor = GAME_CONFIG.BALL_MAX_SPEED / speed;
        Matter.Body.setVelocity(body, {
          x: velocity.x * factor,
          y: velocity.y * factor,
        });
      }
    });
  }

  public getState(): PhysicsState {
    return this.state;
  }

  public removeCircleSegments(circleId: number) {
    const circle = this.state.circles[circleId];
    if (circle && !circle.isExploding) {
      Matter.World.remove(this.world, circle.segments);
      circle.isExploding = true;
    }
  }

  public cleanup() {
    Matter.Runner.stop(this.runner);
    Matter.Engine.clear(this.engine);
    Matter.World.clear(this.world, false);
  }
}

export default PhysicsEngine;
