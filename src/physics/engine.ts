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
  private frameCount: number = 0;
  private lastFrameTime: number = 0;

  constructor(
    onBallCircleCollision: (ballId: string, circleId: number) => void,
    onBallBallCollision: () => void,
  ) {
    // FIX: Moteur physique optimisé pour éliminer les saccades
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.3 }, // Gravité réduite pour plus de fluidité
      constraintIterations: 6, // Optimisé pour Remotion
      positionIterations: 8, // Optimisé pour Remotion
      velocityIterations: 6, // Optimisé pour Remotion
      timing: {
        timeScale: 1,
        timestamp: 0,
      },
    });

    // FIX: Paramètres de stabilité améliorés
    this.engine.world.gravity.scale = 0.0008; // Gravité très douce
    this.engine.timing.timeScale = 1;

    this.world = this.engine.world;
    this.collisionHandlers = {
      onBallCircleCollision,
      onBallBallCollision,
    };

    this.state = this.initializeState();

    // FIX: Gestion des collisions améliorée pour éviter les téléportations
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
              // FIX: Rebond progressif pour éviter les téléportations
              const velocity = ballBody.velocity;
              const speed = Math.sqrt(
                velocity.x * velocity.x + velocity.y * velocity.y,
              );
              const radius = Math.sqrt(
                Math.pow(ballBody.position.x - centerX, 2) +
                  Math.pow(ballBody.position.y - centerY, 2),
              );
              
              if (radius > 0) {
                const normalX = (ballBody.position.x - centerX) / radius;
                const normalY = (ballBody.position.y - centerY) / radius;

                // FIX: Rebond plus doux et progressif
                const bounceStrength = Math.min(speed * 0.8, GAME_CONFIG.BALL_MAX_SPEED * 0.8);
                
                Matter.Body.setVelocity(ballBody, {
                  x: -normalX * bounceStrength,
                  y: -normalY * bounceStrength,
                });

                // FIX: Déplacement minimal pour éviter les accrochages
                const pushDistance = GAME_CONFIG.BALL_RADIUS * 0.1;
                Matter.Body.setPosition(ballBody, {
                  x: ballBody.position.x + normalX * pushDistance,
                  y: ballBody.position.y + normalY * pushDistance,
                });
              }
            }
          }
        }

        // Collision entre balles avec amortissement
        if (
          (bodyA.label === "yesBall" || bodyA.label === "noBall") &&
          (bodyB.label === "yesBall" || bodyB.label === "noBall") &&
          bodyA.label !== bodyB.label
        ) {
          // FIX: Rebond entre balles plus naturel
          const dx = bodyB.position.x - bodyA.position.x;
          const dy = bodyB.position.y - bodyA.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const normalX = dx / distance;
            const normalY = dy / distance;
            const separationForce = 0.5;
            
            Matter.Body.applyForce(bodyA, bodyA.position, {
              x: -normalX * separationForce,
              y: -normalY * separationForce,
            });
            
            Matter.Body.applyForce(bodyB, bodyB.position, {
              x: normalX * separationForce,
              y: normalY * separationForce,
            });
          }
          
          this.collisionHandlers.onBallBallCollision();
        }
      });
    });
  }

  private initializeState(): PhysicsState {
    const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
    const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
    const angle = Math.PI / 4;

    // FIX: Créer les balles avec des propriétés physiques optimisées pour la fluidité
    const yesBall = Matter.Bodies.circle(
      centerX + Math.cos(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      centerY + Math.sin(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      GAME_CONFIG.BALL_RADIUS,
      {
        label: "yesBall",
        friction: 0.001, // Friction très faible pour plus de fluidité
        frictionAir: 0.0001, // Résistance air minimale
        restitution: 0.9, // Rebonds énergiques mais contrôlés
        mass: 1,
        density: 0.001, // Densité faible pour plus de réactivité
        slop: 0.02, // Tolérance réduite pour plus de précision
        inertia: Infinity, // Pas de rotation propre
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
        friction: 0.001, // Friction très faible pour plus de fluidité
        frictionAir: 0.0001, // Résistance air minimale
        restitution: 0.9, // Rebonds énergiques mais contrôlés
        mass: 1,
        density: 0.001, // Densité faible pour plus de réactivité
        slop: 0.02, // Tolérance réduite pour plus de précision
        inertia: Infinity, // Pas de rotation propre
        collisionFilter: {
          category: 0x0002,
          mask: 0x0001,
        },
      },
    );

    // FIX: Vitesse initiale plus fluide et contrôlée
    const initialSpeed = GAME_CONFIG.BALL_SPEED * 0.7;
    Matter.Body.setVelocity(yesBall, {
      x: Math.cos(angle + Math.PI/2) * initialSpeed,
      y: Math.sin(angle + Math.PI/2) * initialSpeed,
    });

    Matter.Body.setVelocity(noBall, {
      x: -Math.cos(angle + Math.PI/2) * initialSpeed,
      y: -Math.sin(angle + Math.PI/2) * initialSpeed,
    });

    // Créer les murs invisibles avec plus de souplesse
    const wallThickness = 50;
    const walls = [
      // Sol
      Matter.Bodies.rectangle(
        GAME_CONFIG.VIDEO_WIDTH / 2,
        GAME_CONFIG.VIDEO_HEIGHT + wallThickness / 2,
        GAME_CONFIG.VIDEO_WIDTH,
        wallThickness,
        { isStatic: true, friction: 0.05, restitution: 0.9 },
      ),
      // Plafond
      Matter.Bodies.rectangle(
        GAME_CONFIG.VIDEO_WIDTH / 2,
        -wallThickness / 2,
        GAME_CONFIG.VIDEO_WIDTH,
        wallThickness,
        { isStatic: true, friction: 0.05, restitution: 0.9 },
      ),
      // Mur gauche
      Matter.Bodies.rectangle(
        -wallThickness / 2,
        GAME_CONFIG.VIDEO_HEIGHT / 2,
        wallThickness,
        GAME_CONFIG.VIDEO_HEIGHT,
        { isStatic: true, friction: 0.05, restitution: 0.9 },
      ),
      // Mur droit
      Matter.Bodies.rectangle(
        GAME_CONFIG.VIDEO_WIDTH + wallThickness / 2,
        GAME_CONFIG.VIDEO_HEIGHT / 2,
        wallThickness,
        GAME_CONFIG.VIDEO_HEIGHT,
        { isStatic: true, friction: 0.05, restitution: 0.9 },
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
    // FIX: Gestion temporelle précise pour Remotion
    const currentTime = (frame / GAME_CONFIG.FPS) * 1000; // Convertir en millisecondes
    const deltaTime = currentTime - this.lastFrameTime;
    const targetDelta = 1000 / GAME_CONFIG.FPS; // Delta cible en ms
    
    // Utiliser un delta time fixe pour la cohérence
    const actualDelta = Math.min(deltaTime || targetDelta, targetDelta * 2);
    
    this.frameCount = frame;
    this.lastFrameTime = currentTime;

    // FIX: Update avec delta time contrôlé
    Matter.Engine.update(this.engine, actualDelta);

    // FIX: Contraintes de vitesse améliorées pour plus de fluidité
    const bodies = [this.state.yesBall, this.state.noBall];
    bodies.forEach((body) => {
      const velocity = body.velocity;
      const speed = Math.sqrt(
        velocity.x * velocity.x + velocity.y * velocity.y,
      );

      // FIX: Contraintes de vitesse plus douces
      if (speed < GAME_CONFIG.BALL_MIN_SPEED && speed > 0.1) {
        const factor = GAME_CONFIG.BALL_MIN_SPEED / speed;
        Matter.Body.setVelocity(body, {
          x: velocity.x * factor * 0.95, // Légère atténuation
          y: velocity.y * factor * 0.95,
        });
      } else if (speed > GAME_CONFIG.BALL_MAX_SPEED) {
        const factor = GAME_CONFIG.BALL_MAX_SPEED / speed;
        Matter.Body.setVelocity(body, {
          x: velocity.x * factor * 0.98, // Légère atténuation
          y: velocity.y * factor * 0.98,
        });
      }

      // FIX: Amortissement progressif pour éviter les oscillations
      if (speed > 0) {
        const dampingFactor = 0.999; // Très léger amortissement
        Matter.Body.setVelocity(body, {
          x: velocity.x * dampingFactor,
          y: velocity.y * dampingFactor,
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
            radius * 0.12, // Largeur des segments réduite
            GAME_CONFIG.CIRCLE_STROKE_WIDTH * 1.2, // Épaisseur modérée
            {
              isStatic: true,
              angle: (angle * Math.PI) / 180,
              label: `circle_${i}_segment_${j}`,
              render: {
                fillStyle: GAME_CONFIG.COLORS.CIRCLE_COLOR,
              },
              collisionFilter: {
                category: 0x0001,
                mask: 0x0002,
              },
              chamfer: { radius: 1 }, // Arrondir légèrement les bords
              friction: 0.05, // Friction très faible
              restitution: 0.8, // Rebond contrôlé
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
