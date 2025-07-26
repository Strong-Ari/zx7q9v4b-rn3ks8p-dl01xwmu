import { chromium, Browser, Page } from "playwright";
import path from "path";
import fs from "fs/promises";

// Tableaux de données aléatoires pour les pseudos TikTok
const RANDOM_USERNAMES = [
  "user7582",
  "queen.kayla",
  "itz_joey123",
  "viralwave",
  "omgitslucy",
  "cashlord",
  "moonchild99",
  "itsyagirl.maya",
  "drippedout",
  "baddie.vibes",
  "lil.princess",
  "savage.mode",
  "blessed_up",
  "notlikeus",
  "main.character",
  "periodt.bae",
  "mindset.queen",
  "energy.check",
  "vibe.police",
  "certified.hottie",
  "no.cap.zone",
  "young.legend",
  "that.girl.era",
  "unbothered.energy",
  "chaotic.good",
  "soft.launch",
  "rizz.master",
  "npc.behavior",
  "slay.queen",
  "touch.grass",
  "brain.rot",
];

// Tableau de commentaires aléatoires Gen Z TikTok
const RANDOM_COMMENTS = [
  "would u tell ur crush u dreamt abt them ?",
  "is this the reason why im still single ?",
  "would u kiss ur bestie for $10k ?",
  "does this scream broke energy yes or no ?",
  "u ever caught feelings for a situationship ?",
  "would ur mom roast u if u wore this ?",
  "is this why men ain't shit yes or no ?",
  "would u skip work for netflix & chill ?",
  "do i look like i cry at 3am or nah ?",
  "would u let ur ex text u rn yes or no ?",
  "is this giving main character vibes or nah ?",
  "would u risk it all for a sneaky link ?",
  "is this how u catch feelings too quick ?",
  "would ur friends clown u for this yes or no ?",
  "is this toxic or just self care ?",
  "would u move to another city for love ?",
  "would u date someone broke but hot ?",
  "is this a red flag or green flag ?",
  "would u tell ur secrets while drunk ?",
  "is this why ur fyp so messy ?",
  "would u block someone just bc they're dry texter ?",
  "does this look cheap af yes or no ?",
  "would u fake laugh if bae's joke ain't funny ?",
  "would u risk getting canceled for clout ?",
  "would u ghost someone who's too clingy ?",
  "is this how u end up on toxic tiktok ?",
  "is this petty af yes or no ?",
  "would u snitch on ur bestie for 1M $ ?",
  "is this why u got trust issues ?",
  "would u double text if they leave u on read ?",
  "is this hoe energy or nah ?",
  "would u kiss someone shorter than u ?",
  "would u date ur friend's ex if they said ok ?",
  "is this how u end up crying in the club ?",
  "is this fboy vibes yes or no ?",
  "would u lie about ur body count ?",
  "is this why ur groupchat poppin ?",
  "would u sell feet pics for easy money ?",
  "would u leave ur bf if he was broke ?",
  "would u date someone with a weird laugh ?",
  "is this oversharing or nah ?",
  "is this the reason u single yes or no ?",
];

interface GenerateCommentResult {
  success: boolean;
  imagePath?: string;
  error?: string;
  username?: string;
  comment?: string;
}

/**
 * Télécharge une image d'utilisateur aléatoire depuis randomuser.me
 */
async function downloadRandomUserImage(): Promise<string> {
  try {
    console.log("🔽 Téléchargement d'une image utilisateur aléatoire...");
    
    // Appeler l'API RandomUser.me
    const response = await fetch('https://randomuser.me/api/');
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error("Aucun utilisateur retourné par l'API");
    }
    
    const user = data.results[0];
    const imageUrl = user.picture.large; // Utiliser la grande image
    
    console.log(`📸 URL de l'image: ${imageUrl}`);
    
    // Télécharger l'image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Erreur lors du téléchargement de l'image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Sauvegarder l'image temporairement
    const tempImagePath = path.join(process.cwd(), "public", "temp", "random-user.jpg");
    
    // Créer le dossier temp s'il n'existe pas
    await fs.mkdir(path.dirname(tempImagePath), { recursive: true });
    
    await fs.writeFile(tempImagePath, Buffer.from(imageBuffer));
    
    console.log(`✅ Image sauvegardée: ${tempImagePath}`);
    
    return tempImagePath;
  } catch (error) {
    console.error("❌ Erreur lors du téléchargement de l'image:", error);
    throw error;
  }
}

/**
 * Génère un pseudo TikTok aléatoire
 */
function getRandomUsername(): string {
  return RANDOM_USERNAMES[Math.floor(Math.random() * RANDOM_USERNAMES.length)];
}

/**
 * Génère un commentaire TikTok aléatoire
 */
function getRandomComment(): string {
  return RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];
}

/**
 * Génère un nom de fichier fixe pour éviter la surcharge du repo
 */
function generateUniqueFileName(): string {
  return `tiktok-comment-current.png`;
}

/**
 * Supprime l'ancienne image s'elle existe
 */
async function removeOldImage(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log("🗑️ Ancienne image supprimée");
  } catch (error) {
    // Le fichier n'existe pas, c'est normal
  }
}

/**
 * Attend qu'un élément soit visible et interactif
 */
async function waitForElement(
  page: Page,
  selector: string,
  timeout = 10000,
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: "visible", timeout });
    return true;
  } catch (error) {
    console.error(`Élément non trouvé: ${selector}`, error);
    return false;
  }
}

/**
 * Fonction principale pour générer un commentaire TikTok
 */
export async function generateTikTokComment(): Promise<GenerateCommentResult> {
  let browser: Browser | null = null;
  let tempImagePath: string | null = null;

  try {
    console.log("🚀 Démarrage de la génération de commentaire TikTok...");

    // Générer des données aléatoires
    const username = getRandomUsername();
    const comment = getRandomComment();
    const fileName = generateUniqueFileName();
    const outputPath = path.join(
      process.cwd(),
      "public",
      "generated",
      fileName,
    );

    console.log(`📝 Pseudo généré: ${username}`);
    console.log(`💬 Commentaire généré: ${comment}`);

    // Télécharger une image d'utilisateur aléatoire
    tempImagePath = await downloadRandomUserImage();

    // Supprimer l'ancienne image s'elle existe
    await removeOldImage(outputPath);

    // Lancer Playwright en mode headless
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    // Naviguer vers le générateur de commentaires TikTok
    console.log("🌐 Navigation vers le site...");
    await page.goto("https://postfully.app/tools/tiktok-comment-generator/", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Attendre que le formulaire soit chargé
    console.log("⏳ Attente du chargement du formulaire...");
    const usernameFieldExists = await waitForElement(
      page,
      'input[placeholder*="username" i], input[name*="username" i], input[id*="username" i]',
    );

    if (!usernameFieldExists) {
      // Essayer d'autres sélecteurs possibles
      const alternativeSelectors = [
        'input[type="text"]',
        "input:first-of-type",
        '[data-testid*="username"], [data-testid*="name"]',
      ];

      let found = false;
      for (const selector of alternativeSelectors) {
        if (await waitForElement(page, selector, 3000)) {
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error("Impossible de trouver le champ username");
      }
    }

    // Remplir le champ username
    console.log("✏️ Remplissage du pseudo...");
    const usernameSelectors = [
      'input[placeholder*="username" i]',
      'input[name*="username" i]',
      'input[id*="username" i]',
      'input[type="text"]:first-of-type',
    ];

    let usernameFieldFilled = false;
    for (const selector of usernameSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          await element.fill("");
          await element.fill(username);
          usernameFieldFilled = true;
          break;
        }
      } catch {}
    }

    if (!usernameFieldFilled) {
      throw new Error("Impossible de remplir le champ username");
    }

    // Remplir le champ commentaire
    console.log("💬 Remplissage du commentaire...");
    const commentSelectors = [
      "textarea",
      'input[placeholder*="comment" i]',
      'input[name*="comment" i]',
      'input[id*="comment" i]',
      'input[type="text"]:last-of-type',
    ];

    let commentFieldFilled = false;
    for (const selector of commentSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          await element.fill("");
          await element.fill(comment);
          commentFieldFilled = true;
          break;
        }
      } catch {}
    }

    if (!commentFieldFilled) {
      throw new Error("Impossible de remplir le champ commentaire");
    }

    // Uploader l'image d'utilisateur aléatoire
    console.log("📤 Upload de l'image d'utilisateur aléatoire...");
    const uploadSelectors = [
      'input[type="file"]',
      'button:has-text("Upload")',
      'button:has-text("upload")',
      '[data-testid*="upload"]',
      'button[title*="upload" i]',
      '.upload-btn',
      '#upload-btn',
    ];

    let uploadSuccess = false;
    
    // D'abord essayer de trouver un input file
    try {
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible({ timeout: 3000 }) || await fileInput.count() > 0) {
        await fileInput.setInputFiles(tempImagePath);
        await page.waitForTimeout(3000); // Attendre l'upload
        uploadSuccess = true;
        console.log("✅ Image uploadée via input file");
      }
    } catch (error) {
      console.log("⚠️ Input file non trouvé, recherche du bouton Upload...");
    }

    // Si l'input file n'a pas marché, essayer les boutons Upload
    if (!uploadSuccess) {
      for (const selector of uploadSelectors.slice(1)) { // Skip input[type="file"] déjà testé
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 3000 })) {
            await element.click();
            
            // Attendre qu'un input file apparaisse après le clic
            await page.waitForTimeout(1000);
            
            const fileInput = page.locator('input[type="file"]').first();
            if (await fileInput.count() > 0) {
              await fileInput.setInputFiles(tempImagePath);
              await page.waitForTimeout(3000);
              uploadSuccess = true;
              console.log(`✅ Image uploadée via bouton: ${selector}`);
              break;
            }
          }
        } catch {}
      }
    }

    if (!uploadSuccess) {
      console.log("⚠️ Bouton Upload non trouvé, utilisation de la photo par défaut");
    }

    // Attendre un peu pour que tout soit généré
    await page.waitForTimeout(3000);

    // Cliquer sur le bouton "Download"
    console.log("📥 Téléchargement de l'image...");
    const downloadSelectors = [
      'button:has-text("Download")',
      'a:has-text("Download")',
      '[data-testid*="download"]',
      'button[title*="download" i]',
      ".download-btn",
      "#download-btn",
      'button >> text="Download"',
    ];

    let downloadElement = null;
    for (const selector of downloadSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          downloadElement = element;
          break;
        }
      } catch {}
    }

    if (!downloadElement) {
      throw new Error("Impossible de trouver le bouton Download");
    }

    // Configurer l'intercepteur de téléchargement
    const downloadPromise = page.waitForEvent("download");
    await downloadElement.click();

    console.log("⏳ Attente du téléchargement...");
    const download = await downloadPromise;

    // Sauvegarder le fichier
    await download.saveAs(outputPath);

    // Vérifier que le fichier a été sauvegardé
    const fileExists = await fs
      .access(outputPath)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      throw new Error("Échec de la sauvegarde du fichier");
    }

    console.log(`✅ Commentaire TikTok généré avec succès: ${fileName}`);

    return {
      success: true,
      imagePath: `/generated/${fileName}`,
      username,
      comment,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la génération:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  } finally {
    if (browser) {
      await browser.close();
    }
    
    // Nettoyer l'image temporaire
    if (tempImagePath) {
      try {
        await fs.unlink(tempImagePath);
        console.log("🗑️ Image temporaire supprimée");
      } catch (error) {
        console.log("⚠️ Impossible de supprimer l'image temporaire:", error);
      }
    }
  }
}

/**
 * Version avec retry automatique
 */
export async function generateTikTokCommentWithRetry(
  maxRetries = 3,
): Promise<GenerateCommentResult> {
  let lastError: string = "";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Tentative ${attempt}/${maxRetries}...`);

    const result = await generateTikTokComment();

    if (result.success) {
      return result;
    }

    lastError = result.error || "Erreur inconnue";

    if (attempt < maxRetries) {
      console.log(`⏳ Attente avant nouvelle tentative...`);
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }

  return {
    success: false,
    error: `Échec après ${maxRetries} tentatives. Dernière erreur: ${lastError}`,
  };
}

// Export par défaut pour utilisation simple
export default generateTikTokCommentWithRetry;
