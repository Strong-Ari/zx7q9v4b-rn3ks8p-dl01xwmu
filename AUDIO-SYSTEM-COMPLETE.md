# 🎵 Système Audio Complet pour Remotion

Ce document décrit le nouveau système audio complet qui gère automatiquement la conversion MIDI vers WAV et les effets sonores pour le rendu Remotion.

## 🎯 Problème Résolu

✅ **Conversion MIDI → WAV automatique** avec cache intelligent  
✅ **Génération de SFX** en WAV pour les collisions  
✅ **Audio dans le rendu final** via les composants `<Audio>` de Remotion  
✅ **Gestion automatique** des nouveaux fichiers MIDI  
✅ **Système de cache** pour éviter les reconversions  
✅ **Qualité audio optimale** via FluidSynth  

## 📁 Architecture du Système

```
scripts/
├── midi-wav-converter.ts      # Convertisseur MIDI → WAV avec cache
├── sfx-generator.ts           # Générateur d'effets sonores
└── prepare-audio-for-render.ts # Orchestrateur principal

src/components/
└── AudioSystem.tsx            # Composant Remotion pour l'audio

public/
├── midis/                     # Fichiers MIDI sources
└── generated/
    ├── audio-cache/          # Cache des WAV convertis
    ├── sfx/                  # Effets sonores générés
    └── audio-index.json      # Index des fichiers audio
```

## 🚀 Installation et Prérequis

### 1. Installer FluidSynth

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install fluidsynth fluid-soundfont-gm
```

#### macOS
```bash
brew install fluidsynth
```

#### Windows
Télécharger depuis [fluidsynth.org](https://www.fluidsynth.org/download/)

### 2. Installer les Dépendances Node

Les dépendances ont été ajoutées au `package.json` :
- `fluidnode`: Bindings Node.js pour FluidSynth (fallback)
- `wav`: Manipulation de fichiers WAV

```bash
npm install
```

## 🎵 Utilisation

### Scripts Npm Disponibles

#### Préparation Automatique (Utilisé par le Rendu)
```bash
npm run audio:prepare    # Prépare tous les audios (MIDI + SFX)
npm run prerender        # Inclut la préparation audio automatiquement
npm run render           # Rendu complet avec audio
```

#### Scripts Individuels
```bash
npm run audio:convert    # Convertit tous les MIDIs en WAV
npm run audio:sfx        # Génère tous les effets sonores
npm run audio:clean      # Nettoie les fichiers générés
npm run audio:stats      # Affiche les statistiques
```

#### Conversion Spécifique
```bash
npm run audio:convert -- convert "AfterDark.mid"
npm run audio:sfx -- collision
```

### Workflow Automatique

1. **Ajout d'un nouveau MIDI** → Placez le fichier dans `public/midis/`
2. **Sélection automatique** → `npm run select:midi` (fait automatiquement)
3. **Conversion automatique** → `npm run audio:prepare` (fait par prerender)
4. **Rendu avec audio** → `npm run render`

## 🔧 Configuration

### Système de Cache Intelligent

Le cache évite les reconversions inutiles :
- **Hash MD5** pour détecter les changements de fichiers
- **Configuration trackée** (sample rate, gain, etc.)
- **Nettoyage automatique** des fichiers orphelins

### Paramètres de Conversion

```typescript
interface ConversionConfig {
  sampleRate: number;    // 44100 Hz par défaut
  gain: number;          // 0.8 par défaut (volume)
  soundfontPath?: string; // Auto-détecté
  outputFormat: "wav";   // Format de sortie
}
```

### SFX Générés

| Fichier | Usage | Caractéristiques |
|---------|-------|------------------|
| `collision.wav` | Balle → Cercle | 800Hz, 0.2s, Sine |
| `ball-collision.wav` | Balle → Balle | 600Hz, 0.15s, Triangle |
| `gap-pass.wav` | Passage réussi | 1200Hz, 0.3s, Sine |
| `success.wav` | Victoire | Accord majeur, 0.5s |

## 🎮 Intégration dans le Jeu

### Composant AudioSystem

Le composant `AudioSystem` gère l'audio pendant le rendu :

```tsx
<AudioSystem
  onCollision={audioTriggers.triggers.collision}
  onBallCollision={audioTriggers.triggers.ballCollision}
  onGapPass={audioTriggers.triggers.gapPass}
  onSuccess={audioTriggers.triggers.success}
  musicVolume={0.6}
  sfxVolume={0.8}
  showDebugInfo={false}
/>
```

### Hook useAudioTriggers

```tsx
const audioTriggers = useAudioTriggers();

// Déclencher un effet sonore
audioTriggers.triggerCollision();
audioTriggers.triggerBallCollision();
audioTriggers.triggerGapPass();
audioTriggers.triggerSuccess();
```

## 📊 Index Audio

Le fichier `public/generated/audio-index.json` contient toutes les informations :

```json
{
  "music": [
    {
      "type": "music",
      "name": "AfterDark",
      "relativePath": "generated/audio-cache/AfterDark.wav",
      "duration": 180.5,
      "size": 15728640
    }
  ],
  "sfx": [
    {
      "type": "sfx",
      "name": "collision",
      "relativePath": "generated/sfx/collision.wav",
      "duration": 0.2,
      "size": 17640
    }
  ],
  "selectedMusic": { /* Musique sélectionnée pour ce rendu */ },
  "generatedAt": "2025-01-02T10:30:00.000Z"
}
```

## 🔍 Debug et Surveillance

### Mode Debug

Activez `showDebugInfo={true}` dans `AudioSystem` pour voir :
- Frame actuelle et temps
- Musique chargée
- SFX actifs en temps réel
- Nombre total de triggers

### Logs de Conversion

Tous les scripts affichent des logs détaillés :
```
[MidiWavConverter] 🎵 Conversion en cours: AfterDark.mid
[MidiWavConverter] 📊 Commande: fluidsynth -ni -F "output.wav" -r 44100 -g 0.8 "soundfont.sf2" "input.mid"
[MidiWavConverter] ✅ Conversion réussie: 15.25 MB
```

### Statistiques

```bash
npm run audio:stats
```

Affiche :
- Nombre de fichiers musicaux et SFX
- Taille totale du cache
- Musique sélectionnée et sa durée
- Date de génération

## 🗂️ Gestion des Fichiers

### Structure Générée

```
public/generated/
├── audio-cache/
│   ├── AfterDark.wav
│   ├── cache-index.json
│   └── ...
├── sfx/
│   ├── collision.wav
│   ├── ball-collision.wav
│   ├── gap-pass.wav
│   └── success.wav
└── audio-index.json
```

### Nettoyage

```bash
npm run audio:clean  # Supprime tous les fichiers générés
```

### Sauvegardes

Le cache peut être sauvegardé et restauré :
- Les fichiers WAV peuvent être committé (optionnel)
- L'index se régénère automatiquement
- Les hash MD5 garantissent la cohérence

## ⚡ Performance

### Optimisations

- **Cache intelligent** : Évite les reconversions
- **Conversion en parallèle** : Traitement simultané possible
- **Compression WAV** : Qualité optimale avec taille réduite
- **Index JSON** : Chargement rapide des métadonnées

### Temps de Conversion

| Fichier MIDI | Taille | Temps de Conversion | WAV Résultant |
|--------------|--------|-------------------|---------------|
| 50KB | ~0.5-2s | ~5-15MB |
| 500KB | ~2-5s | ~20-50MB |

## 🔧 Dépannage

### Problèmes Courants

#### FluidSynth non trouvé
```
❌ FluidSynth n'est pas installé ou accessible
💡 Installation: apt-get install fluidsynth (Ubuntu) ou brew install fluidsynth (macOS)
```

#### Aucun SoundFont
```
⚠️ Aucun SoundFont trouvé dans les emplacements standards
```
Solutions :
- Installer `fluid-soundfont-gm` (Ubuntu)
- Télécharger un SoundFont et le placer dans `assets/soundfonts/`

#### Erreur de Conversion
```
❌ Erreur lors de la conversion: Le fichier de sortie n'a pas été créé
```
Vérifiez :
- Permissions d'écriture dans `public/generated/`
- Espace disque disponible
- Validité du fichier MIDI

#### Audio Manquant dans le Rendu
```
⚠️ Aucun index audio trouvé
```
Solutions :
1. Exécuter `npm run audio:prepare`
2. Vérifier que `public/generated/audio-index.json` existe
3. Relancer `npm run prerender`

### Logs de Debug

Activez les logs détaillés en ajoutant au début du composant :

```tsx
// Dans AudioSystem.tsx
showDebugInfo={true}

// Dans les scripts
console.log("[DEBUG]", ...);
```

## 📈 Évolutions Futures

### Améliorations Prévues

- **Support de formats multiples** : MP3, OGG, FLAC
- **Compression audio** : Réduction de la taille des fichiers
- **SoundFonts personnalisés** : Configuration par projet
- **Effets audio** : Reverb, EQ, filters
- **Synchronisation précise** : Timing au frame près

### API Extensible

Le système est conçu pour être facilement extensible :

```typescript
// Ajouter de nouveaux types de SFX
interface CustomSFXConfig extends SoundParams {
  customProperty: string;
}

// Nouveaux triggers audio
audioTriggers.triggerCustomSound();
```

## 🎉 Résumé

Ce système audio complet résout tous les problèmes d'audio dans Remotion :

✅ **Conversion automatique** MIDI → WAV avec cache  
✅ **SFX générés** algorithmiquement  
✅ **Intégration native** avec `<Audio>` de Remotion  
✅ **Gestion automatique** des nouveaux fichiers  
✅ **Performance optimisée** avec cache intelligent  
✅ **Debug complet** avec logs et statistiques  

Le système fonctionne de manière totalement **automatique** : ajoutez des MIDIs, lancez le rendu, obtenez un video avec audio parfait ! 🎵✨