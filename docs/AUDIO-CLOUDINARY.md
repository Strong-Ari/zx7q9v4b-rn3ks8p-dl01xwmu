# Système Audio Cloudinary

Ce système permet de télécharger automatiquement une musique aléatoire depuis Cloudinary et de l'intégrer dans les compositions Remotion.

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet avec :

```bash
# Obligatoire
CLOUDINARY_CLOUD_NAME=votre_nom_de_cloud

# Optionnel (pour la synchronisation automatique)
CLOUDINARY_API_KEY=votre_cle_api
CLOUDINARY_API_SECRET=votre_secret_api
```

### 2. Organisation sur Cloudinary

Organisez vos fichiers audio sur Cloudinary avec cette structure :
```
- audio/
  - AfterDark.wav
  - BoMoonlightN12.wav
  - comfort_chain.wav
  - ... autres fichiers
```

## Utilisation

### Scripts disponibles

```bash
# Télécharger une musique aléatoire
pnpm download:audio

# Lancer Remotion Studio (télécharge automatiquement l'audio)
pnpm remotion

# Render avec audio aléatoire
pnpm render

# Synchroniser la liste des audios depuis Cloudinary (optionnel)
pnpm sync:cloudinary
```

### Workflow automatique

1. **`pnpm remotion`** ou **`pnpm render`** :
   - Génère un commentaire TikTok
   - Télécharge une musique aléatoire depuis Cloudinary
   - Lance Remotion Studio ou le rendu

2. **Fichiers générés** :
   - `public/current-audio.wav` : La musique téléchargée
   - `public/current-audio-metadata.json` : Métadonnées de la musique

## Fonctionnement technique

### 1. Script de téléchargement (`scripts/download-random-audio.ts`)

- Sélectionne aléatoirement une musique dans la liste
- Télécharge le fichier depuis Cloudinary
- Sauvegarde en tant que `current-audio.wav`
- Génère les métadonnées

### 2. Intégration Remotion

Les compositions `BallEscape` et `BallEscapeOptimized` utilisent :

```tsx
import { Audio } from "remotion";

const audioPath = staticFile("current-audio.wav");

// Dans le JSX
<Audio src={audioPath} />
```

### 3. Synchronisation automatique (optionnel)

Le script `sync-cloudinary-audios.ts` :
- Se connecte à l'API Cloudinary
- Récupère la liste des fichiers audio
- Met à jour automatiquement le script de téléchargement

## Avantages

✅ **Léger** : Plus de gros fichiers WAV dans le repo  
✅ **Automatique** : Intégré dans les scripts existants  
✅ **Aléatoire** : Musique différente à chaque rendu  
✅ **Compatible** : Fonctionne avec toutes les compositions  
✅ **Remotion native** : Utilise le composant `<Audio>` officiel  

## Migration depuis le système MIDI

Les anciens fichiers WAV peuvent être supprimés du dossier `public/songs/` une fois qu'ils sont uploadés sur Cloudinary.

Le système MIDI reste disponible pour les effets sonores interactifs mais n'est plus utilisé pour la musique de fond.

## Dépannage

### Erreur de téléchargement
- Vérifiez `CLOUDINARY_CLOUD_NAME` dans `.env`
- Vérifiez que les URLs Cloudinary sont accessibles
- Assurez-vous que les fichiers existent sur Cloudinary

### Audio non audible dans le rendu
- Le composant `<Audio>` de Remotion gère automatiquement l'audio
- L'audio sera inclus dans les exports vidéo
- Testez d'abord dans Remotion Studio

### Synchronisation échoue
- Vérifiez les clés API Cloudinary
- Assurez-vous que le dossier `audio/` existe sur Cloudinary
- Vérifiez les permissions de l'API key