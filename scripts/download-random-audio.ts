import "dotenv/config";
import fs from "fs";
import path from "path";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
const apiKey = process.env.CLOUDINARY_API_KEY!;
const apiSecret = process.env.CLOUDINARY_API_SECRET!;

const localAudioPath = path.join(process.cwd(), "public", "music.wav");

async function main() {
  console.log("🎵 Récupération de la liste des musiques sur Cloudinary...");

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  // URL de l'API
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
    process.exit(1);
  }

  const listData = await listResponse.json();

  console.log("📋 Données reçues :", JSON.stringify(listData, null, 2));

  const audios = listData.resources;

  if (!audios || audios.length === 0) {
    console.error("❌ Aucune musique trouvée dans la réponse.");
    process.exit(1);
  }

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
  fs.writeFileSync(localAudioPath, buffer);
  console.log(`✅ Musique téléchargée → ${localAudioPath}`);
}

main().catch((err) => {
  console.error("💥 Erreur non gérée :", err);
  process.exit(1);
});
