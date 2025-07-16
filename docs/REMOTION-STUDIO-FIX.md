# Correction : Affichage des Images dans Remotion Studio

## 🐛 Problème rencontré

**Erreur** : `Error loading image with src: http://localhost:3002/tiktok-comment-current.png`

L'image générée n'apparaissait pas dans Remotion Studio car :
- Remotion Studio utilise un port différent (3002) que Next.js (3000)
- L'image était stockée dans `public/generated/` mais Remotion Studio ne pouvait pas y accéder
- Le chemin `/generated/tiktok-comment-current.png` n'était pas résolu correctement

## ✅ Solution appliquée

### 1. **Déplacement du fichier image**
```bash
# Avant
public/generated/tiktok-comment-current.png

# Après
public/tiktok-comment-current.png
```

### 2. **Mise à jour des chemins**

#### Service de génération (`src/services/tiktok-comment-generator.ts`)
```typescript
// Avant
const outputPath = path.join(process.cwd(), "public", "generated", fileName);
imagePath: `/generated/${fileName}`

// Après
const outputPath = path.join(process.cwd(), "public", fileName);
imagePath: `/${fileName}`
```

#### Composition vidéo (`src/remotion/BallEscape.tsx`)
```typescript
// Avant
const commentImagePath = `/generated/tiktok-comment-current.png?t=${Date.now()}`;

// Après
const commentImagePath = `/tiktok-comment-current.png?t=${Date.now()}`;
```

### 3. **Scripts mis à jour**
- `scripts/generate-comment.ts` : Vérifie le dossier `public/` au lieu de `public/generated/`
- `scripts/generate-comment-startup.ts` : Idem

## 🎯 Résultat

- ✅ **Remotion Studio** : L'image s'affiche correctement sur `http://localhost:3002`
- ✅ **Next.js Dev** : L'image fonctionne toujours sur `http://localhost:3000`
- ✅ **Cache-busting** : Le timestamp évite toujours les problèmes de cache
- ✅ **Génération automatique** : Fonctionne dans les deux environnements

## 🔍 Pourquoi ça marche maintenant

### Avant (❌ Problématique)
```
Remotion Studio (port 3002) → /generated/tiktok-comment-current.png
└── Recherche dans public/generated/ 
    └── ❌ Chemin non résolu correctement
```

### Après (✅ Solution)
```
Remotion Studio (port 3002) → /tiktok-comment-current.png
└── Recherche dans public/ 
    └── ✅ Fichier trouvé : public/tiktok-comment-current.png
```

## 💡 Recommandations

### Pour les futurs développements
- **Toujours placer les assets** dans le dossier `public/` racine pour Remotion Studio
- **Éviter les sous-dossiers** pour les fichiers devant être accessibles par Remotion
- **Tester avec les deux serveurs** : Next.js Dev (`npm run dev`) et Remotion Studio (`npm run remotion`)

### Organisation des fichiers
```
public/
├── tiktok-comment-current.png    ✅ Accessible par Remotion Studio
├── favicon.ico                   ✅ Standard Next.js
└── generated/                    ℹ️  Peut conserver les anciens fichiers
    └── tiktok-comment-old.png     ❌ Non accessible par Remotion Studio
```

## 🧪 Test de validation

1. **Générer une image** :
   ```bash
   npm run generate:comment
   ```

2. **Vérifier le fichier** :
   ```bash
   ls -la public/tiktok-comment-current.png
   ```

3. **Tester Remotion Studio** :
   ```bash
   npm run remotion
   # Aller sur http://localhost:3002
   # Sélectionner BallEscape
   # ✅ L'image du commentaire doit s'afficher
   ```

4. **Tester Next.js Dev** :
   ```bash
   npm run dev
   # Aller sur http://localhost:3000
   # ✅ L'image doit s'afficher dans la preview
   ```