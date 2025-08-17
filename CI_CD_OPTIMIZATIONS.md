# Optimisations CI/CD pour le Script d'Upload Vidéo

## Problème Identifié

Le script `video-upload-automation.ts` fonctionnait parfaitement en local mais échouait sur GitHub Actions avec des erreurs de timeout, notamment lors de la navigation vers l'onglet Planification.

## Solutions Implémentées

### 1. Détection Automatique de l'Environnement

```typescript
function isCIEnvironment(): boolean {
  return process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
}
```

### 2. Timeouts Adaptatifs

Les timeouts sont automatiquement ajustés selon l'environnement :

```typescript
function getEnvironmentTimeouts() {
  const isCI = isCIEnvironment();
  return {
    navigation: isCI ? 45000 : 30000, // 45s en CI, 30s en local
    networkIdle: isCI ? 30000 : 15000, // 30s en CI, 15s en local
    selector: isCI ? 20000 : 10000, // 20s en CI, 10s en local
    element: isCI ? 15000 : 8000, // 15s en CI, 8s en local
  };
}
```

### 3. Délais Humains Adaptatifs

Les délais entre les actions sont augmentés en environnement CI/CD :

```typescript
const humanDelay = (min: number = 1000, max: number = 3000): Promise<void> => {
  const isCI = isCIEnvironment();

  // En CI, on augmente les délais pour éviter les timeouts
  const adjustedMin = isCI ? Math.max(min, 2000) : min;
  const adjustedMax = isCI ? Math.max(max, 5000) : max;

  const delay =
    Math.floor(Math.random() * (adjustedMax - adjustedMin + 1)) + adjustedMin;
  return new Promise((resolve) => setTimeout(resolve, delay));
};
```

### 4. Navigation Robuste avec Retry

La fonction `ensureOnPlanningTab` a été améliorée avec :

- Détection automatique de l'environnement CI/CD
- Timeouts adaptatifs
- Système de retry avec rafraîchissement de page
- Fallback vers `domcontentloaded` si `networkidle` échoue

### 5. Configuration Navigateur Optimisée

Arguments supplémentaires pour l'environnement CI/CD :

- `--disable-gpu`
- `--disable-software-rasterizer`
- `--disable-background-timer-throttling`
- `--ignore-certificate-errors`
- `--ignore-ssl-errors`
- Et bien d'autres...

### 6. SlowMo Adaptatif

```typescript
slowMo: isCI ? 200 : 100, // Ralentissement plus important en CI
```

## Fichiers Modifiés

1. **`scripts/video-upload-automation.ts`** - Script principal avec toutes les optimisations
2. **`.github/workflows/test-video-upload.yml`** - Workflow GitHub Actions pour tester
3. **`scripts/test-ci-simulation.ts`** - Script de test pour simuler l'environnement CI/CD
4. **`package.json`** - Ajout du script de test

## Tests

### Test Local de Simulation CI/CD

```bash
pnpm run test-ci-simulation
```

Ce script simule l'environnement CI/CD localement pour vérifier que les optimisations fonctionnent.

### Test sur GitHub Actions

Le workflow `.github/workflows/test-video-upload.yml` peut être déclenché manuellement ou automatiquement sur les push/PR.

## Variables d'Environnement Requises

Pour que le script fonctionne sur GitHub Actions, vous devez configurer ces secrets :

- `METRICOOL_EMAIL` - Email de connexion Metricool
- `METRICOOL_PASSWORD` - Mot de passe Metricool

## Monitoring

En cas d'échec, le workflow upload automatiquement les screenshots dans les artifacts GitHub Actions pour faciliter le debugging.

## Avantages

1. **Robustesse** : Le script fonctionne maintenant dans les deux environnements
2. **Adaptabilité** : Détection automatique de l'environnement
3. **Debugging** : Screenshots automatiques en cas d'échec
4. **Performance** : Timeouts optimisés selon l'environnement
5. **Maintenance** : Code centralisé et réutilisable

## Notes Importantes

- Les timeouts plus longs en CI/CD sont nécessaires car les ressources sont limitées
- Les délais plus longs simulent un comportement plus humain et évitent la détection
- Le script conserve toutes ses fonctionnalités anti-détection existantes
