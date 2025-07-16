# Ball Escape - Générateur de Vidéo TikTok avec Remotion

Un générateur de vidéo TikTok stylé qui simule un jeu "Ball Escape Rings" avec des animations fluides, des effets sonores MIDI et un design moderne.

## 🎮 Fonctionnalités

- Animation fluide de deux balles (Yes/No) avec effet de traînée
- Cercles semi-ouverts dynamiques avec animations d'explosion
- Sons MIDI réactifs aux collisions
- **🆕 Génération automatique de commentaires TikTok réalistes**
- Interface style TikTok avec commentaire, scores et timer
- Animation de fin stylée
- Export en MP4/WebM haute qualité

## 🤖 Génération Automatique de Commentaires

Le système génère automatiquement des commentaires TikTok authentiques :

- **🔄 Au démarrage** : Un commentaire est généré automatiquement avec `npm run dev`
- **🔄 À chaque rafraîchissement** : Nouveau commentaire à chaque chargement de page
- **🎲 Contenu aléatoire** : Pseudos et commentaires Gen Z authentiques
- **📱 Design réaliste** : Images de commentaires TikTok via Playwright
- **💾 Nom fixe** : Une seule image (`tiktok-comment-current.png`) pour éviter la surcharge

### Interface intuitive
- Statut de génération en temps réel
- Bouton "Régénérer" pour un nouveau commentaire
- Affichage du pseudo et commentaire générés

## 🛠️ Technologies

- [Remotion](https://www.remotion.dev/) - Framework de génération vidéo React
- [Next.js](https://nextjs.org/) - Framework React
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- Web Audio API - Gestion des sons MIDI

## 🚀 Installation

1. Cloner le projet :

```bash
git clone [votre-repo]
cd tiktok
```

2. Installer les dépendances :

```bash
pnpm install
```

## 💻 Développement

1. Lancer le serveur de développement :

```bash
pnpm dev
```

2. Ouvrir [http://localhost:3000](http://localhost:3000)

3. Pour le studio Remotion :

```bash
pnpm remotion
```

## 🎥 Export Vidéo

Pour exporter la vidéo en MP4 :

```bash
pnpm render
# ou
npx remotion render src/remotion/Root.tsx BallEscape out/video.mp4
```

## ⚙️ Configuration

Les paramètres du jeu peuvent être modifiés dans `src/constants/game.ts` :

- Dimensions de la vidéo
- Durée
- Taille et vitesse des balles
- Configuration des cercles
- Couleurs
- Paramètres MIDI

## 🎨 Personnalisation

1. **Couleurs** : Modifier les couleurs dans `src/constants/game.ts`
2. **Sons** : Ajuster les fréquences MIDI dans `MIDI_CONFIG`
3. **Animations** : Modifier les paramètres de spring et d'interpolation dans les composants
4. **Interface** : Personnaliser les composants dans `src/components/UI.tsx`

## 📝 Structure du Projet

```
src/
  ├── components/      # Composants React
  │   ├── Ball.tsx    # Balle avec traînée
  │   ├── SemiCircle.tsx
  │   ├── UI.tsx      # Interface TikTok
  │   └── WinnerAnimation.tsx
  ├── hooks/          # Hooks personnalisés
  │   ├── useCollision.ts
  │   └── useMidiPlayer.ts
  ├── constants/      # Configuration
  │   └── game.ts
  └── remotion/       # Composition Remotion
      ├── Root.tsx
      └── BallEscape.tsx
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

MIT
