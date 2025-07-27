import Matter from "matter-js";
import { GAME_CONFIG } from "../constants/game";

interface PhysicsState {
  yesBall: Matter.Body;
  noBall: Matter.Body;
  yesBallRadius: number;
  noBallRadius: number;
  circles: Array<{
    id: number;
    radius: number;
    appearTime: number;
    segments: Matter.Body[];
    isExploding: boolean;
    explosionColor: string;
  }>;
}

class PhysicsEngine {
  private engine: Matter.Engine;
  private world: Matter.World;
  private state: PhysicsState;
  private shrinkSpeed = 20; // px/sec
  private interval = 2; // secondes entre chaque cercle
  private initialRings = 3; // nombre de cercles présents au début
  private maxCircles = GAME_CONFIG.SPIRAL_DENSITY;
  private minRadius = GAME_CONFIG.BALL_RADIUS_MIN;
  private maxRadius = GAME_CONFIG.MAX_CIRCLE_RADIUS;
  private minBallRadius = GAME_CONFIG.BALL_RADIUS_MIN;
  private nextCircleId = 0;
  private lastCircleAppearTime = 0;
  private collisionHandlers: {
    onBallCircleCollision: (ballId: string, circleId: number) => void;
    onBallBallCollision: () => void;
  };
  private frameCount: number = 0;

  constructor(
    onBallCircleCollision: (ballId: string, circleId: number) => void,
    onBallBallCollision: () => void,
  ) {
    // FIX: Moteur physique optimisé pour Remotion - équilibre précision/performance
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.5 },
      constraintIterations: 8, // FIX: Réduire pour de meilleures performances
      positionIterations: 10, // FIX: Réduire pour de meilleures performances
      velocityIterations: 8, // FIX: Réduire pour de meilleures performances
      timing: {
        timeScale: 1,
      },
    });

    // Ajuster les paramètres de simulation pour plus de stabilité
    this.engine.world.gravity.scale = 0.001;
    this.engine.timing.timeScale = 1;

    this.world = this.engine.world;
    this.collisionHandlers = {
      onBallCircleCollision,
      onBallBallCollision,
    };

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
          const circle = this.state.circles.find(c => c.id === circleId);

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
              // Appliquer une force de rebond plus forte
              const velocity = ballBody.velocity;
              const speed = Math.sqrt(
                velocity.x * velocity.x + velocity.y * velocity.y,
              );
              const radius = Math.sqrt(
                Math.pow(ballBody.position.x - centerX, 2) +
                  Math.pow(ballBody.position.y - centerY, 2),
              );
              const normalX = (ballBody.position.x - centerX) / radius;
              const normalY = (ballBody.position.y - centerY) / radius;

              Matter.Body.setVelocity(ballBody, {
                x: -normalX * speed,
                y: -normalY * speed,
              });

              // Déplacer légèrement la balle pour éviter qu'elle ne reste coincée
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
          this.collisionHandlers.onBallBallCollision();
        }
      });
    });
  }

  private initializeState(): PhysicsState {
    const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
    const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
    const angle = Math.PI / 4;

    // Créer les balles avec des propriétés physiques plus strictes
    const yesBall = Matter.Bodies.circle(
      centerX + Math.cos(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      centerY + Math.sin(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      GAME_CONFIG.BALL_RADIUS,
      {
        label: "yesBall",
        friction: 0.005, // FIX: Réduire friction pour plus de fluidité
        frictionAir: 0.0005, // FIX: Réduire friction air
        restitution: 0.85, // FIX: Rebonds plus naturels
        mass: 1,
        density: 0.0005, // FIX: Densité plus faible
        slop: 0.05, // FIX: Tolérance plus large pour éviter les accrochages
        inertia: Infinity,
        collisionFilter: {
          category: 0x0002,
          mask: 0x0001,
        },
      },
    );

    const noBall = Matter.Bodies.circle(
      centerX - Math.cos(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      centerY - Math.sin(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      GAME_CONFIG.BALL_RADIUS,
      {
        label: "noBall",
        friction: 0.005, // FIX: Réduire friction pour plus de fluidité
        frictionAir: 0.0005, // FIX: Réduire friction air
        restitution: 0.85, // FIX: Rebonds plus naturels
        mass: 1,
        density: 0.0005, // FIX: Densité plus faible
        slop: 0.05, // FIX: Tolérance plus large pour éviter les accrochages
        inertia: Infinity,
        collisionFilter: {
          category: 0x0002,
          mask: 0x0001,
        },
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

    // Initialiser le rayon courant des balles
    const yesBallRadius = GAME_CONFIG.BALL_RADIUS;
    const noBallRadius = GAME_CONFIG.BALL_RADIUS;

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

    // Créer les cercles initiaux
    const circles = [];
    for (let i = 0; i < this.initialRings; i++) {
      const appearTime = 0;
      const radius = this.maxRadius - i * ((this.maxRadius - this.minRadius) / (this.maxCircles - 1));
      circles.push(this.createCircle(i, radius, appearTime));
      this.nextCircleId = i + 1;
    }
    this.lastCircleAppearTime = 0;

    // Ajouter tous les corps au monde
    Matter.World.add(this.world, [yesBall, noBall, ...walls]);
    circles.forEach((circle) => {
      Matter.World.add(this.world, circle.segments);
    });

    return {
      yesBall,
      noBall,
      yesBallRadius,
      noBallRadius,
      circles,
    };
  }

  public update(frame: number) {
    // FIX: Delta time fixe pour cohérence Remotion (33.33ms à 30fps)
    const deltaTime = 1000 / GAME_CONFIG.FPS;
    this.frameCount = frame;
    const time = frame / GAME_CONFIG.FPS;

    // Apparition de nouveaux cercles à intervalle régulier
    if (
      this.nextCircleId < this.maxCircles &&
      time - this.lastCircleAppearTime >= this.interval
    ) {
      const radius = this.maxRadius - this.nextCircleId * ((this.maxRadius - this.minRadius) / (this.maxCircles - 1));
      const appearTime = time;
      const circle = this.createCircle(this.nextCircleId, radius, appearTime);
      this.state.circles.push(circle);
      Matter.World.add(this.world, circle.segments);
      this.lastCircleAppearTime = time;
      this.nextCircleId++;
    }

    // Rétrécissement des cercles et suppression si rayon nul
    let minAllowedRadius = this.minBallRadius;
    let anyBallAtMin =
      this.state.yesBallRadius <= this.minBallRadius ||
      this.state.noBallRadius <= this.minBallRadius;

    this.state.circles = this.state.circles.filter((circle) => {
      if (circle.isExploding) return false;
      // Calcul du nouveau rayon
      let newRadius = circle.radius;
      if (!anyBallAtMin) {
        newRadius = Math.max(
          this.minRadius,
          circle.radius - this.shrinkSpeed * deltaTime * 0.001
        );
      }
      // Si le rayon devient inférieur à la limite minimale, on le supprime
      if (newRadius <= minAllowedRadius) {
        Matter.World.remove(this.world, circle.segments);
        return false;
      }
      // Mettre à jour les segments pour coller au nouveau rayon
      Matter.World.remove(this.world, circle.segments);
      circle.radius = newRadius;
      circle.segments = this.createCircleSegments(circle.id, newRadius);
      Matter.World.add(this.world, circle.segments);
      return true;
    });

    // Rétrécissement des balles
    if (!anyBallAtMin) {
      this.state.yesBallRadius = Math.max(
        this.minBallRadius,
        this.state.yesBallRadius - this.shrinkSpeed * deltaTime * 0.001
      );
      this.state.noBallRadius = Math.max(
        this.minBallRadius,
        this.state.noBallRadius - this.shrinkSpeed * deltaTime * 0.001
      );
      // Mettre à jour la taille physique des balles
      Matter.Body.set(this.state.yesBall, { circleRadius: this.state.yesBallRadius });
      Matter.Body.set(this.state.noBall, { circleRadius: this.state.noBallRadius });
    }

    Matter.Engine.update(this.engine, deltaTime);

    // FIX: Contraintes de vitesse simplifiées et plus stables
    const bodies = [this.state.yesBall, this.state.noBall];
    bodies.forEach((body) => {
      const velocity = body.velocity;
      const speed = Math.sqrt(
        velocity.x * velocity.x + velocity.y * velocity.y,
      );

      // Limites de vitesse fixes (pas de progression temporelle)
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
  }

  public getState(): PhysicsState {
    return this.state;
  }

  public removeCircleSegments(circleId: number) {
    const circle = this.state.circles.find(c => c.id === circleId);
    if (circle && !circle.isExploding) {
      Matter.World.remove(this.world, circle.segments);
      circle.isExploding = true;
    }
  }

  public cleanup() {
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engine);
  }

  private createCircle(id: number, radius: number, appearTime: number) {
    return {
      id,
      radius,
      appearTime,
      segments: this.createCircleSegments(id, radius),
      isExploding: false,
      explosionColor: GAME_CONFIG.COLORS.YES_BALL,
    };
  }

  private createCircleSegments(id: number, radius: number) {
    const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
    const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
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
          radius * 0.15,
          GAME_CONFIG.CIRCLE_STROKE_WIDTH * 1.5,
          {
            isStatic: true,
            angle: (angle * Math.PI) / 180,
            label: `circle_${id}_segment_${j}`,
            render: {
              fillStyle: GAME_CONFIG.COLORS.CIRCLE_COLOR,
            },
            collisionFilter: {
              category: 0x0001,
              mask: 0x0002,
            },
            chamfer: { radius: 2 },
            friction: 0.1,
            restitution: 0.5,
          },
        );
        segments.push(segment);
      }
    }
    return segments;
  }
}

export default PhysicsEngine;
