import { addExtra } from "playwright-extra";
import { chromium } from "patchright";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, BrowserContext, Page } from "playwright";
import { promises as fs } from "fs";
import { existsSync } from "fs";
import dotenv from "dotenv";
import path from "path";

// Charger les variables d'environnement
dotenv.config();

// Configuration du navigateur avec stealth
const chromiumExtra = addExtra(chromium);
chromiumExtra.use(StealthPlugin());

// Fonction utilitaire pour les délais aléatoires
const humanDelay = (min: number = 1000, max: number = 3000): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// Fonction pour logger avec timestamp
const logWithTimestamp = (message: string): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// Fonction pour gérer les éléments bloquants et améliorer les interactions
async function safeInteraction(
  page: Page,
  element: any,
  action: 'hover' | 'click',
  description: string,
): Promise<void> {
  try {
    logWithTimestamp(`🔄 Tentative ${action} sur: ${description}`);
    
    // Vérifier si l'élément est visible et stable
    await element.waitForElementState('stable', { timeout: 10000 });
    
    // Faire défiler l'élément en vue si nécessaire
    await element.scrollIntoViewIfNeeded();
    await humanDelay(200, 500);
    
    // Vérifier s'il y a des éléments qui bloquent
    const isBlocked = await page.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Vérifier s'il y a des éléments qui interceptent le centre
      const elementAtPoint = document.elementFromPoint(centerX, centerY);
      return elementAtPoint !== el && !el.contains(elementAtPoint);
    }, element);
    
    if (isBlocked) {
      logWithTimestamp(`⚠️ Élément bloqué détecté, tentative de déblocage...`);
      
      // Essayer de fermer les toasts ou modales qui pourraient bloquer
      const blockingElements = await page.$$(
        'div.text-white .v-icon.fa-xmark, div.text-white .v-icon[aria-label="Fermer"], div.text-white button[aria-label="Fermer"], .toast, .modal, .overlay'
      );
      
      for (const blocker of blockingElements) {
        try {
          if (await blocker.isVisible()) {
            await blocker.click();
            await humanDelay(300, 600);
            logWithTimestamp("Élément bloquant fermé");
          }
        } catch (e) {
          // Ignorer les erreurs de clic
        }
      }
      
      // Attendre un peu et réessayer
      await humanDelay(1000, 2000);
    }
    
    // Exécuter l'action avec retry
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        if (action === 'hover') {
          await element.hover({ timeout: 15000 });
        } else {
          await element.click({ timeout: 15000, force: true });
        }
        logWithTimestamp(`✅ ${action} réussi sur: ${description}`);
        return;
      } catch (error) {
        retryCount++;
        logWithTimestamp(`⚠️ Tentative ${retryCount}/${maxRetries} échouée: ${error}`);
        
        if (retryCount < maxRetries) {
          await humanDelay(1000, 2000);
          
          // Essayer de rafraîchir l'état de l'élément
          try {
            await element.waitForElementState('stable', { timeout: 5000 });
          } catch (e) {
            // Ignorer les erreurs de rafraîchissement
          }
        }
      }
    }
    
    throw new Error(`${action} échoué après ${maxRetries} tentatives sur: ${description}`);
  } catch (error) {
    logWithTimestamp(`❌ Erreur lors de ${action} sur ${description}: ${error}`);
    throw error;
  }
}

// Fonction pour nettoyer proactivement les éléments bloquants
async function cleanupBlockingElements(page: Page): Promise<void> {
  try {
    logWithTimestamp("🧹 Nettoyage des éléments bloquants...");
    
    // Sélecteurs des éléments qui peuvent bloquer
    const blockingSelectors = [
      'div.text-white .v-icon.fa-xmark',
      'div.text-white .v-icon[aria-label="Fermer"]',
      'div.text-white button[aria-label="Fermer"]',
      '.toast',
      '.modal',
      '.overlay',
      '.notification',
      '.alert',
      '[class*="toast"]',
      '[class*="modal"]',
      '[class*="overlay"]',
      '[class*="notification"]',
      '[class*="alert"]'
    ];
    
    for (const selector of blockingSelectors) {
      try {
        const elements = await page.$$(selector);
        for (const element of elements) {
          if (await element.isVisible()) {
            try {
              await element.click({ timeout: 5000, force: true });
              await humanDelay(200, 400);
              logWithTimestamp(`Élément bloquant fermé: ${selector}`);
            } catch (e) {
              // Ignorer les erreurs de clic
            }
          }
        }
      } catch (e) {
        // Ignorer les erreurs de sélecteur
      }
    }
    
    // Attendre un peu après le nettoyage
    await humanDelay(500, 1000);
    logWithTimestamp("✅ Nettoyage des éléments bloquants terminé");
  } catch (error) {
    logWithTimestamp(`⚠️ Erreur lors du nettoyage: ${error}`);
  }
}

// Script de test principal
async function testInteractions(): Promise<void> {
  let browser: Browser | null = null;

  try {
    logWithTimestamp("🧪 Démarrage du test des interactions sécurisées...");

    // Lancement du navigateur
    browser = await chromiumExtra.launch({
      headless: false, // Mode visible pour le test
      slowMo: 100,
      channel: "chrome",
      args: [
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor,TranslateUI",
        "--disable-ipc-flooding-protection",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--disable-client-side-phishing-detection",
        "--disable-component-extensions-with-background-pages",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-features=Translate",
        "--disable-hang-monitor",
        "--disable-popup-blocking",
        "--disable-prompt-on-repost",
        "--disable-sync",
        "--metrics-recording-only",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--enable-automation=false",
        "--password-store=basic",
        "--use-mock-keychain",
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      locale: "fr-FR",
      timezoneId: "Europe/Paris",
    });

    const page = await context.newPage();

    // Test sur une page simple
    logWithTimestamp("🌐 Navigation vers une page de test...");
    await page.goto("https://example.com", { waitUntil: "domcontentloaded" });
    await humanDelay(2000, 3000);

    // Test de la fonction safeInteraction
    logWithTimestamp("🧪 Test de safeInteraction...");
    const heading = await page.$("h1");
    if (heading) {
      await safeInteraction(page, heading, 'hover', 'Titre de la page');
      logWithTimestamp("✅ Test hover réussi");
      
      await safeInteraction(page, heading, 'click', 'Titre de la page');
      logWithTimestamp("✅ Test click réussi");
    }

    // Test de la fonction cleanupBlockingElements
    logWithTimestamp("🧪 Test de cleanupBlockingElements...");
    await cleanupBlockingElements(page);
    logWithTimestamp("✅ Test de nettoyage réussi");

    logWithTimestamp("🎉 Tous les tests sont passés avec succès !");

  } catch (error) {
    logWithTimestamp(`💥 Erreur lors du test: ${error}`);
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
    await testInteractions();
  } catch (error) {
    logWithTimestamp(`💥 Erreur fatale dans main(): ${error}`);
    process.exit(1);
  }
}

// Lancement
main();
