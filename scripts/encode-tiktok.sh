#!/bin/bash

# 🎯 Script d'encodage FFmpeg optimisé pour TikTok
# Utilise des presets rapides et une qualité adaptée pour les réseaux sociaux

set -e

# Configuration par défaut
INPUT_FILE="out/video.mp4"
OUTPUT_FILE="out/tiktok-optimized.mp4"
CRF=20
PRESET="veryfast"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎬 === ENCODAGE TIKTOK OPTIMISÉ ===${NC}"

# Vérifier que FFmpeg est installé
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ FFmpeg n'est pas installé. Installation nécessaire:${NC}"
    echo "   Ubuntu/Debian: sudo apt install ffmpeg"
    echo "   macOS: brew install ffmpeg"
    echo "   Windows: https://ffmpeg.org/download.html"
    exit 1
fi

# Vérifier que le fichier d'entrée existe
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}❌ Fichier d'entrée introuvable: $INPUT_FILE${NC}"
    echo -e "${YELLOW}💡 Exécutez d'abord: pnpm render:optimized${NC}"
    exit 1
fi

# Afficher les informations du fichier source
echo -e "${BLUE}📋 Fichier source:${NC}"
INPUT_SIZE=$(du -h "$INPUT_FILE" | cut -f1)
echo "   📁 $INPUT_FILE ($INPUT_SIZE)"

# Obtenir les dimensions du fichier source
DIMENSIONS=$(ffprobe -v quiet -print_format csv=p=0 -show_entries stream=width,height "$INPUT_FILE" | head -1)
echo "   📐 Dimensions: $DIMENSIONS"

# Calculer la durée
DURATION=$(ffprobe -v quiet -show_entries format=duration -print_format csv=p=0 "$INPUT_FILE")
DURATION_FORMATTED=$(printf "%.1f" $DURATION)
echo "   ⏱️  Durée: ${DURATION_FORMATTED}s"

echo ""
echo -e "${BLUE}⚙️  Configuration d'encodage:${NC}"
echo "   🎯 Preset: $PRESET (vitesse optimisée)"
echo "   🎨 CRF: $CRF (qualité élevée)"
echo "   📱 Format: H.264 YUV420P (compatible TikTok)"
echo "   🔊 Audio: AAC 128kbps"

echo ""
echo -e "${YELLOW}🚀 Début de l'encodage...${NC}"

# Encodage FFmpeg optimisé
ffmpeg -y \
    -i "$INPUT_FILE" \
    -c:v libx264 \
    -preset "$PRESET" \
    -crf "$CRF" \
    -pix_fmt yuv420p \
    -profile:v high \
    -level 4.0 \
    -movflags +faststart \
    -c:a aac \
    -b:a 128k \
    -ar 44100 \
    -ac 2 \
    -avoid_negative_ts make_zero \
    -fflags +genpts \
    -max_muxing_queue_size 1024 \
    "$OUTPUT_FILE"

# Vérifier le succès
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ === ENCODAGE TERMINÉ ===${NC}"
    
    # Afficher les statistiques finales
    OUTPUT_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo -e "${GREEN}📁 Fichier final: $OUTPUT_FILE ($OUTPUT_SIZE)${NC}"
    
    # Calculer la compression
    INPUT_BYTES=$(stat -c%s "$INPUT_FILE" 2>/dev/null || stat -f%z "$INPUT_FILE" 2>/dev/null)
    OUTPUT_BYTES=$(stat -c%s "$OUTPUT_FILE" 2>/dev/null || stat -f%z "$OUTPUT_FILE" 2>/dev/null)
    
    if [ ! -z "$INPUT_BYTES" ] && [ ! -z "$OUTPUT_BYTES" ]; then
        COMPRESSION_RATIO=$(echo "scale=1; $OUTPUT_BYTES * 100 / $INPUT_BYTES" | bc 2>/dev/null || echo "N/A")
        if [ "$COMPRESSION_RATIO" != "N/A" ]; then
            echo -e "${GREEN}📊 Taille finale: ${COMPRESSION_RATIO}% de l'original${NC}"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}🎯 Fichier prêt pour TikTok !${NC}"
    echo -e "${BLUE}💡 Commandes suivantes:${NC}"
    echo "   📱 Upload: Importez $OUTPUT_FILE dans TikTok"
    echo "   🔍 Vérifier: ffprobe $OUTPUT_FILE"
    echo "   ▶️  Tester: mpv $OUTPUT_FILE ou vlc $OUTPUT_FILE"

else
    echo -e "${RED}❌ Erreur lors de l'encodage${NC}"
    exit 1
fi