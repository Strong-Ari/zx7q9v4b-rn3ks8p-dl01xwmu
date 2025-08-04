# 🚀 Guide de Démarrage Rapide - Système Audio

Ce guide vous permet de mettre en place le système audio complet en quelques minutes.

## ⚡ Installation Express

### 1. Installer FluidSynth

#### Ubuntu/Debian
```bash
sudo apt-get update && sudo apt-get install -y fluidsynth fluid-soundfont-gm
```

#### macOS
```bash
brew install fluidsynth
```

#### Windows
Télécharger depuis [fluidsynth.org](https://www.fluidsynth.org/download/)

### 2. Installer les Dépendances Node
```bash
npm install
```

### 3. Tester le Système
```bash
npm run audio:test
```

Si tous les tests passent ✅, vous êtes prêt !

## 🎵 Premier Rendu avec Audio

### Étape 1: Vérifier les MIDIs
```bash
ls public/midis/
# Vous devriez voir vos fichiers .mid
```

### Étape 2: Préparer l'Audio
```bash
npm run audio:prepare
```
Cette commande :
- Convertit automatiquement le MIDI sélectionné en WAV
- Génère tous les effets sonores
- Crée l'index audio pour Remotion

### Étape 3: Lancer le Rendu
```bash
npm run render
```

🎉 **C'est tout !** Votre vidéo contiendra maintenant l'audio complet.

## 📊 Vérification Rapide

### Statistiques du Système
```bash
npm run audio:stats
```

### Structure Générée
```
public/generated/
├── audio-cache/          # WAV convertis depuis MIDI
│   ├── AfterDark.wav
│   └── cache-index.json
├── sfx/                  # Effets sonores
│   ├── collision.wav
│   ├── ball-collision.wav
│   ├── gap-pass.wav
│   └── success.wav
└── audio-index.json      # Index pour Remotion
```

## 🔧 Personnalisation Rapide

### Ajuster les Volumes
Dans `src/remotion/BallEscape.tsx` :
```tsx
<AudioSystem
  musicVolume={0.6}      // Volume musique (0.0 - 1.0)
  sfxVolume={0.8}        // Volume effets (0.0 - 1.0)
  showDebugInfo={false}  // true pour voir les debug
/>
```

### Debug Audio en Temps Réel
```tsx
<AudioSystem
  showDebugInfo={true}  // Affiche les infos audio
/>
```

## 🎮 Workflow Complet

### Développement
1. **Studio Remotion** → Audio via Tone.js (navigateur)
   ```bash
   npm run remotion
   ```

2. **Rendu Final** → Audio via fichiers WAV (serveur)
   ```bash
   npm run render
   ```

### Ajout de Nouveaux MIDIs
1. Placer le fichier `.mid` dans `public/midis/`
2. Le système les détecte automatiquement au prochain rendu
3. Pas de configuration nécessaire !

### Nettoyage
```bash
npm run audio:clean  # Supprime les fichiers générés
```

## 🆘 Dépannage Express

### Erreur FluidSynth
```
❌ FluidSynth n'est pas installé
```
**Solution :** Installer FluidSynth (voir section 1)

### Aucun MIDI Trouvé
```
❌ Aucun fichier MIDI trouvé
```
**Solution :** Placer des fichiers `.mid` dans `public/midis/`

### Audio Silencieux
```
⚠️ Aucun index audio trouvé
```
**Solution :** 
```bash
npm run audio:prepare
npm run render
```

### Cache Corrompu
```bash
npm run audio:clean
npm run audio:prepare
```

## 🎯 Points Clés

✅ **Automatique** - Le système gère tout seul les nouveaux fichiers  
✅ **Cache Intelligent** - Évite les reconversions inutiles  
✅ **Dual Mode** - Studio (Tone.js) + Rendu (WAV)  
✅ **Qualité Optimale** - FluidSynth pour la conversion  
✅ **Debug Complet** - Logs détaillés et statistiques  

## 📝 Commandes Essentielles

```bash
# Test complet du système
npm run audio:test

# Préparation audio (inclus dans prerender)
npm run audio:prepare

# Rendu avec audio
npm run render

# Statistiques
npm run audio:stats

# Nettoyage
npm run audio:clean
```

**Le système fonctionne maintenant automatiquement ! 🎵✨**

Pour plus de détails, consultez `AUDIO-SYSTEM-COMPLETE.md`.