import React from "react";
import { useMidiPlayer } from "../hooks/useMidiPlayer";
import { MIDI_CONFIG } from "../constants/game";

interface MidiDebugInfoProps {
  show?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export const MidiDebugInfo: React.FC<MidiDebugInfoProps> = ({
  show = false,
  position = "bottom-right",
}) => {
  const midiPlayer = useMidiPlayer();

  if (!show || !MIDI_CONFIG.DEBUG_LOGS) {
    return null;
  }

  const midiInfo = midiPlayer.getMidiInfo();
  const audioStats = midiPlayer.audioStatus;

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
        🎵 MIDI Debug Info
      </div>

      {/* État du système MIDI */}
      <div style={{ marginBottom: "6px" }}>
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}
        >
          <span
            style={{
              ...statusIndicatorStyle,
              ...getStatusColor(midiPlayer.isInitialized),
            }}
          ></span>
          <span>
            MIDI: {midiPlayer.isInitialized ? "Initialisé" : "Non initialisé"}
          </span>
        </div>

        <div
          style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}
        >
          <span
            style={{
              ...statusIndicatorStyle,
              ...getStatusColor(audioStats.isActive),
            }}
          ></span>
          <span>Audio: {audioStats.isActive ? "Actif" : "Inactif"}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <span
            style={{
              ...statusIndicatorStyle,
              ...getStatusColor(audioStats.totalNotesPlayed > 0),
            }}
          ></span>
          <span>Notes jouées: {audioStats.totalNotesPlayed}</span>
        </div>

        {/* Indicateur d'interaction utilisateur nécessaire */}
        {midiPlayer.needsUserInteraction && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "2px",
              color: "#fbbf24",
            }}
          >
            <span
              style={{
                ...statusIndicatorStyle,
                backgroundColor: "#fbbf24",
              }}
            ></span>
            <span>⚠️ Interaction requise</span>
          </div>
        )}
      </div>

      {/* État de chargement */}
      {midiPlayer.isLoading && (
        <div style={{ marginBottom: "6px", color: "#fbbf24" }}>
          ⏳ Chargement MIDI...
        </div>
      )}

      {/* Erreur */}
      {midiPlayer.error && (
        <div
          style={{ marginBottom: "6px", color: "#f87171", fontSize: "10px" }}
        >
          ❌ Erreur: {midiPlayer.error}
        </div>
      )}

      {/* Bouton d'activation audio si nécessaire */}
      {midiPlayer.needsUserInteraction && (
        <div style={{ marginBottom: "6px" }}>
          <button
            onClick={() => {
              console.log("[MidiDebugInfo] Tentative d'activation manuelle de l'audio...");
              midiPlayer.activateAudio().then(success => {
                if (success) {
                  console.log("[MidiDebugInfo] Audio activé avec succès!");
                } else {
                  console.log("[MidiDebugInfo] Échec de l'activation audio");
                }
              });
            }}
            style={{
              backgroundColor: "#f59e0b",
              border: "none",
              color: "black",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "11px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🔊 Activer Audio
          </button>
        </div>
      )}

      {/* Bouton de réinitialisation si erreur */}
      {midiPlayer.error && !midiPlayer.isLoading && (
        <div style={{ marginBottom: "6px" }}>
          <button
            onClick={() => {
              console.log("[MidiDebugInfo] Réinitialisation manuelle...");
              midiPlayer.initMidi();
            }}
            style={{
              backgroundColor: "#ef4444",
              border: "none",
              color: "white",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "11px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            🔄 Réinitialiser
          </button>
        </div>
      )}

      {/* Informations sur le fichier MIDI */}
      {midiInfo && (
        <div style={{ marginBottom: "6px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "3px" }}>
            📁 {midiInfo.fileName}
          </div>

          <div style={{ fontSize: "10px", color: "#94a3b8" }}>
            Notes: {midiInfo.totalNotes} | Durée:{" "}
            {midiInfo.totalDuration.toFixed(1)}s
          </div>

          <div style={{ fontSize: "10px", color: "#94a3b8" }}>
            Position: {midiInfo.currentNoteIndex + 1}/{midiInfo.totalNotes} (
            {midiInfo.progress.toFixed(1)}%)
          </div>

          {/* Barre de progression */}
          <div
            style={{
              marginTop: "4px",
              height: "3px",
              backgroundColor: "#374151",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                backgroundColor: "#4ade80",
                width: `${midiInfo.progress}%`,
                transition: "width 0.2s ease",
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Fichiers disponibles */}
      <div style={{ fontSize: "10px", color: "#6b7280" }}>
        {midiPlayer.availableFiles.length} fichiers MIDI disponibles
      </div>

      {/* Actions de test */}
      {audioStats.isActive && !midiPlayer.needsUserInteraction && (
        <div
          style={{
            marginTop: "8px",
            paddingTop: "6px",
            borderTop: "1px solid #444",
          }}
        >
          <button
            onClick={() => {
              console.log("[MidiDebugInfo] Test de note manuel...");
              midiPlayer.playNextNote();
            }}
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
            🎵 Test Note
          </button>

          <button
            onClick={() => {
              console.log("[MidiDebugInfo] Reset de séquence manuel...");
              midiPlayer.resetSequence();
            }}
            style={{
              backgroundColor: "#f59e0b",
              border: "none",
              color: "black",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "10px",
              cursor: "pointer",
            }}
          >
            🔄 Reset
          </button>
        </div>
      )}

      {/* Instructions pour l'utilisateur */}
      {midiPlayer.needsUserInteraction && (
        <div
          style={{
            marginTop: "8px",
            paddingTop: "6px",
            borderTop: "1px solid #444",
            fontSize: "10px",
            color: "#94a3b8",
            lineHeight: "1.3",
          }}
        >
          💡 Cliquez sur "Activer Audio" ou
          <br />
          interagissez avec la page pour
          <br />
          démarrer l'audio.
        </div>
      )}

      {/* Statut détaillé pour debug */}
      {MIDI_CONFIG.DEBUG_LOGS && (
        <div
          style={{
            marginTop: "8px",
            paddingTop: "6px",
            borderTop: "1px solid #444",
            fontSize: "9px",
            color: "#6b7280",
          }}
        >
          <div>Init: {midiPlayer.isInitialized ? "✓" : "✗"}</div>
          <div>Loading: {midiPlayer.isLoading ? "✓" : "✗"}</div>
          <div>Error: {midiPlayer.error ? "✓" : "✗"}</div>
          <div>UserInteraction: {midiPlayer.needsUserInteraction ? "✓" : "✗"}</div>
        </div>
      )}
    </div>
  );
};

export default MidiDebugInfo;
