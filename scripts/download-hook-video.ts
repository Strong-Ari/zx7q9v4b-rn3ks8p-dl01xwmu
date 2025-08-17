import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const cloudName = process.env.CLOUDINARY_VIDEO_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_VIDEO_API_KEY;
const apiSecret = process.env.CLOUDINARY_VIDEO_API_SECRET;

const localVideoPath = path.join(process.cwd(), "public", "hook.mp4");

async function main() {
  // Vérifier si les variables Cloudinary sont configurées
  if (!cloudName || !apiKey || !apiSecret) {
    console.log(
      "⚠️ Variables Cloudinary vidéo non configurées, utilisation d'un fichier vidéo local...",
    );

    // Chercher les fichiers vidéo locaux
    const videosDir = path.join(process.cwd(), "public", "videos");
    let videoFiles: string[] = [];
    if (fs.existsSync(videosDir)) {
      videoFiles = fs
        .readdirSync(videosDir)
        .filter(
          (file) =>
            file.endsWith(".mp4") ||
            file.endsWith(".mov") ||
            file.endsWith(".avi"),
        );
    }

    if (videoFiles.length > 0) {
      const randomVideo = videoFiles[crypto.randomInt(0, videoFiles.length)];
      const sourcePath = path.join(videosDir, randomVideo);
      fs.copyFileSync(sourcePath, localVideoPath);
      console.log(`✅ Copié ${randomVideo} vers hook.mp4`);
      return;
    }

    // Aucun fichier trouvé, créer un fichier vide
    console.log("⚠️ Aucun fichier vidéo trouvé, création d'un fichier vide");
    fs.writeFileSync(localVideoPath, new Uint8Array(0));
    return;
  }

  console.log("🎬 Récupération de la liste des vidéos sur Cloudinary...");

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  // URL de l'API - récupérer tous les fichiers vidéo
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
    console.log("⚠️ Utilisation d'un fichier vidéo local par défaut...");

    // Utiliser un fichier local en cas d'erreur
    const videosDir = path.join(process.cwd(), "public", "videos");
    let videoFiles: string[] = [];
    if (fs.existsSync(videosDir)) {
      videoFiles = fs
        .readdirSync(videosDir)
        .filter(
          (file) =>
            file.endsWith(".mp4") ||
            file.endsWith(".mov") ||
            file.endsWith(".avi"),
        );
    }
    if (videoFiles.length > 0) {
      const randomVideo = videoFiles[crypto.randomInt(0, videoFiles.length)];
      const sourcePath = path.join(videosDir, randomVideo);
      fs.copyFileSync(sourcePath, localVideoPath);
      console.log(`✅ Copié ${randomVideo} vers hook.mp4`);
      return;
    }
    fs.writeFileSync(localVideoPath, new Uint8Array(0));
    return;
  }

  const listData = await listResponse.json();

  console.log("📋 Données reçues :", JSON.stringify(listData, null, 2));

  // Filtrer pour ne garder que les fichiers vidéo (pas de dossier spécifique)
  const videos = listData.resources.filter(
    (resource: any) =>
      (resource.format === "mp4" ||
        resource.format === "mov" ||
        resource.format === "avi") &&
      resource.resource_type === "video",
  );

  if (!videos || videos.length === 0) {
    console.error("❌ Aucune vidéo trouvée dans Cloudinary.");
    process.exit(1);
  }

  console.log(`🎬 ${videos.length} vidéos trouvées`);

  // 2. Choisir un fichier vidéo au hasard
  const randomVideo = videos[crypto.randomInt(0, videos.length)];
  console.log(`🎯 Vidéo choisie : ${randomVideo.public_id}`);
  console.log(`🔗 URL de la vidéo : ${randomVideo.secure_url}`);
  console.log(`📐 Dimensions : ${randomVideo.width}x${randomVideo.height}`);
  console.log(`🎞️ Format : ${randomVideo.format}`);

  // 3. Télécharger la vidéo avec les paramètres de transformation optimisés
  // Utiliser les mêmes paramètres que l'exemple : f_mp4,w_720,h_1280,c_fill,q_auto:good,fps_30
  const transformedUrl = randomVideo.secure_url.replace(
    /\/upload\//,
    "/upload/f_mp4,w_720,h_1280,c_fill,q_auto:good,fps_30/",
  );

  console.log(`🔧 URL transformée : ${transformedUrl}`);

  const videoResponse = await fetch(transformedUrl);
  if (!videoResponse.ok) {
    const errorText = await videoResponse.text();
    console.error("❌ Erreur lors du téléchargement de la vidéo :", errorText);
    process.exit(1);
  }

  const arrayBuffer = await videoResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 4. Écrire le fichier local sous le nom hook.mp4
  fs.writeFileSync(localVideoPath, new Uint8Array(buffer));
  console.log(`✅ Vidéo téléchargée → hook.mp4`);
  console.log(`📁 Taille : ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

  // 5. Afficher les informations de compatibilité avec Remotion
  console.log(`\n🎬 Paramètres Remotion :`);
  console.log(`   - Dimensions : 720x1280 (format vertical TikTok)`);
  console.log(`   - FPS : 30`);
  console.log(`   - Format : MP4`);
  console.log(`   - Codec : H.264`);
  console.log(`   - Qualité : auto:good`);
  console.log(`   - Crop : fill (pour s'adapter aux dimensions)`);
}

main().catch((err) => {
  console.error("💥 Erreur non gérée :", err);
  process.exit(1);
});
