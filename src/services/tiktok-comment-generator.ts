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
  "simpgod23",
  "ghost.mode",
  "late4everything",
  "thot.patrol",
  "snackdealer",
  "side.eye.queen",
  "delulu.mode",
  "lowkey.obsessed",
  "alpha.femme",
  "betaboy.energy",
  "sigma.scroll",
  "mood.sync",
  "shy.baddie",
  "zodiac.bae",
  "scrolladdict",
  "hot.mess.era",
  "foryou.witch",
  "skrrt.szn",
  "notmyproblem",
  "vibekiller",
  "corememory.mp4",
  "pls.stop",
  "uwu.boi",
  "not.clickbait",
  "irl.npc",
  "seen.zoned",
  "rizzlord",
  "fyp.warrior",
  "sassy.rizzler",
  "tea.spiller99",
  "toxiccrush",
  "sadboyhours",
  "cringe.machine",
  "gossip.ghoul",
  "filter.freak",
  "emoprincess",
  "drama.mama",
  "capdetector",
  "ily.bruh",
  "glo.up.gawd",
  "flexalert",
  "clout.bait",
  "trend.survivor",
  "hoe.exe",
  "girlboss.4eva",
  "mainchar.energy",
  "soft.core.rizz",
  "ratioed_you",
  "based.and.tired",
  "crying.mp4",
  "mental.breakdance",
  "genz.overthinker",
  "pls.unsee",
  "tiktookmeout",
  "overstim.baddie",
  "never.offline",
  "cancelproof",
  "bfless.baddie",
  "cutecore.rage",
  "doyouloveme",
  "istg.irl",
  "nvm.ignore",
  "ghosting.queen",
  "doubletexted",
  "highkey.simp",
  "foryou.glitch",
  "daily.delulu",
  "scrollgod",
  "cap.or.fact",
  "mid.tok",
  "chronically.online",
  "fr.nofr",
  "npc.freak",
  "based.babe",
  "xoxo.emma",
  "itsmaddie_",
  "user829473",
  "alex.vibes",
  "pretty.in.pink",
  "daddyissues_",
  "coffeeaddict24",
  "thatbitch.sarah",
  "anxiety.queen",
  "hopeless.romantic",
  "mess.express",
  "user.not.found",
  "golden.hour",
  "midnight.snack",
  "basic.bitch",
  "chaos.coordinator",
  "sleepy.head",
  "overthinking.rn",
  "itsme.jess",
  "broke.college.kid",
  "procrastinator",
  "crisis.mode",
  "hot.mess",
  "millennial.vibes",
  "dog.mom",
  "plant.mom",
  "single.life",
  "its.complicated",
  "crying.rn",
  "dead.inside",
  "barely.alive",
  "monday.survivor",
  "coffee.addict",
  "sleep.deprived",
  "exhausted.24.7",
  "mentally.out",
  "trust.issues",
  "commitment.issues",
  "serial.dater",
  "hopeless.case",
  "red.flag.magnet",
  "walking.disaster",
  "human.tornado",
  "overthinker.pro",
  "certified.mess",
  "disaster.bi",
  "chaotic.gay",
  "sad.lesbian",
  "anxious.type",
  "avoidant.vibes",
  "borderline.energy",
  "perfectly.broken",
  "beautifully.messy",
  "damaged.soul",
  "work.in.progress",
  "under.construction",
  "loading.404",
  "not.found",
  "error.human",
  "system.crash",
  "connection.lost",
  "battery.dead",
  "out.of.order",
  "temp.unavailable",
  "try.again.later",
  "loading.forever",
  "buffering.life",
  "lagging.irl",
  "always.late",
  "tardy.queen",
  "time.blind",
  "zero.organization",
  "adulting.fail",
  "responsibility.who",
  "bills.ignored",
  "rent.overdue",
  "broke.again",
  "student.debt",
  "credit.destroyed",
  "financial.ruin",
  "money.allergic",
  "debt.collector",
  "poor.choices",
  "questionable.life",
  "regret.central",
  "cringe.daily",
  "past.embarrassing",
  "future.disappointed",
  "present.confused",
  "identity.lost",
  "quarter.crisis",
  "existential.void",
  "sunday.dread",
  "monday.blues",
  "tuesday.meh",
  "wednesday.vibes",
  "thursday.mood",
  "friday.energy",
  "saturday.lazy",
  "weekend.mode",
  "weekday.zombie",
  "not.morning.person",
  "night.owl",
  "vampire.schedule",
  "nocturnal.vibes",
  "daylight.hater",
  "sunshine.allergic",
  "vitamin.d.lacking",
  "pale.af",
  "ghost.mode",
  "transparent.life",
  "barely.here",
  "fading.fast",
  "disappearing.daily",
  "invisible.me",
  "wallflower.vibes",
  "introvert.life",
  "social.anxiety",
  "people.phobic",
  "humans.exhausting",
  "society.nope",
  "hermit.mode",
  "cave.life",
  "recluse.energy",
  "antisocial.vibes",
  "loner.life",
  "solitude.lover",
  "alone.time",
  "myself.only",
  "party.solo",
  "table.one",
  "flying.solo",
  "independent.af",
  "strong.alone",
  "no.man.needed",
  "self.sufficient",
  "boss.energy",
  "girl.boss",
  "ceo.vibes",
  "entrepreneur.life",
  "hustle.mode",
  "grind.time",
  "rise.grind",
  "no.rest",
  "work.always",
  "busy.life",
  "never.stop",
  "sleep.overrated",
  "coffee.life",
  "caffeine.dependent",
  "espresso.lover",
  "latte.life",
  "cappuccino.daily",
  "mocha.vibes",
  "frappuccino.addict",
  "starbucks.girl",
  "dunkin.fan",
  "coffee.shop",
  "indie.cafe",
  "hipster.brew",
  "artisan.coffee",
  "single.origin",
  "fair.trade",
  "organic.only",
  "sustainable.life",
  "eco.warrior",
  "zero.waste",
  "minimalist.vibes",
  "marie.kondo",
  "tidy.life",
  "organizing.pro",
  "clean.obsessed",
  "neat.freak",
  "perfectionist.life",
  "ocd.energy",
  "anxiety.clean",
  "stress.tidy",
  "control.freak",
  "type.a.vibes",
  "overachiever.life",
  "people.pleaser",
  "yes.queen",
  "cant.say.no",
  "boundary.less",
  "codependent.vibes",
  "attachment.chaos",
  "abandonment.fear",
  "rejection.sensitive",
  "approval.seeker",
  "validation.hunter",
  "attention.seeker",
  "main.character",
  "pick.me.vibes",
  "not.other.girls",
];

// Tableau de commentaires aléatoires Gen Z TikTok
const RANDOM_COMMENTS = [
  "would u text ur ex rn?",
  "would u stalk ur crush's finsta yes or nah?",
  "would u slide into someone's DMs drunk?",
  "would u get back w/ ur toxic ex yes or no?",
  "would u date ur bestie's ex?",
  "would u fake being single at the club yes or nah?",
  "would u ghost someone instead of being real?",
  "would u stay w/ someone who cheated yes or no?",
  "would u marry someone for their money?",
  "would u cheat if u knew u'd never get caught yes or nah?",
  "would u forgive someone who left u on read for 6 months?",
  "would u date someone ur parents can't stand yes or no?",
  "would u pick love over a bag?",
  "would u jump out a plane for a rack? ✈️💰",
  "would u eat a roach for $500 yes or nah? 🪳💰",
  "would u spend the night in a haunted house solo? 👻🏠",
  "would u give up netflix for a year yes or no? 📺❌",
  "would u live in the woods for a month? 🌲",
  "would u eat only ramen for a week straight yes or no? 🍜",
  "would u walk across america? 🚶‍♀️🇺🇸",
  "would u go phone-less for 6 months yes or nah? 📱❌",
  "would u get locked in a room full of spiders? 🕷️🚪",
  "would u drink ur own piss to survive? 💦💩",
  "would u fight a bear w/ ur bare hands? 🐻👊",
  "would u spend a week in solitary confinement? 🔒🏥",
  "would u let ur ex see ur glow up yes or nah?",
  "would u soft block someone after a fight?",
  "would u rizz up ur boss for a promotion yes or no?",
  "would u be fwb w/ someone u caught feelings for?",
  "would u double text someone who's dry yes or nah?",
  "would u stay friends w/ someone who's dating ur ex?",
  "would u post thirst traps to make someone jealous ???",
  "would u expose ur bestie's secret for 10k?",
  "would u lie to the cops for ur day one yes or nah?",
  "would u tell ur friend their mans is cheating ?",
  "would u pick ur bestie over ur relationship yes or no?",
  "would u lend ur homie 5k no questions asked ??",
  "would u drop a friend who got clout yes or nah ?",
  "would u take the L for something ur friend did ?",
  "would u stop fw someone over politics yes or no ?",
  "would u post bail for ur bestie at 3am?",
  "would u beef w/ someone who dissed ur friend yes or nah?",
  "would u keep it 100 even if it hurts ur friend?",
  "would u invite ur ex to ur wedding yes or no?",
  "would u be in someone's wedding u secretly can't stand?",
  "would u forgive a friend who finessed u yes or nah?",
  "would u cut off a friend who never pays u back?",
  "would u snitch on ur friend if they were dealing yes or no?",
  "would u fight someone who jumped ur bestie?",
  "would u steal for ur family yes or nah?",
  "would u rat out ur homie to save urself?",
  "would u keep ur mouth shut about ur friend's affair yes or no?",
  "would u quit ur 9-5 to be an influencer?",
  "would u move to LA w/ $500 and a dream yes or nah?",
  "would u put ur whole paycheck in crypto?",
  "would u work at Mickey D's for $100/hr yes or no?",
  "would u sleep in a graveyard overnight? ⚰️😴",
  "would u bungee jump off a skyscraper? 🪂🏢",
  "would u eat raw meat for a band? 🍖🎤",
  "would u delete all ur socials for a milly?",
  "would u live w/ ur parents till 30 to stack bread ??",
  "would u take out loans to start ur business?",
  "would u sell ur kidney for half a mill yes or no?",
  "would u grind 80 hrs a week to be rich?",
  "would u finesse a rack if u knew u wouldn't get caught yes or nah?",
  "would u marry someone loaded but mid?",
  "would u take a job u hate for 200k a year yes or no?",
  "would u bet ur life savings to double up?",
  "would u sell ur soul for unlimited money yes or nah?",
  "would u be homeless to chase ur dreams?",
  "would u scam ppl to get rich yes or no?",
  "would u work for bezos even tho he's problematic?",
  "would u rob a bank if u knew u'd get away w/ it yes or nah?",
  "would u be a sugar baby for the bag?",
  "would u drop out of college to start a business yes or no?",
  "would u jump out a plane for a rack?",
  "would u shave ur head for charity? ✂️❤️",
  "would u swim w/ sharks for content yes or nah? 🦈📱",
  "would u live in the woods for a month?",
  "would u walk across america?",
  "would u go phone-less for 6 months yes or nah?",
  "would u sleep in a graveyard overnight?",
  "would u bungee jump off a skyscraper yes or no?",
  "would u eat raw meat for a band?",
  "would u get locked in a room full of spiders yes or nah?",
  "would u drink ur own piss to survive?",
  "would u fight a bear w/ ur bare hands yes or no?",
  "would u spend a week in solitary confinement?",
  "would u eat ur own vomit for 10k yes or nah?",
  "would u let someone tattoo ur face blindfolded?",
  "would u live on a deserted island for 5 years yes or no?",
  "would u rather blow up on tiktok or ig yes or nah?",
  "would u get a bbl if it was free yes or no?",
  "would u go to coachella by urself yes or nah?",
  "would u rock fake designer for the drip yes or no?",
  "would u delete all ur posts for ur career yes or nah?",
  "would u start an OF for 10k a month yes or no?",
  "would u go viral for something cringe yes or nah?",
  "would u trade lives w/ ur fave celeb yes or no?",
  "would u give up music forever yes or nah?",
  "would u only watch reality tv for life yes or no?",
  "would u get ur ex's name tatted for clout yes or nah?",
  "would u eat dog food on live for a mill followers yes or no?",
  "would u wear the same fit for a year yes or nah?",
  "would u only speak in emojis for a month yes or no?",
  "would u give up all streaming forever yes or nah?",
  "would u let someone else run ur socials yes or no?",
  "would u collab w/ someone u hate for views yes or nah?",
  "would u fake drama for engagement yes or no?",
  "would u expose urself for going viral yes or nah?",
  "would u date someone just for their following ?",
  "would u return a wallet w/ a band in it yes or nah?",
  "would u cap on ur resume for ur dream job ?",
  "would u risk ur life to save a stranger yes or nah?",
  "would u adopt a kid as a single parent yes or no?",
  "would u give ur kidney to save someone yes or nah?",
  "would u snitch on ur own family yes or no?",
  "would u lie in court to protect someone innocent ?",
  "would u steal meds to save someone's life yes or no?",
  "would u sacrifice one person to save 100 yes or nah?",
  "would u die for world peace yes or no?",
  "would u tell the truth if it ruins someone yes or nah?",
  "would u cheat if everyone else was doing it yes or no?",
  "would u keep money u found on the street yes or nah?",
  "would u lie to spare someone's feelings ?",
  "would u break the law to help family yes or nah?",
  "would u turn in a criminal if u knew them ?",
  "would u keep a secret that could save lives ?",
  "would u frame someone u hate for a crime yes or no?",
  "would u let an innocent person go to jail yes or nah?",
  "would u kill someone to protect ur family yes or no?",
  "would u move to a random country for 5 years yes or nah?",
  "would u go vegan forever yes or no?",
  "would u never drink again yes or nah?",
  "would u hit the gym every day for a year yes or no?",
  "would u learn chinese in 6 months yes or nah?",
  "would u meditate 2 hrs daily yes or no?",
  "would u go back to school at 40 yes or nah?",
  "would u become a minimalist w/ only 50 things ?",
  "would u wake up at 5am every day yes or nah?",
  "would u quit sugar forever yes or no?",
  "would u run a marathon w/ no training yes or nah?",
  "would u read 100 books in a year yes or no?",
  "would u volunteer every weekend yes or nah?",
  "would u go to therapy even if u don't think u need it ?",
  "would u quit social media cold turkey yes or nah?",
  "would u live off grid for a year yes or no?",
  "would u do a juice cleanse for 30 days yes or nah?",
  "would u take an ice bath every morning yes or no?",
  "would u do yoga every day yes or nah?",
  "would u journal ur thoughts daily yes or no?",
  "would u get a face tat for 50k yes or nah?",
  "would u eat only mcdonald's for a year for 100k yes or no?",
  "would u throw hands if someone talked about ur mom yes or nah?",
  "would u snitch on someone selling yes or no?",
  "would u marry someone for a green card yes or nah?",
  "would u fake being disabled for bread yes or no?",
  "would u fake ur own death for a fresh start yes or nah?",
  "would u change ur race if u could yes or no?",
  "would u rather be feared or loved yes or nah?",
  "would u sell ur vote in an election yes or no?",
  "would u join a cult for the community yes or nah?",
  "would u be a dictator to fix the world yes or no?",
  "would u clone urself if possible yes or nah?",
  "would u live forever if u could yes or no?",
  "would u rather know when u'll die or how yes or nah?",
  "would u eat human meat if it tasted good yes or no?",
  "would u be in a polyamorous relationship yes or nah?",
  "would u sell drugs if it was legal yes or no?",
  "would u fight in a war for ur country yes or nah?",
  "would u assassinate someone evil for money yes or no?",
  "would u eat pineapple pizza every day yes or nah?",
  "would u wear socks w/ slides in public yes or no?",
  "would u sing karaoke in front of 1000 ppl yes or nah?",
  "would u dye ur hair neon green yes or no?",
  "would u wear dirty underwear for a week yes or nah?",
  "would u eat cereal w/ water instead of milk yes or no?",
  "would u walk backwards everywhere for a day ??",
  "would u talk like a pirate for a month yes or no?",
  "would u only eat baby food for a week yes or nah?",
  "would u wear a furry costume to work ?",
  "would u laugh at a funeral if something was funny ?",
  "would u pick ur nose in public if no one saw yes or no?",
  "would u wear ur clothes inside out for a year ?",
  "would u brush ur teeth w/ chocolate syrup ?",
  "would u sleep on the floor for better posture yes or nah?",
  "would u eat a whole onion like an apple yes or no?",
  "would u lick a public toilet seat for 5k ???",
  "would u wear the same socks for a month yes or no?",
  "would u eat expired food to save money yes or nah?",
  "would u shower w/ ur clothes on yes or no?",
  "would u start ur own biz w/ no experience yes or nah?",
  "would u work for free for a year to learn ur dream job yes or no?",
  "would u move cross country for a promotion yes or nah?",
  "would u go back to college at 50 yes or no?",
  "would u quit ur stable job to chase passion yes or nah?",
  "would u work for ur biggest competitor yes or no?",
  "would u take a pay cut to wfh forever yes or nah?",
  "would u grind nights and weekends to get ahead ?",
  "would u fire ur bestie if they were a trash employee 🙂‍↕️?",
  "would u take credit for someone else's work to get promoted yes or no?",
  "would u work for a company that destroys the environment 🤭?",
  "would u be a whistleblower at ur job yes or no?",
  "would u lie about ur age to get hired yes or nah?",
  "would u work in a strip club for good money yes or no 😏?",
  "would u be a cam model if it paid ur bills yes or nah?",
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
    const response = await fetch("https://randomuser.me/api/");
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
      throw new Error(
        `Erreur lors du téléchargement de l'image: ${imageResponse.status}`,
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Sauvegarder l'image temporairement
    const tempImagePath = path.join(
      process.cwd(),
      "public",
      "temp",
      "random-user.jpg",
    );

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
      ".upload-btn",
      "#upload-btn",
    ];

    let uploadSuccess = false;

    // D'abord essayer de trouver un input file
    try {
      const fileInput = page.locator('input[type="file"]').first();
      if (
        (await fileInput.isVisible({ timeout: 3000 })) ||
        (await fileInput.count()) > 0
      ) {
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
      for (const selector of uploadSelectors.slice(1)) {
        // Skip input[type="file"] déjà testé
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 3000 })) {
            await element.click();

            // Attendre qu'un input file apparaisse après le clic
            await page.waitForTimeout(1000);

            const fileInput = page.locator('input[type="file"]').first();
            if ((await fileInput.count()) > 0) {
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
      console.log(
        "⚠️ Bouton Upload non trouvé, utilisation de la photo par défaut",
      );
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
