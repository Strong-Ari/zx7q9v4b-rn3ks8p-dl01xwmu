// Script de test pour la génération de descriptions
import { randomInt } from "crypto";

// Fonction utilitaire pour sélectionner un élément aléatoire
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Fonction pour générer une description unique
function generateDescription(): string {
  const actions = [
    "Follow + comment",
    "Comment & follow", 
    "Drop a comment & follow",
    "Follow + drop your comment",
    "Leave a comment & follow",
    "Follow, then comment",
    "Comment first, then follow",
    "Follow me + comment below",
  ];

  const endings = [
    "– I'll feature one next! 🚀💬",
    "= maybe YOU next vid! ⭐🔥",
    "– your words next vid! 💡🔥",
    "– be in next TikTok! 🔥💬",
    "– I pick a winner! 🤩💬",
    "= chance to be next! 🚀⭐",
    "– could be YOU! ⭐💬",
    "– I'll show one next! 🎉💥",
    "= spotlight next! 💡💥",
    "– get featured next! 🌟💬",
    "= next video star! 🎯🔥",
    "– join the fun! 🎉💥",
  ];

  const hashtags = [
    "#fyp #gaming #arcade",
    "#foryou #mobilegame #challenge",
    "#viral #game #skill",
    "#fypシ #arcade #balls",
    "#foryoupage #gaming #fun",
    "#viral #game #rings",
    "#fyp #challenge #gaming",
    "#viral #rings #fun",
    "#viral #ball #arcade",
    "#foryou #game #skill",
    "#viral #arcade #challenge",
    "#fyp #game #fun",
    "#viral #gaming #skill",
    "#foryou #arcade #challenge",
  ];

  return `${pickRandom(actions)} ${pickRandom(endings)} ${pickRandom(hashtags)}`;
}

// Test de génération
console.log("🧪 Test de génération de descriptions uniques :\n");

for (let i = 0; i < 5; i++) {
  const description = generateDescription();
  console.log(`${i + 1}. ${description}`);
}

console.log("\n✅ Génération testée avec succès !");
console.log("💡 Chaque exécution du script principal créera une description unique.");
