import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import React from "react";
import {
  TikTokComment,
  MultipleTikTokComments,
  COMMENT_POSITIONS,
  createPositionedComment,
} from "../TikTokComment/TikTokComment";

// Import de votre composition principale existante
import { Main } from "./Main";

interface MainWithCommentsProps {
  /**
   * Chemins des images de commentaires générés
   */
  commentImages?: string[];

  /**
   * Activer/désactiver les commentaires
   */
  showComments?: boolean;

  /**
   * Délai entre l'apparition des commentaires (en frames)
   */
  commentDelay?: number;
}

export const MainWithComments: React.FC<MainWithCommentsProps> = ({
  commentImages = [],
  showComments = true,
  commentDelay = 90,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Configuration des commentaires avec timing automatique
  const comments = commentImages.map((imagePath, index) => {
    const startFrame = 60 + index * commentDelay; // Commencer après 2 secondes
    const duration = 180; // 6 secondes de durée par commentaire

    // Alterner les positions pour éviter les superpositions
    const positions = [
      "bottomLeft",
      "bottomRight",
      "centerLeft",
      "centerRight",
    ] as const;
    const position = positions[index % positions.length];

    return createPositionedComment(imagePath, position, startFrame, duration);
  });

  // Animation de l'arrière-plan principal
  const backgroundScale = spring({
    frame,
    fps,
    config: {
      damping: 200,
      stiffness: 50,
    },
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    >
      {/* Composition principale en arrière-plan */}
      <div
        style={{
          transform: `scale(${backgroundScale})`,
          width: "100%",
          height: "100%",
        }}
      >
        <Main />
      </div>

      {/* Overlay semi-transparent pour améliorer la lisibilité des commentaires */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.3) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Affichage des commentaires TikTok */}
      {showComments && <MultipleTikTokComments comments={comments} />}

      {/* Indicateur de progression */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          color: "white",
          fontSize: 12,
          fontFamily: "system-ui",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: "4px 8px",
          borderRadius: "4px",
          opacity: 0.7,
        }}
      >
        {Math.round((frame / durationInFrames) * 100)}%
      </div>

      {/* Filigrane TikTok */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          color: "white",
          fontSize: 14,
          fontFamily: "system-ui, sans-serif",
          fontWeight: "bold",
          textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
          opacity: 0.9,
        }}
      >
        📱 TikTok Auto
      </div>
    </div>
  );
};

// Exemple de composition avec commentaires pré-générés
export const ExampleWithStaticComments: React.FC = () => {
  // Exemples de chemins d'images (à remplacer par des vraies images générées)
  const exampleComments = [
    "/generated/tiktok-comment-example-1.png",
    "/generated/tiktok-comment-example-2.png",
    "/generated/tiktok-comment-example-3.png",
  ];

  return (
    <MainWithComments
      commentImages={exampleComments}
      showComments={true}
      commentDelay={120}
    />
  );
};

// Composition avec un seul commentaire personnalisé
export const SingleCommentExample: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#000",
      }}
    >
      <Main />

      {/* Commentaire personnalisé avec animations avancées */}
      <TikTokComment
        imagePath="/generated/tiktok-comment-featured.png"
        x={0.1}
        y={0.65}
        scale={1.1}
        startFrame={90}
        duration={240}
        animationType="bounceIn"
        animationDuration={45}
        rotation={-2}
        className="featured-comment"
      />

      {/* Commentaire secondaire */}
      <TikTokComment
        imagePath="/generated/tiktok-comment-secondary.png"
        {...COMMENT_POSITIONS.topRight}
        scale={0.8}
        startFrame={180}
        duration={150}
        animationType="slideIn"
        animationDuration={30}
        opacity={0.9}
      />
    </div>
  );
};
