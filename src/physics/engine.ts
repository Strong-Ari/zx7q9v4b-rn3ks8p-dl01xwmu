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

  constructor(
    onBallCircleCollision: (ballId: string, circleId: number) => void,
    onBallBallCollision: () => void,
  ) {
    // FIX: Moteur physique optimisé pour Remotion - équilibre précision/performance
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.3 }, // FIX: Réduire la gravité pour plus de fluidité
      constraintIterations: 6, // FIX: Réduire encore pour plus de fluidité
      positionIterations: 8, // FIX: Réduire encore
      velocityIterations: 6, // FIX: Réduire encore
      timing: {
        timeScale: 1,
      },
    });

    // FIX: Ajuster les paramètres de simulation pour plus de stabilité et de fluidité
    this.engine.world.gravity.scale = 0.0008; // FIX: Réduire l'échelle de gravité
    this.engine.timing.timeScale = 1;

    this.world = this.engine.world;
    this.collisionHandlers = {
      onBallCircleCollision,
      onBallBallCollision,
    };

    this.state = this.initializeState();

    // FIX: Configurer les collisions avec une logique de rebond plus naturelle
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
              // FIX: Physique de rebond plus naturelle basée sur la normale de collision
              const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
              const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
              
              // Calculer la normale de surface du ring
              const toCenter = {
                x: centerX - ballBody.position.x,
                y: centerY - ballBody.position.y
              };
              const distance = Math.sqrt(toCenter.x * toCenter.x + toCenter.y * toCenter.y);
              const normal = {
                x: toCenter.x / distance,
                y: toCenter.y / distance
              };

              // Calculer le rebond en utilisant la formule physique standard
              const velocity = ballBody.velocity;
              const dotProduct = velocity.x * normal.x + velocity.y * normal.y;
              
              // FIX: Rebond avec conservation d'énergie plus réaliste
              const restitution = 0.8; // Légère perte d'énergie
              const newVelocity = {
                x: velocity.x - (1 + restitution) * dotProduct * normal.x,
                y: velocity.y - (1 + restitution) * dotProduct * normal.y
              };

              // FIX: Ajouter une légère randomisation pour éviter les patterns répétitifs
              const randomFactor = 0.95 + Math.random() * 0.1; // ±5% de variation
              newVelocity.x *= randomFactor;
              newVelocity.y *= randomFactor;

              Matter.Body.setVelocity(ballBody, newVelocity);

              // FIX: Déplacer la balle pour éviter les collisions multiples
              const pushDistance = GAME_CONFIG.BALL_RADIUS * 0.1;
              Matter.Body.setPosition(ballBody, {
                x: ballBody.position.x - normal.x * pushDistance,
                y: ballBody.position.y - normal.y * pushDistance,
              });
            }
          }
        }

        // FIX: Collision entre balles plus fluide
        if (
          (bodyA.label === "yesBall" || bodyA.label === "noBall") &&
          (bodyB.label === "yesBall" || bodyB.label === "noBall") &&
          bodyA.label !== bodyB.label
        ) {
          // FIX: Collision élastique entre balles avec conservation du momentum
          const ball1 = bodyA;
          const ball2 = bodyB;
          
          const dx = ball2.position.x - ball1.position.x;
          const dy = ball2.position.y - ball1.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const normal = { x: dx / distance, y: dy / distance };
            
            // Vitesses relatives
            const relativeVelocity = {
              x: ball2.velocity.x - ball1.velocity.x,
              y: ball2.velocity.y - ball1.velocity.y
            };
            
            const speed = relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;
            
            if (speed < 0) return; // Les balles s'éloignent déjà
            
            // FIX: Collision élastique avec conservation de l'énergie
            const restitution = 0.9;
            const impulse = (1 + restitution) * speed / 2; // Masses égales
            
            Matter.Body.setVelocity(ball1, {
              x: ball1.velocity.x + impulse * normal.x,
              y: ball1.velocity.y + impulse * normal.y
            });
            
            Matter.Body.setVelocity(ball2, {
              x: ball2.velocity.x - impulse * normal.x,
              y: ball2.velocity.y - impulse * normal.y
            });
            
            // Séparer les balles pour éviter qu'elles restent collées
            const separation = (GAME_CONFIG.BALL_RADIUS * 2.1 - distance) / 2;
            if (separation > 0) {
              Matter.Body.setPosition(ball1, {
                x: ball1.position.x - normal.x * separation,
                y: ball1.position.y - normal.y * separation
              });
              Matter.Body.setPosition(ball2, {
                x: ball2.position.x + normal.x * separation,
                y: ball2.position.y + normal.y * separation
              });
            }
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

    // Créer les balles avec des propriétés physiques plus strictes
    const yesBall = Matter.Bodies.circle(
      centerX + Math.cos(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      centerY + Math.sin(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      GAME_CONFIG.BALL_RADIUS,
      {
        label: "yesBall",
        friction: 0.002, // FIX: Réduire encore la friction pour plus de fluidité
        frictionAir: 0.0003, // FIX: Réduire friction air pour un mouvement plus libre
        restitution: 0.9, // FIX: Rebonds plus énergiques
        mass: 1,
        density: 0.0003, // FIX: Densité encore plus faible pour des mouvements plus légers
        slop: 0.1, // FIX: Tolérance très large pour éviter les micro-collisions
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
        friction: 0.002, // FIX: Réduire encore la friction pour plus de fluidité
        frictionAir: 0.0003, // FIX: Réduire friction air pour un mouvement plus libre
        restitution: 0.9, // FIX: Rebonds plus énergiques
        mass: 1,
        density: 0.0003, // FIX: Densité encore plus faible pour des mouvements plus légers
        slop: 0.1, // FIX: Tolérance très large pour éviter les micro-collisions
        inertia: Infinity,
        collisionFilter: {
          category: 0x0002,
          mask: 0x0001,
        },
      },
    );

    // FIX: Appliquer une vitesse initiale plus dynamique et naturelle
    const initialSpeed = GAME_CONFIG.BALL_SPEED * 1.1; // Légèrement plus rapide
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
    // FIX: Delta time fixe pour cohérence Remotion (33.33ms à 30fps)
    const deltaTime = 1000 / GAME_CONFIG.FPS;
    this.frameCount = frame;

    Matter.Engine.update(this.engine, deltaTime);

    // FIX: Supprimer la mise à jour manuelle des segments - géré par SemiCircle.tsx
    // Les segments restent statiques, la rotation est purement visuelle

    // FIX: Contraintes de vitesse simplifiées et plus stables
    const bodies = [this.state.yesBall, this.state.noBall];
    bodies.forEach((body) => {
      const velocity = body.velocity;
      const speed = Math.sqrt(
        velocity.x * velocity.x + velocity.y * velocity.y,
      );

      // FIX: Limites de vitesse plus larges pour plus de fluidité
      const minSpeed = GAME_CONFIG.BALL_MIN_SPEED * 0.8; // Plus permissif
      const maxSpeed = GAME_CONFIG.BALL_MAX_SPEED * 1.2; // Plus de liberté

      if (speed < minSpeed && speed > 0.1) { // Éviter la division par zéro
        const factor = minSpeed / speed;
        Matter.Body.setVelocity(body, {
          x: velocity.x * factor,
          y: velocity.y * factor,
        });
      } else if (speed > maxSpeed) {
        const factor = maxSpeed / speed;
        Matter.Body.setVelocity(body, {
          x: velocity.x * factor,
          y: velocity.y * factor,
        });
      }

      // FIX: Ajouter une force centripète douce pour maintenir l'action dans la zone visible
      const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
      const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
      const distanceFromCenter = Math.sqrt(
        Math.pow(body.position.x - centerX, 2) + 
        Math.pow(body.position.y - centerY, 2)
      );

      // Si la balle s'éloigne trop du centre, appliquer une force centripète douce
      const maxDistance = GAME_CONFIG.MAX_CIRCLE_RADIUS + 100;
      if (distanceFromCenter > maxDistance) {
        const forceIntensity = 0.0005; // Force très douce
        const forceX = (centerX - body.position.x) / distanceFromCenter * forceIntensity;
        const forceY = (centerY - body.position.y) / distanceFromCenter * forceIntensity;
        
        Matter.Body.applyForce(body, body.position, { x: forceX, y: forceY });
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
            radius * 0.15, // Augmenter légèrement la largeur des segments
            GAME_CONFIG.CIRCLE_STROKE_WIDTH * 1.5, // Augmenter légèrement l'épaisseur
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
              chamfer: { radius: 2 }, // Arrondir légèrement les bords pour éviter les accrochages
              friction: 0.1,
              restitution: 0.5,
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
