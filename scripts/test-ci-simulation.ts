import { addExtra } from "playwright-extra";
import { chromium } from "patchright";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, BrowserContext, Page } from "playwright";

// Configuration du navigateur avec stealth
const chromiumExtra = addExtra(chromium);
chromiumExtra.use(StealthPlugin());

// Fonction pour détecter l'environnement CI/CD
function isCIEnvironment(): boolean {
  return process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
}

// Fonction pour obtenir les timeouts adaptés à l'environnement
function getEnvironmentTimeouts() {
  const isCI = isCIEnvironment();
  return {
    navigation: isCI ? 45000 : 30000,
    networkIdle: isCI ? 30000 : 15000,
    selector: isCI ? 20000 : 10000,
    element: isCI ? 15000 : 8000,
  };
}

// Fonction utilitaire pour les délais aléatoires
const humanDelay = (min: number = 1000, max: number = 3000): Promise<void> => {
  const isCI = isCIEnvironment();

  // En CI, on augmente les délais pour éviter les timeouts
  const adjustedMin = isCI ? Math.max(min, 2000) : min;
  const adjustedMax = isCI ? Math.max(max, 5000) : max;

  const delay =
    Math.floor(Math.random() * (adjustedMax - adjustedMin + 1)) + adjustedMin;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// Fonction pour logger avec timestamp
const logWithTimestamp = (message: string): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

async function testCIEnvironment() {
  let browser: Browser | null = null;

  try {
    logWithTimestamp("🧪 Test de simulation d'environnement CI/CD...");

    // Simuler l'environnement CI
    process.env.CI = "true";
    process.env.GITHUB_ACTIONS = "true";

    const isCI = isCIEnvironment();
    const timeouts = getEnvironmentTimeouts();

    logWithTimestamp(`🌍 Environnement détecté: ${isCI ? "CI/CD" : "Local"}`);
    logWithTimestamp(`⏱️ Timeouts configurés: ${JSON.stringify(timeouts)}`);

    // Test de la fonction humanDelay
    logWithTimestamp("⏳ Test de humanDelay...");
    const startTime = Date.now();
    await humanDelay(1000, 2000);
    const endTime = Date.now();
    logWithTimestamp(`✅ humanDelay terminé en ${endTime - startTime}ms`);

    // Test de lancement du navigateur
    logWithTimestamp("🌐 Test de lancement du navigateur...");
    browser = await chromiumExtra.launch({
      headless: true,
      slowMo: isCI ? 200 : 100,
      channel: "chrome",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
        "--disable-hang-monitor",
        "--disable-prompt-on-repost",
        "--disable-client-side-phishing-detection",
        "--disable-component-extensions-with-background-pages",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-sync",
        "--metrics-recording-only",
        "--no-first-run",
        "--safebrowsing-disable-auto-update",
        "--disable-translate",
        "--disable-background-networking",
        "--hide-scrollbars",
        "--mute-audio",
        "--ignore-certificate-errors",
        "--ignore-ssl-errors",
        "--ignore-certificate-errors-spki-list",
      ],
    });

    logWithTimestamp("✅ Navigateur lancé avec succès");

    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      locale: "fr-FR",
      timezoneId: "Europe/Paris",
    });

    const page = await context.newPage();

    // Test de navigation avec timeout adapté
    logWithTimestamp(
      `🧭 Test de navigation avec timeout ${timeouts.navigation}ms...`,
    );
    await page.goto("https://httpbin.org/get", {
      waitUntil: "domcontentloaded",
      timeout: timeouts.navigation,
    });

    logWithTimestamp("✅ Navigation réussie");

    // Test d'attente avec timeout adapté
    logWithTimestamp(
      `⏱️ Test d'attente networkidle avec timeout ${timeouts.networkIdle}ms...`,
    );
    await page.waitForLoadState("networkidle", {
      timeout: timeouts.networkIdle,
    });

    logWithTimestamp("✅ Attente networkidle réussie");

    logWithTimestamp("🎉 Tous les tests CI/CD simulés ont réussi !");
  } catch (error) {
    logWithTimestamp(`❌ Erreur lors du test: ${error}`);
    throw error;
  } finally {
    if (browser) {
      logWithTimestamp("🔒 Fermeture du navigateur...");
      await browser.close();
    }
  }
}

// Point d'entrée
async function main() {
  try {
    await testCIEnvironment();
  } catch (error) {
    logWithTimestamp(`💥 Erreur fatale: ${error}`);
    process.exit(1);
  }
}

// Lancement
main();
