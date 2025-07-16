import { NextRequest, NextResponse } from 'next/server';
import generateTikTokCommentWithRetry from '@/services/tiktok-comment-generator';

export async function POST(request: NextRequest) {
  try {
    console.log('🎬 Nouvelle demande de génération de commentaire TikTok');
    
    // Optionnel: récupérer des paramètres depuis le body
    const body = await request.json().catch(() => ({}));
    const maxRetries = body.maxRetries || 3;
    
    // Générer le commentaire TikTok
    const result = await generateTikTokCommentWithRetry(maxRetries);
    
    if (result.success) {
      console.log('✅ Commentaire généré avec succès');
      return NextResponse.json({
        success: true,
        data: {
          imagePath: result.imagePath,
          username: result.username,
          comment: result.comment
        }
      }, { status: 200 });
    } else {
      console.error('❌ Échec de la génération:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Erreur dans l\'API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur interne'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Générateur de commentaires TikTok - Utilisez POST pour générer',
    endpoints: {
      POST: '/api/generate-tiktok-comment'
    },
    example: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        maxRetries: 3
      }
    }
  });
}