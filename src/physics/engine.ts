import Matter from "matter-js";
import { GAME_CONFIG } from "../constants/game";

interface PhysicsState {
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
  private state: PhysicsState;
  private collisionHandlers: {
    onBallCircleCollision: (ballId: string, circleId: number) => void;
    onBallBallCollision: () => void;
  };
  private lastFrameTime: number = 0;
  private frameCount: number = 0;

  constructor(
    onBallCircleCollision: (ballId: string, circleId: number) => void,
    onBallBallCollision: () => void,
  ) {
    // Créer le moteur physique avec des paramètres réalistes
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.5 }, // Ajouter une gravité légère
      constraintIterations: 8,
      positionIterations: 12,
      velocityIterations: 8,
      timing: {
        timeScale: 1,
      },
    });

    // Ajuster les paramètres de simulation pour plus de stabilité
    this.engine.world.gravity.scale = 0.001; // Réduire l'échelle de la gravité pour un effet plus subtil
    this.engine.timing.timeScale = 1;

    this.world = this.engine.world;
    this.collisionHandlers = {
      onBallCircleCollision,
      onBallBallCollision,
    };

    // Initialiser l'état
    this.state = this.initializeState();

    // Configurer les collisions avec la logique originale
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
          const circle = this.state.circles[circleId];

          if (!circle.isExploding) {
            const timeInSeconds = this.frameCount / GAME_CONFIG.FPS;
            const baseRotation = (circleId * 360) / GAME_CONFIG.SPIRAL_DENSITY;
            const currentRotation =
              baseRotation +
              timeInSeconds * GAME_CONFIG.SPIRAL_ROTATION_SPEED * 360;

            const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
            const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
            const ballAngle =
              (Math.atan2(
                ballBody.position.y - centerY,
                ballBody.position.x - centerX,
              ) *
                180) /
              Math.PI;

            const normalizedBallAngle = (ballAngle + 360) % 360;
            const gapStart = currentRotation % 360;
            const gapEnd = (gapStart + GAME_CONFIG.CIRCLE_GAP_MAX_ANGLE) % 360;

            const isInGap =
              gapStart <= gapEnd
                ? normalizedBallAngle >= gapStart &&
                  normalizedBallAngle <= gapEnd
                : normalizedBallAngle >= gapStart ||
                  normalizedBallAngle <= gapEnd;

            if (isInGap) {
              this.collisionHandlers.onBallCircleCollision(
                ballBody.label,
                circleId,
              );
            } else {
              Matter.Body.setVelocity(ballBody, {
                x: -ballBody.velocity.x * 0.8,
                y: -ballBody.velocity.y * 0.8,
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
          this.collisionHandlers.onBallBallCollision();
        }
      });
    });
  }

  private initializeState(): PhysicsState {
    const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
    const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
    const angle = Math.PI / 4;

    // Créer les balles avec des propriétés physiques réalistes
    const yesBall = Matter.Bodies.circle(
      centerX + Math.cos(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      centerY + Math.sin(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      GAME_CONFIG.BALL_RADIUS,
      {
        label: "yesBall",
        friction: 0.01, // Très peu de friction pour des mouvements fluides
        frictionAir: 0.001, // Légère résistance de l'air
        restitution: 0.8, // Rebonds élastiques (0.8 = 80% de l'énergie conservée)
        mass: 1,
        density: 0.001,
        slop: 0.05, // Tolérance de chevauchement pour éviter les tremblements
        inertia: Infinity, // Empêche la rotation de la balle
      },
    );

    const noBall = Matter.Bodies.circle(
      centerX - Math.cos(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      centerY - Math.sin(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      GAME_CONFIG.BALL_RADIUS,
      {
        label: "noBall",
        friction: 0.01,
        frictionAir: 0.001,
        restitution: 0.8,
        mass: 1,
        density: 0.001,
        slop: 0.05,
        inertia: Infinity,
      },
    );

    // Appliquer une vitesse initiale plus naturelle
    const initialSpeed = GAME_CONFIG.BALL_SPEED * 0.8;
    Matter.Body.setVelocity(yesBall, {
      x: Math.cos(angle) * initialSpeed,
      y: Math.sin(angle) * initialSpeed,
    });

    Matter.Body.setVelocity(noBall, {
      x: -Math.cos(angle) * initialSpeed,
      y: -Math.sin(angle) * initialSpeed,
    });

    // Créer les murs invisibles pour contenir les balles
    const wallThickness = 50;
    const walls = [
      // Sol
      Matter.Bodies.rectangle(
        GAME_CONFIG.VIDEO_WIDTH / 2,
        GAME_CONFIG.VIDEO_HEIGHT + wallThickness / 2,
        GAME_CONFIG.VIDEO_WIDTH,
        wallThickness,
        { isStatic: true, friction: 0.1, restitution: 0.8 },
      ),
      // Plafond
      Matter.Bodies.rectangle(
        GAME_CONFIG.VIDEO_WIDTH / 2,
        -wallThickness / 2,
        GAME_CONFIG.VIDEO_WIDTH,
        wallThickness,
        { isStatic: true, friction: 0.1, restitution: 0.8 },
      ),
      // Mur gauche
      Matter.Bodies.rectangle(
        -wallThickness / 2,
        GAME_CONFIG.VIDEO_HEIGHT / 2,
        wallThickness,
        GAME_CONFIG.VIDEO_HEIGHT,
        { isStatic: true, friction: 0.1, restitution: 0.8 },
      ),
      // Mur droit
      Matter.Bodies.rectangle(
        GAME_CONFIG.VIDEO_WIDTH + wallThickness / 2,
        GAME_CONFIG.VIDEO_HEIGHT / 2,
        wallThickness,
        GAME_CONFIG.VIDEO_HEIGHT,
        { isStatic: true, friction: 0.1, restitution: 0.8 },
      ),
    ];

    // Créer les cercles avec leurs segments
    const circles = this.createCircles();

    // Ajouter tous les corps au monde
    Matter.World.add(this.world, [yesBall, noBall, ...walls]);
    circles.forEach((circle) => {
      Matter.World.add(this.world, circle.segments);
    });

    return {
      yesBall,
      noBall,
      circles,
    };
  }

  public update(frame: number) {
    const currentTime = frame * (1000 / GAME_CONFIG.FPS);
    const deltaTime = this.lastFrameTime
      ? currentTime - this.lastFrameTime
      : 1000 / GAME_CONFIG.FPS;
    this.lastFrameTime = currentTime;
    this.frameCount = frame;

    Matter.Engine.update(this.engine, deltaTime);

    // Mettre à jour la rotation des segments des cercles de manière fluide
    this.state.circles.forEach((circle, circleIndex) => {
      if (!circle.isExploding) {
        // Calculer la rotation de la même manière que dans SemiCircle.tsx
        const ringPosition = ((circleIndex * 360) / GAME_CONFIG.SPIRAL_DENSITY) * 
          (circle.segments.length > 0 ? 
            Math.sqrt(Math.pow(circle.segments[0].position.x - GAME_CONFIG.VIDEO_WIDTH / 2, 2) +
                     Math.pow(circle.segments[0].position.y - GAME_CONFIG.VIDEO_HEIGHT / 2, 2)) / GAME_CONFIG.MAX_CIRCLE_RADIUS 
            : 1);
        
        const baseSpeed = 0.5;
        const speedMultiplier = 1 - ringPosition;
        const rotationSpeed = baseSpeed * (0.5 + speedMultiplier * 0.5);
        const currentRotation = (frame * rotationSpeed + ringPosition * GAME_CONFIG.MAX_CIRCLE_RADIUS) % 360;
        const totalRotation = (currentRotation * Math.PI) / 180;

        const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
        const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;

        circle.segments.forEach((segment, segmentIndex) => {
          const radius = Math.sqrt(
            Math.pow(segment.position.x - centerX, 2) +
              Math.pow(segment.position.y - centerY, 2),
          );

          const newAngle = segmentIndex * (360 / circle.segments.length) + currentRotation;
          const radians = (newAngle * Math.PI) / 180;

          Matter.Body.setPosition(segment, {
            x: centerX + radius * Math.cos(radians),
            y: centerY + radius * Math.sin(radians),
          });

          Matter.Body.setAngle(segment, radians);
        });
      }
    });

    // Appliquer les contraintes de vitesse aux balles
    const bodies = [this.state.yesBall, this.state.noBall];
    bodies.forEach((body) => {
      const velocity = body.velocity;
      const speed = Math.sqrt(
        velocity.x * velocity.x + velocity.y * velocity.y,
      );

      // Ajuster la vitesse en fonction du temps écoulé
      const timeProgress =
        frame / (GAME_CONFIG.DURATION_IN_SECONDS * GAME_CONFIG.FPS);
      const speedMultiplier = 1 + timeProgress * 0.5; // Augmentation progressive de la vitesse

      // Appliquer les limites de vitesse
      if (speed < GAME_CONFIG.BALL_MIN_SPEED * speedMultiplier) {
        const factor = (GAME_CONFIG.BALL_MIN_SPEED * speedMultiplier) / speed;
        Matter.Body.setVelocity(body, {
          x: velocity.x * factor,
          y: velocity.y * factor,
        });
      } else if (speed > GAME_CONFIG.BALL_MAX_SPEED * speedMultiplier) {
        const factor = (GAME_CONFIG.BALL_MAX_SPEED * speedMultiplier) / speed;
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
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
  }

  private createCircles() {
    const circles: PhysicsState["circles"] = [];
    const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
    const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;

    // Augmenter l'espacement entre les cercles
    const radiusStep =
      (GAME_CONFIG.MAX_CIRCLE_RADIUS - GAME_CONFIG.MIN_CIRCLE_RADIUS) /
      (GAME_CONFIG.SPIRAL_DENSITY - 1);

    for (let i = 0; i < GAME_CONFIG.SPIRAL_DENSITY; i++) {
      const radius = GAME_CONFIG.MIN_CIRCLE_RADIUS + radiusStep * i * 1.5; // Augmentation de 50% de l'espacement

      const segments: Matter.Body[] = [];
      const segmentCount = 36;
      const gapAngle =
        GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE +
        Math.random() *
          (GAME_CONFIG.CIRCLE_GAP_MAX_ANGLE - GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE);

      for (let j = 0; j < segmentCount; j++) {
        const angle = (j * 360) / segmentCount;
        if (angle < 360 - gapAngle) {
          const segment = Matter.Bodies.rectangle(
            centerX + radius * Math.cos((angle * Math.PI) / 180),
            centerY + radius * Math.sin((angle * Math.PI) / 180),
            radius * 0.1,
            GAME_CONFIG.CIRCLE_STROKE_WIDTH,
            {
              isStatic: true,
              angle: (angle * Math.PI) / 180,
              label: `circle_${i}_segment_${j}`,
              render: {
                fillStyle: GAME_CONFIG.COLORS.CIRCLE_COLOR,
              },
            },
          );
          segments.push(segment);
        }
      }

      circles.push({
        id: i,
        segments,
        isExploding: false,
        explosionColor: GAME_CONFIG.COLORS.YES_BALL,
      });
    }

    return circles;
  }
}

export default PhysicsEngine;
