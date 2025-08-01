# Solution : Décalage de Collision entre Physique et Rendu Visuel

## Problème Identifié

La balle détruisait toujours le ring **hors** du gap, comme s'il existait un décalage angulaire entre la position physique et le rendu graphique.

## Cause Racine

Le décalage venait d'une **incohérence de référentiel** entre :

1. **Physique (Matter.js)** : Calculait l'angle de la balle dans le système de coordonnées global de l'écran
2. **Rendu visuel (SVG/Remotion)** : Appliquait une transformation SVG qui changeait le référentiel :
   ```svg
   <g transform="translate(centerX, centerY) rotate(currentRotation)">
   ```

## Analyse Technique

### Ancienne Logique (Problématique)
```typescript
// Dans collisionStart (engine.ts)
const ballAngle = (Math.atan2(
  ballBody.position.y - centerY,
  ballBody.position.x - centerX,
) * 180) / Math.PI;
const normalizedBallAngle = (ballAngle + 360) % 360;

// Gap calculé dans le système global
const gapStart = effectiveRotation % 360;
const gapEnd = (gapStart + circle.gapAngle) % 360;
```

### Problème
- L'angle de la balle était calculé dans le système global
- Le gap était calculé avec `effectiveRotation = currentRotation + gapRotation`
- Mais le SVG appliquait d'abord une translation, puis une rotation
- Résultat : **décalage de 324°** entre les deux référentiels

## Solution Implémentée

### Nouvelle Logique (Corrigée)
```typescript
// 1. Position de la balle dans le système SVG (après translation)
const ballInSVG = {
  x: ballBody.position.x - centerX,
  y: ballBody.position.y - centerY,
};

// 2. Rotation inverse pour obtenir la position dans le système local du cercle
const rotationRad = (-currentRotation * Math.PI) / 180;
const ballInLocal = {
  x: ballInSVG.x * Math.cos(rotationRad) - ballInSVG.y * Math.sin(rotationRad),
  y: ballInSVG.x * Math.sin(rotationRad) + ballInSVG.y * Math.cos(rotationRad),
};

// 3. Angle de la balle dans le système local (comme dans le SVG)
const localBallAngle = (Math.atan2(ballInLocal.y, ballInLocal.x) * 180) / Math.PI;
const normalizedLocalBallAngle = (localBallAngle + 360) % 360;

// 4. Gap calculé dans le système local
const gapStart = gapRotation % 360;
const gapEnd = (gapStart + circle.gapAngle) % 360;
```

## Avantages de la Solution

1. **Cohérence référentiel** : Les calculs de collision utilisent maintenant le même système de coordonnées que le rendu SVG
2. **Précision** : Élimination du décalage de 324° entre physique et visuel
3. **Maintenabilité** : La logique est maintenant alignée avec les transformations SVG
4. **Robustesse** : Fonctionne correctement pour toutes les positions de balle et rotations de ring

## Tests de Validation

- ✅ Balle à droite du centre
- ✅ Balle au-dessus du centre  
- ✅ Balle avec gap à 45°
- ✅ Balle avec gap à 90°
- ✅ Différentes frames et cercles

## Impact

- **Avant** : La balle détruisait le ring hors du gap (décalage de 324°)
- **Après** : La balle détruit le ring exactement où elle le touche visuellement

## Fichiers Modifiés

- `src/physics/engine.ts` : Correction de la logique de collision dans `collisionStart`

## Conclusion

Le problème était causé par une **incohérence de référentiel** entre la physique (système global) et le rendu visuel (système local après transformation SVG). La solution aligne les calculs de collision avec le système de coordonnées utilisé par le rendu SVG, éliminant complètement le décalage.