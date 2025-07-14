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
    // Créer le moteur physique avec des paramètres améliorés
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.3 }, // Gravité plus douce
      constraintIterations: 10,
      positionIterations: 16,
      velocityIterations: 12,
      timing: {
        timeScale: 1,
      },
    });

    // Paramètres optimisés pour la stabilité
    this.engine.world.gravity.scale = 0.001;
    this.engine.timing.timeScale = 1;

    this.world = this.engine.world;
    this.collisionHandlers = {
      onBallCircleCollision,
      onBallBallCollision,
    };

    // Initialiser l'état
    this.state = this.initializeState();

    // Configurer les collisions avec une logique améliorée
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
            // Calculer la position de l'ouverture de manière synchronisée
            const isInGap = this.checkIfBallInGap(ballBody, circleId);

            if (isInGap) {
              this.collisionHandlers.onBallCircleCollision(
                ballBody.label,
                circleId,
              );
            } else {
              // Rebond avec amélioration de la physique
              const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
              const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
              const dx = ballBody.position.x - centerX;
              const dy = ballBody.position.y - centerY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Direction normale à la surface
              const normalX = dx / distance;
              const normalY = dy / distance;
              
              // Vitesse actuelle
              const vx = ballBody.velocity.x;
              const vy = ballBody.velocity.y;
              
              // Calcul du rebond avec coefficient de restitution
              const dotProduct = vx * normalX + vy * normalY;
              const bounceVx = vx - 2 * dotProduct * normalX;
              const bounceVy = vy - 2 * dotProduct * normalY;
              
              // Appliquer une légère randomisation pour éviter les patterns
              const randomFactor = 0.05;
              const randomX = (Math.random() - 0.5) * randomFactor;
              const randomY = (Math.random() - 0.5) * randomFactor;
              
              Matter.Body.setVelocity(ballBody, {
                x: bounceVx * 0.85 + randomX, // Légère perte d'énergie
                y: bounceVy * 0.85 + randomY,
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

  // Méthode améliorée pour vérifier si la balle est dans l'ouverture
  private checkIfBallInGap(ballBody: Matter.Body, circleId: number): boolean {
    const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
    const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
    
    // Position de la balle par rapport au centre
    const ballAngle = Math.atan2(
      ballBody.position.y - centerY,
      ballBody.position.x - centerX,
    );
    const ballAngleDegrees = ((ballAngle * 180) / Math.PI + 360) % 360;

    // Calculer la rotation actuelle du cercle (synchronisée avec SemiCircle.tsx)
    const timeInSeconds = this.frameCount / GAME_CONFIG.FPS;
    const baseRotation = (circleId * 360) / GAME_CONFIG.SPIRAL_DENSITY;
    
    // Calculer la rotation de la même manière que dans SemiCircle.tsx
    const radiusStep = (GAME_CONFIG.MAX_CIRCLE_RADIUS - GAME_CONFIG.MIN_CIRCLE_RADIUS) / (GAME_CONFIG.SPIRAL_DENSITY - 1);
    const radius = GAME_CONFIG.MIN_CIRCLE_RADIUS + radiusStep * circleId * 1.5;
    const ringPosition = baseRotation * (radius / GAME_CONFIG.MAX_CIRCLE_RADIUS);
    
    const baseSpeed = 0.5;
    const speedMultiplier = 1 - (radius - GAME_CONFIG.MIN_CIRCLE_RADIUS) / (GAME_CONFIG.MAX_CIRCLE_RADIUS - GAME_CONFIG.MIN_CIRCLE_RADIUS);
    const rotationSpeed = baseSpeed * (0.5 + speedMultiplier * 0.5);
    
    const currentRotation = (this.frameCount * rotationSpeed + ringPosition) % 360;
    
    // Calculer les limites de l'ouverture
    const gapAngle = GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE + 
      Math.random() * (GAME_CONFIG.CIRCLE_GAP_MAX_ANGLE - GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE);
    const gapStart = (currentRotation + 180) % 360; // Décalage de 180° pour l'ouverture
    const gapEnd = (gapStart + gapAngle) % 360;

    // Vérifier si la balle est dans l'ouverture
    let isInGap = false;
    if (gapStart <= gapEnd) {
      isInGap = ballAngleDegrees >= gapStart && ballAngleDegrees <= gapEnd;
    } else {
      isInGap = ballAngleDegrees >= gapStart || ballAngleDegrees <= gapEnd;
    }

    return isInGap;
  }

  private initializeState(): PhysicsState {
    const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
    const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
    const angle = Math.PI / 4;

    // Créer les balles avec des propriétés physiques améliorées
    const yesBall = Matter.Bodies.circle(
      centerX + Math.cos(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      centerY + Math.sin(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      GAME_CONFIG.BALL_RADIUS,
      {
        label: "yesBall",
        friction: 0.005, // Friction très faible pour des mouvements fluides
        frictionAir: 0.0005, // Résistance de l'air minime
        restitution: 0.9, // Rebonds plus élastiques
        mass: 1,
        density: 0.001,
        slop: 0.1, // Tolérance de chevauchement
        inertia: Infinity, // Empêche la rotation
      },
    );

    const noBall = Matter.Bodies.circle(
      centerX - Math.cos(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      centerY - Math.sin(angle) * GAME_CONFIG.INITIAL_CIRCLE_RADIUS,
      GAME_CONFIG.BALL_RADIUS,
      {
        label: "noBall",
        friction: 0.005,
        frictionAir: 0.0005,
        restitution: 0.9,
        mass: 1,
        density: 0.001,
        slop: 0.1,
        inertia: Infinity,
      },
    );

    // Vitesse initiale améliorée
    const initialSpeed = GAME_CONFIG.BALL_SPEED * 1.2;
    Matter.Body.setVelocity(yesBall, {
      x: Math.cos(angle) * initialSpeed,
      y: Math.sin(angle) * initialSpeed,
    });

    Matter.Body.setVelocity(noBall, {
      x: -Math.cos(angle) * initialSpeed,
      y: -Math.sin(angle) * initialSpeed,
    });

    // Créer les murs avec des propriétés améliorées
    const wallThickness = 50;
    const walls = [
      // Sol
      Matter.Bodies.rectangle(
        GAME_CONFIG.VIDEO_WIDTH / 2,
        GAME_CONFIG.VIDEO_HEIGHT + wallThickness / 2,
        GAME_CONFIG.VIDEO_WIDTH,
        wallThickness,
        { isStatic: true, friction: 0.1, restitution: 0.9 },
      ),
      // Plafond
      Matter.Bodies.rectangle(
        GAME_CONFIG.VIDEO_WIDTH / 2,
        -wallThickness / 2,
        GAME_CONFIG.VIDEO_WIDTH,
        wallThickness,
        { isStatic: true, friction: 0.1, restitution: 0.9 },
      ),
      // Mur gauche
      Matter.Bodies.rectangle(
        -wallThickness / 2,
        GAME_CONFIG.VIDEO_HEIGHT / 2,
        wallThickness,
        GAME_CONFIG.VIDEO_HEIGHT,
        { isStatic: true, friction: 0.1, restitution: 0.9 },
      ),
      // Mur droit
      Matter.Bodies.rectangle(
        GAME_CONFIG.VIDEO_WIDTH + wallThickness / 2,
        GAME_CONFIG.VIDEO_HEIGHT / 2,
        wallThickness,
        GAME_CONFIG.VIDEO_HEIGHT,
        { isStatic: true, friction: 0.1, restitution: 0.9 },
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

    // Mise à jour du moteur physique avec deltaTime stable
    Matter.Engine.update(this.engine, Math.min(deltaTime, 1000 / 30)); // Limiter deltaTime

    // Rotation fluide des segments des cercles
    this.state.circles.forEach((circle, circleIndex) => {
      if (!circle.isExploding) {
        // Calculer la rotation de manière synchronisée avec le rendu
        const radiusStep = (GAME_CONFIG.MAX_CIRCLE_RADIUS - GAME_CONFIG.MIN_CIRCLE_RADIUS) / (GAME_CONFIG.SPIRAL_DENSITY - 1);
        const radius = GAME_CONFIG.MIN_CIRCLE_RADIUS + radiusStep * circleIndex * 1.5;
        const baseRotation = (circleIndex * 360) / GAME_CONFIG.SPIRAL_DENSITY;
        const ringPosition = baseRotation * (radius / GAME_CONFIG.MAX_CIRCLE_RADIUS);
        
        const baseSpeed = 0.5;
        const speedMultiplier = 1 - (radius - GAME_CONFIG.MIN_CIRCLE_RADIUS) / (GAME_CONFIG.MAX_CIRCLE_RADIUS - GAME_CONFIG.MIN_CIRCLE_RADIUS);
        const rotationSpeed = baseSpeed * (0.5 + speedMultiplier * 0.5);
        
        const currentRotation = (frame * rotationSpeed + ringPosition) % 360;
        const totalRotationRadians = (currentRotation * Math.PI) / 180;

        const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
        const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;

        // Mise à jour fluide des segments
        circle.segments.forEach((segment, segmentIndex) => {
          const originalAngle = (segmentIndex * 360) / 36; // 36 segments par cercle
          const newAngle = originalAngle + currentRotation;
          const radians = (newAngle * Math.PI) / 180;
          
          const newX = centerX + radius * Math.cos(radians);
          const newY = centerY + radius * Math.sin(radians);
          
          // Mise à jour fluide avec interpolation
          Matter.Body.setPosition(segment, { x: newX, y: newY });
          Matter.Body.setAngle(segment, radians);
        });
      }
    });

    // Gestion améliorée de la vitesse des balles
    const bodies = [this.state.yesBall, this.state.noBall];
    bodies.forEach((body) => {
      const velocity = body.velocity;
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      // Progression temporelle pour augmenter l'intensité
      const timeProgress = frame / (GAME_CONFIG.DURATION_IN_SECONDS * GAME_CONFIG.FPS);
      const speedMultiplier = 1 + timeProgress * 0.3; // Augmentation plus progressive

      // Appliquer les limites de vitesse avec contrôle plus fin
      const minSpeed = GAME_CONFIG.BALL_MIN_SPEED * speedMultiplier;
      const maxSpeed = GAME_CONFIG.BALL_MAX_SPEED * speedMultiplier;

      if (speed < minSpeed && speed > 0.1) {
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

      // Appliquer une force centripète douce pour éviter que les balles sortent trop loin
      const centerX = GAME_CONFIG.VIDEO_WIDTH / 2;
      const centerY = GAME_CONFIG.VIDEO_HEIGHT / 2;
      const distanceFromCenter = Math.sqrt(
        Math.pow(body.position.x - centerX, 2) + 
        Math.pow(body.position.y - centerY, 2)
      );
      
      if (distanceFromCenter > GAME_CONFIG.MAX_CIRCLE_RADIUS + 100) {
        const forceX = (centerX - body.position.x) * 0.0001;
        const forceY = (centerY - body.position.y) * 0.0001;
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

    // Espacement amélioré entre les cercles
    const radiusStep = (GAME_CONFIG.MAX_CIRCLE_RADIUS - GAME_CONFIG.MIN_CIRCLE_RADIUS) / (GAME_CONFIG.SPIRAL_DENSITY - 1);

    for (let i = 0; i < GAME_CONFIG.SPIRAL_DENSITY; i++) {
      const radius = GAME_CONFIG.MIN_CIRCLE_RADIUS + radiusStep * i * 1.5;
      const segments: Matter.Body[] = [];
      const segmentCount = 36;
      
      // Angle d'ouverture fixe pour une meilleure prévisibilité
      const gapAngle = GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE + 
        (i % 3) * ((GAME_CONFIG.CIRCLE_GAP_MAX_ANGLE - GAME_CONFIG.CIRCLE_GAP_MIN_ANGLE) / 3);

      for (let j = 0; j < segmentCount; j++) {
        const angle = (j * 360) / segmentCount;
        // Créer l'ouverture à 180° (côté opposé à 0°)
        const gapStart = 180 - gapAngle / 2;
        const gapEnd = 180 + gapAngle / 2;
        
        // Créer des segments uniquement en dehors de l'ouverture
        if (angle < gapStart || angle > gapEnd) {
          const segment = Matter.Bodies.rectangle(
            centerX + radius * Math.cos((angle * Math.PI) / 180),
            centerY + radius * Math.sin((angle * Math.PI) / 180),
            radius * 0.08, // Segments plus fins pour une meilleure fluidité
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
