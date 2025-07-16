import { Img, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import React from 'react';

interface TikTokCommentProps {
  /**
   * Chemin de l'image du commentaire généré (ex: "/generated/comment.png")
   */
  imagePath: string;
  
  /**
   * Position X du commentaire (0 = gauche, 1 = droite)
   */
  x?: number;
  
  /**
   * Position Y du commentaire (0 = haut, 1 = bas)  
   */
  y?: number;
  
  /**
   * Échelle du commentaire (1 = taille normale)
   */
  scale?: number;
  
  /**
   * Frame de début d'apparition
   */
  startFrame?: number;
  
  /**
   * Durée d'apparition en frames
   */
  duration?: number;
  
  /**
   * Type d'animation d'entrée
   */
  animationType?: 'fadeIn' | 'slideIn' | 'scaleIn' | 'bounceIn' | 'none';
  
  /**
   * Durée de l'animation d'entrée en frames
   */
  animationDuration?: number;
  
  /**
   * Rotation en degrés
   */
  rotation?: number;
  
  /**
   * Opacité (0 = transparent, 1 = opaque)
   */
  opacity?: number;
  
  /**
   * Classe CSS personnalisée
   */
  className?: string;
}

export const TikTokComment: React.FC<TikTokCommentProps> = ({
  imagePath,
  x = 0.1,
  y = 0.7,
  scale = 1,
  startFrame = 0,
  duration,
  animationType = 'slideIn',
  animationDuration = 30,
  rotation = 0,
  opacity = 1,
  className = ''
}) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  
  // Calculer la durée totale si non spécifiée
  const totalDuration = duration || durationInFrames - startFrame;
  
  // Déterminer si le commentaire doit être visible
  const isVisible = frame >= startFrame && frame < startFrame + totalDuration;
  
  if (!isVisible) {
    return null;
  }
  
  // Frame relative pour les animations
  const relativeFrame = frame - startFrame;
  
  // Calculer l'opacité basée sur l'animation
  let animatedOpacity = opacity;
  let animatedScale = scale;
  let animatedX = x * width;
  let animatedY = y * height;
  let animatedRotation = rotation;
  
  // Appliquer les animations d'entrée
  if (relativeFrame < animationDuration) {
    const progress = relativeFrame / animationDuration;
    
    switch (animationType) {
      case 'fadeIn':
        animatedOpacity = interpolate(
          progress,
          [0, 1],
          [0, opacity],
          {
            easing: Easing.out(Easing.ease)
          }
        );
        break;
        
      case 'slideIn':
        animatedOpacity = interpolate(
          progress,
          [0, 1],
          [0, opacity],
          {
            easing: Easing.out(Easing.ease)
          }
        );
        animatedX = interpolate(
          progress,
          [0, 1],
          [width, x * width],
          {
            easing: Easing.out(Easing.back(1.5))
          }
        );
        break;
        
      case 'scaleIn':
        animatedOpacity = interpolate(
          progress,
          [0, 1],
          [0, opacity],
          {
            easing: Easing.out(Easing.ease)
          }
        );
        animatedScale = interpolate(
          progress,
          [0, 1],
          [0, scale],
          {
            easing: Easing.out(Easing.back(1.5))
          }
        );
        break;
        
      case 'bounceIn':
        animatedOpacity = interpolate(
          progress,
          [0, 1],
          [0, opacity],
          {
            easing: Easing.out(Easing.ease)
          }
        );
        animatedScale = interpolate(
          progress,
          [0, 0.3, 0.7, 1],
          [0, scale * 1.3, scale * 0.9, scale],
          {
            easing: Easing.out(Easing.ease)
          }
        );
        break;
        
      case 'none':
      default:
        break;
    }
  }
  
  // Animation de sortie subtile dans les dernières frames
  const exitDuration = Math.min(15, animationDuration);
  if (relativeFrame > totalDuration - exitDuration) {
    const exitProgress = (relativeFrame - (totalDuration - exitDuration)) / exitDuration;
    animatedOpacity *= interpolate(
      exitProgress,
      [0, 1],
      [1, 0.8],
      {
        easing: Easing.in(Easing.ease)
      }
    );
  }
  
  // Styles finaux
  const commentStyle: React.CSSProperties = {
    position: 'absolute',
    left: animatedX,
    top: animatedY,
    transform: `scale(${animatedScale}) rotate(${animatedRotation}deg)`,
    opacity: animatedOpacity,
    transformOrigin: 'center center',
    // Optimisations pour les performances
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    // Style par défaut pour les commentaires TikTok
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    // Effet de lueur pour style TikTok
    filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.1))',
    maxWidth: '80%',
    maxHeight: '30%',
    objectFit: 'contain' as const
  };
  
  return (
    <div
      style={commentStyle}
      className={`tiktok-comment ${className}`}
    >
      <Img
        src={imagePath}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: '12px'
        }}
        // Optimisations pour Remotion
        placeholder="blur"
      />
    </div>
  );
};

// Composant helper pour plusieurs commentaires
interface MultipleCommentsProps {
  comments: Array<{
    imagePath: string;
    startFrame: number;
    duration?: number;
    x?: number;
    y?: number;
    scale?: number;
    animationType?: TikTokCommentProps['animationType'];
  }>;
}

export const MultipleTikTokComments: React.FC<MultipleCommentsProps> = ({
  comments
}) => {
  return (
    <>
      {comments.map((comment, index) => (
        <TikTokComment
          key={`comment-${index}`}
          {...comment}
        />
      ))}
    </>
  );
};

// Preset de positions pour commentaires multiples
export const COMMENT_POSITIONS = {
  bottomLeft: { x: 0.05, y: 0.75 },
  bottomRight: { x: 0.7, y: 0.75 },
  topLeft: { x: 0.05, y: 0.1 },
  topRight: { x: 0.7, y: 0.1 },
  center: { x: 0.3, y: 0.5 },
  centerLeft: { x: 0.05, y: 0.5 },
  centerRight: { x: 0.7, y: 0.5 }
} as const;

export type CommentPosition = keyof typeof COMMENT_POSITIONS;

// Helper pour créer un commentaire avec une position prédéfinie
export const createPositionedComment = (
  imagePath: string,
  position: CommentPosition,
  startFrame: number,
  duration?: number
): TikTokCommentProps => ({
  imagePath,
  startFrame,
  duration,
  ...COMMENT_POSITIONS[position]
});