import React, { useEffect, useMemo, useState } from "react";
import { Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AudioFile, AudioIndex } from "../../scripts/prepare-audio-for-render";

/**
 * Système audio pour Remotion utilisant les composants natifs
 * Gère la musique de fond et les effets sonores pendant le rendu
 */

interface AudioSystemProps {
  // Props pour contrôler quand jouer les SFX
  onCollision?: boolean;
  onBallCollision?: boolean;
  onGapPass?: boolean;
  onSuccess?: boolean;
  
  // Configuration audio
  musicVolume?: number;
  sfxVolume?: number;
  
  // Pour le debug
  showDebugInfo?: boolean;
}

interface SFXTrigger {
  type: "collision" | "ball-collision" | "gap-pass" | "success";
  frame: number;
  played: boolean;
}

export const AudioSystem: React.FC<AudioSystemProps> = ({
  onCollision = false,
  onBallCollision = false,
  onGapPass = false,
  onSuccess = false,
  musicVolume = 1.0,
  sfxVolume = 1.0,
  showDebugInfo = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const [audioIndex, setAudioIndex] = useState<AudioIndex | null>(null);
  const [sfxTriggers, setSfxTriggers] = useState<SFXTrigger[]>([]);

  // Charger l'index audio au montage du composant
  useEffect(() => {
    const loadAudioIndex = async () => {
      try {
        // Tenter de charger l'index audio généré
        const response = await fetch(staticFile("generated/audio-index.json"));
        if (response.ok) {
          const index: AudioIndex = await response.json();
          setAudioIndex(index);
          console.log("[AudioSystem] Index audio chargé:", index);
        } else {
          console.warn("[AudioSystem] Aucun index audio trouvé - les audios ne seront pas disponibles");
        }
      } catch (error) {
        console.warn("[AudioSystem] Erreur lors du chargement de l'index audio:", error);
      }
    };

    loadAudioIndex();
  }, []);

  // Trouver les fichiers SFX par nom
  const sfxFiles = useMemo(() => {
    if (!audioIndex) return {};
    
    const sfxMap: Record<string, AudioFile> = {};
    audioIndex.sfx.forEach(sfx => {
      sfxMap[sfx.name] = sfx;
    });
    
    return sfxMap;
  }, [audioIndex]);

  // Gérer les déclenchements de SFX
  useEffect(() => {
    const newTriggers: SFXTrigger[] = [];

    if (onCollision) {
      newTriggers.push({
        type: "collision",
        frame,
        played: false,
      });
    }

    if (onBallCollision) {
      newTriggers.push({
        type: "ball-collision",
        frame,
        played: false,
      });
    }

    if (onGapPass) {
      newTriggers.push({
        type: "gap-pass",
        frame,
        played: false,
      });
    }

    if (onSuccess) {
      newTriggers.push({
        type: "success",
        frame,
        played: false,
      });
    }

    if (newTriggers.length > 0) {
      setSfxTriggers(prev => [...prev, ...newTriggers]);
    }
  }, [onCollision, onBallCollision, onGapPass, onSuccess, frame]);

  // Musique de fond
  const backgroundMusic = useMemo(() => {
    if (!audioIndex?.selectedMusic) return null;
    
    const musicPath = staticFile(audioIndex.selectedMusic.relativePath);
    return (
      <Audio
        src={musicPath}
        volume={musicVolume}
        loop
        startFrom={0}
        endAt={audioIndex.selectedMusic.duration ? Math.floor(audioIndex.selectedMusic.duration * fps) : undefined}
      />
    );
  }, [audioIndex, musicVolume, fps]);

  // Composants SFX basés sur les déclencheurs
  const sfxComponents = useMemo(() => {
    const components: React.ReactElement[] = [];
    
    sfxTriggers.forEach((trigger, index) => {
      const sfxFile = sfxFiles[trigger.type];
      if (!sfxFile) return;

      const shouldPlay = frame >= trigger.frame;
      if (!shouldPlay) return;

      const sfxPath = staticFile(sfxFile.relativePath);
      const sfxDuration = sfxFile.duration ? Math.floor(sfxFile.duration * fps) : 30; // 30 frames par défaut

      components.push(
        <Audio
          key={`sfx-${trigger.type}-${trigger.frame}-${index}`}
          src={sfxPath}
          volume={sfxVolume}
          startFrom={trigger.frame}
          endAt={trigger.frame + sfxDuration}
        />
      );
    });

    return components;
  }, [sfxTriggers, sfxFiles, sfxVolume, frame, fps]);

  // Information de debug
  const debugInfo = useMemo(() => {
    if (!showDebugInfo) return null;

    const currentTime = frame / fps;
    const activeSFX = sfxTriggers.filter(t => 
      frame >= t.frame && 
      frame <= t.frame + (sfxFiles[t.type]?.duration ? Math.floor(sfxFiles[t.type].duration! * fps) : 30)
    );

    return (
      <div 
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "10px",
          fontSize: "12px",
          fontFamily: "monospace",
          borderRadius: "4px",
          zIndex: 1000,
        }}
      >
        <div>🎵 AudioSystem Debug</div>
        <div>Frame: {frame} ({currentTime.toFixed(2)}s)</div>
        <div>Musique: {audioIndex?.selectedMusic?.name || "Aucune"}</div>
        <div>SFX actifs: {activeSFX.length}</div>
        <div>SFX total: {sfxTriggers.length}</div>
        {activeSFX.map((sfx, i) => (
          <div key={i} style={{ color: "#90EE90" }}>
            ▶ {sfx.type}
          </div>
        ))}
      </div>
    );
  }, [showDebugInfo, frame, fps, audioIndex, sfxTriggers, sfxFiles]);

  // Affichage de l'état de chargement
  if (!audioIndex) {
    return showDebugInfo ? (
      <div style={{
        position: "absolute",
        top: 10,
        right: 10,
        background: "rgba(255,165,0,0.8)",
        color: "white",
        padding: "10px",
        fontSize: "12px",
        fontFamily: "monospace",
        borderRadius: "4px",
      }}>
        🎵 Chargement audio...
      </div>
    ) : null;
  }

  return (
    <>
      {/* Musique de fond */}
      {backgroundMusic}
      
      {/* Effets sonores */}
      {sfxComponents}
      
      {/* Debug info */}
      {debugInfo}
    </>
  );
};

// Hook utilitaire pour déclencher facilement les SFX
export const useAudioTriggers = () => {
  const [triggers, setTriggers] = useState({
    collision: false,
    ballCollision: false,
    gapPass: false,
    success: false,
  });

  const triggerCollision = () => {
    setTriggers(prev => ({ ...prev, collision: true }));
    // Reset après 1 frame
    setTimeout(() => setTriggers(prev => ({ ...prev, collision: false })), 16);
  };

  const triggerBallCollision = () => {
    setTriggers(prev => ({ ...prev, ballCollision: true }));
    setTimeout(() => setTriggers(prev => ({ ...prev, ballCollision: false })), 16);
  };

  const triggerGapPass = () => {
    setTriggers(prev => ({ ...prev, gapPass: true }));
    setTimeout(() => setTriggers(prev => ({ ...prev, gapPass: false })), 16);
  };

  const triggerSuccess = () => {
    setTriggers(prev => ({ ...prev, success: true }));
    setTimeout(() => setTriggers(prev => ({ ...prev, success: false })), 16);
  };

  return {
    triggers,
    triggerCollision,
    triggerBallCollision,
    triggerGapPass,
    triggerSuccess,
  };
};