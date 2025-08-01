import { useMemo } from "react";

interface DynamicCircle {
  id: number;
  radius: number;
  appearTime: number;
}

interface UseDynamicCirclesParams {
  frame: number;
  fps: number;
  shrinkSpeed: number; // px/sec
  interval: number; // secondes entre chaque cercle
  maxCircles: number;
  minRadius: number;
  maxRadius: number;
  initialCircles?: number; // Nombre de cercles au début (optionnel)
  minShrinkRadius?: number; // Rayon minimum avant arrêt du rétrécissement
}

/**
 * Gère l'apparition progressive et le rétrécissement des cercles.
 * Chaque cercle apparaît à intervalle régulier et son rayon diminue à vitesse constante.
 */
export function useDynamicCircles({
  frame,
  fps,
  shrinkSpeed,
  interval,
  maxCircles,
  minRadius,
  maxRadius,
  initialCircles = 1, // Par défaut 1 cercle au début
  minShrinkRadius = 300, // Rayon minimum augmenté pour plus d'opportunités de cassage
}: UseDynamicCirclesParams): DynamicCircle[] {
  // Temps écoulé en secondes
  const time = frame / fps;

  // Nombre de cercles à afficher à ce moment
  const numCircles = Math.min(
    maxCircles,
    Math.max(initialCircles, Math.floor(time / interval) + 1),
  );

  // Calcul du rayon initial pour chaque cercle (même logique que dans BallEscape)
  const getInitialRadius = (id: number) =>
    minRadius + (id * (maxRadius - minRadius)) / maxCircles;

  // Générer la liste des cercles dynamiques
  return useMemo(() => {
    return Array.from({ length: numCircles })
      .map((_, i) => {
        const appearTime = i * interval;
        const timeSinceAppear = Math.max(0, time - appearTime);
        const initialRadius = getInitialRadius(i);
        const shrink = shrinkSpeed * timeSinceAppear;

        // Calculer le rayon (peut descendre en dessous de minShrinkRadius)
        const calculatedRadius = initialRadius - shrink;

        // Si le rayon est trop petit, le ring disparaît (retourne null)
        if (calculatedRadius < minShrinkRadius) {
          return null;
        }

        return {
          id: i,
          radius: calculatedRadius,
          appearTime,
        };
      })
      .filter((circle): circle is DynamicCircle => circle !== null); // Filtrer les rings null
  }, [
    numCircles,
    time,
    shrinkSpeed,
    interval,
    minRadius,
    maxRadius,
    maxCircles,
    initialCircles,
    minShrinkRadius,
  ]);
}
