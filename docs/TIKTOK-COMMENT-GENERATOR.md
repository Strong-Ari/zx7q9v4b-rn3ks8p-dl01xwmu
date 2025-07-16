# 🎬 Générateur de Commentaires TikTok

Ce module permet de générer automatiquement des faux commentaires TikTok avec Playwright pour vos vidéos Remotion.

## 🚀 Installation et Configuration

### Prérequis

Assurez-vous que Playwright et ses dépendances sont installés :

```bash
pnpm install
npx playwright install chromium
```

### Structure du Projet

```
src/
├── services/
│   └── tiktok-comment-generator.ts    # Service principal
├── app/api/
│   └── generate-tiktok-comment/
│       └── route.ts                   # API Route Next.js
├── remotion/
│   └── TikTokComment/
│       └── TikTokComment.tsx          # Composant Remotion
└── ...

public/
└── generated/                         # Images générées
    ├── tiktok-comment-xxx.png
    └── ...

scripts/
└── test-tiktok-generator.ts          # Script de test
```

## 📝 Utilisation

### 1. Génération via Script Direct

```bash
# Test du générateur
pnpm test:tiktok

# Génération simple
pnpm generate:comment
```

### 2. Génération via API

```typescript
// Dans votre code client
const generateComment = async () => {
  const response = await fetch("/api/generate-tiktok-comment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      maxRetries: 3,
    }),
  });

  const result = await response.json();

  if (result.success) {
    console.log("Image générée:", result.data.imagePath);
    console.log("Pseudo:", result.data.username);
    console.log("Commentaire:", result.data.comment);
  }
};
```

### 3. Utilisation Directe du Service

```typescript
import generateTikTokCommentWithRetry from "@/services/tiktok-comment-generator";

const result = await generateTikTokCommentWithRetry(3);

if (result.success) {
  // Utiliser result.imagePath dans Remotion
  console.log("Image:", result.imagePath);
}
```

## 🎨 Intégration dans Remotion

### Composant Simple

```typescript
import { TikTokComment } from '@/remotion/TikTokComment/TikTokComment';

export const MyVideo = () => {
  return (
    <div>
      {/* Votre contenu vidéo */}

      <TikTokComment
        imagePath="/generated/tiktok-comment-xxx.png"
        x={0.1}
        y={0.7}
        startFrame={60}
        duration={180}
        animationType="slideIn"
      />
    </div>
  );
};
```

### Commentaires Multiples

```typescript
import { MultipleTikTokComments, createPositionedComment } from '@/remotion/TikTokComment/TikTokComment';

export const VideoWithComments = () => {
  const comments = [
    createPositionedComment('/generated/comment-1.png', 'bottomLeft', 60),
    createPositionedComment('/generated/comment-2.png', 'bottomRight', 150),
    createPositionedComment('/generated/comment-3.png', 'centerLeft', 240)
  ];

  return (
    <div>
      {/* Votre contenu */}
      <MultipleTikTokComments comments={comments} />
    </div>
  );
};
```

### Utilisation avec le Composant Principal

```typescript
import { MainWithComments } from '@/remotion/MyComp/MainWithComments';

// Dans votre configuration Remotion
{
  id: 'MainWithComments',
  component: MainWithComments,
  durationInFrames: 900,
  fps: 30,
  width: 1080,
  height: 1920,
  defaultProps: {
    commentImages: [
      '/generated/tiktok-comment-1.png',
      '/generated/tiktok-comment-2.png'
    ],
    showComments: true,
    commentDelay: 90
  }
}
```

## ⚙️ Configuration

### Tableaux de Données

Le générateur utilise des données prédéfinies pour créer des commentaires authentiques :

#### Pseudos Aléatoires (30 options)

- `user7582`, `queen.kayla`, `itz_joey123`
- `viralwave`, `omgitslucy`, `cashlord`
- `moonchild99`, `baddie.vibes`, etc.

#### Commentaires Gen Z (42 questions)

- `"would u tell ur crush u dreamt abt them ?"`
- `"is this the reason why im still single ?"`
- `"would u kiss ur bestie for $10k ?"`
- etc.

### Options du Composant TikTokComment

| Prop                | Type     | Default   | Description               |
| ------------------- | -------- | --------- | ------------------------- |
| `imagePath`         | `string` | -         | Chemin de l'image générée |
| `x`                 | `number` | `0.1`     | Position X (0-1)          |
| `y`                 | `number` | `0.7`     | Position Y (0-1)          |
| `scale`             | `number` | `1`       | Échelle du commentaire    |
| `startFrame`        | `number` | `0`       | Frame de début            |
| `duration`          | `number` | -         | Durée en frames           |
| `animationType`     | `string` | `slideIn` | Type d'animation          |
| `animationDuration` | `number` | `30`      | Durée animation           |
| `rotation`          | `number` | `0`       | Rotation en degrés        |
| `opacity`           | `number` | `1`       | Opacité                   |

### Types d'Animation

- `fadeIn` : Apparition en fondu
- `slideIn` : Glissement depuis la droite
- `scaleIn` : Agrandissement depuis 0
- `bounceIn` : Effet de rebond
- `none` : Apparition directe

### Positions Prédéfinies

```typescript
COMMENT_POSITIONS = {
  bottomLeft: { x: 0.05, y: 0.75 },
  bottomRight: { x: 0.7, y: 0.75 },
  topLeft: { x: 0.05, y: 0.1 },
  topRight: { x: 0.7, y: 0.1 },
  center: { x: 0.3, y: 0.5 },
  centerLeft: { x: 0.05, y: 0.5 },
  centerRight: { x: 0.7, y: 0.5 },
};
```

## 🔧 Workflow Recommandé

### 1. Génération en Batch

```typescript
// Script pour générer plusieurs commentaires
const generateMultipleComments = async (count: number) => {
  const results = [];

  for (let i = 0; i < count; i++) {
    const result = await generateTikTokCommentWithRetry();
    if (result.success) {
      results.push(result.imagePath);
    }

    // Pause entre les générations
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return results;
};
```

### 2. Intégration dans le Pipeline de Rendu

```typescript
// Exemple de workflow complet
export const generateVideoWithComments = async () => {
  // 1. Générer les commentaires
  const commentPaths = await generateMultipleComments(3);

  // 2. Configurer la composition
  const composition = {
    id: "TikTokVideo",
    component: MainWithComments,
    defaultProps: {
      commentImages: commentPaths,
      showComments: true,
    },
  };

  // 3. Rendre la vidéo
  // (utiliser l'API Remotion Lambda ou render local)
};
```

## 🐛 Gestion d'Erreurs

### Erreurs Communes

1. **Site inaccessible** : Le script inclut des retry automatiques
2. **Éléments non trouvés** : Plusieurs sélecteurs de fallback
3. **Téléchargement échoué** : Vérification de l'existence du fichier

### Debugging

```bash
# Mode verbose pour voir les erreurs détaillées
DEBUG=1 pnpm test:tiktok
```

### Monitoring

Le service log automatiquement :

- ✅ Succès avec détails (pseudo, commentaire, fichier)
- ❌ Erreurs avec messages explicites
- ⏱️ Temps d'exécution
- 📊 Statistiques de fichiers

## 📈 Optimisations

### Performance

- Headless browser par défaut
- Retry intelligent avec délais progressifs
- Nettoyage automatique des anciens fichiers
- Optimisations Remotion intégrées

### Qualité

- Sélecteurs CSS robustes avec fallbacks
- Noms de fichiers uniques basés sur timestamp
- Vérification d'existence des fichiers générés
- Animations fluides optimisées pour le rendu

## 🔒 Considérations

### Respect du Site

- Utilisation responsable avec délais entre requêtes
- User-Agent réaliste pour éviter la détection
- Pas de surcharge du service tiers

### Légalité

- Utilisation pour création de contenu original
- Respect des conditions d'utilisation
- Pas de revente ou redistribution

## 📚 Exemples Complets

Voir les fichiers d'exemple dans le projet :

- `src/remotion/MyComp/MainWithComments.tsx` - Intégration complète
- `scripts/test-tiktok-generator.ts` - Tests et génération
- `src/app/api/generate-tiktok-comment/route.ts` - API usage
