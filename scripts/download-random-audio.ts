import "dotenv/config";
import fs from "fs";
import path from "path";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const localAudioPath = path.join(process.cwd(), "public", "music.wav");

async function main() {
  // Vérifier si les variables Cloudinary sont configurées
  if (!cloudName || !apiKey || !apiSecret) {
    console.log(
      "⚠️ Variables Cloudinary non configurées, utilisation du fichier audio local...",
    );

    // Vérifier si le fichier audio local existe déjà
    if (fs.existsSync(localAudioPath)) {
      console.log("✅ Fichier audio local déjà présent");
      return;
    }

    // Créer un fichier audio vide ou copier depuis les sons existants
    const soundsDir = path.join(process.cwd(), "public", "sounds");
    if (fs.existsSync(soundsDir)) {
      const soundFiles = fs
        .readdirSync(soundsDir)
        .filter((file) => file.endsWith(".wav"));
      if (soundFiles.length > 0) {
        const randomSound =
          soundFiles[Math.floor(Math.random() * soundFiles.length)];
        const sourcePath = path.join(soundsDir, randomSound);
        fs.copyFileSync(sourcePath, localAudioPath);
        console.log(`✅ Copié ${randomSound} vers music.wav`);
        return;
      }
    }

    console.log("⚠️ Aucun fichier audio trouvé, création d'un fichier vide");
    fs.writeFileSync(localAudioPath, new Uint8Array(0));
    return;
  }

  console.log("🎵 Récupération de la liste des musiques sur Cloudinary...");

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  // URL de l'API - d'abord récupérer tous les fichiers pour voir la structure
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/video?type=upload&max_results=500`;
  console.log("📡 URL appelée :", url);

  // 1. Récupérer la liste des fichiers
  const listResponse = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    console.error(
      "❌ Erreur lors de la récupération des fichiers :",
      errorText,
    );
    console.log("⚠️ Utilisation du fichier audio local par défaut...");

    // Utiliser un fichier local en cas d'erreur
    if (!fs.existsSync(localAudioPath)) {
      const soundsDir = path.join(process.cwd(), "public", "sounds");
      if (fs.existsSync(soundsDir)) {
        const soundFiles = fs
          .readdirSync(soundsDir)
          .filter((file) => file.endsWith(".wav"));
        if (soundFiles.length > 0) {
          const randomSound =
            soundFiles[Math.floor(Math.random() * soundFiles.length)];
          const sourcePath = path.join(soundsDir, randomSound);
          fs.copyFileSync(sourcePath, localAudioPath);
          console.log(`✅ Copié ${randomSound} vers music.wav`);
          return;
        }
      }
      fs.writeFileSync(localAudioPath, new Uint8Array(0));
    }
    return;
  }

  const listData = await listResponse.json();

  console.log("📋 Données reçues :", JSON.stringify(listData, null, 2));

  // Filtrer pour ne garder que les fichiers du dossier "music"
  const audios = listData.resources.filter(
    (resource: any) =>
      resource.asset_folder === "music" && resource.is_audio === true,
  );

  if (!audios || audios.length === 0) {
    console.error("❌ Aucune musique trouvée dans le dossier 'music'.");
    process.exit(1);
  }

  console.log(`🎵 ${audios.length} musiques trouvées dans le dossier 'music'`);

  // 2. Choisir un fichier audio au hasard
  const randomAudio = audios[Math.floor(Math.random() * audios.length)];
  console.log(`🎯 Musique choisie : ${randomAudio.public_id}`);
  console.log(`🔗 URL de la musique : ${randomAudio.secure_url}`);

  // 3. Télécharger la musique
  const audioResponse = await fetch(randomAudio.secure_url);
  if (!audioResponse.ok) {
    const errorText = await audioResponse.text();
    console.error(
      "❌ Erreur lors du téléchargement de la musique :",
      errorText,
    );
    process.exit(1);
  }

  const arrayBuffer = await audioResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 4. Écrire le fichier local
  fs.writeFileSync(localAudioPath, new Uint8Array(buffer));
  console.log(`✅ Musique téléchargée → ${localAudioPath}`);
}

main().catch((err) => {
  console.error("💥 Erreur non gérée :", err);
  process.exit(1);
});
