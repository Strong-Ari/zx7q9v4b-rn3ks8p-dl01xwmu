import React, { useState, useEffect } from "react";
import { GAME_CONFIG } from "../constants/game";

interface AudioInitOverlayProps {
  onAudioReady: () => void;
  isVisible: boolean;
}

export const AudioInitOverlay: React.FC<AudioInitOverlayProps> = ({
  onAudioReady,
  isVisible,
}) => {
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    if (isClicked) {
      // Délai pour laisser le temps à l'audio de s'initialiser
      const timer = setTimeout(() => {
        onAudioReady();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isClicked, onAudioReady]);

  if (!isVisible || isClicked) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        fontFamily: GAME_CONFIG.UI_FONT,
        color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          borderRadius: "20px",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          border: "2px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <h2
          style={{ fontSize: "32px", marginBottom: "20px", color: "#4ade80" }}
        >
          🎵 Audio Initialisation
        </h2>
        <p
          style={{ fontSize: "18px", marginBottom: "30px", lineHeight: "1.5" }}
        >
          Cliquez pour activer l'audio et commencer à jouer !
        </p>
        <button
          onClick={() => setIsClicked(true)}
          style={{
            padding: "15px 30px",
            fontSize: "20px",
            backgroundColor: "#4ade80",
            color: "#000",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 15px rgba(74, 222, 128, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow =
              "0 6px 20px rgba(74, 222, 128, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "0 4px 15px rgba(74, 222, 128, 0.3)";
          }}
        >
          🎮 Activer l'Audio
        </button>
        <p style={{ fontSize: "14px", marginTop: "20px", opacity: 0.7 }}>
          L'audio est nécessaire pour une expérience complète
        </p>
      </div>
    </div>
  );
};
