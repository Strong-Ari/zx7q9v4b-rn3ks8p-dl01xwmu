import React from "react";
import { useSimpleAudio } from "../hooks/useSimpleAudio";

interface AudioDebugInfoProps {
  show?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export const AudioDebugInfo: React.FC<AudioDebugInfoProps> = ({
  show = false,
  position = "bottom-right",
}) => {
  const audioPlayer = useSimpleAudio();

  if (!show) {
    return null;
  }

  const positionStyles = {
    "top-left": { top: "10px", left: "10px" },
    "top-right": { top: "10px", right: "10px" },
    "bottom-left": { bottom: "10px", left: "10px" },
    "bottom-right": { bottom: "10px", right: "10px" },
  };

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    ...positionStyles[position],
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    color: "white",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: "monospace",
    zIndex: 1000,
    minWidth: "200px",
    maxWidth: "300px",
  };

  const statusIndicatorStyle: React.CSSProperties = {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    marginRight: "6px",
  };

  const getStatusColor = (isActive: boolean) => ({
    backgroundColor: isActive ? "#4ade80" : "#f87171",
  });

  return (
    <div style={containerStyle}>
      <div
        style={{
          marginBottom: "8px",
          fontWeight: "bold",
          borderBottom: "1px solid #444",
          paddingBottom: "4px",
        }}
      >
        🔊 Audio Debug Info
      </div>

      {/* État du système audio */}
      <div style={{ marginBottom: "6px" }}>
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}
        >
          <span
            style={{
              ...statusIndicatorStyle,
              ...getStatusColor(audioPlayer.isInitialized),
            }}
          ></span>
          <span>
            Audio: {audioPlayer.isInitialized ? "Initialisé" : "Non initialisé"}
          </span>
        </div>

        <div
          style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}
        >
          <span
            style={{
              ...statusIndicatorStyle,
              ...getStatusColor(audioPlayer.audioStatus.isAvailable),
            }}
          ></span>
          <span>Disponible: {audioPlayer.audioStatus.isAvailable ? "Oui" : "Non"}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              ...statusIndicatorStyle,
              ...getStatusColor(audioPlayer.audioStatus.isBrowserMode),
            }}
          ></span>
          <span>Mode: {audioPlayer.audioStatus.isBrowserMode ? "Browser" : "Server"}</span>
        </div>
      </div>

      {/* État de chargement */}
      {audioPlayer.isLoading && (
        <div style={{ marginBottom: "6px", color: "#fbbf24" }}>
          ⏳ Initialisation audio...
        </div>
      )}

      {/* Erreur */}
      {audioPlayer.error && (
        <div
          style={{ marginBottom: "6px", color: "#f87171", fontSize: "10px" }}
        >
          ❌ Erreur: {audioPlayer.error}
        </div>
      )}

      {/* Informations sur le système */}
      <div style={{ marginBottom: "6px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "3px" }}>
          🎵 Système Audio Simple
        </div>

        <div style={{ fontSize: "10px", color: "#94a3b8" }}>
          Sons de collision: Balle-Cercle, Balle-Balle
        </div>

        <div style={{ fontSize: "10px", color: "#94a3b8" }}>
          Synthétiseur: Triangle Wave
        </div>
      </div>

      {/* Actions de test */}
      {audioPlayer.isInitialized && (
        <div
          style={{
            marginTop: "8px",
            paddingTop: "6px",
            borderTop: "1px solid #444",
          }}
        >
          <button
            onClick={() => audioPlayer.playCollisionSound("BALL_CIRCLE")}
            style={{
              backgroundColor: "#4ade80",
              border: "none",
              color: "black",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              cursor: "pointer",
              marginRight: "4px",
            }}
          >
            🎯 Test Balle-Cercle
          </button>

          <button
            onClick={() => audioPlayer.playCollisionSound("BALL_BALL")}
            style={{
              backgroundColor: "#f59e0b",
              border: "none",
              color: "black",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              cursor: "pointer",
              marginRight: "4px",
            }}
          >
            ⚽ Test Balle-Balle
          </button>

          <button
            onClick={() => audioPlayer.playFrequency(440, 0.5)}
            style={{
              backgroundColor: "#8b5cf6",
              border: "none",
              color: "black",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              cursor: "pointer",
            }}
          >
            🎵 Test 440Hz
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioDebugInfo;