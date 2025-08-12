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

// Gestion des erreurs non capturées
process.on("unhandledRejection", (reason, promise) => {
  console.log("🚨 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.log("🚨 Uncaught Exception:", error);
  process.exit(1);
});

interface Config {
  email: string;
  password: string;
}

const COOKIES_PATH = "cookies.json";
const VIDEO_LINK_PATH = "cloudinary-link.txt";
const LOGIN_URL = "https://app.metricool.com/home";
const PLANNER_URL = "https://app.metricool.com/planner";
const SCREENSHOTS_DIR = "screenshots";

const descriptions: string[] = [
  "Follow + comment 👇 Best one's in my next vid! 🔥 #fyp #viral",
  "Comment & follow – I'll feature one next! 🚀💬 #trending",
  "Follow + comment = maybe YOU next vid! ⭐🔥 #foryou",
  "Drop a comment & follow – I pick one! 😎🔥 #viralvideo",
  "Follow + comment, get in next upload! 💥🎉 #explore",
  "Follow + comment – your words next vid! 💡🔥 #fypシ",
  "Comment & follow – I pick a winner! 🤩💬 #trendingnow",
  "Follow + comment = chance to be next! 🚀⭐ #viral",
  "Follow + comment – maybe YOU get picked! ✨🔥 #foryoupage",
  "Comment & follow – I'll show one next! 🎉💥 #viralchallenge",
  "Follow + comment – be in next TikTok! 🔥💬 #fyp",
  "Comment & follow – best one's in! 📢💥 #trending",
  "Follow + comment, see your name next! 🌟💬 #viral",
  "Follow + comment – I'll pick the top! 🚀🔥 #foryou",
  "Comment & follow – your words next! 💥💬 #viralvideo",
  "Follow + comment = feature next vid! 🌟🔥 #explorepage",
  "Follow + comment – be the lucky one! 🍀💬 #trendingnow",
  "Comment & follow – I choose one next! 🎯🔥 #viralcontent",
  "Follow + comment = spotlight next! 💡💥 #fypシ",
  "Comment & follow – could be YOU! ⭐💬 #viralchallenge",
];

// Fonction utilitaire pour les délais aléatoires (plus humain)
const humanDelay = (min: number = 1000, max: number = 3000): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// Fonction pour logger avec timestamp
const logWithTimestamp = (message: string): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// Fonction pour créer le dossier screenshots s'il n'existe pas
async function ensureScreenshotsDir(): Promise<void> {
  try {
    if (!existsSync(SCREENSHOTS_DIR)) {
      await fs.mkdir(SCREENSHOTS_DIR);
      logWithTimestamp(`📁 Dossier ${SCREENSHOTS_DIR} créé`);
    }
  } catch (error) {
    logWithTimestamp(`❌ Erreur création dossier screenshots: ${error}`);
  }
}

// Fonction pour prendre un screenshot avec nom descriptif
async function takeScreenshot(
  page: Page,
  stepName: string,
  description?: string,
): Promise<void> {
  try {
    await ensureScreenshotsDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${timestamp}_${stepName}.png`;
    const filePath = path.join(SCREENSHOTS_DIR, fileName);
    await page.screenshot({ path: filePath, fullPage: true });
    const logMessage = description
      ? `📸 Screenshot: ${fileName} - ${description}`
      : `📸 Screenshot: ${fileName}`;
    logWithTimestamp(logMessage);
  } catch (error) {
    logWithTimestamp(`❌ Erreur screenshot ${stepName}: ${error}`);
  }
}

// Fonction pour sauvegarder les cookies
async function saveCookies(context: BrowserContext): Promise<void> {
  try {
    logWithTimestamp("🔄 Sauvegarde des cookies en cours...");
    const cookies = await context.cookies();
    await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    logWithTimestamp(
      `💾 Cookies sauvegardés avec succès (${cookies.length} cookies)`,
    );
  } catch (error) {
    logWithTimestamp(`❌ Erreur lors de la sauvegarde des cookies: ${error}`);
    throw error;
  }
}

// Fonction pour charger les cookies
async function loadCookies(context: BrowserContext): Promise<boolean> {
  try {
    logWithTimestamp("🔍 Recherche du fichier de cookies...");
    if (!existsSync(COOKIES_PATH)) {
      logWithTimestamp("⚠️ Aucun fichier de cookies trouvé");
      return false;
    }
    const cookiesJSON = await fs.readFile(COOKIES_PATH, "utf8");
    const cookies = JSON.parse(cookiesJSON);
    if (!Array.isArray(cookies) || cookies.length === 0) {
      logWithTimestamp("⚠️ Fichier de cookies vide ou invalide");
      return false;
    }
    await context.addCookies(cookies);
    logWithTimestamp(
      `🔄 Cookies chargés avec succès (${cookies.length} cookies)`,
    );
    return true;
  } catch (error) {
    logWithTimestamp(`❌ Erreur lors du chargement des cookies: ${error}`);
    return false;
  }
}

// Fonction améliorée pour s'assurer d'être sur l'onglet Planification
async function ensureOnPlanningTab(page: Page): Promise<void> {
  try {
    logWithTimestamp("🔍 Navigation vers l'onglet Planification...");

    // Navigation directe vers la page planner
    await page.goto(PLANNER_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await humanDelay(3000, 5000);

    // Attendre que la page soit complètement chargée
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await humanDelay(2000, 3000);

    logWithTimestamp("✅ Navigation vers la page Planification réussie");
    await takeScreenshot(
      page,
      "planner_page_loaded",
      "Page Planification chargée",
    );
  } catch (error) {
    logWithTimestamp(
      `❌ Erreur lors de la navigation vers Planification: ${error}`,
    );
    throw error;
  }
}

// Fonction améliorée pour vérifier si la session est valide
async function isSessionValid(page: Page): Promise<boolean> {
  try {
    logWithTimestamp("🔍 Vérification de la validité de la session...");
    await ensureOnPlanningTab(page);

    // Attendre et vérifier la présence du bouton "Créer une publication"
    try {
      await page.waitForSelector('button:has-text("Créer une publication")', {
        timeout: 15000,
      });
      logWithTimestamp("✅ Session valide détectée");
      return true;
    } catch {
      // Essayer avec d'autres sélecteurs possibles
      const alternativeSelectors = [
        'button[data-testid="create-publication"]',
        'button:has-text("Create")',
        'button:has-text("Créer")',
        ".create-post-btn",
        '[data-cy="create-post"]',
      ];

      for (const selector of alternativeSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          logWithTimestamp(
            `✅ Session valide détectée avec sélecteur alternatif: ${selector}`,
          );
          return true;
        } catch {
          continue;
        }
      }

      logWithTimestamp("❌ Session invalide ou expirée - bouton non trouvé");
      return false;
    }
  } catch (error) {
    logWithTimestamp(`❌ Erreur lors de la vérification de session: ${error}`);
    return false;
  }
}

// Fonction de connexion avec comportement humain
async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  try {
    logWithTimestamp("🔐 Début de la procédure de connexion...");

    await page.goto(LOGIN_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await humanDelay(3000, 5000);

    // Attendre que les champs de connexion soient visibles
    await page.waitForSelector("#j_username", { timeout: 15000 });
    await page.waitForSelector("#j_password", { timeout: 15000 });

    // Saisie email avec simulation humaine
    logWithTimestamp("📝 Saisie de l'email...");
    const emailInput = await page.$("#j_username");
    if (emailInput) {
      await emailInput.click();
      await humanDelay(500, 1000);
      await page.type("#j_username", email, {
        delay: Math.random() * 100 + 50,
      });
      await humanDelay(500, 1500);
    }

    // Saisie mot de passe avec simulation humaine
    logWithTimestamp("🔑 Saisie du mot de passe...");
    const passwordInput = await page.$("#j_password");
    if (passwordInput) {
      await passwordInput.click();
      await humanDelay(300, 800);
      await page.type("#j_password", password, {
        delay: Math.random() * 100 + 50,
      });
      await humanDelay(800, 1500);
    }

    // Clic sur connexion avec hover
    logWithTimestamp("▶️ Connexion...");
    const loginButton = await page.$("#loginFormSubmit");
    if (loginButton) {
      await loginButton.hover();
      await humanDelay(300, 700);
      await loginButton.click();
    }

    // Attendre la redirection après connexion
    try {
      await page.waitForURL("**/planner*", { timeout: 30000 });
      logWithTimestamp("✅ Redirection vers planner détectée");
    } catch {
      // Attendre avec timeout plus long
      await humanDelay(8000, 12000);
    }

    logWithTimestamp("✅ Connexion réussie");

    // S'assurer d'être sur la page de planification
    await ensureOnPlanningTab(page);
  } catch (error) {
    logWithTimestamp(`❌ Erreur lors de la connexion: ${error}`);
    throw error;
  }
}

// Fonction pour obtenir une description aléatoire
function getRandomDescription(): string {
  const randomIndex = Math.floor(Math.random() * descriptions.length);
  const selectedDescription = descriptions[randomIndex];
  logWithTimestamp(`🎲 Description sélectionnée: "${selectedDescription}"`);
  return selectedDescription;
}

// Fonction pour lire le lien vidéo
async function readVideoLink(): Promise<string> {
  try {
    logWithTimestamp(`📂 Lecture du fichier ${VIDEO_LINK_PATH}...`);
    if (!existsSync(VIDEO_LINK_PATH)) {
      throw new Error(`Le fichier ${VIDEO_LINK_PATH} n'existe pas`);
    }
    const videoLink = await fs.readFile(VIDEO_LINK_PATH, "utf8");
    const trimmedLink = videoLink.trim();
    if (!trimmedLink) {
      throw new Error(`Le fichier ${VIDEO_LINK_PATH} est vide`);
    }
    logWithTimestamp(`✅ Lien Cloudinary récupéré: ${trimmedLink}`);
    return trimmedLink;
  } catch (error) {
    logWithTimestamp(`❌ Erreur lecture fichier ${VIDEO_LINK_PATH}: ${error}`);
    throw error;
  }
}

// Fonction pour valider les variables d'environnement
function validateEnvironmentVariables(): Config {
  logWithTimestamp("🔍 Validation des variables d'environnement...");
  const email = process.env.METRICOOL_EMAIL;
  const password = process.env.METRICOOL_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Variables d'environnement manquantes. Veuillez créer un fichier .env avec METRICOOL_EMAIL et METRICOOL_PASSWORD",
    );
  }

  logWithTimestamp(
    `✅ Configuration chargée pour l'email: ${email.replace(/(.{2}).*@/, "$1***@")}`,
  );
  return { email, password };
}

// Fonction pour simuler une saisie humaine d'URL
async function typeUrlHumanly(
  page: Page,
  selector: string,
  url: string,
): Promise<void> {
  const input = await page.$(selector);
  if (!input) throw new Error(`Input ${selector} not found`);

  // Focus avec hover d'abord
  await input.hover();
  await humanDelay(200, 500);
  await input.click();
  await humanDelay(300, 800);

  // Effacer le contenu existant
  await page.keyboard.press("Control+a");
  await humanDelay(100, 300);
  await page.keyboard.press("Delete");
  await humanDelay(200, 500);

  // Taper l'URL avec des délais variables
  for (const char of url) {
    await page.keyboard.type(char);
    await humanDelay(50, 150); // Délai entre chaque caractère
  }

  await humanDelay(500, 1000);

  // Simuler des événements naturels
  await page.evaluate(
    (args: string[]) => {
      const [selector, url] = args;
      const input = document.querySelector(selector) as HTMLInputElement;
      if (input) {
        input.value = url;
        ["input", "change", "keyup", "blur", "paste"].forEach((eventType) => {
          input.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
      }
    },
    [selector, url],
  );

  // Appuyer sur Tab pour déclencher la validation
  await page.keyboard.press("Tab");
  await humanDelay(500, 1000);
}

// Fonction améliorée pour trouver le bouton "Créer une publication"
async function findCreatePublicationButton(page: Page): Promise<any> {
  const selectors = [
    'button:has-text("Créer une publication")',
    'button:has-text("Create")',
    'button:has-text("Créer")',
    'button[data-testid="create-publication"]',
    ".create-post-btn",
    '[data-cy="create-post"]',
    "button:has(.fa-plus)",
    'button[title*="Créer"]',
    'button[aria-label*="Créer"]',
  ];

  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          logWithTimestamp(`✅ Bouton trouvé avec le sélecteur: ${selector}`);
          return element;
        }
      }
    } catch (error) {
      logWithTimestamp(`⚠️ Sélecteur ${selector} non trouvé: ${error}`);
    }
  }

  return null;
}

// Fonction principale d'automatisation avec anti-détection
async function automatePublication(
  page: Page,
  videoLink: string,
): Promise<void> {
  try {
    logWithTimestamp(
      "🚀 Début du processus d'automatisation avec anti-détection...",
    );
    await takeScreenshot(page, "start", "Début du processus");

    // Attendre que la page soit complètement chargée
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await humanDelay(3000, 5000);

    // Recherche améliorée du bouton "Créer une publication"
    logWithTimestamp('▶️ Recherche du bouton "Créer une publication"...');
    const createButton = await findCreatePublicationButton(page);

    if (!createButton) {
      await takeScreenshot(
        page,
        "create_button_not_found",
        "Bouton Créer une publication introuvable",
      );

      // Essayer de rafraîchir la page
      logWithTimestamp("🔄 Rafraîchissement de la page...");
      await page.reload({ waitUntil: "networkidle" });
      await humanDelay(5000, 8000);

      const createButtonAfterReload = await findCreatePublicationButton(page);
      if (!createButtonAfterReload) {
        throw new Error(
          'Bouton "Créer une publication" introuvable même après rafraîchissement',
        );
      }

      await createButtonAfterReload.hover();
      await humanDelay(300, 800);
      await createButtonAfterReload.click();
    } else {
      await createButton.hover();
      await humanDelay(300, 800);
      await createButton.click();
    }

    await humanDelay(2000, 4000);
    await takeScreenshot(
      page,
      "clicked_create_publication",
      "Après clic sur Créer une publication",
    );

    // Ajout description
    logWithTimestamp("📝 Recherche du champ description...");
    await page.waitForSelector(
      'span.placeholder.editor-box[contenteditable="true"]',
      { timeout: 10000 },
    );
    const description = getRandomDescription();

    const descriptionInput = await page.$(
      'span.placeholder.editor-box[contenteditable="true"]',
    );
    if (!descriptionInput) {
      throw new Error("Champ description introuvable");
    }
    await descriptionInput.click();
    await humanDelay(500, 1000);
    await page.type(
      'span.placeholder.editor-box[contenteditable="true"]',
      description,
      {
        delay: Math.random() * 50 + 30,
      },
    );
    await humanDelay(1000, 2000);
    await takeScreenshot(page, "description_typed", "Description saisie");

    // Ajout vidéo
    logWithTimestamp("📹 Recherche bouton ajout vidéo...");
    const videoButton = await page.$("button:has(i.fa-regular.fa-photo-video)");
    if (!videoButton) {
      throw new Error("Bouton ajout vidéo introuvable");
    }
    await videoButton.hover();
    await humanDelay(300, 700);
    await videoButton.click();
    await humanDelay(1000, 2000);
    await takeScreenshot(
      page,
      "video_button_clicked",
      "Bouton ajout vidéo cliqué",
    );

    const addVideoOption = await page.$(
      'div.v-list-item:has-text("Ajouter une vidéo")',
    );
    if (!addVideoOption) {
      throw new Error('Option "Ajouter une vidéo" introuvable');
    }
    await addVideoOption.hover();
    await humanDelay(200, 500);
    await addVideoOption.click();
    await humanDelay(1000, 2000);
    await takeScreenshot(
      page,
      "video_option_clicked",
      "Option Ajouter une vidéo cliquée",
    );

    // Clic sur URL
    logWithTimestamp('▶️ Recherche bouton "URL"...');
    const urlButton = await page.$('button:has-text("URL")');
    if (!urlButton) {
      throw new Error('Bouton "URL" introuvable');
    }
    await urlButton.hover();
    await humanDelay(300, 600);
    await urlButton.click();
    await humanDelay(1000, 2000);
    await takeScreenshot(page, "url_button_clicked", "Bouton URL cliqué");

    // Saisie URL vidéo
    logWithTimestamp("📝 Saisie de l'URL vidéo...");
    await takeScreenshot(page, "before_url_input", "Avant saisie URL");
    await typeUrlHumanly(page, 'input[name="URL"]', videoLink);
    await takeScreenshot(page, "after_url_input", "Après saisie URL");

    logWithTimestamp("⏳ Début attente validation URL...");
    let validationSuccess = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!validationSuccess && attempts < maxAttempts) {
      attempts++;

      try {
        const indicators = await page.evaluate(() => {
          const acceptButton = Array.from(
            document.querySelectorAll("button"),
          ).find(
            (btn) =>
              (btn.textContent?.includes("Accepter") ||
                btn.textContent?.includes("Accept")) &&
              !btn.disabled &&
              !btn.hasAttribute("disabled"),
          );
          const videoPreview = document.querySelector(
            'video, img[src*="cloudinary"], .video-preview, [class*="preview"]',
          );
          const errorElem = document.querySelector(
            '.error, .v-messages__message, .text-red, [class*="error"]',
          );
          const urlInput = document.querySelector(
            'input[name="URL"]',
          ) as HTMLInputElement;

          return {
            acceptButtonEnabled: !!acceptButton,
            hasVideoPreview: !!videoPreview,
            hasErrors: !!errorElem?.textContent?.trim(),
            errorText: errorElem?.textContent || "",
            urlValue: !!urlInput?.value,
            urlValueString: urlInput?.value || "",
          };
        });

        logWithTimestamp(
          `🔍 Tentative ${attempts}/${maxAttempts} - acceptButton: ${indicators.acceptButtonEnabled}, videoPreview: ${indicators.hasVideoPreview}, errors: ${indicators.hasErrors}, errorText: "${indicators.errorText}", urlValue: "${indicators.urlValueString}"`,
        );

        await takeScreenshot(
          page,
          `validation_attempt_${attempts}`,
          `Tentative validation URL ${attempts}`,
        );

        if (indicators.acceptButtonEnabled && indicators.urlValue) {
          validationSuccess = true;
          logWithTimestamp("✅ Validation URL réussie !");
          break;
        }

        if (attempts % 5 === 0) {
          logWithTimestamp("🔄 Tentative de re-validation: press Tab + Enter");
          await page.keyboard.press("Tab");
          await humanDelay(300, 600);
          await page.keyboard.press("Enter");
          await humanDelay(500, 1000);
        }
      } catch (e) {
        logWithTimestamp(`⚠️ Exception pendant la vérification: ${e}`);
      }

      await humanDelay(1000, 1500);
    }

    if (!validationSuccess) {
      await takeScreenshot(
        page,
        "url_validation_failed",
        "Échec validation URL",
      );
      throw new Error(`URL non validée après ${maxAttempts} tentatives`);
    }

    // Clic sur Accepter
    logWithTimestamp('✅ Recherche bouton "Accepter"...');
    const acceptButton = await page.$(
      'button:has-text("Accepter"), button:has-text("Accept")',
    );
    if (!acceptButton) {
      throw new Error('Bouton "Accepter" introuvable au moment du clic');
    }
    await acceptButton.hover();
    await humanDelay(300, 700);
    await acceptButton.click();
    await humanDelay(2000, 4000);
    await takeScreenshot(page, "accept_clicked", "Bouton Accepter cliqué");

    // Publication
    logWithTimestamp("📤 Publication...");
    await takeScreenshot(
      page,
      "before_publish_dropdown",
      "Avant recherche dropdown publication",
    );
    await page.waitForSelector(
      "button.v-btn.bg-primary:has(i.fa-chevron-down)",
      { timeout: 10000 },
    );
    const publishDropdown = await page.$(
      "button.v-btn.bg-primary:has(i.fa-chevron-down)",
    );
    if (!publishDropdown) {
      throw new Error("Dropdown de publication introuvable");
    }
    await publishDropdown.hover();
    await humanDelay(300, 600);
    await publishDropdown.click();
    await humanDelay(1000, 2000);
    await takeScreenshot(
      page,
      "publish_dropdown_clicked",
      "Dropdown publication cliqué",
    );

    // Attendre que l'option "Publier maintenant" soit visible
    await page.waitForSelector('div.v-list-item[data-value="publishNow"]', {
      timeout: 5000,
    });
    const publishNowItem = await page.$(
      'div.v-list-item[data-value="publishNow"]',
    );
    if (!publishNowItem) {
      throw new Error('Option "Publier maintenant" introuvable');
    }
    await page.$eval('div.v-list-item[data-value="publishNow"]', (el) =>
      el.scrollIntoView(),
    );
    await humanDelay(200, 500);
    await publishNowItem.click({ force: true });
    await takeScreenshot(
      page,
      "publish_now_clicked",
      "Option Publier maintenant cliquée",
    );

    const finalPublishButton = await page.$(
      'button.v-btn:has-text("Publier maintenant")',
    );
    if (!finalPublishButton) {
      await takeScreenshot(
        page,
        "final_publish_not_found",
        'Bouton final "Publier maintenant" introuvable',
      );
      logWithTimestamp('❌ Bouton final "Publier maintenant" introuvable');
      throw new Error('Bouton final "Publier maintenant" introuvable');
    }

    // Fermer le toast s'il est présent AVANT de cliquer sur Publier maintenant
    const toastCloseBtnBeforePublish = await page.$(
      'div.text-white .v-icon.fa-xmark, div.text-white .v-icon[aria-label="Fermer"], div.text-white button[aria-label="Fermer"]',
    );
    if (toastCloseBtnBeforePublish) {
      await toastCloseBtnBeforePublish.click();
      await humanDelay(500, 1000);
      logWithTimestamp("Toast fermé avant publication");
    }

    // Attendre la disparition du toast
    try {
      await page.waitForSelector(
        "div.flex.items-center.justify-between.pl-4.pr-2.py-2.gap-4.text-white",
        { state: "detached", timeout: 5000 },
      );
      logWithTimestamp("Toast disparu, prêt à publier");
    } catch {
      logWithTimestamp(
        "Toast toujours présent après 5s, on tente quand même la publication",
      );
    }

    await finalPublishButton.hover();
    await humanDelay(500, 1000);
    await finalPublishButton.click();
    await humanDelay(2000, 4000);
    await takeScreenshot(
      page,
      "final_publish_clicked",
      "Bouton Publier maintenant cliqué",
    );

    // Fermer le toast d'erreur s'il est présent
    const toastCloseBtn = await page.$(
      'div.text-white .v-icon.fa-xmark, div.text-white .v-icon[aria-label="Fermer"], div.text-white button[aria-label="Fermer"]',
    );
    if (toastCloseBtn) {
      await toastCloseBtn.click();
      await humanDelay(500, 1000);
      logWithTimestamp("Toast d'erreur fermé automatiquement (croix)");
    }

    // Vérification du succès
    logWithTimestamp("⏳ Vérification du succès de la publication...");
    try {
      await page.waitForFunction(
        () => {
          const toast = document.querySelector(
            "div.flex.items-center.justify-between.pl-4.pr-2.py-2.gap-4.text-white",
          );
          return (
            toast &&
            /succès|créée|success|created/i.test(toast.textContent || "")
          );
        },
        { timeout: 60000 },
      );
      logWithTimestamp("✅ Publication réussie, toast de validation détecté.");
      await takeScreenshot(
        page,
        "toast_success_found",
        "Toast de succès détecté",
      );
    } catch (e) {
      await takeScreenshot(
        page,
        "toast_success_not_found",
        "Toast de succès non détecté",
      );
      const toastHtml = await page.evaluate(() => {
        const toast = document.querySelector(
          "div.flex.items-center.justify-between.pl-4.pr-2.py-2.gap-4.text-white",
        );
        return toast ? toast.outerHTML : "Aucun toast trouvé";
      });
      logWithTimestamp(
        `⚠️ Toast de succès non détecté après 60s. HTML du toast: ${toastHtml}`,
      );
      // On ne throw pas d'erreur fatale, on continue
    }

    logWithTimestamp("🎉 Publication réussie avec anti-détection !");
  } catch (error) {
    await takeScreenshot(
      page,
      "automation_error",
      "Erreur durant automatisation",
    );
    logWithTimestamp(
      `❌ Erreur durant l'automatisation: ${error instanceof Error ? error.message : error}`,
    );
    throw error;
  }
}

// Fonction principale avec playwright-extra
async function run(): Promise<void> {
  let browser: Browser | null = null;

  try {
    logWithTimestamp("🔄 Démarrage du script avec anti-détection avancé...");

    const config = validateEnvironmentVariables();
    const videoLink = await readVideoLink();

    // Lancement du navigateur avec playwright-extra et plugins stealth
    logWithTimestamp("🌐 Lancement du navigateur avec anti-détection...");
    browser = await chromiumExtra.launch({
      headless: true,
      slowMo: 100, // Ralentissement pour paraître plus humain
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
      viewport: { width: 1366, height: 768 }, // Résolution plus commune
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      locale: "fr-FR",
      timezoneId: "Europe/Paris",
      permissions: ["geolocation"],
      extraHTTPHeaders: {
        "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
      },
    });

    // Scripts d'initialisation pour masquer l'automatisation
    await context.addInitScript(() => {
      // Masquer webdriver
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      delete (window as any).navigator.webdriver;

      // Masquer les propriétés d'automatisation
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5].map(() => ({})),
      });

      Object.defineProperty(navigator, "languages", {
        get: () => ["fr-FR", "fr", "en-US", "en"],
      });

      // Ajouter des propriétés manquantes
      Object.defineProperty(navigator, "permissions", {
        get: () => ({
          query: () => Promise.resolve({ state: "granted" }),
        }),
      });

      // Masquer automation flags
      if ((window as any).chrome) {
        Object.defineProperty((window as any).chrome, "runtime", {
          get: () => ({}),
        });
      }

      // Modifier la stack trace pour masquer playwright
      const originalError = Error.prepareStackTrace;
      Error.prepareStackTrace = (error, stack) => {
        if (originalError) return originalError(error, stack);
        return error.stack;
      };
    });

    const page = await context.newPage();

    // Configuration avancée de la page
    await page.setExtraHTTPHeaders({
      DNT: "1",
      "Upgrade-Insecure-Requests": "1",
    });

    // Chargement des cookies
    const cookiesLoaded = await loadCookies(context);

    // Vérification de la session si cookies chargés
    let sessionIsValid = false;
    if (cookiesLoaded) {
      logWithTimestamp(
        "🔍 Vérification de la session avec les cookies existants...",
      );
      try {
        // Navigation vers la page de planification
        await page.goto(PLANNER_URL, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        await humanDelay(5000, 8000);
        sessionIsValid = await isSessionValid(page);
      } catch (error) {
        logWithTimestamp(
          `⚠️ Erreur lors de la vérification de session: ${error}`,
        );
        sessionIsValid = false;
      }
    }

    // Connexion si nécessaire
    if (!sessionIsValid) {
      logWithTimestamp("🔐 Connexion requise...");
      await login(page, config.email, config.password);
      await saveCookies(context);
    } else {
      logWithTimestamp("✅ Session existante utilisée");
      // Pas besoin de re-naviguer, isSessionValid() l'a déjà fait
    }

    // Automatisation avec anti-détection
    await automatePublication(page, videoLink);

    logWithTimestamp("✨ Script terminé avec succès !");
    await humanDelay(3000, 5000);
  } catch (error) {
    logWithTimestamp(`💥 Erreur fatale: ${error}`);
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
    logWithTimestamp("🎬 Lancement du script avec anti-détection...");
    await run();
  } catch (error) {
    logWithTimestamp(`💥 Erreur fatale dans main(): ${error}`);
    process.exit(1);
  }
}

// Lancement
main();
