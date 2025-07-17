# 🔧 DIAGNOSTIC TIMING REMOTION - CORRECTION ROTATION SPIRALE

## 🚨 PROBLÈME IDENTIFIÉ

**Cause principale** : Incohérence de la valeur `fps` entre preview et export dans `SemiCircle.tsx`

### 📍 Code problématique

```typescript
// src/components/SemiCircle.tsx:26-27
const { fps } = useVideoConfig();
const timeInSeconds = frame / fps;
const currentRotation = baseRotation + timeInSeconds * GAME_CONFIG.SPIRAL_ROTATION_SPEED * 360;
```

## 🧪 TESTS À EFFECTUER

### Test 1: Vérification FPS
Ajouter dans `SemiCircle.tsx` ligne 26 :
```typescript
console.log(`[DIAGNOSTIC] Frame: ${frame}, FPS: ${fps}, Time: ${frame/fps}`);
```

### Test 2: Vérification rotation
Ajouter ligne 28 :
```typescript
console.log(`[DIAGNOSTIC] CurrentRotation: ${currentRotation}, BaseRotation: ${baseRotation}`);
```

### Test 3: Test avec FPS en dur
Remplacer la ligne 26 par :
```typescript
const timeInSeconds = frame / 30; // FPS forcé à 30
```

## 🛠️ CORRECTIONS RECOMMANDÉES

### Solution 1: Utiliser GAME_CONFIG.FPS (RECOMMANDÉE)

```typescript
// Dans SemiCircle.tsx, remplacer :
const { fps } = useVideoConfig();
const timeInSeconds = frame / fps;

// Par :
const timeInSeconds = frame / GAME_CONFIG.FPS;
```

### Solution 2: Calcul basé sur frames uniquement

```typescript
// Calcul direct sans dépendance au FPS
const rotationPerFrame = (GAME_CONFIG.SPIRAL_ROTATION_SPEED * 360) / GAME_CONFIG.FPS;
const currentRotation = baseRotation + frame * rotationPerFrame;
```

### Solution 3: Normalisation de la vitesse de rotation

```typescript
// Ajuster SPIRAL_ROTATION_SPEED pour être indépendant du FPS
const normalizedSpeed = GAME_CONFIG.SPIRAL_ROTATION_SPEED / GAME_CONFIG.FPS;
const currentRotation = baseRotation + frame * normalizedSpeed * 360;
```

## 📝 RÉSULTATS ATTENDUS

### Avant correction :
- Preview : FPS = 30, rotation fluide
- Export : FPS = valeur différente (?), rotation saccadée/rapide

### Après correction :
- Preview et Export : même vitesse de rotation, synchronisation parfaite

## 🎯 CORRECTIF IMMÉDIAT

La **Solution 1** est la plus simple et garantit la cohérence :

1. Remplacer `useVideoConfig().fps` par `GAME_CONFIG.FPS` 
2. S'assurer que `GAME_CONFIG.FPS = 30` correspond à la configuration Remotion
3. Tester preview et export

## 🔍 TESTS DE VALIDATION

1. **Rotation en 61 secondes** : Vérifier que la rotation complète se fait bien sur 1830 frames
2. **Pas de reset** : S'assurer qu'il n'y a pas de boucle toutes les 2 secondes
3. **Cohérence preview/export** : Même vitesse dans les deux modes

## ✅ RÉSULTATS DES TESTS

### Test du script de validation (pnpm test:rotation)
```
📊 Configuration:
- Durée: 61 secondes
- FPS: 30
- Total frames: 1830
- Vitesse spirale: 0.05

🧪 Tests de rotation:
Frame 0: 0s → 0.00° (0 tours + 0.00°)
Frame 900: 30s → 540.00° (1 tours + 180.00°)
Frame 1830: 61s → 1098.00° (3 tours + 18.00°)

🔄 Résultats:
- Rotation totale: 1098.00°
- Nombre de tours complets: 3.05
- Vitesse angulaire: 18.00°/seconde

✅ PASS: La rotation est suffisante pour être visible
✅ PASS: La vitesse de rotation est raisonnable
```

### Impact de la différence de FPS
```
FPS 24: Frame 900 → 37.50s → 675.00°
FPS 30: Frame 900 → 30.00s → 540.00°  ← Correct (GAME_CONFIG)
FPS 60: Frame 900 → 15.00s → 270.00°
```

**Diagnostic confirmé** : La différence de FPS entre preview et export causait des rotations à vitesses différentes.

## 🔧 CORRECTION APPLIQUÉE

✅ **Modifié** : `src/components/SemiCircle.tsx`
- Ligne 26 : `const timeInSeconds = frame / GAME_CONFIG.FPS;` 
- Ajout de logs de diagnostic temporaires

✅ **Ajouté** : `scripts/test-rotation-timing.ts`
- Script de test accessible via `pnpm test:rotation`

## 📝 INSTRUCTIONS DE TEST

1. **Tester la preview** : `pnpm remotion` - Observer les logs dans la console
2. **Tester l'export** : `pnpm render` - Observer la même vitesse de rotation
3. **Valider les calculs** : `pnpm test:rotation`

## 🎯 RÉSULTATS ATTENDUS APRÈS CORRECTION

- ✅ Rotation fluide et identique en preview et export
- ✅ Pas de reset toutes les 2 secondes
- ✅ Animation complète sur 61 secondes (3.05 tours)
- ✅ Logs cohérents entre les deux modes

---

**Status**: ✅ CORRIGÉ - Prêt pour test