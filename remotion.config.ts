// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { Config } from "@remotion/cli/config";
import { webpackOverride } from "./src/remotion/webpack-override.mjs";

// ✅ OPTIMISATIONS EXPORT REMOTION ✅

// 1. Format d'image optimisé pour l'export
Config.setVideoImageFormat("jpeg"); // JPEG = moins de RAM que PNG

// 2. Qualité vidéo optimisée
Config.setCrf(18); // Qualité élevée mais encode plus léger que défaut (23)

// 3. Concurrency limitée pour éviter la surcharge CPU/RAM
Config.setConcurrency(2); // Limiter à 2 threads (adaptable selon la machine)

// 4. Optimisations de rendu
Config.setChromiumOpenGlRenderer("egl"); // Renderer GPU plus stable
Config.setChromiumHeadlessMode(true); // Mode headless pour les performances

// 5. Configuration mémoire
Config.setChromiumDisableWebSecurity(false); // Sécurité activée
Config.setTimeoutInMilliseconds(120000); // Timeout plus long: 2 minutes

// 6. Assets statiques
Config.setPublicDir("public");

// 7. Configuration Webpack
Config.overrideWebpackConfig(webpackOverride);

// 8. Preview settings (plus léger pour le développement)
if (process.env.NODE_ENV !== "production") {
  Config.setVideoImageFormat("png"); // PNG pour preview (meilleure qualité debug)
  Config.setConcurrency(1); // 1 thread en dev pour debug plus facile
}
