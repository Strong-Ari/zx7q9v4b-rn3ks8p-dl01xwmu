# Intégration des Commentaires TikTok dans la Vidéo

## Vue d'ensemble

Le système a été modifié pour remplacer le faux commentaire UI par une vraie image de commentaire TikTok générée automatiquement. L'image générée remplace directement l'UI factice dans la vidéo.

## Fonctionnement

### 1. Génération de l'image
```bash
npm run generate:comment
```

Cette commande :
- Génère un pseudo TikTok aléatoire
- Génère un commentaire aléatoire en style Gen Z
- Crée une image de commentaire TikTok réaliste
- Sauvegarde l'image sous le nom fixe `tiktok-comment-current.png`
- Supprime automatiquement l'ancienne image pour éviter la surcharge du repo

### 2. Intégration dans la vidéo

L'image générée est automatiquement utilisée dans la composition `BallEscape` :
- **Fichier modifié** : `src/remotion/BallEscape.tsx`
- **Composant utilisé** : `TikTokComment` au lieu de `Comment`
- **Image source** : `/tiktok-comment-current.png`

### 3. Configuration

#### Position et animation :
```typescript
<TikTokComment
  imagePath="/tiktok-comment-current.png"
  x={0.5}          // Position horizontale (0-1)
  y={0.1}          // Position verticale (0-1)
  scale={1}        // Échelle du commentaire
  startFrame={0}   // Frame de début
  animationType="fadeIn"
  animationDuration={30}
/>
```

#### Types d'animation disponibles :
- `fadeIn` : Apparition en fondu
- `slideIn` : Glissement depuis la droite
- `scaleIn` : Zoom d'apparition
- `bounceIn` : Effet de rebond
- `none` : Aucune animation

## Workflow Recommandé

### Pour générer une nouvelle vidéo :

1. **Générer le commentaire** :
   ```bash
   npm run generate:comment
   ```

2. **Vérifier l'image** :
   L'image sera créée dans `public/tiktok-comment-current.png`

3. **Générer la vidéo** :
   ```bash
   npm run render
   ```

### Personnalisation

#### Modifier les commentaires possibles :
Éditez le tableau `RANDOM_COMMENTS` dans `src/services/tiktok-comment-generator.ts`

#### Modifier les pseudos possibles :
Éditez le tableau `RANDOM_USERNAMES` dans `src/services/tiktok-comment-generator.ts`

#### Ajuster la position du commentaire :
Modifiez les propriétés `x` et `y` du composant `TikTokComment` dans `BallEscape.tsx`

## Avantages du Système

### ✅ Nom fixe
- Une seule image dans le repo
- Pas de surcharge de fichiers
- Facilite le déploiement

### ✅ Réalisme
- Vraie image de commentaire TikTok
- Pseudo et commentaire aléatoires
- Style Gen Z authentique

### ✅ Simplicité
- Pas besoin d'API
- Une seule commande pour générer
- Intégration automatique dans la vidéo

### ✅ Flexibilité
- Position configurable
- Animations personnalisables
- Timing ajustable

## Fichiers Modifiés

1. **Service de génération** : `src/services/tiktok-comment-generator.ts`
   - Nom de fichier fixe au lieu de timestamp
   - Suppression automatique de l'ancienne image

2. **Composition principale** : `src/remotion/BallEscape.tsx`
   - Remplacement du composant `Comment` par `TikTokComment`
   - Utilisation de l'image générée

3. **Script de génération** : `scripts/generate-comment.ts`
   - Script simplifié pour génération sans API

4. **Package.json** : Mise à jour de la commande `generate:comment`

## Troubleshooting

### L'image ne s'affiche pas
- Vérifiez que l'image existe : `public/tiktok-comment-current.png`
- Regénérez l'image : `npm run generate:comment`

### Erreur Playwright
- Installez les browsers : `npx playwright install chromium`
- Vérifiez la connexion internet

### Position incorrecte
- Ajustez les valeurs `x` et `y` dans `BallEscape.tsx`
- Valeurs entre 0 et 1 (0.5 = centre)